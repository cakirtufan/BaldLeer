import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { PredictionCard } from "@/components/PredictionCard";
import { StatCard } from "@/components/StatCard";
import { formatGermanDate } from "@/domain/dateUtils";
import { useAppState } from "@/storage/AppStateProvider";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export default function DashboardScreen() {
  const { state, predictions, handlePredictionAction } = useAppState();
  const urgent = predictions[0];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Smart Refill</Text>
        <Text style={styles.title}>Bald leer?</Text>
        <Text style={styles.subtitle}>Intelligente Nachkauf-Vorschläge auf Basis deiner bisherigen Einkäufe.</Text>
        <Text style={styles.body}>
          Wir analysieren deine bisherigen Einkäufe und schlagen Produkte vor, die bald wieder nötig sein könnten.
        </Text>
      </View>

      <View style={styles.stats}>
        <StatCard label="Vorschläge" value={predictions.length} hint="basierend auf eBon-Historie" />
        <StatCard label="Einkaufsliste" value={state.shoppingList.length} hint="aus Bald leer?" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Am dringendsten</Text>
        {urgent ? (
          <Text style={styles.learned}>
            {urgent.displayName} könnte bald wieder nötig sein. Geschätzter Bedarf:{" "}
            {formatGermanDate(urgent.estimatedNextPurchaseDate)}.
          </Text>
        ) : (
          <Text style={styles.learned}>Aktuell gibt es keine aktiven Nachkauf-Vorschläge.</Text>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top-Vorschläge</Text>
        <Link href="/predictions" style={styles.link}>Alle anzeigen</Link>
      </View>

      {predictions.length === 0 ? (
        <EmptyState
          title="Keine Vorschläge aktiv"
          text="Wenn genügend wiederkehrende Einkäufe vorhanden sind, erscheinen hier sanfte Nachkauf-Hinweise."
        />
      ) : (
        predictions.slice(0, 3).map((prediction) => (
          <PredictionCard
            key={prediction.id}
            prediction={prediction}
            compact
            onAction={handlePredictionAction}
          />
        ))
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aus deinen Einkäufen gelernt</Text>
        <Text style={styles.learned}>
          Wiederkehrende Kategorien werden aus digitalen Kassenbons erkannt. Häufigkeit, letzter Kauf und Feedback wie
          „Noch genug” verändern die nächsten Vorschläge lokal auf dem Gerät.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.xl,
    borderColor: colors.border,
    borderWidth: 1
  },
  kicker: { color: colors.primary, fontWeight: "800", textTransform: "uppercase", fontSize: 12 },
  title: { color: colors.text, fontSize: 34, fontWeight: "900", marginTop: 6 },
  subtitle: { color: colors.text, fontWeight: "800", fontSize: 16, marginTop: 4 },
  body: { color: colors.textMuted, lineHeight: 21, marginTop: spacing.md },
  stats: { flexDirection: "row", gap: spacing.md },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
  learned: { color: colors.textMuted, lineHeight: 21 },
  link: { color: colors.primaryDark, fontWeight: "800" }
});
