import { Text, StyleSheet, View } from "react-native";
import { Urgency } from "@/domain/types";
import { colors } from "@/theme/colors";

const labels: Record<Urgency, string> = {
  not_urgent: "Nicht dringend",
  soon: "Bald nötig",
  probably_needed_now: "Wahrscheinlich nötig",
  overdue: "Überfällig"
};

const badgeColors: Record<Urgency, string> = {
  not_urgent: colors.info,
  soon: colors.warning,
  probably_needed_now: colors.accent,
  overdue: colors.danger
};

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return (
    <View style={[styles.badge, { backgroundColor: badgeColors[urgency] }]}>
      <Text style={styles.text}>{labels[urgency]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  text: { color: "#fff", fontSize: 12, fontWeight: "700" }
});
