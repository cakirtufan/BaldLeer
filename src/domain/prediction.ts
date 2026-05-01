import { addDays, daysBetween, daysFromToday } from "./dateUtils";
import { categoryLabel } from "./normalization";
import {
  Confidence,
  FeedbackRecord,
  ProductCategory,
  Purchase,
  RefillPrediction,
  RecommendationTier,
  Urgency,
  UserSettings
} from "./types";

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function classifyUrgency(daysUntilNext: number): Urgency {
  if (daysUntilNext > 10) return "not_urgent";
  if (daysUntilNext >= 1) return "soon";
  if (daysUntilNext >= -7) return "probably_needed_now";
  return "overdue";
}

function timingCopy(daysUntilNext: number): string {
  if (daysUntilNext > 10) return `voraussichtlich in ${daysUntilNext} Tagen wieder relevant`;
  if (daysUntilNext >= 1) return `in den nächsten ${daysUntilNext} Tagen wahrscheinlich wieder relevant`;
  if (daysUntilNext === 0) return "wahrscheinlich ab heute wieder relevant";
  return `seit ${Math.abs(daysUntilNext)} Tagen wahrscheinlich wieder relevant`;
}

export function classifyConfidence(purchaseCount: number, intervals: number[]): Confidence {
  if (purchaseCount <= 2) return "low";
  const variability = intervalVariability(intervals);
  if (variability > 0.45) return "low";
  if (purchaseCount >= 5 && variability <= 0.25) return "high";
  return "medium";
}

export function intervalVariability(intervals: number[]): number {
  if (intervals.length === 0) return 0;
  const avg = average(intervals);
  const maxDeviation = Math.max(...intervals.map((value) => Math.abs(value - avg)));
  return avg === 0 ? 0 : maxDeviation / avg;
}

function intervalStabilityLabel(variability: number): "stabil" | "mittel" | "unregelmäßig" {
  if (variability <= 0.25) return "stabil";
  if (variability <= 0.45) return "mittel";
  return "unregelmäßig";
}

function dataDepthLabel(purchaseCount: number): "wenig Daten" | "solide Historie" | "starke Historie" {
  if (purchaseCount >= 5) return "starke Historie";
  if (purchaseCount >= 3) return "solide Historie";
  return "wenig Daten";
}

function confidenceWeight(confidence: Confidence): number {
  if (confidence === "high") return 1;
  if (confidence === "medium") return 0.78;
  return 0.48;
}

function urgencyScore(daysUntilNext: number): number {
  if (daysUntilNext < -7) return 1;
  if (daysUntilNext <= 0) return 0.92;
  if (daysUntilNext <= 10) return 0.74;
  if (daysUntilNext <= 21) return 0.34;
  return 0.14;
}

function urgencyScoreFloor(urgency: Urgency): number {
  if (urgency === "overdue") return 76;
  if (urgency === "probably_needed_now") return 68;
  if (urgency === "soon") return 52;
  return 0;
}

function applyUrgencyScoreFloor(score: number, urgency: Urgency): number {
  return Math.max(score, urgencyScoreFloor(urgency));
}

function tierForScore(score: number): RecommendationTier {
  if (score >= 72) return "high";
  if (score >= 42) return "medium";
  return "low";
}

function isSeasonalCategory(category: ProductCategory): boolean {
  return category === "cleaning_spray" || category === "soap" || category === "suncare" || category === "tea_health";
}

function isStockupPurchase(purchase: Purchase, usualQuantity: number): boolean {
  const quantityRatio = usualQuantity > 0 ? purchase.quantity / usualQuantity : purchase.quantity;
  return Boolean(purchase.isStockup || quantityRatio >= 1.75 || (purchase.isPromo && quantityRatio > 1.2));
}

