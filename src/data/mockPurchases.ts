import { dateDaysAgo } from "@/domain/dateUtils";
import { normalizeProductName } from "@/domain/normalization";
import { DemoProfileId, ProductCategory, Purchase } from "@/domain/types";

type BasketItemSeed = {
  productName: string;
  category: ProductCategory;
  packageSize: string;
  quantity: number;
  price: number;
  discountPercent?: number;
  isPromo?: boolean;
  isStockup?: boolean;
};

type BasketSeed = {
  daysAgo: number;
  storeName: string;
  receiptId: string;
  items: BasketItemSeed[];
};

function itemToPurchase(basket: BasketSeed, item: BasketItemSeed, index: number): Purchase {
  return {
    id: `${basket.receiptId}-${index}`,
    date: dateDaysAgo(basket.daysAgo),
    storeName: basket.storeName,
    receiptId: basket.receiptId,
    productName: item.productName,
    normalizedProductName: normalizeProductName(item.productName),
    category: item.category,
    packageSize: item.packageSize,
    quantity: item.quantity,
    price: item.price,
    discountPercent: item.discountPercent ?? 0,
    isPromo: item.isPromo ?? false,
    isStockup: item.isStockup ?? false
  };
}

function build(baskets: BasketSeed[]): Purchase[] {
  return baskets
    .flatMap((basket) => basket.items.map((item, index) => itemToPurchase(basket, item, index)))
    .sort((a, b) => b.date.localeCompare(a.date) || a.receiptId.localeCompare(b.receiptId));
}

