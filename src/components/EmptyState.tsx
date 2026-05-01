import { Text, StyleSheet, View } from "react-native";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.container}>
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
    borderWidth: 1
  },
  title: { fontWeight: "800", color: colors.text, fontSize: 17, marginBottom: 6 },
  text: { color: colors.textMuted, lineHeight: 20 }
});