function estimateStockupAdjustmentDays(lastPurchase: Purchase, usualQuantity: number, medianIntervalDays: number): number {
  if (!isStockupPurchase(lastPurchase, usualQuantity)) return 0;
  const quantityRatio = Math.max(1, lastPurchase.quantity / Math.max(1, usualQuantity));
  const quantityExtension = medianIntervalDays * Math.max(0, quantityRatio - 1) * 0.8;
  const promoExtension = lastPurchase.isPromo ? medianIntervalDays * 0.2 : 0;
  return Math.round(quantityExtension + promoExtension);
}

function createPrediction(
  key: string,
  displayName: string,
  category: ProductCategory,
  purchases: Purchase[],
  settings: UserSettings,
  predictionLevel: "category" | "product"
): RefillPrediction | null {
  const sorted = [...purchases].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return null;
  const intervals = sorted.slice(1).map((purchase, index) => daysBetween(sorted[index].date, purchase.date));
  const medianIntervalDays = Math.max(1, Math.round(median(intervals)));
  const averageIntervalDays = Math.round(average(intervals));
  const lastPurchase = sorted[sorted.length - 1];
  const lastPurchaseDate = lastPurchase.date;
  const usualQuantity = Math.max(1, Math.round(median(sorted.map((purchase) => purchase.quantity))));
  const stockupAdjustmentDays = estimateStockupAdjustmentDays(lastPurchase, usualQuantity, medianIntervalDays);
  const adjustedIntervalDays = medianIntervalDays + stockupAdjustmentDays;
  const estimatedNextPurchaseDate = addDays(lastPurchaseDate, adjustedIntervalDays);
  const daysUntilNext = daysFromToday(estimatedNextPurchaseDate);
  const urgency = classifyUrgency(daysUntilNext);
  const confidence = classifyConfidence(sorted.length, intervals);
  const variability = intervalVariability(intervals);
  const suppressed = settings.suppressedKeys.includes(key);
  const daysSinceLast = Math.max(0, daysBetween(lastPurchaseDate, new Date().toISOString().slice(0, 10)));
  const reasonCodes = [
    "recurring_interval",
    stockupAdjustmentDays > 0 ? "stockup_adjusted" : null,
    confidence !== "low" && variability <= 0.35 ? "stable_history" : null,
    confidence === "low" && sorted.length <= 2 ? "low_data" : null,
    variability > 0.45 ? "irregular_history" : null,
    daysUntilNext <= 10 ? "urgent_timing" : null,
    isSeasonalCategory(category) ? "seasonal_relevance" : null
  ].filter((code): code is RefillPrediction["reasonCodes"][number] => Boolean(code));
  const stockupWeight = stockupAdjustmentDays > 0 && daysUntilNext > 0 ? 0.72 : 1;
  const rawScore = Math.round(
    100 *
      urgencyScore(daysUntilNext) *
      confidenceWeight(confidence) *
      stockupWeight *
      (predictionLevel === "product" ? 0.92 : 1)
  );
  const score = applyUrgencyScoreFloor(rawScore, urgency);

  return {
    id: `${predictionLevel}:${key}`,
    predictionLevel,
    key,
    displayName,
    category,
    lastPurchaseDate,
    purchaseCount: sorted.length,
    medianIntervalDays,
    averageIntervalDays,
    adjustedIntervalDays,
    usualQuantity,
    lastQuantity: lastPurchase.quantity,
    stockupAdjustmentDays,
    estimatedNextPurchaseDate,
    daysUntilNext,
    urgency,
    confidence,
    score,
    recommendationTier: tierForScore(score),
    reasonCodes,
    signals: {
      intervalStability: intervalStabilityLabel(variability),
      dataDepth: dataDepthLabel(sorted.length),
      feedbackSignal: "kein Feedback",
      mlReadiness: sorted.length >= 4 && variability <= 0.45 ? "ML-ready" : "regelbasiert",
      stockupSignal: stockupAdjustmentDays > 0 ? "Vorratskauf erkannt" : "kein Vorratskauf"
    },
    suppressed,
    explanation: `Basierend auf deinen bisherigen Einkäufen kaufst du ${displayName} ungefähr alle ${medianIntervalDays} Tage. Der letzte Kauf war vor ${daysSinceLast} Tagen; damit ist diese Kategorie ${timingCopy(daysUntilNext)}.${stockupAdjustmentDays > 0 ? ` Beim letzten Kauf wurde ein Vorratskauf erkannt, deshalb verschiebt BaldLeer den Hinweis um ca. ${stockupAdjustmentDays} Tage nach hinten.` : ""}`
  };
}