const familyBaskets: BasketSeed[] = [
  {
    daysAgo: 2,
    storeName: "dm Demo-Markt",
    receiptId: "FAM-EBON-001",
    items: [
      { productName: "Windeln Größe 5", category: "diapers", packageSize: "42 Stück", quantity: 1, price: 10.95 },
      { productName: "Feuchttücher Aqua", category: "baby_wipes", packageSize: "4 x 80 Stück", quantity: 1, price: 4.95 },
      { productName: "Sonnenmilch Kids LSF 50", category: "other", packageSize: "200 ml", quantity: 1, price: 8.95 },
      { productName: "After Sun Lotion", category: "other", packageSize: "250 ml", quantity: 1, price: 3.95 },
      { productName: "Kinder Zahnbürste", category: "other", packageSize: "1 Stück", quantity: 1, price: 1.75 },
      { productName: "Deo Roll-on Sensitiv", category: "other", packageSize: "50 ml", quantity: 1, price: 1.55 },
      { productName: "Shampoo Family 500 ml", category: "shampoo", packageSize: "500 ml", quantity: 1, price: 2.95 }
    ]
  },
  {
    daysAgo: 14,
    storeName: "Rossmann Demo-Filiale",
    receiptId: "FAM-EBON-002",
    items: [
      { productName: "Windeln Pants Größe 5", category: "diapers", packageSize: "42 Stück", quantity: 1, price: 11.45 },
      { productName: "Badreiniger Spray", category: "cleaning_spray", packageSize: "750 ml", quantity: 1, price: 2.25 },
      { productName: "Flüssigseife Nachfüllpack", category: "soap", packageSize: "500 ml", quantity: 1, price: 1.65 },
      { productName: "Zahnpasta Kräuter 75 ml", category: "toothpaste", packageSize: "75 ml", quantity: 1, price: 1.95 },
      { productName: "Wattestäbchen Papier", category: "other", packageSize: "200 Stück", quantity: 1, price: 0.95 },
      { productName: "Duschgel Familiengröße", category: "soap", packageSize: "500 ml", quantity: 1, price: 1.85 }
    ]
  },
  {
    daysAgo: 28,
    storeName: "dm Demo-Markt",
    receiptId: "FAM-EBON-003",
    items: [
      { productName: "Toilettenpapier 10 Rollen", category: "toilet_paper", packageSize: "10 Rollen", quantity: 2, price: 5.45, discountPercent: 20, isPromo: true, isStockup: true },
      { productName: "Küchenrolle 4 Rollen", category: "kitchen_paper", packageSize: "4 Rollen", quantity: 1, price: 3.25 },
      { productName: "Feuchttücher Sensitiv", category: "baby_wipes", packageSize: "4 x 80 Stück", quantity: 1, price: 4.95 },
      { productName: "Müllbeutel 35 L", category: "other", packageSize: "30 Stück", quantity: 1, price: 1.95 },
      { productName: "Deo Spray Fresh", category: "other", packageSize: "150 ml", quantity: 2, price: 1.45, discountPercent: 20, isPromo: true, isStockup: true },
      { productName: "Zahnpasta Sensitive 75 ml", category: "toothpaste", packageSize: "75 ml", quantity: 1, price: 2.15 }
    ]
  },
  {
    daysAgo: 40,
    storeName: "Rossmann Demo-Filiale",
    receiptId: "FAM-EBON-004",
    items: [
      { productName: "Windeln Größe 5", category: "diapers", packageSize: "42 Stück", quantity: 1, price: 10.95 },
      { productName: "Feuchttücher Sensitiv", category: "baby_wipes", packageSize: "4 x 80 Stück", quantity: 1, price: 4.95 },
      { productName: "Colorwaschmittel 1,5 L", category: "laundry_detergent", packageSize: "1,5 L", quantity: 2, price: 4.75, discountPercent: 15, isPromo: true, isStockup: true },
      { productName: "Weichspüler Sensitiv", category: "other", packageSize: "1 L", quantity: 1, price: 1.75 },
      { productName: "Fleckenspray", category: "cleaning_spray", packageSize: "500 ml", quantity: 1, price: 2.85 },
      { productName: "Shampoo Repair 300 ml", category: "shampoo", packageSize: "300 ml", quantity: 1, price: 2.45 }
    ]
  },
  {
    daysAgo: 55,
    storeName: "dm Demo-Markt",
    receiptId: "FAM-EBON-005",
    items: [
      { productName: "Spülmaschinentabs 60 Stück", category: "dishwasher_tabs", packageSize: "60 Stück", quantity: 1, price: 7.95 },
      { productName: "Allzweckreiniger", category: "cleaning_spray", packageSize: "1 L", quantity: 1, price: 2.15 },
      { productName: "Handseife Milch & Honig", category: "soap", packageSize: "300 ml", quantity: 1, price: 1.25 },
      { productName: "Schwämme 6er Pack", category: "other", packageSize: "6 Stück", quantity: 1, price: 1.15 },
      { productName: "Klarspüler", category: "dishwasher_tabs", packageSize: "750 ml", quantity: 1, price: 2.35 },
      { productName: "Vitamin D Tabletten", category: "other", packageSize: "60 Stück", quantity: 1, price: 3.95 }
    ]
  },
  {
    daysAgo: 66,
    storeName: "Rossmann Demo-Filiale",
    receiptId: "FAM-EBON-006",
    items: [
      { productName: "Windeln Größe 5", category: "diapers", packageSize: "42 Stück", quantity: 1, price: 10.95 },
      { productName: "Feuchttücher Aqua", category: "baby_wipes", packageSize: "4 x 80 Stück", quantity: 1, price: 4.95 },
      { productName: "Baby Pflegecreme", category: "other", packageSize: "100 ml", quantity: 1, price: 2.75 },
      { productName: "Taschentücher Box", category: "other", packageSize: "100 Stück", quantity: 2, price: 1.35 },
      { productName: "Erkältungstee", category: "other", packageSize: "20 Beutel", quantity: 1, price: 2.25 }
    ]
  },
  {
    daysAgo: 82,
    storeName: "dm Demo-Markt",
    receiptId: "FAM-EBON-007",
    items: [
      { productName: "Colorwaschmittel 1,5 L", category: "laundry_detergent", packageSize: "1,5 L", quantity: 1, price: 4.75 },
      { productName: "Toilettenpapier 10 Rollen", category: "toilet_paper", packageSize: "10 Rollen", quantity: 1, price: 5.45 },
      { productName: "Küchenrolle 4 Rollen", category: "kitchen_paper", packageSize: "4 Rollen", quantity: 1, price: 3.25 },
      { productName: "Duschgel Sensitiv", category: "soap", packageSize: "300 ml", quantity: 1, price: 1.45 },
      { productName: "Mundspülung Fresh", category: "toothpaste", packageSize: "500 ml", quantity: 1, price: 2.25 }
    ]
  },
  {
    daysAgo: 96,
    storeName: "Rossmann Demo-Filiale",
    receiptId: "FAM-EBON-008",
    items: [
      { productName: "Windeln Pants Größe 5", category: "diapers", packageSize: "42 Stück", quantity: 1, price: 11.45 },
      { productName: "Feuchttücher Sensitiv", category: "baby_wipes", packageSize: "4 x 80 Stück", quantity: 1, price: 4.95 },
      { productName: "Spülmaschinentabs All-in-1", category: "dishwasher_tabs", packageSize: "60 Stück", quantity: 1, price: 8.25 },
      { productName: "Vitamin C Brausetabletten", category: "other", packageSize: "20 Stück", quantity: 2, price: 1.25, discountPercent: 10, isPromo: true, isStockup: true },
      { productName: "Nasenspray Meerwasser", category: "other", packageSize: "20 ml", quantity: 1, price: 2.95 },
      { productName: "Erkältungstee", category: "other", packageSize: "20 Beutel", quantity: 1, price: 2.25 }
    ]
  },
  {
    daysAgo: 122,
    storeName: "dm Demo-Markt",
    receiptId: "FAM-EBON-009",
    items: [
      { productName: "Windeln Größe 5", category: "diapers", packageSize: "42 Stück", quantity: 1, price: 10.95 },
      { productName: "Feuchttücher Sensitiv", category: "baby_wipes", packageSize: "4 x 80 Stück", quantity: 1, price: 4.95 },
      { productName: "Toilettenpapier Recycling 8 Rollen", category: "toilet_paper", packageSize: "8 Rollen", quantity: 1, price: 4.95 },
      { productName: "Handcreme Urea", category: "other", packageSize: "75 ml", quantity: 1, price: 2.25 },
      { productName: "Shampoo Sensitiv 300 ml", category: "shampoo", packageSize: "300 ml", quantity: 1, price: 2.45 },
      { productName: "Deo Roll-on Sensitiv", category: "other", packageSize: "50 ml", quantity: 1, price: 1.55 }
    ]
  }
];

