import { Text, StyleSheet, View } from "react-native";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border
  },
  value: { color: colors.primaryDark, fontSize: 24, fontWeight: "800" },
  label: { color: colors.text, fontWeight: "700", marginTop: 4 },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: 4 }
});
