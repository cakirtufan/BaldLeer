from __future__ import annotations

import argparse
import csv
import re
import subprocess
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


FILENAME_RE = re.compile(r".*_dm-eBon_(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})\.pdf$", re.IGNORECASE)
PRICE_QTY_RE = re.compile(r"^([0-9]+,[0-9]{2})\s+([0-9]+)$")
MULTI_PRODUCT_RE = re.compile(r"^([0-9]+)x\s+([0-9]+,[0-9]{2})\s+(.+)$")
STOP_MARKERS = {
    "Zwischensumme",
    "SUMME EUR",
    "Zu zahlender Betrag EUR",
    "MwSt-Satz",
    "******************************************",
}


@dataclass(frozen=True)
class DmReceipt:
    invoice_id: str
    invoice_date: str
    rows: list[dict[str, object]]


def normalize_product_name(product_name: str) -> str:
    normalized = product_name.lower()
    normalized = normalized.replace("ß", "ss").replace("ä", "ae").replace("ö", "oe").replace("ü", "ue")
    normalized = re.sub(r"[^a-z0-9]+", "_", normalized)
    return normalized.strip("_")


def category_for_product(product_name: str) -> str:
    name = product_name.upper()
    rules = [
        ("diapers", ["PAMPERS", "PANTS", "WINDEL", "BABYLOVE PANTS"]),
        ("baby_wipes", ["FEUCHTT", "WIPES", "BABYPFLEGETÜC", "BABYPFLEGETUEC", "HÄNDEREINIGUNGST", "HAENDEREINIGUNGST"]),
        ("baby_food", ["HIPP", "FRUCHTBAR", "BABYBREI", "QUETSCH", "MENÜ", "MENUE", "GLÄSCHEN", "GLAESCHEN", "APTAMIL", "KINDERMILCH", "MAMA SMOOTHIE"]),
        ("baby_care", ["BABYLOVE", "NUK", "AVENT", "MEDELA", "LANSINOH", "STILLSAFT", "STILLSCHAL", "SCHNULLER", "TRINKFL", "TRINKB", "BABYLÖFFEL", "BABYLOEFFEL"]),
        ("coffee", ["KAFFEE", "ESPRESSO", "CREMA", "EARLYBIRD", "LAVAZZA"]),
        ("laundry_detergent", ["WASCHMITTEL", "COLOR", "PERSIL", "SPEE", "DASH", "WEICHSPÜLER", "WEICHSPUELER"]),
        ("dishwasher_tabs", ["SPÜLMASCH", "SPUELMASCH", "SOMAT", "FINISH", "TABS", "KLARSPÜLER", "KLARSPUELER"]),
        ("toilet_paper", ["TOILETTENPAPIER", "TOIPA", "KLOPAPIER"]),
        ("kitchen_paper", ["KÜCHENROLLE", "KUECHENROLLE", "KÜCHENTUCH", "KUECHENTUCH", "TASCHENTÜCHER", "TASCHENTUECHER"]),
        ("shampoo", ["SHAMPOO", "SPÜLUNG", "SPUELUNG", "HAARKUR", "BATISTE", "TROCKEN SH", "TROCKENSH", "OGX"]),
        ("toothpaste", ["ZAHNPASTA", "ZAHNCREME", "SENSODYNE", "ELMEX", "ORAL-B"]),
        ("deodorant", ["DEO", "DEODORANT", "REXONA", "NIVEA MEN"]),
        ("soap", ["SEIFE", "HANDWASCH", "WASCHGEL", "DUSCHGEL", "DUSCHE"]),
        ("cleaning_spray", ["REINIGER", "BAD", "WC", "DOMESTOS", "DENKMIT", "SPRAY", "ENTKALKER", "SAGROTAN", "DESINFEKTION"]),
        ("suncare", ["SONNEN", "SUN", "LSF", "AFTER SUN"]),
        ("tea_health", ["TEE", "VITAMIN", "HUSTEN", "HALS", "ERKÄLT", "ERKAELT", "MAGNESIUM", "DOPPELHERZ", "MIVOLIS", "HANSAPLAST", "FFP2", "KOMPRES"]),
        ("pet_food", ["KATZE", "KATER", "HUND", "FELIX", "WHISKAS", "PURINA"]),
        ("personal_care", ["CREME", "LOTION", "GESICHT", "RASIER", "BÜRSTE", "BUERSTE", "WATTE", "TAMPON", "BINDEN", "ALWAYS", "WELEDA", "PFLEGEÖL", "PFLEGEOEL"]),
        ("household", ["PROFISSIMO", "MÜLLBEUTEL", "MUELLBEUTEL", "PACKPAPIER", "PUMPSP", "SCHWAMM", "HANDSCHUHE"]),
        ("snacks", ["RIEGEL", "KEKS", "SCHOKO", "CHIPS", "GUMMI"]),
    ]
    for category, tokens in rules:
        if any(token in name for token in tokens):
            return category
    return "other"


