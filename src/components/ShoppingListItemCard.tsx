import { Pressable, StyleSheet, Text, View } from "react-native";
import { categoryLabel } from "@/domain/normalization";
import { CartItem, ShoppingListItem } from "@/domain/types";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function ShoppingListItemCard({
  item,
  type,
  onBought,
  onRemove
}: {
  item: ShoppingListItem | CartItem;
  type: "list" | "cart";
  onBought?: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{item.displayName}</Text>
        <Text style={styles.meta}>{categoryLabel(item.category)} · aus BaldLeer</Text>
      </View>
      <View style={styles.actions}>
        {type === "list" && onBought ? (
          <Pressable style={styles.primaryButton} onPress={onBought}>
            <Text style={styles.primaryText}>Als gekauft markieren</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.secondaryButton} onPress={onRemove}>
          <Text style={styles.secondaryText}>Entfernen</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md
  },
  textBlock: { gap: 3 },
  title: { color: colors.text, fontSize: 16, fontWeight: "800" },
  meta: { color: colors.textMuted, fontSize: 13 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  primaryButton: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  primaryText: { color: "#fff", fontWeight: "800" },
  secondaryButton: { backgroundColor: colors.surfaceMuted, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  secondaryText: { color: colors.textMuted, fontWeight: "800" }
});
