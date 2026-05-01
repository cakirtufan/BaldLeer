import { Ionicons } from "@expo/vector-icons";
import { Text, StyleSheet, View } from "react-native";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Ionicons name="sparkles-outline" size={22} color={colors.primaryDark} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.xl,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: "flex-start"
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md
  },
  title: { fontWeight: "800", color: colors.text, fontSize: 17, marginBottom: 6 },
  text: { color: colors.textMuted, lineHeight: 20 }
});
