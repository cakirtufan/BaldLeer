import { todayIso } from "./dateUtils";
import { normalizeProductName } from "./normalization";
import {
  CartItem,
  FeedbackAction,
  FeedbackRecord,
  Purchase,
  RefillPrediction,
  ShoppingListItem,
  UserSettings
} from "./types";

export function createFeedback(prediction: RefillPrediction, action: FeedbackAction): FeedbackRecord {
  return {
    id: `fb-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    predictionKey: prediction.key,
    category: prediction.category,
    productName: prediction.predictionLevel === "product" ? prediction.displayName : undefined,
    action,
    date: todayIso()
  };
}

export function createPurchaseFromPrediction(prediction: RefillPrediction): Purchase {
  return {
    id: `purchase-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: todayIso(),
    storeName: "Smart Refill Demo-Markt",
    receiptId: `EBON-${todayIso()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    productName: prediction.displayName,
    normalizedProductName: normalizeProductName(prediction.displayName),
    category: prediction.category,
    packageSize: "1 Packung",
    quantity: 1,
    price: 3.49,
    discountPercent: 0,
    isPromo: false,
    isStockup: false
  };
}

export function createShoppingListItem(prediction: RefillPrediction): ShoppingListItem {
  return {
    id: `list-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    displayName: prediction.displayName,
    category: prediction.category,
    sourcePredictionId: prediction.id,
    createdAt: todayIso(),
    status: "open"
  };
}

export function createCartItem(prediction: RefillPrediction): CartItem {
  return {
    id: `cart-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    displayName: prediction.displayName,
    category: prediction.category,
    sourcePredictionId: prediction.id,
    createdAt: todayIso()
  };
}

export function suppressPrediction(settings: UserSettings, prediction: RefillPrediction): UserSettings {
  return {
    ...settings,
    suppressedKeys: Array.from(new Set([...settings.suppressedKeys, prediction.key]))
  };
}
