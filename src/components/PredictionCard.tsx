import { Pressable, StyleSheet, Text, View } from "react-native";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { UrgencyBadge } from "./UrgencyBadge";
import { formatGermanDate } from "@/domain/dateUtils";
import { categoryLabel } from "@/domain/normalization";
import { FeedbackAction, RefillPrediction } from "@/domain/types";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type Props = {
  prediction: RefillPrediction;
  compact?: boolean;
  onAction?: (prediction: RefillPrediction, action: FeedbackAction) => void;
};

export function PredictionCard({ prediction, compact, onAction }: Props) {
  const timing =
    prediction.daysUntilNext >= 0
      ? `${prediction.daysUntilNext} Tage`
      : `${Math.abs(prediction.daysUntilNext)} Tage über Plan`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.category}>{categoryLabel(prediction.category)}</Text>
          <Text style={styles.title}>{prediction.displayName}</Text>
        </View>
        <UrgencyBadge urgency={prediction.urgency} />
      </View>

      <View style={styles.badgeRow}>
        <ConfidenceBadge confidence={prediction.confidence} />
        <Text style={styles.meta}>{prediction.purchaseCount} Käufe erkannt</Text>
      </View>

      <Text style={styles.explanation}>{prediction.explanation}</Text>

      <View style={styles.signalPanel}>
        <Text style={styles.signalTitle}>Prediction Intelligence</Text>
        <View style={styles.signalGrid}>
          <Text style={styles.signalChip}>Historie: {prediction.signals.dataDepth}</Text>
          <Text style={styles.signalChip}>Intervall: {prediction.signals.intervalStability}</Text>
          <Text style={[styles.signalChip, prediction.stockupAdjustmentDays > 0 ? styles.stockupChip : null]}>
            {prediction.signals.stockupSignal}
          </Text>
          <Text style={styles.signalChip}>{prediction.signals.feedbackSignal}</Text>
          <Text style={styles.signalChip}>{prediction.signals.mlReadiness}</Text>
        </View>
      </View>

      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Intervall</Text>
          <Text style={styles.summaryValue}>
            {prediction.adjustedIntervalDays === prediction.medianIntervalDays
              ? `${prediction.medianIntervalDays} Tage`
              : `${prediction.adjustedIntervalDays} Tage angepasst`}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Nächster Bedarf</Text>
          <Text style={styles.summaryValue}>{formatGermanDate(prediction.estimatedNextPurchaseDate)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Status</Text>
          <Text style={styles.summaryValue}>{timing}</Text>
        </View>
      </View>

      {!compact ? (
        <View style={styles.details}>
          <Text style={styles.detail}>Letzter Kauf: {formatGermanDate(prediction.lastPurchaseDate)}</Text>
          <Text style={styles.detail}>Üblicher Abstand: ca. {prediction.medianIntervalDays} Tage</Text>
          {prediction.stockupAdjustmentDays > 0 ? (
            <Text style={styles.detail}>
              Vorratskauf-Anpassung: +{prediction.stockupAdjustmentDays} Tage bei {prediction.lastQuantity}× Menge
            </Text>
          ) : null}
          <Text style={styles.detail}>Geschätzter nächster Bedarf: {formatGermanDate(prediction.estimatedNextPurchaseDate)}</Text>
          <Text style={styles.detail}>
            {prediction.daysUntilNext >= 0
              ? `Noch ${prediction.daysUntilNext} Tage`
              : `Seit ${Math.abs(prediction.daysUntilNext)} Tagen wahrscheinlich wieder nötig`}
          </Text>
        </View>
      ) : null}

      {onAction ? (
        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={() => onAction(prediction, "add_to_list")}>
            <Text style={styles.primaryButtonText}>Zur Einkaufsliste</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => onAction(prediction, "add_to_cart")}>
            <Text style={styles.secondaryButtonText}>In den Warenkorb</Text>
          </Pressable>
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
  badgeRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  meta: { color: colors.textMuted, fontSize: 12 },
  explanation: { color: colors.text, lineHeight: 20 },
  signalPanel: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm
  },
  signalTitle: { color: colors.primaryDark, fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  signalGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  signalChip: {
    backgroundColor: colors.surfaceMuted,
    color: colors.textMuted,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: "800"
  },
  stockupChip: { backgroundColor: "#f2e6d6", color: colors.accent },
  summaryStrip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm
  },
  summaryItem: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  summaryLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  summaryValue: { color: colors.text, fontSize: 12, fontWeight: "900", flexShrink: 1, textAlign: "right" },
  details: { gap: 4 },
  detail: { color: colors.textMuted, fontSize: 13 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  primaryButton: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  primaryButtonText: { color: "#fff", fontWeight: "800" },
  secondaryButton: { backgroundColor: colors.surfaceMuted, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  secondaryButtonText: { color: colors.primaryDark, fontWeight: "800" },
  textButton: { paddingHorizontal: 8, paddingVertical: 10 },
  textButtonText: { color: colors.textMuted, fontWeight: "700" }
});
