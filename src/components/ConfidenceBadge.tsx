import { Text, StyleSheet, View } from "react-native";
import { Confidence } from "@/domain/types";
import { colors } from "@/theme/colors";

const labels: Record<Confidence, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch"
};

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>Vertrauen: {labels[confidence]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.surfaceMuted
  },
  text: { color: colors.textMuted, fontSize: 12, fontWeight: "700" }
});
