import { Pressable, StyleSheet, Text, View } from "react-native";
import { UrgencyBadge } from "./UrgencyBadge";
import { formatGermanDate } from "@/domain/dateUtils";
import { categoryLabel } from "@/domain/normalization";
import { FeedbackAction, PredictionReasonCode, RefillPrediction } from "@/domain/types";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type Props = {
  prediction: RefillPrediction;
  compact?: boolean;
  onAction?: (prediction: RefillPrediction, action: FeedbackAction) => void;
};

const reasonLabels: Record<PredictionReasonCode, string> = {
  recurring_interval: "wiederkehrender Bedarf",
  stockup_adjusted: "Vorratskauf berücksichtigt",
  feedback_postponed: "Feedback eingerechnet",
  stable_history: "stabile Historie",
  irregular_history: "unregelmäßig",
  low_data: "wenig Daten",
  urgent_timing: "zeitlich relevant",
  seasonal_relevance: "saisonaler Kontext"
};

const tierLabels = {
  high: "Hohe Priorität",
  medium: "Mittlere Priorität",
  low: "Beobachten"
} as const;

export function PredictionCard({ prediction, compact, onAction }: Props) {
  const timing =
    prediction.daysUntilNext >= 0
      ? `${prediction.daysUntilNext} Tage`
      : `${Math.abs(prediction.daysUntilNext)} Tage über Plan`;
  const visibleReasons = prediction.reasonCodes.slice(0, compact ? 2 : 3);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.category}>{categoryLabel(prediction.category)}</Text>
          <Text style={styles.title}>{prediction.displayName}</Text>
        </View>
        <UrgencyBadge urgency={prediction.urgency} />
      </View>

      <View style={styles.decisionRow}>
        <View style={styles.decisionItem}>
          <Text style={styles.decisionLabel}>Nächster Bedarf</Text>
          <Text style={styles.decisionValue}>{formatGermanDate(prediction.estimatedNextPurchaseDate)}</Text>
        </View>
        <View style={styles.decisionItem}>
          <Text style={styles.decisionLabel}>Status</Text>
          <Text style={styles.decisionValue}>{timing}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreValue}>{prediction.score}</Text>
          <Text style={styles.scoreLabel}>{tierLabels[prediction.recommendationTier]}</Text>
        </View>
      </View>

      <View style={styles.reasonRow}>
        {visibleReasons.map((code) => (
          <Text key={code} style={styles.reasonChip}>{reasonLabels[code]}</Text>
        ))}
        {prediction.stockupAdjustmentDays > 0 ? <Text style={styles.stockupNote}>+{prediction.stockupAdjustmentDays} Tage wegen Vorrat</Text> : null}
      </View>

      {!compact ? <Text style={styles.microCopy}>Ø alle {prediction.medianIntervalDays} Tage · {prediction.purchaseCount} Käufe · {prediction.signals.dataDepth}</Text> : null}

      {onAction ? (
        <View style={styles.actions}>
          <View style={styles.mainActions}>
            <Pressable style={styles.primaryButton} onPress={() => onAction(prediction, "add_to_list")}>
              <Text style={styles.primaryButtonText}>Liste</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => onAction(prediction, "add_to_cart")}>
              <Text style={styles.secondaryButtonText}>Warenkorb</Text>
            </Pressable>
          </View>
          <View style={styles.feedbackActions}>
            <Pressable style={styles.textButton} onPress={() => onAction(prediction, "still_enough")}>
              <Text style={styles.textButtonText}>Noch genug</Text>
            </Pressable>
            <Pressable style={styles.textButton} onPress={() => onAction(prediction, "bought_already")}>
              <Text style={styles.textButtonText}>Schon gekauft</Text>
            </Pressable>
            <Pressable style={styles.textButton} onPress={() => onAction(prediction, "not_relevant")}>
              <Text style={styles.textButtonText}>Nicht relevant</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderColor: colors.border,
    borderWidth: 1,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1
  },
  header: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  titleBlock: { flex: 1 },
  category: { color: colors.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  title: { color: colors.text, fontSize: 18, fontWeight: "800", marginTop: 3 },
  decisionRow: { flexDirection: "row", gap: spacing.sm, alignItems: "stretch" },
  decisionItem: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: 12, padding: spacing.md },
  decisionLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  decisionValue: { color: colors.text, fontSize: 14, fontWeight: "900", marginTop: 4 },
  scoreBox: {
    width: 74,
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    padding: spacing.sm,
    alignItems: "center",
    justifyContent: "center"
  },
  scoreValue: { color: "#fff", fontSize: 20, fontWeight: "900" },
  scoreLabel: { color: "#dfeee8", fontSize: 10, fontWeight: "800", textAlign: "center" },
  reasonRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  reasonChip: {
    backgroundColor: colors.surfaceMuted,
    color: colors.textMuted,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: "800"
  },
  stockupNote: { color: colors.accent, fontSize: 11, fontWeight: "900", paddingVertical: 5 },
  microCopy: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  actions: { gap: spacing.sm },
  mainActions: { flexDirection: "row", gap: spacing.sm },
  feedbackActions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  primaryButton: { flex: 1, backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "900" },
  secondaryButton: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, alignItems: "center" },
  secondaryButtonText: { color: colors.primaryDark, fontWeight: "900" },
  textButton: { paddingHorizontal: 2, paddingVertical: 4 },
  textButtonText: { color: colors.textMuted, fontWeight: "700", fontSize: 12 }
});
