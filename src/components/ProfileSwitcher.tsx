import { Pressable, StyleSheet, Text, View } from "react-native";
import { mockProfiles } from "@/data/mockProfiles";
import { DemoProfileId } from "@/domain/types";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function ProfileSwitcher({
  activeProfileId,
  onChange
}: {
  activeProfileId: DemoProfileId;
  onChange: (profileId: DemoProfileId) => void;
}) {
  return (
    <View style={styles.container}>
      {mockProfiles.map((profile) => {
        const active = profile.id === activeProfileId;
        return (
          <Pressable
            key={profile.id}
            onPress={() => onChange(profile.id)}
            style={[styles.option, active ? styles.active : null]}
          >
            <View style={styles.optionTop}>
              <Text style={[styles.name, active ? styles.activeText : null]}>{profile.name}</Text>
              <Text style={[styles.status, active ? styles.activeStatus : null]}>{active ? "Aktiv" : "Auswählen"}</Text>
            </View>
            <Text style={[styles.description, active ? styles.activeDescription : null]}>{profile.description}</Text>
            <View style={styles.useCaseRow}>
              <Text style={[styles.useCase, active ? styles.activeUseCase : null]}>6 Monate eBon-Daten</Text>
              <Text style={[styles.useCase, active ? styles.activeUseCase : null]}>andere Nachkaufmuster</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  option: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm
  },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.md },
  name: { color: colors.text, fontWeight: "800", fontSize: 16 },
  activeText: { color: "#fff" },
  status: { color: colors.primaryDark, fontSize: 12, fontWeight: "900" },
  activeStatus: { color: "#fff" },
  description: { color: colors.textMuted, lineHeight: 18 },
  activeDescription: { color: "#eef7f3" },
  useCaseRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  useCase: {
    backgroundColor: colors.surfaceMuted,
    color: colors.textMuted,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: "800"
  },
  activeUseCase: { backgroundColor: "#eef7f3", color: colors.primaryDark }
});
