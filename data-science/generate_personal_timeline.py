from __future__ import annotations

import argparse
import csv
import random
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path


@dataclass(frozen=True)
class PersonalPattern:
    category: str
    products: tuple[str, ...]
    base_interval: int
    jitter: int
    price: float
    package_size: str
    active_months: tuple[int, ...] | None = None
    future_discount_window: tuple[int, int] | None = None


PATTERNS = [
    PersonalPattern("toilet_paper", ("Toilettenpapier 10 Rollen", "Toilettenpapier 20 Rollen"), 33, 9, 5.45, "Rollen"),
    PersonalPattern("laundry_detergent", ("Colorwaschmittel 1,5 L", "Vollwaschmittel Pulver"), 39, 12, 4.75, "Packung"),
    PersonalPattern("dishwasher_tabs", ("Spuelmaschinentabs 60 Stueck", "Spuelmaschinentabs All-in-1"), 42, 10, 7.95, "Packung"),
    PersonalPattern("shampoo", ("Shampoo Sensitiv 300 ml", "Shampoo Repair 300 ml"), 51, 17, 2.45, "Flasche"),
    PersonalPattern("toothpaste", ("Zahnpasta Kraeuter 75 ml", "Zahnpasta Sensitive 75 ml"), 46, 12, 1.95, "Tube"),
    PersonalPattern("diapers", ("Windeln Groesse 5", "Windeln Pants Groesse 5"), 13, 4, 10.95, "Packung", None, (18, 32)),
    PersonalPattern("baby_wipes", ("Feuchttuecher Sensitiv", "Feuchttuecher Aqua"), 15, 5, 4.95, "Packung", None, (18, 32)),
    PersonalPattern("coffee", ("Kaffee Crema 1 kg", "Kaffee Espresso 1 kg"), 24, 8, 10.49, "Packung"),
    PersonalPattern("kitchen_paper", ("Kuechenrolle 4 Rollen", "Kuechentuecher 3-lagig"), 27, 9, 3.25, "Rollen"),
    PersonalPattern("soap", ("Fluessigseife Nachfuellpack", "Handseife Milch & Honig"), 36, 11, 1.65, "Packung"),
    PersonalPattern("cleaning_spray", ("Badreiniger Spray", "Allzweckreiniger"), 34, 13, 2.25, "Flasche"),
    PersonalPattern("suncare", ("Sonnencreme LSF 50", "Sonnenmilch Kids LSF 50"), 31, 8, 8.95, "Flasche", (5, 6, 7, 8)),
]

NOISE_PRODUCTS = [
    ("Handcreme Limited Edition", "cosmetics", 1.95),
    ("Duftkerze Vanille", "home", 3.45),
    ("Geschenkset Pflege", "gift", 9.95),
    ("Nagellack Rot", "cosmetics", 2.75),
    ("Vitamin C Brausetabletten", "health", 1.25),
]

COUPLINGS = {
    "diapers": ("baby_wipes",),
    "baby_wipes": ("diapers",),
    "dishwasher_tabs": ("cleaning_spray",),
    "laundry_detergent": ("soap",),
}


def product_by_category() -> dict[str, PersonalPattern]:
    return {pattern.category: pattern for pattern in PATTERNS}


def is_active(pattern: PersonalPattern, day: date) -> bool:
    return pattern.active_months is None or day.month in pattern.active_months


def promo_for(pattern: PersonalPattern, day_index: int, is_future: bool) -> tuple[bool, int]:
    if is_future and pattern.future_discount_window:
        start, end = pattern.future_discount_window
        if start <= day_index <= end:
            return True, random.choice([20, 25, 30])
    if random.random() < 0.10:
        return True, random.choice([10, 15, 20])
    return False, 0


