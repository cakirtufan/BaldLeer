import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { PredictionCard } from "@/components/PredictionCard";
import { RefillPrediction } from "@/domain/types";
import { useAppState } from "@/storage/AppStateProvider";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type TierFilter = "all" | "high" | "medium" | "low";

const tierLabels: Record<TierFilter, string> = {
  all: "Alle",
  high: "Priorität",
  medium: "Demnächst",
  low: "Beobachten"
};

export default function PredictionsScreen() {
  const { predictions, handlePredictionAction } = useAppState();
  const [tier, setTier] = useState<TierFilter>("all");
  const visiblePredictions = useMemo(
    () => predictions.filter((prediction) => tier === "all" || prediction.recommendationTier === tier),
    [predictions, tier]
  );
  const highCount = predictions.filter((prediction) => prediction.recommendationTier === "high").length;
  const topPrediction = predictions[0];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Nachkauf-Assistent</Text>
        <Text style={styles.title}>Vorschläge</Text>
        <Text style={styles.text}>Kurz priorisiert, damit direkt klar ist, was wahrscheinlich bald wieder nötig sein könnte.</Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>{predictions.length}</Text>
          <Text style={styles.summaryLabel}>aktive Hinweise</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>{highCount}</Text>
          <Text style={styles.summaryLabel}>hohe Priorität</Text>
        </View>
      </View>

      {topPrediction ? <TopSuggestion prediction={topPrediction} /> : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {(Object.keys(tierLabels) as TierFilter[]).map((item) => (
          <Text key={item} onPress={() => setTier(item)} style={[styles.chip, tier === item && styles.activeChip]}>
            {tierLabels[item]}
          </Text>
        ))}
      </ScrollView>

      {visiblePredictions.length === 0 ? (
        <EmptyState
          title="Keine Vorschläge in dieser Ansicht"
          text="Wechsle den Filter oder setze unterdrückte Kategorien zurück."
        />
      ) : (
        visiblePredictions.map((prediction) => (
          <PredictionCard key={prediction.id} prediction={prediction} onAction={handlePredictionAction} />
        ))
      )}
    </ScrollView>
  );
}

function TopSuggestion({ prediction }: { prediction: RefillPrediction }) {
  return (
    <View style={styles.topCard}>
      <Text style={styles.topLabel}>Wichtigster Hinweis</Text>
      <Text style={styles.topTitle}>{prediction.displayName}</Text>
      <Text style={styles.topText}>
        {prediction.daysUntilNext >= 0
          ? `In etwa ${prediction.daysUntilNext} Tagen wieder relevant.`
          : `Seit ${Math.abs(prediction.daysUntilNext)} Tagen wahrscheinlich wieder relevant.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.xl
  },
  kicker: { color: colors.primary, fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: colors.text, fontSize: 28, fontWeight: "900" },
  text: { color: colors.textMuted, lineHeight: 21, marginTop: spacing.sm },
  summary: { flexDirection: "row", gap: spacing.md },
  summaryBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.lg
  },
  summaryValue: { color: colors.primaryDark, fontSize: 24, fontWeight: "900" },
  summaryLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "800", marginTop: 2 },
  topCard: { backgroundColor: colors.primaryDark, borderRadius: 16, padding: spacing.lg, gap: spacing.sm },
  topLabel: { color: "#dfeee8", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  topTitle: { color: "#fff", fontSize: 20, fontWeight: "900" },
  topText: { color: "#eef7f3", lineHeight: 20 },
  filters: { gap: spacing.sm },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    color: colors.textMuted,
    overflow: "hidden",
    fontWeight: "800"
  },
  activeChip: { backgroundColor: colors.primary, color: "#fff" }
});
