from __future__ import annotations

import argparse
import csv
import random
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path


@dataclass(frozen=True)
class ProductPattern:
    product_names: tuple[str, ...]
    category: str
    package_size: str
    base_interval_days: int
    interval_jitter_days: int
    unit_price: float
    segment_weights: dict[str, float]
    stockup_probability: float
    skip_probability: float
    promo_sensitivity: float


SEGMENTS = {
    "family": {
        "household_size": (3, 5),
        "promo_sensitivity": 0.55,
        "brand_switch_probability": 0.22,
        "basket_noise_probability": 0.18,
    },
    "single": {
        "household_size": (1, 1),
        "promo_sensitivity": 0.38,
        "brand_switch_probability": 0.30,
        "basket_noise_probability": 0.26,
    },
    "pet": {
        "household_size": (1, 3),
        "promo_sensitivity": 0.48,
        "brand_switch_probability": 0.20,
        "basket_noise_probability": 0.22,
    },
}


PRODUCTS = [
    ProductPattern(("Toilettenpapier 10 Rollen", "Toilettenpapier Recycling 8 Rollen", "Toilettenpapier 20 Rollen"), "toilet_paper", "Rollen", 31, 9, 5.45, {"family": 1.25, "single": 0.72, "pet": 1.0}, 0.22, 0.08, 0.55),
    ProductPattern(("Colorwaschmittel 1,5 L", "Vollwaschmittel Pulver", "Colorwaschmittel 2,5 L"), "laundry_detergent", "Packung", 36, 11, 4.75, {"family": 1.35, "single": 0.72, "pet": 1.0}, 0.18, 0.10, 0.45),
    ProductPattern(("Spuelmaschinentabs 60 Stueck", "Spuelmaschinentabs All-in-1", "Spuelmaschinenpulver"), "dishwasher_tabs", "Packung", 39, 12, 7.95, {"family": 1.15, "single": 0.48, "pet": 0.9}, 0.20, 0.14, 0.52),
    ProductPattern(("Shampoo Sensitiv 300 ml", "Shampoo Repair 300 ml", "Shampoo Family 500 ml"), "shampoo", "Flasche", 48, 16, 2.45, {"family": 1.0, "single": 1.08, "pet": 0.9}, 0.10, 0.16, 0.35),
    ProductPattern(("Zahnpasta Kraeuter 75 ml", "Zahnpasta Sensitive 75 ml", "Zahnpasta Whitening 75 ml"), "toothpaste", "Tube", 44, 13, 1.95, {"family": 1.12, "single": 1.0, "pet": 0.9}, 0.12, 0.12, 0.35),
    ProductPattern(("Windeln Groesse 5", "Windeln Pants Groesse 5", "Windeln Groesse 6"), "diapers", "Packung", 12, 4, 10.95, {"family": 1.85, "single": 0.0, "pet": 0.0}, 0.28, 0.04, 0.60),
    ProductPattern(("Feuchttuecher Sensitiv", "Feuchttuecher Aqua", "Feuchttuecher 6er Pack"), "baby_wipes", "Packung", 14, 5, 4.95, {"family": 1.65, "single": 0.1, "pet": 0.0}, 0.24, 0.06, 0.58),
    ProductPattern(("Kaffee Crema 1 kg", "Kaffee Espresso 1 kg", "Kaffee Pads 32 Stueck"), "coffee", "Packung", 22, 8, 10.49, {"family": 1.0, "single": 1.38, "pet": 1.0}, 0.25, 0.10, 0.62),
    ProductPattern(("Katzenfutter Huhn 12er Pack", "Katzenfutter Lachs 12er Pack", "Katzenstreu 10 L"), "pet_food", "Packung", 14, 4, 6.95, {"family": 0.0, "single": 0.1, "pet": 1.85}, 0.20, 0.04, 0.50),
    ProductPattern(("Kuechenrolle 4 Rollen", "Kuechenrolle Recycling", "Kuechentuecher 3-lagig"), "kitchen_paper", "Rollen", 24, 8, 3.25, {"family": 1.1, "single": 0.7, "pet": 1.3}, 0.18, 0.12, 0.45),
    ProductPattern(("Fluessigseife Nachfuellpack", "Handseife Milch & Honig", "Seife Sensitiv Nachfuellpack"), "soap", "Packung", 35, 12, 1.65, {"family": 1.0, "single": 0.8, "pet": 1.0}, 0.12, 0.15, 0.32),
    ProductPattern(("Badreiniger Spray", "Allzweckreiniger", "Kuechenreiniger Spray"), "cleaning_spray", "Flasche", 32, 13, 2.25, {"family": 1.0, "single": 0.7, "pet": 1.2}, 0.14, 0.18, 0.38),
]