def add_row(
    rows: list[dict[str, object]],
    invoice_id: str,
    invoice_date: date,
    pattern: PersonalPattern,
    is_future: bool,
    day_index: int,
    forced_quantity: int | None = None,
) -> bool:
    is_promo, discount = promo_for(pattern, day_index, is_future)
    stockup_probability = 0.18 + (0.28 if is_promo else 0.0)
    is_stockup = random.random() < stockup_probability
    quantity = forced_quantity or (2 if is_stockup else 1)
    if is_stockup and random.random() < 0.15:
        quantity = 3
    product_name = random.choice(pattern.products) if random.random() < 0.28 else pattern.products[0]
    rows.append(
        {
            "customer_id": "PERSONA_FAMILY_001",
            "segment": "family_with_toddler",
            "household_size": 4,
            "invoice_id": invoice_id,
            "invoice_date": invoice_date.isoformat(),
            "period": "future" if is_future else "history",
            "store_channel": "app_online" if random.random() < 0.20 else "store_ebon",
            "product_name": product_name,
            "brand_variant": product_name,
            "category": pattern.category,
            "package_size": pattern.package_size,
            "quantity": quantity,
            "unit_price": round(pattern.price * (1 - discount / 100), 2),
            "discount_percent": discount,
            "coupon_used": int(is_promo and random.random() < 0.75),
            "is_promo": int(is_promo),
            "is_stockup": int(is_stockup),
        }
    )
    return is_stockup


def generate_period(start: date, end: date, is_future: bool, invoice_start: int) -> tuple[list[dict[str, object]], int]:
    rows: list[dict[str, object]] = []
    invoice_counter = invoice_start
    lookup = product_by_category()

    for pattern in PATTERNS:
        current = start + timedelta(days=random.randint(0, max(3, pattern.base_interval - 2)))
        stockup_extension = 0
        while current <= end:
            if not is_active(pattern, current):
                current += timedelta(days=10)
                continue
            skip_probability = 0.08 if pattern.category in {"diapers", "baby_wipes"} else 0.16
            if random.random() < skip_probability:
                current += timedelta(days=pattern.base_interval + random.randint(0, pattern.jitter))
                continue

            actual = current + timedelta(days=random.randint(-pattern.jitter, pattern.jitter) + stockup_extension)
            stockup_extension = 0
            if start <= actual <= end:
                invoice_counter += 1
                invoice_id = f"PERS-{invoice_counter}"
                day_index = (actual - start).days
                is_stockup = add_row(rows, invoice_id, actual, pattern, is_future, day_index)

                for coupled_category in COUPLINGS.get(pattern.category, ()):
                    if random.random() < 0.42:
                        add_row(rows, invoice_id, actual, lookup[coupled_category], is_future, day_index, forced_quantity=1)

                if random.random() < 0.22:
                    name, category, price = random.choice(NOISE_PRODUCTS)
                    rows.append(
                        {
                            "customer_id": "PERSONA_FAMILY_001",
                            "segment": "family_with_toddler",
                            "household_size": 4,
                            "invoice_id": invoice_id,
                            "invoice_date": actual.isoformat(),
                            "period": "future" if is_future else "history",
                            "store_channel": "store_ebon",
                            "product_name": name,
                            "brand_variant": name,
                            "category": category,
                            "package_size": "1 Stueck",
                            "quantity": 1,
                            "unit_price": price,
                            "discount_percent": 0,
                            "coupon_used": 0,
                            "is_promo": 0,
                            "is_stockup": 0,
                        }
                    )

                if is_stockup:
                    stockup_extension = random.randint(7, 18)

            current += timedelta(days=max(5, pattern.base_interval + random.randint(-6, 8)))

    rows.sort(key=lambda row: (str(row["invoice_date"]), str(row["invoice_id"])))
    return rows, invoice_counter


def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--history-output", default="data-science/data/personal_history_12m.csv")
    parser.add_argument("--future-output", default="data-science/data/personal_future_3m.csv")
    parser.add_argument("--full-output", default="data-science/data/personal_full_15m.csv")
    args = parser.parse_args()

    random.seed(args.seed)
    anchor = date.today()
    history_start = anchor - timedelta(days=365)
    history_end = anchor
    future_start = anchor + timedelta(days=1)
    future_end = anchor + timedelta(days=90)

    history, invoice_counter = generate_period(history_start, history_end, False, 20000)
    future, _ = generate_period(future_start, future_end, True, invoice_counter)
    full = sorted(history + future, key=lambda row: (str(row["invoice_date"]), str(row["invoice_id"])))

    write_csv(Path(args.history_output), history)
    write_csv(Path(args.future_output), future)
    write_csv(Path(args.full_output), full)

    print(f"Wrote {len(history)} history rows to {args.history_output}")
    print(f"Wrote {len(future)} future rows to {args.future_output}")
    print(f"Wrote {len(full)} full timeline rows to {args.full_output}")


if __name__ == "__main__":
    main()
