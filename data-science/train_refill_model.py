from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import average_precision_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


COLUMN_ALIASES = {
    "CustomerID": "customer_id",
    "InvoiceNo": "invoice_id",
    "InvoiceDate": "invoice_date",
    "Description": "product_name",
    "Quantity": "quantity",
    "UnitPrice": "unit_price",
}

CATEGORY_KEYWORDS = {
    "toilet_paper": ["toilet", "paper", "roll"],
    "laundry_detergent": ["detergent", "wash", "laundry"],
    "dishwasher_tabs": ["dishwasher", "tabs"],
    "shampoo": ["shampoo"],
    "toothpaste": ["toothpaste", "dental"],
    "diapers": ["diaper", "nappy"],
    "baby_wipes": ["wipe", "baby"],
    "coffee": ["coffee", "espresso"],
    "pet_food": ["cat", "dog", "pet"],
    "kitchen_paper": ["kitchen towel", "towel"],
    "soap": ["soap"],
    "cleaning_spray": ["cleaner", "spray"],
}


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.rename(columns={old: new for old, new in COLUMN_ALIASES.items() if old in df.columns})
    required = {"customer_id", "invoice_id", "invoice_date", "product_name", "quantity", "unit_price"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    if "category" not in df.columns:
        df["category"] = df["product_name"].map(infer_category)

    df = df.dropna(subset=["customer_id", "invoice_date", "product_name"])
    df["invoice_date"] = pd.to_datetime(df["invoice_date"], errors="coerce")
    df = df.dropna(subset=["invoice_date"])
    df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(1).clip(lower=1)
    df["unit_price"] = pd.to_numeric(df["unit_price"], errors="coerce").fillna(0).clip(lower=0)
    df["spend"] = df["quantity"] * df["unit_price"]
    for column in ["discount_percent", "coupon_used", "is_promo", "is_stockup", "household_size"]:
        if column not in df.columns:
            df[column] = 0
        df[column] = pd.to_numeric(df[column], errors="coerce").fillna(0)
    for column, default in [("segment", "unknown"), ("store_channel", "unknown")]:
        if column not in df.columns:
            df[column] = default
        df[column] = df[column].fillna(default).astype(str)
    return df.sort_values("invoice_date")


def infer_category(product_name: str) -> str:
    text = str(product_name).lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in text for keyword in keywords):
            return category
    return "other"


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


def build_examples(df: pd.DataFrame, horizon_days: int, step_days: int) -> pd.DataFrame:
    examples: list[dict[str, object]] = []
    min_date = df["invoice_date"].min().normalize() + pd.Timedelta(days=45)
    max_date = df["invoice_date"].max().normalize() - pd.Timedelta(days=horizon_days)
    snapshots = pd.date_range(min_date, max_date, freq=f"{step_days}D")

    grouped = df.groupby(["customer_id", "category"], sort=False)
    for (customer_id, category), group in grouped:
      group = group.sort_values("invoice_date")
      if len(group) < 2:
          continue
      for snapshot in snapshots:
          history = group[group["invoice_date"] <= snapshot]
          if len(history) < 2:
              continue
          future = group[(group["invoice_date"] > snapshot) & (group["invoice_date"] <= snapshot + pd.Timedelta(days=horizon_days))]
          last_date = history["invoice_date"].max().normalize()
          features = interval_features(history)
          last_90_days = history[history["invoice_date"] >= snapshot - pd.Timedelta(days=90)]
          last_purchase = history.sort_values("invoice_date").iloc[-1]
          examples.append(
              {
                  "customer_id": str(customer_id),
                  "category": str(category),
                  "segment": str(last_purchase.get("segment", "unknown")),
                  "store_channel": str(last_purchase.get("store_channel", "unknown")),
                  "snapshot_date": snapshot,
                  "days_since_last": int((snapshot - last_date).days),
                  "purchase_count": int(len(history)),
                  "purchase_count_90d": int(len(last_90_days)),
                  "total_quantity": float(history["quantity"].sum()),
                  "quantity_90d": float(last_90_days["quantity"].sum()),
                  "total_spend": float(history["spend"].sum()),
                  "spend_90d": float(last_90_days["spend"].sum()),
                  "last_quantity": float(last_purchase["quantity"]),
                  "last_discount_percent": float(last_purchase["discount_percent"]),
                  "last_coupon_used": float(last_purchase["coupon_used"]),
                  "last_is_promo": float(last_purchase["is_promo"]),
                  "last_is_stockup": float(last_purchase["is_stockup"]),
                  "promo_rate": float(history["is_promo"].mean()),
                  "coupon_rate": float(history["coupon_used"].mean()),
                  "stockup_rate": float(history["is_stockup"].mean()),
                  "avg_discount_percent": float(history["discount_percent"].mean()),
                  "household_size": float(last_purchase.get("household_size", 0)),
                  "month": int(snapshot.month),
                  "weekday": int(snapshot.weekday()),
                  "median_interval": features["median_interval"],
                  "average_interval": features["average_interval"],
                  "interval_variability": features["interval_variability"],
                  "label": int(len(future) > 0),
              }
          )

    return pd.DataFrame(examples)


