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
            <Text style={[styles.name, active ? styles.activeText : null]}>{profile.name}</Text>
            <Text style={[styles.description, active ? styles.activeDescription : null]}>{profile.description}</Text>
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
    borderRadius: 14,
    padding: spacing.lg
  },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  name: { color: colors.text, fontWeight: "800", fontSize: 16 },
  activeText: { color: "#fff" },
  description: { color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  activeDescription: { color: "#eef7f3" }
});
