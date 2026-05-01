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
      {!compact ? (
        <View style={styles.details}>
          <Text style={styles.detail}>Letzter Kauf: {formatGermanDate(prediction.lastPurchaseDate)}</Text>
          <Text style={styles.detail}>Üblicher Abstand: ca. {prediction.medianIntervalDays} Tage</Text>
          <Text style={styles.detail}>Geschätzter Bedarf: {formatGermanDate(prediction.estimatedNextPurchaseDate)}</Text>
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
    gap: spacing.md
  },
  header: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  titleBlock: { flex: 1 },
  category: { color: colors.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  title: { color: colors.text, fontSize: 18, fontWeight: "800", marginTop: 3 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  meta: { color: colors.textMuted, fontSize: 12 },
  explanation: { color: colors.text, lineHeight: 20 },
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