NOISE_PRODUCTS = [
    ("Sonnencreme LSF 50", "seasonal_suncare", 8.95),
    ("Handcreme Limited Edition", "cosmetics", 1.95),
    ("Duftkerze Vanille", "home", 3.45),
    ("Geschenkset Pflege", "gift", 9.95),
    ("Nagellack Rot", "cosmetics", 2.75),
    ("Vitamin C Brausetabletten", "health", 1.25),
]

BASKET_COUPLINGS = {
    "diapers": ["baby_wipes"],
    "baby_wipes": ["diapers"],
    "pet_food": ["kitchen_paper", "cleaning_spray"],
    "laundry_detergent": ["soap"],
    "dishwasher_tabs": ["cleaning_spray"],
}


def segment_for_customer(customer_index: int) -> str:
    return ["family", "single", "pet"][customer_index % 3]


def pick_product_name(product: ProductPattern, segment: str) -> str:
    if random.random() < SEGMENTS[segment]["brand_switch_probability"]:
        return random.choice(product.product_names)
    return product.product_names[0]


def seasonal_multiplier(category: str, current_date: date) -> float:
    month = current_date.month
    if category == "seasonal_suncare" and month in {5, 6, 7, 8}:
        return 2.4
    if category in {"cleaning_spray", "kitchen_paper"} and month in {11, 12, 1, 2}:
        return 1.18
    return 1.0


def promotion_on_date(product: ProductPattern, current_date: date, segment: str) -> tuple[bool, int]:
    promo_window = current_date.day <= 7 or current_date.day >= 25
    probability = product.promo_sensitivity * SEGMENTS[segment]["promo_sensitivity"] * (0.42 if promo_window else 0.13)
    is_promo = random.random() < probability
    discount_percent = random.choice([10, 15, 20, 25]) if is_promo else 0
    return is_promo, discount_percent


def add_row(
    rows: list[dict[str, object]],
    invoice_id: str,
    customer_id: str,
    segment: str,
    household_size: int,
    invoice_date: date,
    product_name: str,
    category: str,
    package_size: str,
    quantity: int,
    unit_price: float,
    discount_percent: int,
    is_promo: bool,
    coupon_used: bool,
    is_stockup: bool,
    store_channel: str,
) -> None:
    rows.append(
        {
            "customer_id": customer_id,
            "segment": segment,
            "household_size": household_size,
            "invoice_id": invoice_id,
            "invoice_date": invoice_date.isoformat(),
            "store_channel": store_channel,
            "product_name": product_name,
            "brand_variant": product_name,
            "category": category,
            "package_size": package_size,
            "quantity": quantity,
            "unit_price": round(unit_price * (1 - discount_percent / 100), 2),
            "discount_percent": discount_percent,
            "coupon_used": int(coupon_used),
            "is_promo": int(is_promo),
            "is_stockup": int(is_stockup),
        }
    )