function groupedBy<T>(items: T[], getKey: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const key = getKey(item);
    groups[key] = groups[key] ? [...groups[key], item] : [item];
    return groups;
  }, {});
}

export function applyFeedbackToPrediction(
  prediction: RefillPrediction,
  feedback: FeedbackRecord[]
): RefillPrediction {
  const related = feedback.filter(
    (record) => record.predictionKey === prediction.key || record.predictionKey === `category:${prediction.category}`
  );
  const notRelevant = related.some((record) => record.action === "not_relevant");
  const stillEnoughCount = related.filter((record) => record.action === "still_enough").length;
  const feedbackSignal = related.length > 0 ? "Feedback berücksichtigt" : prediction.signals.feedbackSignal;
  if (notRelevant) return { ...prediction, suppressed: true, signals: { ...prediction.signals, feedbackSignal } };
  if (stillEnoughCount === 0) return { ...prediction, signals: { ...prediction.signals, feedbackSignal } };

  const postponedDate = addDays(
    prediction.estimatedNextPurchaseDate,
    prediction.medianIntervalDays * 0.25 * stillEnoughCount
  );
  const daysUntilNext = daysFromToday(postponedDate);
  const urgency = classifyUrgency(daysUntilNext);
  const score = applyUrgencyScoreFloor(Math.round(prediction.score * 0.72), urgency);
  return {
    ...prediction,
    estimatedNextPurchaseDate: postponedDate,
    daysUntilNext,
    urgency,
    score,
    recommendationTier: tierForScore(score),
    reasonCodes: Array.from(new Set([...prediction.reasonCodes, "feedback_postponed"])),
    signals: { ...prediction.signals, feedbackSignal },
    explanation: `${prediction.explanation} Dein Feedback „Noch genug” wurde berücksichtigt; der nächste Hinweis wird bewusst etwas später angezeigt.`
  };
}

export function calculateRefillPredictions(
  purchases: Purchase[],
  feedback: FeedbackRecord[],
  settings: UserSettings
): RefillPrediction[] {
  if (!settings.refillSuggestionsEnabled || !settings.usePurchaseHistory) return [];

  const categoryPredictions = Object.entries(groupedBy(purchases, (purchase) => purchase.category))
    .map(([category, groupedPurchases]) =>
      createPrediction(
        `category:${category}`,
        categoryLabel(category as ProductCategory),
        category as ProductCategory,
        groupedPurchases,
        settings,
        "category"
      )
    )
    .filter((prediction): prediction is RefillPrediction => Boolean(prediction));

  const productPredictions = Object.entries(groupedBy(purchases, (purchase) => purchase.normalizedProductName))
    .map(([normalizedName, groupedPurchases]) => {
      if (groupedPurchases.length < 3) return null;
      const first = groupedPurchases[0];
      return createPrediction(
        `product:${normalizedName}`,
        first.productName,
        first.category,
        groupedPurchases,
        settings,
        "product"
      );
    })
    .filter((prediction): prediction is RefillPrediction => Boolean(prediction));

  return [...categoryPredictions, ...productPredictions]
    .map((prediction) => applyFeedbackToPrediction(prediction, feedback))
    .filter((prediction) => !prediction.suppressed)
    .sort((a, b) => b.score - a.score || a.daysUntilNext - b.daysUntilNext);
}