def baseline_scores(examples: pd.DataFrame, horizon_days: int) -> np.ndarray:
    estimated_due_in = examples["median_interval"] - examples["days_since_last"]
    return (horizon_days - estimated_due_in).astype(float).to_numpy()


def metrics(y_true: np.ndarray, y_score: np.ndarray, threshold: float) -> dict[str, float]:
    y_pred = (y_score >= threshold).astype(int)
    result = {
        "average_precision": float(average_precision_score(y_true, y_score)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
    }
    if len(set(y_true.tolist())) > 1:
        result["roc_auc"] = float(roc_auc_score(y_true, y_score))
    else:
        result["roc_auc"] = 0.0
    return result


def train_and_evaluate(examples: pd.DataFrame, horizon_days: int, estimators: int) -> dict[str, object]:
    split_date = examples["snapshot_date"].quantile(0.75)
    train = examples[examples["snapshot_date"] <= split_date].copy()
    test = examples[examples["snapshot_date"] > split_date].copy()

    numeric_features = [
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
    categorical_features = ["category", "segment", "store_channel"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("category", OneHotEncoder(handle_unknown="ignore"), categorical_features),
            ("numeric", "passthrough", numeric_features),
        ]
    )
    model = RandomForestClassifier(
        n_estimators=estimators,
        min_samples_leaf=8,
        class_weight="balanced_subsample",
        n_jobs=1,
        random_state=42,
    )
    pipeline = Pipeline([("preprocessor", preprocessor), ("model", model)])
    pipeline.fit(train[categorical_features + numeric_features], train["label"])

    ml_scores = pipeline.predict_proba(test[categorical_features + numeric_features])[:, 1]
    baseline = baseline_scores(test, horizon_days)

    return {
        "examples": int(len(examples)),
        "train_examples": int(len(train)),
        "test_examples": int(len(test)),
        "positive_rate_test": float(test["label"].mean()),
        "horizon_days": horizon_days,
        "baseline_median_interval": metrics(test["label"].to_numpy(), baseline, threshold=0.0),
        "random_forest": metrics(test["label"].to_numpy(), ml_scores, threshold=0.5),
        "sample_predictions": sample_predictions(test, ml_scores),
    }


def sample_predictions(test: pd.DataFrame, scores: np.ndarray) -> list[dict[str, object]]:
    sample = test.copy()
    sample["score"] = scores
    sample = sample.sort_values("score", ascending=False).head(10)
    return [
        {
            "customer_id": row.customer_id,
            "category": row.category,
            "segment": row.segment,
            "snapshot_date": row.snapshot_date.date().isoformat(),
            "probability_next_14_days": round(float(row.score), 3),
            "days_since_last": int(row.days_since_last),
            "median_interval": round(float(row.median_interval), 1),
            "last_is_stockup": int(row.last_is_stockup),
            "last_is_promo": int(row.last_is_promo),
            "actual_label": int(row.label),
        }
        for row in sample.itertuples()
    ]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--horizon-days", type=int, default=14)
    parser.add_argument("--step-days", type=int, default=14)
    parser.add_argument("--estimators", type=int, default=70)
    parser.add_argument("--max-examples", type=int, default=45000)
    parser.add_argument("--output", default="data-science/outputs/refill_model_metrics.json")
    args = parser.parse_args()

    df = normalize_columns(pd.read_csv(args.input))
    examples = build_examples(df, horizon_days=args.horizon_days, step_days=args.step_days)
    if examples.empty:
        raise ValueError("No supervised examples could be built. Need repeated purchases per customer/category.")
    if len(examples) > args.max_examples:
        examples = examples.sort_values("snapshot_date").sample(args.max_examples, random_state=42).sort_values("snapshot_date")

    result = train_and_evaluate(examples, horizon_days=args.horizon_days, estimators=args.estimators)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    print(f"Wrote metrics to {output_path}")


if __name__ == "__main__":
    main()
