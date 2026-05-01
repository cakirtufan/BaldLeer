from __future__ import annotations

import argparse
import csv
import re
import subprocess
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


PRODUCT_LINE_RE = re.compile(r"^[♥\s]*(\d{7,14})♥(.+?)€\s*([0-9]+,[0-9]{2})\*?♥?([AB])")
FILENAME_RE = re.compile(r"ROSSMANN-Bon-(\d{4}-\d{2}-\d{2})-T(\d{6})-VKST-(\d+)\.pdf", re.IGNORECASE)


@dataclass(frozen=True)
class ExtractedReceipt:
    invoice_id: str
    invoice_date: str
    store_code: str
    rows: list[dict[str, object]]


def category_for_product(product_name: str) -> str:
    name = product_name.upper()
    rules = [
        ("baby_care", ["BEBE", "BABY", "KINDER", "FEUCHTT", "HIPP", "PAMPERS", "ERDBÄR", "ERDBAER", "FRUCHTBAR", "NUK"]),
        ("suncare", ["AMBRE", "SOLAIRE", "SONNEN", "LSF"]),
        ("toilet_paper", ["TOIPA", "TOILET", "KLOPAPIER"]),
        ("kitchen_paper", ["KUECHEN", "KÜCHEN", "KÜCHENT", "KUECHENT", "TUECHER", "TÜCHER", "TATÜ"]),
        ("dishwasher_tabs", ["SOMAT", "FINISH", "SPUELMASCH", "SPÜLMASCH"]),
        ("laundry_detergent", ["WASCHMITTEL", "RUBIN MULTI", "VOLLWASCH", "COLORWASCH"]),
        ("soap", ["SEIFE", "SEIFEN", "HANDSEIFE"]),
        ("cleaning_spray", ["REINIG", "HYGIENE", "DOMOL", "BADREINIG", "ALLZWECK", "FAIRY", "WC ENTE", "BIFF", "MR.PROPER", "SCHWAMMTUCH"]),
        ("shampoo", ["SHAMPOO", "TROCKENSHA", "BATISTE"]),
        ("deodorant", ["DEO", "REXONA"]),
        ("toothpaste", ["ZAHNPASTA", "PROKUDENT", "SENSODYNE", "TEPE"]),
        ("tea_health", ["TEE", "EARL GREY", "MEßMER", "MESSMER", "VITAMIN", "ERKÄLT", "ERKAELT", "ABTEI", "ROTB", "HEILBR", "HALS", "HUSTEN"]),
        ("personal_care", ["LIPPEN", "HAND&NAGEL", "PFLEG", "BÜRSTE", "BUERSTE", "ALWAYS", "BINDE", "RAS", "MIZELLEN", "NAGEL"]),
        ("household", ["TRAGETASCHE", "EASYZIP", "AROMA", "BEUTEL"]),
        ("coffee", ["LAVAZZA", "KAFFEE", "CREMA"]),
        ("snacks", ["BALLS", "PEANUT", "BROWNIE", "REESES"]),
    ]
    for category, tokens in rules:
        if any(token in name for token in tokens):
            return category
    return "other"


def normalize_product_name(product_name: str) -> str:
    normalized = product_name.lower()
    normalized = normalized.replace("ß", "ss").replace("ä", "ae").replace("ö", "oe").replace("ü", "ue")
    normalized = re.sub(r"[^a-z0-9]+", "_", normalized)
    return normalized.strip("_")


def parse_filename(path: Path) -> tuple[str, str, str]:
    match = FILENAME_RE.match(path.name)
    if not match:
        raise ValueError(f"Unsupported Rossmann receipt filename: {path.name}")
    day, time_part, store_code = match.groups()
    timestamp = datetime.strptime(f"{day} {time_part}", "%Y-%m-%d %H%M%S")
    invoice_id = path.stem
    return invoice_id, timestamp.isoformat(), store_code


def pdf_text(path: Path) -> str:
    result = subprocess.run(["pdftotext", str(path), "-"], check=True, capture_output=True, text=True, encoding="utf-8")
    return result.stdout


