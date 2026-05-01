import { StyleSheet, Text, View } from "react-native";
import { formatGermanDate } from "@/domain/dateUtils";
import { categoryLabel } from "@/domain/normalization";
import { Purchase } from "@/domain/types";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function PurchaseCard({ purchase }: { purchase: Purchase }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.title}>{purchase.productName}</Text>
        <Text style={styles.price}>{purchase.price.toFixed(2).replace(".", ",")} €</Text>
      </View>
      <Text style={styles.meta}>{purchase.storeName} · eBon {purchase.receiptId}</Text>
      <View style={styles.grid}>
        <Text style={styles.detail}>Kategorie: {categoryLabel(purchase.category)}</Text>
        <Text style={styles.detail}>Letzter Kauf: {formatGermanDate(purchase.date)}</Text>
        <Text style={styles.detail}>Menge: {purchase.quantity} × {purchase.packageSize}</Text>
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
    gap: spacing.sm
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  title: { flex: 1, color: colors.text, fontWeight: "800", fontSize: 16 },
  price: { color: colors.primaryDark, fontWeight: "800" },
  meta: { color: colors.textMuted, fontSize: 13 },
  grid: { gap: 3 },
  detail: { color: colors.textMuted, fontSize: 13 }
});
