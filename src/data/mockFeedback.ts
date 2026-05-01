import { dateDaysAgo } from "@/domain/dateUtils";
import { DemoProfileId, FeedbackRecord } from "@/domain/types";

export function getMockFeedback(profileId: DemoProfileId): FeedbackRecord[] {
  if (profileId === "family") {
    return [
      {
        id: "demo-feedback-family-laundry",
        predictionKey: "category:laundry_detergent",
        category: "laundry_detergent",
        action: "still_enough",
        date: dateDaysAgo(2)
      }
    ];
  }

  if (profileId === "single") {
    return [
      {
        id: "demo-feedback-single-soap",
        predictionKey: "category:soap",
        category: "soap",
        action: "not_relevant",
        date: dateDaysAgo(5)
      }
    ];
  }

  return [
    {
      id: "demo-feedback-pet-cleaner",
      predictionKey: "category:cleaning_spray",
      category: "cleaning_spray",
      action: "still_enough",
      date: dateDaysAgo(3)
    }
  ];
}
