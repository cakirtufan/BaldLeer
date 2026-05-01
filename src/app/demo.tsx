import { router } from "expo-router";
import { ScrollView, StyleSheet, Text } from "react-native";
import { ProfileSwitcher } from "@/components/ProfileSwitcher";
import { mockProfiles } from "@/data/mockProfiles";
import { useAppState } from "@/storage/AppStateProvider";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export default function DemoScreen() {
  const { state, resetProfile } = useAppState();
  const active = mockProfiles.find((profile) => profile.id === state.activeProfileId);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Demo-Profil</Text>
      <Text style={styles.text}>
        Wechsle das Profil, um im Pitch unterschiedliche Kaufhistorien und Nachkaufmuster zu demonstrieren.
      </Text>
      <ProfileSwitcher
        activeProfileId={state.activeProfileId}
        onChange={(profileId) => {
          void resetProfile(profileId).then(() => router.replace("/"));
        }}
      />
      <Text style={styles.active}>Aktiv: {active?.name}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, fontSize: 28, fontWeight: "900" },
  text: { color: colors.textMuted, lineHeight: 21 },
  active: { color: colors.primaryDark, fontWeight: "900" }
});