def clean_product(raw: str) -> str:
    product = raw.strip("♥ ")
    product = re.sub(r"♥+", " ", product)
    product = re.sub(r"\s+", " ", product)
    return product.strip()


def extract_receipt(path: Path) -> ExtractedReceipt:
    invoice_id, invoice_date, store_code = parse_filename(path)
    rows: list[dict[str, object]] = []
    in_coupon_section = False
    for line in pdf_text(path).splitlines():
        if "Deine Coupon-Ersparnis" in line:
            in_coupon_section = True
            continue
        if in_coupon_section and ("Summe:" in line or "Du hast insgesamt" in line):
            in_coupon_section = False
        if in_coupon_section:
            continue
        match = PRODUCT_LINE_RE.match(line)
        if not match:
            continue
        barcode, raw_product, raw_price, vat_group = match.groups()
        product_name = clean_product(raw_product)
        if product_name.upper().startswith("COUPON"):
            continue
        price = float(raw_price.replace(",", "."))
        category = category_for_product(product_name)
        rows.append(
            {
                "customer_id": "ROSSMANN_RECEIPT_USER",
                "segment": "real_receipt_export",
                "household_size": 1,
                "invoice_id": invoice_id,
                "invoice_date": invoice_date,
                "period": "unknown",
                "store_channel": "store_ebon",
                "store_code": store_code,
                "barcode": barcode,
                "product_name": product_name,
                "brand_variant": product_name,
                "category": category,
                "package_size": "",
                "quantity": 1,
                "unit_price": price,
                "discount_percent": 0,
                "coupon_used": 0,
                "is_promo": 1 if "*" in line else 0,
                "is_stockup": 0,
                "vat_group": vat_group,
            }
        )
    return ExtractedReceipt(invoice_id=invoice_id, invoice_date=invoice_date, store_code=store_code, rows=rows)


def add_months(value: datetime, months: int) -> datetime:
    month = value.month + months
    year = value.year + (month - 1) // 12
    month = ((month - 1) % 12) + 1
    day = min(value.day, 28)
    return value.replace(year=year, month=month, day=day)


def split_period(rows: list[dict[str, object]], train_months: int | None, future_months: int | None) -> None:
    dates = [datetime.fromisoformat(str(row["invoice_date"])) for row in rows]
    if future_months is not None:
        cutoff = add_months(max(dates), -future_months)
    elif train_months is not None:
        cutoff = add_months(min(dates), train_months)
    else:
        raise ValueError("Either train_months or future_months must be provided.")
    for row in rows:
        row["period"] = "history" if datetime.fromisoformat(str(row["invoice_date"])) < cutoff else "future"


def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        raise ValueError("No rows extracted from Rossmann receipts.")
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", default="data/rossmann-receipts")
    parser.add_argument("--output", default="data-science/data/rossmann_receipts.csv")
    parser.add_argument("--history-output", default="data-science/data/rossmann_history_9m.csv")
    parser.add_argument("--future-output", default="data-science/data/rossmann_future_3m.csv")
    parser.add_argument("--train-months", type=int, default=None)
    parser.add_argument("--future-months", type=int, default=3)
    args = parser.parse_args()

    receipts = [extract_receipt(path) for path in sorted(Path(args.input_dir).glob("*.pdf"))]
    rows = [row for receipt in receipts for row in receipt.rows]
    rows.sort(key=lambda row: (str(row["invoice_date"]), str(row["invoice_id"]), str(row["product_name"])))
    split_period(rows, args.train_months, args.future_months)
    history = [row for row in rows if row["period"] == "history"]
    future = [row for row in rows if row["period"] == "future"]

    write_csv(Path(args.output), rows)
    write_csv(Path(args.history_output), history)
    write_csv(Path(args.future_output), future)

    receipt_count = len(receipts)
    categories = sorted({str(row["category"]) for row in rows})
    print(f"Extracted {len(rows)} product rows from {receipt_count} Rossmann receipts.")
    print(f"History rows: {len(history)} | Future rows: {len(future)} | Categories: {', '.join(categories)}")


if __name__ == "__main__":
    main()
