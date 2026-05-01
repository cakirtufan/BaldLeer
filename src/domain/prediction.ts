import { addDays, daysBetween, daysFromToday } from "./dateUtils";
import { categoryLabel } from "./normalization";
import {
  Confidence,
  FeedbackRecord,
  ProductCategory,
  Purchase,
  RefillPrediction,
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
  const avg = average(intervals);
  const maxDeviation = Math.max(...intervals.map((value) => Math.abs(value - avg)));
  const variability = avg === 0 ? 0 : maxDeviation / avg;
  if (variability > 0.45) return "low";
  if (purchaseCount >= 5 && variability <= 0.25) return "high";
  return "medium";
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
  const lastPurchaseDate = sorted[sorted.length - 1].date;
  const estimatedNextPurchaseDate = addDays(lastPurchaseDate, medianIntervalDays);
  const daysUntilNext = daysFromToday(estimatedNextPurchaseDate);
  const urgency = classifyUrgency(daysUntilNext);
  const confidence = classifyConfidence(sorted.length, intervals);
  const suppressed = settings.suppressedKeys.includes(key);
  const daysSinceLast = Math.max(0, daysBetween(lastPurchaseDate, new Date().toISOString().slice(0, 10)));

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
    estimatedNextPurchaseDate,
    daysUntilNext,
    urgency,
    confidence,
    suppressed,
    explanation: `Basierend auf deinen bisherigen Einkäufen kaufst du ${displayName} ungefähr alle ${medianIntervalDays} Tage. Der letzte Kauf war vor ${daysSinceLast} Tagen; damit ist diese Kategorie ${timingCopy(daysUntilNext)}.`
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
  const related = feedback.filter((record) => record.predictionKey === prediction.key);
  const notRelevant = related.some((record) => record.action === "not_relevant");
  const stillEnoughCount = related.filter((record) => record.action === "still_enough").length;
  if (notRelevant) return { ...prediction, suppressed: true };
  if (stillEnoughCount === 0) return prediction;

  const postponedDate = addDays(
    prediction.estimatedNextPurchaseDate,
    prediction.medianIntervalDays * 0.25 * stillEnoughCount
  );
  const daysUntilNext = daysFromToday(postponedDate);
  return {
    ...prediction,
    estimatedNextPurchaseDate: postponedDate,
    daysUntilNext,
    urgency: classifyUrgency(daysUntilNext),
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
    .sort((a, b) => a.daysUntilNext - b.daysUntilNext);
}
