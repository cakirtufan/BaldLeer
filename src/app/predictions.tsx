import { ScrollView, StyleSheet, Text } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { PredictionCard } from "@/components/PredictionCard";
import { useAppState } from "@/storage/AppStateProvider";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export default function PredictionsScreen() {
  const { predictions, handlePredictionAction } = useAppState();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>BaldLeer</Text>
      <Text style={styles.text}>
        Diese Vorschläge entstehen aus wiederkehrenden Kategorien und Produkten in der digitalen Einkaufshistorie.
      </Text>
      {predictions.length === 0 ? (
        <EmptyState
          title="Noch keine aktiven Vorschläge"
          text="Aktiviere die Nachkauf-Vorschläge oder setze unterdrückte Kategorien zurück, um Demo-Vorschläge zu sehen."
        />
      ) : (
        predictions.map((prediction) => (
          <PredictionCard key={prediction.id} prediction={prediction} onAction={handlePredictionAction} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, fontSize: 28, fontWeight: "900" },
  text: { color: colors.textMuted, lineHeight: 21 }
});
