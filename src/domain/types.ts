export type ProductCategory =
  | "toilet_paper"
  | "laundry_detergent"
  | "dishwasher_tabs"
  | "shampoo"
  | "toothpaste"
  | "diapers"
  | "baby_wipes"
  | "coffee"
  | "pet_food"
  | "kitchen_paper"
  | "soap"
  | "cleaning_spray"
  | "other";

export type Purchase = {
  id: string;
  date: string;
  storeName: string;
  receiptId: string;
  productName: string;
  normalizedProductName: string;
  category: ProductCategory;
  packageSize: string;
  quantity: number;
  price: number;
};

export type PredictionLevel = "category" | "product";
export type Urgency = "not_urgent" | "soon" | "probably_needed_now" | "overdue";
export type Confidence = "low" | "medium" | "high";

export type PredictionSignals = {
  intervalStability: "stabil" | "mittel" | "unregelmäßig";
  dataDepth: "wenig Daten" | "solide Historie" | "starke Historie";
  feedbackSignal: "kein Feedback" | "Feedback berücksichtigt";
  mlReadiness: "regelbasiert" | "ML-ready";
};

export type RefillPrediction = {
  id: string;
  predictionLevel: PredictionLevel;
  key: string;
  displayName: string;
  category: ProductCategory;
  lastPurchaseDate: string;
  purchaseCount: number;
  medianIntervalDays: number;
  averageIntervalDays: number;
  estimatedNextPurchaseDate: string;
  daysUntilNext: number;
  urgency: Urgency;
  confidence: Confidence;
  signals: PredictionSignals;
  explanation: string;
  suppressed: boolean;
};

export type FeedbackAction =
  | "add_to_list"
  | "add_to_cart"
  | "still_enough"
  | "bought_already"
  | "not_relevant";

export type FeedbackRecord = {
  id: string;
  predictionKey: string;
  category: ProductCategory;
  productName?: string;
  action: FeedbackAction;
  date: string;
};

export type ShoppingListItem = {
  id: string;
  displayName: string;
  category: ProductCategory;
  sourcePredictionId: string;
  createdAt: string;
  status: "open" | "bought";
};

export type CartItem = {
  id: string;
  displayName: string;
  category: ProductCategory;
  sourcePredictionId: string;
  createdAt: string;
};

export type UserSettings = {
  refillSuggestionsEnabled: boolean;
  usePurchaseHistory: boolean;
  reminderHintsEnabled: boolean;
  suppressedKeys: string[];
};

export type DemoProfileId = "family" | "single" | "pet";

export type DemoProfile = {
  id: DemoProfileId;
  name: string;
  description: string;
};

export type AppState = {
  activeProfileId: DemoProfileId;
  purchases: Purchase[];
  feedback: FeedbackRecord[];
  shoppingList: ShoppingListItem[];
  cart: CartItem[];
  settings: UserSettings;
};
