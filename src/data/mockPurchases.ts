import { dateDaysAgo } from "@/domain/dateUtils";
import { normalizeProductName } from "@/domain/normalization";
import { DemoProfileId, ProductCategory, Purchase } from "@/domain/types";

type PurchaseSeed = {
  daysAgo: number;
  storeName: string;
  receiptId: string;
  productName: string;
  category: ProductCategory;
  packageSize: string;
  quantity: number;
  price: number;
};

function purchase(seed: PurchaseSeed, index: number): Purchase {
  return {
    id: `${seed.receiptId}-${index}`,
    date: dateDaysAgo(seed.daysAgo),
    storeName: seed.storeName,
    receiptId: seed.receiptId,
    productName: seed.productName,
    normalizedProductName: normalizeProductName(seed.productName),
    category: seed.category,
    packageSize: seed.packageSize,
    quantity: seed.quantity,
    price: seed.price
  };
}

function build(seeds: PurchaseSeed[]): Purchase[] {
  return seeds.map(purchase).sort((a, b) => b.date.localeCompare(a.date));
}

const familySeeds: PurchaseSeed[] = [
  ...[5, 16, 28, 40, 52, 66, 80, 94, 108, 122].map((daysAgo, i) => ({
    daysAgo,
    storeName: i % 2 ? "dm Demo-Markt" : "Rossmann Demo-Filiale",
    receiptId: `FAM-WIN-${i}`,
    productName: "Windeln Größe 5",
    category: "diapers" as ProductCategory,
    packageSize: "42 Stück",
    quantity: 1,
    price: 10.95
  })),
  ...[8, 20, 33, 46, 61, 76, 91].map((daysAgo, i) => ({
    daysAgo,
    storeName: "dm Demo-Markt",
    receiptId: `FAM-FEU-${i}`,
    productName: "Feuchttücher Sensitiv",
    category: "baby_wipes" as ProductCategory,
    packageSize: "4 x 80 Stück",
    quantity: 1,
    price: 4.95
  })),
  ...[28, 59, 90, 121, 154].map((daysAgo, i) => ({
    daysAgo,
    storeName: "Rossmann Demo-Filiale",
    receiptId: `FAM-TOI-${i}`,
    productName: "Toilettenpapier 10 Rollen",
    category: "toilet_paper" as ProductCategory,
    packageSize: "10 Rollen",
    quantity: 1,
    price: 5.45
  })),
  ...[12, 47, 82, 118, 155].map((daysAgo, i) => ({
    daysAgo,
    storeName: "dm Demo-Markt",
    receiptId: `FAM-WAS-${i}`,
    productName: "Colorwaschmittel 1,5 L",
    category: "laundry_detergent" as ProductCategory,
    packageSize: "1,5 L",
    quantity: 1,
    price: 4.75
  })),
  ...[18, 55, 94, 132].map((daysAgo, i) => ({
    daysAgo,
    storeName: "Rossmann Demo-Filiale",
    receiptId: `FAM-TAB-${i}`,
    productName: "Spülmaschinentabs 60 Stück",
    category: "dishwasher_tabs" as ProductCategory,
    packageSize: "60 Stück",
    quantity: 1,
    price: 7.95
  }))
];

const singleSeeds: PurchaseSeed[] = [
  ...[7, 27, 48, 70, 91, 112, 134, 156].map((daysAgo, i) => ({
    daysAgo,
    storeName: "Rossmann Demo-Filiale",
    receiptId: `SIN-KAF-${i}`,
    productName: "Kaffee Crema 1 kg",
    category: "coffee" as ProductCategory,
    packageSize: "1 kg",
    quantity: 1,
    price: 10.49
  })),
  ...[18, 76, 135].map((daysAgo, i) => ({
    daysAgo,
    storeName: "dm Demo-Markt",
    receiptId: `SIN-TOI-${i}`,
    productName: "Toilettenpapier 10 Rollen",
    category: "toilet_paper" as ProductCategory,
    packageSize: "10 Rollen",
    quantity: 1,
    price: 5.45
  })),
  ...[11, 57, 103, 150].map((daysAgo, i) => ({
    daysAgo,
    storeName: "dm Demo-Markt",
    receiptId: `SIN-ZAH-${i}`,
    productName: "Zahnpasta Kräuter 75 ml",
    category: "toothpaste" as ProductCategory,
    packageSize: "75 ml",
    quantity: 1,
    price: 1.95
  })),
  ...[35, 82, 130].map((daysAgo, i) => ({
    daysAgo,
    storeName: "Rossmann Demo-Filiale",
    receiptId: `SIN-SHA-${i}`,
    productName: "Shampoo Sensitiv 300 ml",
    category: "shampoo" as ProductCategory,
    packageSize: "300 ml",
    quantity: 1,
    price: 2.45
  })),
  ...[6, 40, 98].map((daysAgo, i) => ({
    daysAgo,
    storeName: "dm Demo-Markt",
    receiptId: `SIN-SEI-${i}`,
    productName: "Flüssigseife Nachfüllpack",
    category: "soap" as ProductCategory,
    packageSize: "500 ml",
    quantity: 1,
    price: 1.65
  }))
];

const petSeeds: PurchaseSeed[] = [
  ...[2, 16, 30, 44, 58, 72, 86, 100, 114, 128, 142].map((daysAgo, i) => ({
    daysAgo,
    storeName: i % 2 ? "dm Demo-Markt" : "Rossmann Demo-Filiale",
    receiptId: `PET-FUT-${i}`,
    productName: "Katzenfutter Huhn 12er Pack",
    category: "pet_food" as ProductCategory,
    packageSize: "12er Pack",
    quantity: 1,
    price: 6.95
  })),
  ...[9, 32, 55, 80, 104, 129, 154].map((daysAgo, i) => ({
    daysAgo,
    storeName: "dm Demo-Markt",
    receiptId: `PET-KUE-${i}`,
    productName: "Küchenrolle 4 Rollen",
    category: "kitchen_paper" as ProductCategory,
    packageSize: "4 Rollen",
    quantity: 1,
    price: 3.25
  })),
  ...[20, 50, 81, 113, 145].map((daysAgo, i) => ({
    daysAgo,
    storeName: "Rossmann Demo-Filiale",
    receiptId: `PET-REI-${i}`,
    productName: "Badreiniger Spray",
    category: "cleaning_spray" as ProductCategory,
    packageSize: "750 ml",
    quantity: 1,
    price: 2.25
  })),
  ...[26, 57, 88, 119, 151].map((daysAgo, i) => ({
    daysAgo,
    storeName: "dm Demo-Markt",
    receiptId: `PET-TOI-${i}`,
    productName: "Toilettenpapier 10 Rollen",
    category: "toilet_paper" as ProductCategory,
    packageSize: "10 Rollen",
    quantity: 1,
    price: 5.45
  }))
];

export function getMockPurchases(profileId: DemoProfileId): Purchase[] {
  if (profileId === "single") return build(singleSeeds);
  if (profileId === "pet") return build(petSeeds);
  return build(familySeeds);
}
