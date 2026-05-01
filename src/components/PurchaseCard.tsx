import { StyleSheet, Text, View } from "react-native";
import { formatGermanDate } from "@/domain/dateUtils";
import { categoryLabel } from "@/domain/normalization";
import { Purchase } from "@/domain/types";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function PurchaseCard({ purchases }: { purchases: Purchase[] }) {
  const first = purchases[0];
  const total = purchases.reduce((sum, purchase) => sum + purchase.price * purchase.quantity, 0);
  const promoCount = purchases.filter((purchase) => purchase.isPromo || purchase.discountPercent).length;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>eBon {first.receiptId}</Text>
          <Text style={styles.meta}>{first.storeName} · {formatGermanDate(first.date)}</Text>
        </View>
        <Text style={styles.price}>{total.toFixed(2).replace(".", ",")} €</Text>
      </View>

      <View style={styles.receiptSummary}>
        <Text style={styles.summaryText}>{purchases.length} Positionen</Text>
        {promoCount > 0 ? <Text style={styles.promoText}>{promoCount} Angebot/Stokauf</Text> : null}
      </View>

      {purchases.map((purchase) => (
        <View key={purchase.id} style={styles.lineItem}>
          <View style={styles.lineText}>
            <Text style={styles.productName}>{purchase.productName}</Text>
            <Text style={styles.detail}>
              {categoryLabel(purchase.category)} · {purchase.quantity} × {purchase.packageSize}
            </Text>
            {purchase.isStockup ? <Text style={styles.stockup}>Vorratskauf im Angebot</Text> : null}
          </View>
          <Text style={styles.linePrice}>{(purchase.price * purchase.quantity).toFixed(2).replace(".", ",")} €</Text>
        </View>
      ))}
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
  titleBlock: { flex: 1 },
  title: { color: colors.text, fontWeight: "900", fontSize: 16 },
  price: { color: colors.primaryDark, fontWeight: "800" },
  meta: { color: colors.textMuted, fontSize: 13 },
  receiptSummary: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  summaryText: { color: colors.textMuted, fontSize: 12, fontWeight: "800" },
  promoText: { color: colors.accent, fontSize: 12, fontWeight: "900" },
  lineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.sm
  },
  lineText: { flex: 1 },
  productName: { color: colors.text, fontWeight: "800" },
  detail: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  stockup: { color: colors.accent, fontSize: 12, fontWeight: "900", marginTop: 3 },
  linePrice: { color: colors.text, fontWeight: "800" }
});
