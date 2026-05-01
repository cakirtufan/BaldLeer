import { describe, expect, it } from "vitest";
import { addDays, todayIso } from "@/domain/dateUtils";
import {
  applyFeedbackToPrediction,
  calculateRefillPredictions,
  classifyConfidence,
  classifyUrgency,
  median
} from "@/domain/prediction";
import { FeedbackRecord, Purchase, UserSettings } from "@/domain/types";

const settings: UserSettings = {
  refillSuggestionsEnabled: true,
  usePurchaseHistory: true,
  reminderHintsEnabled: true,
  suppressedKeys: []
};

function purchase(id: string, daysAgo: number): Purchase {
  return {
    id,
    date: addDays(todayIso(), -daysAgo),
    storeName: "Demo-Markt",
    receiptId: `EBON-${id}`,
    productName: "Toilettenpapier 10 Rollen",
    normalizedProductName: "toilettenpapier",
    category: "toilet_paper",
    packageSize: "10 Rollen",
    quantity: 1,
    price: 5.45,
    discountPercent: 0,
    isPromo: false,
    isStockup: false
  };
}

describe("prediction logic", () => {
  it("calculates median interval", () => {
    expect(median([10, 30, 20])).toBe(20);
    expect(median([10, 20, 30, 40])).toBe(25);
  });

  it("classifies urgency", () => {
    expect(classifyUrgency(12)).toBe("not_urgent");
    expect(classifyUrgency(5)).toBe("soon");
    expect(classifyUrgency(-3)).toBe("probably_needed_now");
    expect(classifyUrgency(-9)).toBe("overdue");
  });

  it("classifies confidence", () => {
    expect(classifyConfidence(2, [30])).toBe("low");
    expect(classifyConfidence(4, [29, 31, 30])).toBe("medium");
    expect(classifyConfidence(6, [29, 30, 31, 30, 30])).toBe("high");
    expect(classifyConfidence(6, [10, 45, 12, 60, 8])).toBe("low");
  });

  it("suppresses not relevant predictions", () => {
    const predictions = calculateRefillPredictions([purchase("1", 60), purchase("2", 30), purchase("3", 1)], [], {
      ...settings,
      suppressedKeys: ["category:toilet_paper"]
    });
    expect(predictions.some((prediction) => prediction.key === "category:toilet_paper")).toBe(false);
  });

  it("postpones still enough feedback", () => {
    const [prediction] = calculateRefillPredictions([purchase("1", 60), purchase("2", 30), purchase("3", 0)], [], settings);
    const feedback: FeedbackRecord[] = [
      {
        id: "fb-1",
        predictionKey: prediction.key,
        category: prediction.category,
        action: "still_enough",
        date: todayIso()
      }
    ];
    const adjusted = applyFeedbackToPrediction(prediction, feedback);
    expect(adjusted.daysUntilNext).toBeGreaterThan(prediction.daysUntilNext);
  });

  it("extends estimated coverage after a promo stock-up purchase", () => {
    const regular = [purchase("1", 90), purchase("2", 60), purchase("3", 30)];
    const stockup: Purchase = {
      ...purchase("4", 1),
      quantity: 2,
      discountPercent: 20,
      isPromo: true,
      isStockup: true
    };
    const [prediction] = calculateRefillPredictions([...regular, stockup], [], settings);
    expect(prediction.stockupAdjustmentDays).toBeGreaterThan(0);
    expect(prediction.adjustedIntervalDays).toBeGreaterThan(prediction.medianIntervalDays);
    expect(prediction.signals.stockupSignal).toBe("Vorratskauf erkannt");
  });
});
