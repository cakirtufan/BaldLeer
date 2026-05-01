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
import { getMockFeedback } from "@/data/mockFeedback";
import { getMockPurchases } from "@/data/mockPurchases";

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
    expect(prediction.reasonCodes).toContain("stockup_adjusted");
    expect(prediction.score).toBeGreaterThanOrEqual(0);
    expect(prediction.score).toBeLessThanOrEqual(100);
  });

  it("keeps overdue predictions in high priority even with low confidence", () => {
    const predictions = calculateRefillPredictions([purchase("1", 75), purchase("2", 45)], [], settings);
    const prediction = predictions.find((item) => item.key === "category:toilet_paper");

    expect(prediction?.urgency).toBe("overdue");
    expect(prediction?.confidence).toBe("low");
    expect(prediction?.score).toBeGreaterThanOrEqual(72);
    expect(prediction?.recommendationTier).toBe("high");
  });

  it("does not let stock-up damping hide an overdue prediction", () => {
    const stockup: Purchase = {
      ...purchase("3", 90),
      quantity: 2,
      discountPercent: 20,
      isPromo: true,
      isStockup: true
    };
    const predictions = calculateRefillPredictions([purchase("1", 170), purchase("2", 130), stockup], [], settings);
    const prediction = predictions.find((item) => item.key === "category:toilet_paper");

    expect(prediction?.stockupAdjustmentDays).toBeGreaterThan(0);
    expect(prediction?.urgency).toBe("overdue");
    expect(prediction?.score).toBeGreaterThanOrEqual(72);
    expect(prediction?.recommendationTier).toBe("high");
  });

  it("adds reason codes and a lower score after still enough feedback", () => {
    const [prediction] = calculateRefillPredictions([purchase("1", 60), purchase("2", 30), purchase("3", 0)], [], settings);
    const feedback: FeedbackRecord[] = [
      {
        id: "fb-2",
        predictionKey: prediction.key,
        category: prediction.category,
        action: "still_enough",
        date: todayIso()
      }
    ];
    const adjusted = applyFeedbackToPrediction(prediction, feedback);
    expect(adjusted.reasonCodes).toContain("feedback_postponed");
    expect(adjusted.score).toBeLessThanOrEqual(prediction.score);
  });

  it("demo profiles expose storytelling prediction signals", () => {
    const familyPredictions = calculateRefillPredictions(getMockPurchases("family"), getMockFeedback("family"), settings);
    const singlePredictions = calculateRefillPredictions(getMockPurchases("single"), getMockFeedback("single"), settings);
    const petPredictions = calculateRefillPredictions(getMockPurchases("pet"), getMockFeedback("pet"), settings);
    const allReasonCodes = [...familyPredictions, ...singlePredictions, ...petPredictions].flatMap(
      (prediction) => prediction.reasonCodes
    );

    expect(familyPredictions.some((prediction) => prediction.reasonCodes.includes("feedback_postponed"))).toBe(true);
    expect(singlePredictions.some((prediction) => prediction.category === "soap")).toBe(false);
    expect(allReasonCodes).toContain("stockup_adjusted");
    expect(allReasonCodes).toContain("stable_history");
    expect(petPredictions[0].score).toBeGreaterThan(0);
  });
});
