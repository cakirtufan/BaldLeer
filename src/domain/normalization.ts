import { ProductCategory } from "./types";

export const categoryLabels: Record<ProductCategory, string> = {
  toilet_paper: "Toilettenpapier",
  laundry_detergent: "Waschmittel",
  dishwasher_tabs: "Spülmaschinentabs",
  shampoo: "Shampoo",
  toothpaste: "Zahnpasta",
  diapers: "Windeln",
  baby_wipes: "Feuchttücher",
  coffee: "Kaffee",
  pet_food: "Tierfutter",
  kitchen_paper: "Küchenrolle",
  soap: "Seife",
  cleaning_spray: "Reiniger",
  other: "Sonstiges"
};

export function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\d+[,.]?\d*\s?(ml|l|kg|g|stück|rollen|er pack|pack)/gi, "")
    .replace(/[^a-zäöüß\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function categoryLabel(category: ProductCategory): string {
  return categoryLabels[category];
}