def generate_transactions(customer_count: int, months: int, seed: int) -> list[dict[str, object]]:
    random.seed(seed)
    today = date.today()
    start = today - timedelta(days=months * 30)
    rows: list[dict[str, object]] = []
    invoice_counter = 10000

    product_by_category = {product.category: product for product in PRODUCTS}

    for customer_index in range(customer_count):
        segment = segment_for_customer(customer_index)
        household_min, household_max = SEGMENTS[segment]["household_size"]
        household_size = random.randint(household_min, household_max)
        customer_id = f"C{customer_index + 1:04d}"
        customer_shift = random.randint(0, 12)

        for product in PRODUCTS:
            weight = product.segment_weights[segment]
            if weight <= 0:
                continue
            adoption_probability = min(0.96, 0.50 + weight * 0.25)
            if random.random() > adoption_probability:
                continue

            interval = max(5, int(product.base_interval_days / weight))
            current = start + timedelta(days=random.randint(0, interval + customer_shift))
            stockup_extension = 0
            while current <= today:
                if random.random() < product.skip_probability:
                    current = current + timedelta(days=max(5, interval + random.randint(0, product.interval_jitter_days)))
                    continue

                jitter = random.randint(-product.interval_jitter_days, product.interval_jitter_days)
                actual_date = current + timedelta(days=jitter + stockup_extension)
                stockup_extension = 0
                if start <= actual_date <= today:
                    invoice_counter += 1
                    invoice_id = f"INV-{invoice_counter}"
                    is_promo, discount_percent = promotion_on_date(product, actual_date, segment)
                    stockup_probability = product.stockup_probability + (0.18 if is_promo else 0.0)
                    is_stockup = random.random() < stockup_probability
                    quantity = 2 if is_stockup else 1
                    if is_stockup and random.random() < 0.18:
                        quantity = 3
                    coupon_used = is_promo and random.random() < 0.72
                    store_channel = "app_online" if random.random() < 0.22 else "store_ebon"
                    product_name = pick_product_name(product, segment)

                    add_row(
                        rows,
                        invoice_id,
                        customer_id,
                        segment,
                        household_size,
                        actual_date,
                        product_name,
                        product.category,
                        product.package_size,
                        quantity,
                        product.unit_price,
                        discount_percent,
                        is_promo,
                        coupon_used,
                        is_stockup,
                        store_channel,
                    )

                    for coupled_category in BASKET_COUPLINGS.get(product.category, []):
                        if random.random() < 0.34 and coupled_category in product_by_category:
                            coupled = product_by_category[coupled_category]
                            add_row(
                                rows,
                                invoice_id,
                                customer_id,
                                segment,
                                household_size,
                                actual_date,
                                pick_product_name(coupled, segment),
                                coupled.category,
                                coupled.package_size,
                                1,
                                coupled.unit_price,
                                discount_percent if random.random() < 0.35 else 0,
                                is_promo,
                                coupon_used and random.random() < 0.5,
                                False,
                                store_channel,
                            )

                    if random.random() < SEGMENTS[segment]["basket_noise_probability"]:
                        name, category, price = random.choice(NOISE_PRODUCTS)
                        if random.random() < 0.5 * seasonal_multiplier(category, actual_date):
                            add_row(
                                rows,
                                invoice_id,
                                customer_id,
                                segment,
                                household_size,
                                actual_date,
                                name,
                                category,
                                "1 Stueck",
                                1,
                                price,
                                random.choice([0, 10, 15]),
                                False,
                                False,
                                False,
                                store_channel,
                            )

                    if is_stockup:
                        stockup_extension = random.randint(5, 16)

                current = current + timedelta(days=max(5, interval + random.randint(-6, 7)))

    rows.sort(key=lambda row: (str(row["invoice_date"]), str(row["invoice_id"]), str(row["customer_id"])))
    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--customers", type=int, default=220)
    parser.add_argument("--months", type=int, default=12)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output", default="data-science/data/sample_drugstore_transactions.csv")
    args = parser.parse_args()

    rows = generate_transactions(args.customers, args.months, args.seed)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} transactions to {output_path}")


if __name__ == "__main__":
    main()
