import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
  const activeListItems = state.shoppingList.filter((item) => item.status === "open").length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.kicker}>Smart Refill im Händlerprofil</Text>
            <Text style={styles.title}>BaldLeer</Text>
          </View>
          <View style={styles.profilePill}>
            <Text style={styles.profilePillText}>Demo</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Intelligente Nachkauf-Vorschläge auf Basis deiner bisherigen Einkäufe.</Text>
        <Text style={styles.body}>
          Aus digitalen Kassenbons wird ein aktiver Assistent: wiederkehrende Bedarfe erkennen, sanft erinnern und mit
          einem Tipp auf Einkaufsliste oder Warenkorb vorbereiten.
        </Text>
        <View style={styles.heroFooter}>
          <Text style={styles.heroMetric}>Keine OCR</Text>
          <Text style={styles.heroMetric}>Lokale Demo-Daten</Text>
          <Text style={styles.heroMetric}>Opt-in-fähig</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <StatCard label="Aktive Vorschläge" value={predictions.length} hint="aus eBon-Historie" />
        <StatCard label="Offene Artikel" value={activeListItems} hint="Einkaufsliste" />
      </View>

      <View style={styles.priorityCard}>
        <Text style={styles.priorityLabel}>Priorität für den nächsten Einkauf</Text>
        {urgent ? (
          <>
            <Text style={styles.priorityTitle}>{urgent.displayName}</Text>
            <Text style={styles.learned}>
              Könnte bald wieder nötig sein. Der geschätzte nächste Bedarf liegt bei{" "}
              {formatGermanDate(urgent.estimatedNextPurchaseDate)}.
            </Text>
          </>
        ) : (
          <Text style={styles.learned}>Aktuell gibt es keine aktiven Nachkauf-Vorschläge.</Text>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Empfohlene Nachkäufe</Text>
          <Text style={styles.sectionHint}>Sanfte Hinweise statt harter Leerstandsmeldung.</Text>
        </View>
        <Link href="/predictions" asChild>
          <Pressable style={styles.linkButton}>
            <Text style={styles.linkButtonText}>Alle</Text>
          </Pressable>
        </Link>
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
          Die Funktion erkennt wiederkehrende Kategorien aus digitalen Kassenbons, nutzt robuste Median-Intervalle und
          berücksichtigt Feedback wie „Noch genug” oder „Nicht relevant”. In dieser MVP-Version bleibt alles lokal auf
          dem Gerät.
        </Text>
      </View>

      <View style={styles.intelligenceCard}>
        <Text style={styles.intelligenceKicker}>ML-ready Architektur</Text>
        <Text style={styles.intelligenceTitle}>Erklärbar zuerst, lernfähig danach</Text>
        <Text style={styles.intelligenceText}>
          Der MVP nutzt transparente Regeln wie Median-Intervall, Stabilität und Feedback-Signale. Mit echter
          Händlerhistorie kann daraus später ein kleines Scoring-Modell werden, ohne die Nutzererklärung zu verlieren.
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
    borderRadius: 20,
    padding: spacing.xl,
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2
  },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.md },
  kicker: { color: colors.primary, fontWeight: "800", textTransform: "uppercase", fontSize: 12 },
  title: { color: colors.text, fontSize: 34, fontWeight: "900", marginTop: 6 },
  subtitle: { color: colors.text, fontWeight: "800", fontSize: 16, marginTop: 4 },
  body: { color: colors.textMuted, lineHeight: 21, marginTop: spacing.md },
  profilePill: { backgroundColor: colors.surfaceMuted, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  profilePillText: { color: colors.primaryDark, fontSize: 12, fontWeight: "900" },
  heroFooter: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg },
  heroMetric: {
    backgroundColor: colors.surfaceMuted,
    color: colors.textMuted,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "800"
  },
  stats: { flexDirection: "row", gap: spacing.md },
  priorityCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.sm
  },
  priorityLabel: { color: "#dfeee8", fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  priorityTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
  sectionHint: { color: colors.textMuted, marginTop: 3, fontSize: 13 },
  learned: { color: colors.textMuted, lineHeight: 21 },
  intelligenceCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.sm
  },
  intelligenceKicker: { color: colors.primary, fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  intelligenceTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
  intelligenceText: { color: colors.textMuted, lineHeight: 21 },
  linkButton: { backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  linkButtonText: { color: colors.primaryDark, fontWeight: "900" }
});