const singleBaskets: BasketSeed[] = [
  {
    daysAgo: 7,
    storeName: "Rossmann Demo-Filiale",
    receiptId: "SIN-EBON-001",
    items: [
      { productName: "Kaffee Crema 1 kg", category: "coffee", packageSize: "1 kg", quantity: 2, price: 10.49, discountPercent: 25, isPromo: true, isStockup: true },
      { productName: "Zahnpasta Sensitive 75 ml", category: "toothpaste", packageSize: "75 ml", quantity: 1, price: 1.95 }
    ]
  },
  {
    daysAgo: 18,
    storeName: "dm Demo-Markt",
    receiptId: "SIN-EBON-002",
    items: [
      { productName: "Toilettenpapier 10 Rollen", category: "toilet_paper", packageSize: "10 Rollen", quantity: 1, price: 5.45 },
      { productName: "Handcreme Limited Edition", category: "other", packageSize: "75 ml", quantity: 1, price: 1.95 }
    ]
  },
  {
    daysAgo: 34,
    storeName: "Rossmann Demo-Filiale",
    receiptId: "SIN-EBON-003",
    items: [
      { productName: "Shampoo Repair 300 ml", category: "shampoo", packageSize: "300 ml", quantity: 1, price: 2.45 },
      { productName: "Flüssigseife Nachfüllpack", category: "soap", packageSize: "500 ml", quantity: 1, price: 1.65 }
    ]
  },
  {
    daysAgo: 48,
    storeName: "dm Demo-Markt",
    receiptId: "SIN-EBON-004",
    items: [
      { productName: "Kaffee Espresso 1 kg", category: "coffee", packageSize: "1 kg", quantity: 1, price: 10.99 },
      { productName: "Vitamin C Brausetabletten", category: "other", packageSize: "20 Stück", quantity: 1, price: 1.25 }
    ]
  },
  {
    daysAgo: 76,
    storeName: "Rossmann Demo-Filiale",
    receiptId: "SIN-EBON-005",
    items: [
      { productName: "Toilettenpapier 10 Rollen", category: "toilet_paper", packageSize: "10 Rollen", quantity: 1, price: 5.45 },
      { productName: "Zahnpasta Kräuter 75 ml", category: "toothpaste", packageSize: "75 ml", quantity: 1, price: 1.95 }
    ]
  },
  {
    daysAgo: 91,
    storeName: "dm Demo-Markt",
    receiptId: "SIN-EBON-006",
    items: [
      { productName: "Kaffee Crema 1 kg", category: "coffee", packageSize: "1 kg", quantity: 1, price: 10.49 },
      { productName: "Sonnencreme LSF 50", category: "other", packageSize: "200 ml", quantity: 1, price: 8.95 }
    ]
  },
  {
    daysAgo: 130,
    storeName: "Rossmann Demo-Filiale",
    receiptId: "SIN-EBON-007",
    items: [
      { productName: "Shampoo Sensitiv 300 ml", category: "shampoo", packageSize: "300 ml", quantity: 1, price: 2.45 },
      { productName: "Kaffee Crema 1 kg", category: "coffee", packageSize: "1 kg", quantity: 1, price: 10.49 }
    ]
  }
];

