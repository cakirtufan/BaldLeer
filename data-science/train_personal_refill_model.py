from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def load_transactions(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    df["invoice_date"] = pd.to_datetime(df["invoice_date"])
    for column in ["quantity", "unit_price", "discount_percent", "coupon_used", "is_promo", "is_stockup", "household_size"]:
        df[column] = pd.to_numeric(df.get(column, 0), errors="coerce").fillna(0)
    df["spend"] = df["quantity"] * df["unit_price"]
    return df.sort_values("invoice_date")


def interval_features(history: pd.DataFrame) -> dict[str, float]:
    dates = sorted(history["invoice_date"].dt.normalize().unique())
    if len(dates) < 2:
        return {"median_interval": 999.0, "average_interval": 999.0, "interval_variability": 1.0}
    intervals = np.diff(np.array(dates, dtype="datetime64[D]")).astype(int)
    avg = float(np.mean(intervals))
    variability = float(np.max(np.abs(intervals - avg)) / avg) if avg else 1.0
    return {
        "median_interval": float(np.median(intervals)),
        "average_interval": avg,
        "interval_variability": variability,
    }


def features_for_category(timeline: pd.DataFrame, category: str, snapshot: pd.Timestamp, horizon_days: int) -> dict[str, object] | None:
    group = timeline[timeline["category"] == category].sort_values("invoice_date")
    history = group[group["invoice_date"] <= snapshot]
    if len(history) < 2:
        return None
    future = group[(group["invoice_date"] > snapshot) & (group["invoice_date"] <= snapshot + pd.Timedelta(days=horizon_days))]
    last = history.iloc[-1]
    last_date = last["invoice_date"].normalize()
    last_90 = history[history["invoice_date"] >= snapshot - pd.Timedelta(days=90)]
    intervals = interval_features(history)
    return {
        "category": category,
        "snapshot_date": snapshot,
        "days_since_last": int((snapshot - last_date).days),
        "purchase_count": int(len(history)),
        "purchase_count_90d": int(len(last_90)),
        "total_quantity": float(history["quantity"].sum()),
        "quantity_90d": float(last_90["quantity"].sum()),
        "total_spend": float(history["spend"].sum()),
        "spend_90d": float(last_90["spend"].sum()),
        "last_quantity": float(last["quantity"]),
        "last_discount_percent": float(last["discount_percent"]),
        "last_coupon_used": float(last["coupon_used"]),
        "last_is_promo": float(last["is_promo"]),
        "last_is_stockup": float(last["is_stockup"]),
        "promo_rate": float(history["is_promo"].mean()),
        "coupon_rate": float(history["coupon_used"].mean()),
        "stockup_rate": float(history["is_stockup"].mean()),
        "avg_discount_percent": float(history["discount_percent"].mean()),
        "household_size": float(last["household_size"]),
        "month": int(snapshot.month),
        "weekday": int(snapshot.weekday()),
        "median_interval": intervals["median_interval"],
        "average_interval": intervals["average_interval"],
        "interval_variability": intervals["interval_variability"],
        "label": int(len(future) > 0),
    }


def build_examples(timeline: pd.DataFrame, start: pd.Timestamp, end: pd.Timestamp, horizon_days: int, step_days: int) -> pd.DataFrame:
    categories = sorted(timeline["category"].unique())
    rows: list[dict[str, object]] = []
    for snapshot in pd.date_range(start, end, freq=f"{step_days}D"):
        for category in categories:
            row = features_for_category(timeline, category, snapshot, horizon_days)
            if row:
                rows.append(row)
    return pd.DataFrame(rows)


def baseline_scores(examples: pd.DataFrame, horizon_days: int) -> np.ndarray:
    estimated_due_in = examples["median_interval"] - examples["days_since_last"]
    return (horizon_days - estimated_due_in).astype(float).to_numpy()


def best_f1_threshold(y_true: np.ndarray, y_score: np.ndarray) -> float:
    candidates = np.linspace(float(np.min(y_score)), float(np.max(y_score)), 101)
    best_threshold = 0.5
    best_score = -1.0
    for threshold in candidates:
        score = f1_score(y_true, (y_score >= threshold).astype(int), zero_division=0)
        if score > best_score:
            best_score = score
            best_threshold = float(threshold)
    return best_threshold


def metrics(y_true: np.ndarray, y_score: np.ndarray, threshold: float) -> dict[str, float]:
    y_pred = (y_score >= threshold).astype(int)
    result = {
        "average_precision": float(average_precision_score(y_true, y_score)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "threshold": float(threshold),
    }
    result["roc_auc"] = float(roc_auc_score(y_true, y_score)) if len(set(y_true.tolist())) > 1 else 0.0
    return result


def train_personal_model(train: pd.DataFrame) -> Pipeline:
    numeric = [
        "days_since_last",
        "purchase_count",
        "purchase_count_90d",
        "total_quantity",
        "quantity_90d",
        "total_spend",
        "spend_90d",
        "last_quantity",
        "last_discount_percent",
        "last_coupon_used",
        "last_is_promo",
        "last_is_stockup",
        "promo_rate",
        "coupon_rate",
        "stockup_rate",
        "avg_discount_percent",
        "household_size",
        "month",
        "weekday",
        "median_interval",
        "average_interval",
        "interval_variability",
    ]
    categorical = ["category"]
    preprocessor = ColumnTransformer(
        [
            ("category", OneHotEncoder(handle_unknown="ignore"), categorical),
            ("numeric", StandardScaler(), numeric),
        ]
    )
    model = LogisticRegression(class_weight="balanced", max_iter=1000)
    return Pipeline([("preprocessor", preprocessor), ("model", model)]).fit(train[categorical + numeric], train["label"])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--history", default="data-science/data/personal_history_12m.csv")
    parser.add_argument("--future", default="data-science/data/personal_future_3m.csv")
    parser.add_argument("--horizon-days", type=int, default=14)
    parser.add_argument("--step-days", type=int, default=7)
    parser.add_argument("--output", default="data-science/outputs/personal_refill_metrics.json")
    args = parser.parse_args()

    history = load_transactions(args.history)
    future = load_transactions(args.future)
    full = pd.concat([history, future], ignore_index=True).sort_values("invoice_date")
    anchor = history["invoice_date"].max().normalize()

    train_start = history["invoice_date"].min().normalize() + pd.Timedelta(days=60)
    train_end = anchor - pd.Timedelta(days=args.horizon_days)
    test_start = anchor + pd.Timedelta(days=1)
    test_end = future["invoice_date"].max().normalize() - pd.Timedelta(days=args.horizon_days)

    train = build_examples(history, train_start, train_end, args.horizon_days, args.step_days)
    test = build_examples(full, test_start, test_end, args.horizon_days, args.step_days)
    if train.empty or test.empty:
        raise ValueError("Not enough individual history/future examples.")

    pipeline = train_personal_model(train)
    feature_columns = [column for column in train.columns if column not in {"snapshot_date", "label"}]
    train_ml_scores = pipeline.predict_proba(train[feature_columns])[:, 1]
    train_baseline = baseline_scores(train, args.horizon_days)
    ml_scores = pipeline.predict_proba(test[feature_columns])[:, 1]
    baseline = baseline_scores(test, args.horizon_days)
    ml_threshold = best_f1_threshold(train["label"].to_numpy(), train_ml_scores)
    baseline_threshold = best_f1_threshold(train["label"].to_numpy(), train_baseline)

    result = {
        "user": "PERSONA_FAMILY_001",
        "framing": "train on 12 months individual history, evaluate on next 3 months rolling future",
        "history_rows": int(len(history)),
        "future_rows": int(len(future)),
        "train_examples": int(len(train)),
        "test_examples": int(len(test)),
        "test_positive_rate": float(test["label"].mean()),
        "horizon_days": args.horizon_days,
        "baseline_median_interval": metrics(test["label"].to_numpy(), baseline, threshold=baseline_threshold),
        "personal_logistic_model": metrics(test["label"].to_numpy(), ml_scores, threshold=ml_threshold),
        "top_future_predictions": top_predictions(test, ml_scores),
    }

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    print(f"Wrote metrics to {output}")


def top_predictions(test: pd.DataFrame, scores: np.ndarray) -> list[dict[str, object]]:
    ranked = test.copy()
    ranked["score"] = scores
    ranked = ranked.sort_values("score", ascending=False).head(12)
    return [
        {
            "category": row.category,
            "snapshot_date": row.snapshot_date.date().isoformat(),
            "probability_next_14_days": round(float(row.score), 3),
            "days_since_last": int(row.days_since_last),
            "median_interval": round(float(row.median_interval), 1),
            "last_is_stockup": int(row.last_is_stockup),
            "last_is_promo": int(row.last_is_promo),
            "actual_label": int(row.label),
        }
        for row in ranked.itertuples()
    ]


if __name__ == "__main__":
    main()
