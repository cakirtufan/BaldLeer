import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ProfileSwitcher } from "@/components/ProfileSwitcher";
import { mockProfiles } from "@/data/mockProfiles";
import { useAppState } from "@/storage/AppStateProvider";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export default function DemoScreen() {
  const { state, resetProfile } = useAppState();
  const active = mockProfiles.find((profile) => profile.id === state.activeProfileId);
  const story =
    state.activeProfileId === "family"
      ? "Zeigt Windeln/Feuchttücher als stabile Bedarfe, Waschmittel mit Feedback-Verschiebung und Toilettenpapier als Vorratskauf."
      : state.activeProfileId === "single"
        ? "Zeigt Kaffee als Promo-Vorratskauf, Zahnpasta als stabilen Bedarf und Seife als ausgeblendete Kategorie."
        : "Zeigt Katzenfutter als sehr regelmäßigen Bedarf, Küchenrolle als Begleitkategorie und Reiniger mit Feedback-Verschiebung.";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Live Pitch Setup</Text>
        <Text style={styles.title}>Demo-Profil wählen</Text>
        <Text style={styles.text}>
          Ein Profilwechsel setzt die lokalen Demo-Daten zurück und zeigt sofort andere Kaufhistorien, Intervalle und
          Nachkauf-Vorschläge.
        </Text>
      </View>
      <ProfileSwitcher
        activeProfileId={state.activeProfileId}
        onChange={(profileId) => {
          void resetProfile(profileId).then(() => router.replace("/"));
        }}
      />
      <View style={styles.activeCard}>
        <Text style={styles.activeLabel}>Aktuelles Szenario</Text>
        <Text style={styles.active}>{active?.name}</Text>
        <Text style={styles.text}>{story}</Text>
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
  kicker: { color: colors.primary, fontWeight: "900", fontSize: 12, textTransform: "uppercase" },
  title: { color: colors.text, fontSize: 28, fontWeight: "900" },
  text: { color: colors.textMuted, lineHeight: 21, marginTop: spacing.sm },
  activeCard: { backgroundColor: colors.surfaceMuted, borderRadius: 16, padding: spacing.lg },
  activeLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  active: { color: colors.primaryDark, fontWeight: "900" }
});