const petBaskets: BasketSeed[] = [
  {
    daysAgo: 2,
    storeName: "Rossmann Demo-Filiale",
    receiptId: "PET-EBON-001",
    items: [
      { productName: "Katzenfutter Huhn 12er Pack", category: "pet_food", packageSize: "12er Pack", quantity: 3, price: 6.95, discountPercent: 20, isPromo: true, isStockup: true },
      { productName: "Küchenrolle 4 Rollen", category: "kitchen_paper", packageSize: "4 Rollen", quantity: 1, price: 3.25 }
    ]
  },
  {
    daysAgo: 16,
    storeName: "dm Demo-Markt",
    receiptId: "PET-EBON-002",
    items: [
      { productName: "Katzenfutter Lachs 12er Pack", category: "pet_food", packageSize: "12er Pack", quantity: 1, price: 6.95 },
      { productName: "Badreiniger Spray", category: "cleaning_spray", packageSize: "750 ml", quantity: 1, price: 2.25 }
    ]
  },
  {
    daysAgo: 32,
    storeName: "Rossmann Demo-Filiale",
    receiptId: "PET-EBON-003",
    items: [
      { productName: "Katzenfutter Huhn 12er Pack", category: "pet_food", packageSize: "12er Pack", quantity: 1, price: 6.95 },
      { productName: "Küchenreiniger Spray", category: "cleaning_spray", packageSize: "750 ml", quantity: 1, price: 2.35 }
    ]
  },
  {
    daysAgo: 55,
    storeName: "dm Demo-Markt",
    receiptId: "PET-EBON-004",
    items: [
      { productName: "Küchenrolle Recycling", category: "kitchen_paper", packageSize: "4 Rollen", quantity: 1, price: 3.15 },
      { productName: "Toilettenpapier 10 Rollen", category: "toilet_paper", packageSize: "10 Rollen", quantity: 1, price: 5.45 }
    ]
  },
  {
    daysAgo: 72,
    storeName: "Rossmann Demo-Filiale",
    receiptId: "PET-EBON-005",
    items: [
      { productName: "Katzenfutter Huhn 12er Pack", category: "pet_food", packageSize: "12er Pack", quantity: 1, price: 6.95 },
      { productName: "Küchenrolle 4 Rollen", category: "kitchen_paper", packageSize: "4 Rollen", quantity: 1, price: 3.25 }
    ]
  },
  {
    daysAgo: 104,
    storeName: "dm Demo-Markt",
    receiptId: "PET-EBON-006",
    items: [
      { productName: "Katzenfutter Lachs 12er Pack", category: "pet_food", packageSize: "12er Pack", quantity: 1, price: 6.95 },
      { productName: "Badreiniger Spray", category: "cleaning_spray", packageSize: "750 ml", quantity: 1, price: 2.25 },
      { productName: "Toilettenpapier 10 Rollen", category: "toilet_paper", packageSize: "10 Rollen", quantity: 1, price: 5.45 }
    ]
  },
  {
    daysAgo: 142,
    storeName: "Rossmann Demo-Filiale",
    receiptId: "PET-EBON-007",
    items: [
      { productName: "Katzenfutter Huhn 12er Pack", category: "pet_food", packageSize: "12er Pack", quantity: 1, price: 6.95 },
      { productName: "Küchenrolle 4 Rollen", category: "kitchen_paper", packageSize: "4 Rollen", quantity: 1, price: 3.25 }
    ]
  }
];

export function getMockPurchases(profileId: DemoProfileId): Purchase[] {
  if (profileId === "single") return build(singleBaskets);
  if (profileId === "pet") return build(petBaskets);
  return build(familyBaskets);
}
