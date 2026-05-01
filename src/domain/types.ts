export type ProductCategory =
  | "toilet_paper"
  | "laundry_detergent"
  | "dishwasher_tabs"
  | "shampoo"
  | "toothpaste"
  | "diapers"
  | "baby_wipes"
  | "baby_food"
  | "baby_care"
  | "coffee"
  | "pet_food"
  | "kitchen_paper"
  | "soap"
  | "cleaning_spray"
  | "tea_health"
  | "personal_care"
  | "deodorant"
  | "suncare"
  | "household"
  | "snacks"
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
  discountPercent?: number;
  isPromo?: boolean;
  isStockup?: boolean;
};

export type PredictionLevel = "category" | "product";
export type Urgency = "not_urgent" | "soon" | "probably_needed_now" | "overdue";
export type Confidence = "low" | "medium" | "high";
export type RecommendationTier = "high" | "medium" | "low";
export type PredictionReasonCode =
  | "recurring_interval"
  | "stockup_adjusted"
  | "feedback_postponed"
  | "stable_history"
  | "irregular_history"
  | "low_data"
  | "urgent_timing"
  | "seasonal_relevance";

export type PredictionSignals = {
  intervalStability: "stabil" | "mittel" | "unregelmäßig";
  dataDepth: "wenig Daten" | "solide Historie" | "starke Historie";
  feedbackSignal: "kein Feedback" | "Feedback berücksichtigt";
  mlReadiness: "regelbasiert" | "ML-ready";
  stockupSignal: "kein Vorratskauf" | "Vorratskauf erkannt";
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
  adjustedIntervalDays: number;
  usualQuantity: number;
  lastQuantity: number;
  stockupAdjustmentDays: number;
  estimatedNextPurchaseDate: string;
  daysUntilNext: number;
  urgency: Urgency;
  confidence: Confidence;
  score: number;
  recommendationTier: RecommendationTier;
  reasonCodes: PredictionReasonCode[];
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