def parse_filename(path: Path) -> tuple[str, str]:
    match = FILENAME_RE.match(path.name)
    if not match:
        raise ValueError(f"Unsupported dm receipt filename: {path.name}")
    day, hour, minute, second = match.groups()
    timestamp = datetime.strptime(f"{day} {hour}:{minute}:{second}", "%Y-%m-%d %H:%M:%S")
    return path.stem, timestamp.isoformat()


def pdf_text(path: Path) -> str:
    result = subprocess.run(["pdftotext", str(path), "-"], check=True, capture_output=True, text=True, encoding="utf-8")
    return result.stdout


def parse_product_rows(path: Path) -> DmReceipt:
    invoice_id, invoice_date = parse_filename(path)
    lines = [line.strip() for line in pdf_text(path).splitlines() if line.strip()]
    rows: list[dict[str, object]] = []
    index = 0
    while index < len(lines):
        line = lines[index]
        if line in STOP_MARKERS or line.startswith("dm-Rabatte"):
            break

        multi = MULTI_PRODUCT_RE.match(line)
        if multi:
            quantity = int(multi.group(1))
            unit_price = float(multi.group(2).replace(",", "."))
            product_name = multi.group(3).strip()
            next_line = lines[index + 1] if index + 1 < len(lines) else ""
            if PRICE_QTY_RE.match(next_line):
                index += 1
            if unit_price > 0:
                rows.append(create_row(invoice_id, invoice_date, product_name, quantity, unit_price))
            index += 1
            continue

        next_line = lines[index + 1] if index + 1 < len(lines) else ""
        price_qty = PRICE_QTY_RE.match(next_line)
        if price_qty and not looks_like_header(line):
            product_name = line
            total_price = float(price_qty.group(1).replace(",", "."))
            quantity = int(price_qty.group(2))
            unit_price = round(total_price / max(1, quantity), 2)
            if unit_price > 0:
                rows.append(create_row(invoice_id, invoice_date, product_name, quantity, unit_price))
            index += 2
            continue

        index += 1

    if not rows:
        rows = parse_block_layout(invoice_id, invoice_date, lines)

    return DmReceipt(invoice_id=invoice_id, invoice_date=invoice_date, rows=rows)


def parse_block_layout(invoice_id: str, invoice_date: str, lines: list[str]) -> list[dict[str, object]]:
    product_names: list[str] = []
    stop_index = -1
    for index, line in enumerate(lines):
        if line in STOP_MARKERS or line.startswith("SUMME"):
            stop_index = index
            break
        if index < 5 or looks_like_header(line):
            continue
        if re.search(r"[A-Za-zÄÖÜäöüß]", line):
            product_names.append(line)

    if not product_names or stop_index < 0:
        return []

    after_products = lines[stop_index + 1 :]
    before_tax: list[str] = []
    for line in after_products:
        if line == "MwSt-Satz" or line.startswith("Deine PAYBACK") or line.startswith("*****"):
            break
        before_tax.append(line)

    decimal_values = [float(line.replace(",", ".")) for line in before_tax if re.match(r"^-?[0-9]+,[0-9]{2}$", line)]
    quantity_values = [int(line) for line in before_tax if re.match(r"^[0-9]+$", line)]
    count = min(len(product_names), len(decimal_values))
    if count == 0:
        return []

    quantities = quantity_values[-count:] if len(quantity_values) >= count else [1] * count
    rows: list[dict[str, object]] = []
    for product_name, unit_price, quantity in zip(product_names[:count], decimal_values[:count], quantities):
        if unit_price > 0:
            rows.append(create_row(invoice_id, invoice_date, product_name, quantity, unit_price))
    return rows


