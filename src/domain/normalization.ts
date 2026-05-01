import { ProductCategory } from "./types";

export const categoryLabels: Record<ProductCategory, string> = {
  toilet_paper: "Toilettenpapier",
  laundry_detergent: "Waschmittel",
  dishwasher_tabs: "Spuelmaschinentabs",
  shampoo: "Shampoo",
  toothpaste: "Zahnpasta",
  diapers: "Windeln",
  baby_wipes: "Feuchttuecher",
  baby_food: "Babynahrung",
  baby_care: "Babypflege",
  coffee: "Kaffee",
  pet_food: "Tierfutter",
  kitchen_paper: "Kuechenrolle",
  soap: "Seife",
  cleaning_spray: "Reiniger",
  tea_health: "Gesundheit",
  personal_care: "Pflege",
  deodorant: "Deo",
  suncare: "Sonnenschutz",
  household: "Haushalt",
  snacks: "Snacks",
  other: "Sonstiges"
};

export function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\d+[,.]?\d*\s?(ml|l|kg|g|stueck|stuck|rollen|er pack|pack)/gi, "")
    .replace(/[^a-zäöüß\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function categoryLabel(category: ProductCategory): string {
  return categoryLabels[category];
}