def looks_like_header(line: str) -> bool:
    return bool(
        re.match(r"^\d{2}\.\d{2}\.\d{4}$", line)
        or re.match(r"^\d{2}:\d{2}$", line)
        or re.match(r"^[A-Z]\d+/\d+$", line)
        or re.match(r"^\d+/\d+$", line)
        or re.match(r"^\d{3,}$", line)
    )


def create_row(invoice_id: str, invoice_date: str, product_name: str, quantity: int, unit_price: float) -> dict[str, object]:
    category = category_for_product(product_name)
    return {
        "customer_id": "DM_RECEIPT_USER",
        "segment": "real_receipt_export",
        "household_size": 1,
        "invoice_id": invoice_id,
        "invoice_date": invoice_date,
        "period": "unknown",
        "store_channel": "store_ebon",
        "store_code": "",
        "barcode": "",
        "product_name": product_name,
        "brand_variant": product_name,
        "category": category,
        "package_size": "",
        "quantity": quantity,
        "unit_price": unit_price,
        "discount_percent": 0,
        "coupon_used": 0,
        "is_promo": 0,
        "is_stockup": 1 if quantity >= 2 else 0,
        "vat_group": "",
        "normalized_product_name": normalize_product_name(product_name),
    }


def add_months(value: datetime, months: int) -> datetime:
    month = value.month + months
    year = value.year + (month - 1) // 12
    month = ((month - 1) % 12) + 1
    day = min(value.day, 28)
    return value.replace(year=year, month=month, day=day)


def split_period(rows: list[dict[str, object]], future_months: int) -> None:
    dates = [datetime.fromisoformat(str(row["invoice_date"])) for row in rows]
    cutoff = add_months(max(dates), -future_months)
    for row in rows:
        row["period"] = "history" if datetime.fromisoformat(str(row["invoice_date"])) < cutoff else "future"


def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        raise ValueError("No rows extracted from dm receipts.")
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", default="data/dm-receipts")
    parser.add_argument("--output", default="data-science/data/dm_receipts.csv")
    parser.add_argument("--history-output", default="data-science/data/dm_history.csv")
    parser.add_argument("--future-output", default="data-science/data/dm_future.csv")
    parser.add_argument("--future-months", type=int, default=3)
    args = parser.parse_args()

    receipts = [parse_product_rows(path) for path in sorted(Path(args.input_dir).glob("*.pdf"))]
    rows = [row for receipt in receipts for row in receipt.rows]
    rows.sort(key=lambda row: (str(row["invoice_date"]), str(row["invoice_id"]), str(row["product_name"])))
    split_period(rows, args.future_months)
    history = [row for row in rows if row["period"] == "history"]
    future = [row for row in rows if row["period"] == "future"]

    write_csv(Path(args.output), rows)
    write_csv(Path(args.history_output), history)
    write_csv(Path(args.future_output), future)

    categories = sorted({str(row["category"]) for row in rows})
    empty_receipts = [receipt.invoice_id for receipt in receipts if not receipt.rows]
    print(f"Extracted {len(rows)} product rows from {len(receipts)} dm receipts.")
    print(f"History rows: {len(history)} | Future rows: {len(future)} | Categories: {', '.join(categories)}")
    if empty_receipts:
        print(f"Receipts without parsed product rows: {len(empty_receipts)}")


if __name__ == "__main__":
    main()
