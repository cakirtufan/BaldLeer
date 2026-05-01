import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { PurchaseCard } from "@/components/PurchaseCard";
import { categoryLabels } from "@/domain/normalization";
import { ProductCategory } from "@/domain/types";
import { useAppState } from "@/storage/AppStateProvider";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export default function PurchasesScreen() {
  const { state } = useAppState();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ProductCategory | "all">("all");

  const categories = useMemo(
    () => Array.from(new Set(state.purchases.map((purchase) => purchase.category))),
    [state.purchases]
  );

  const purchases = useMemo(() => {
    return state.purchases
      .filter((purchase) => category === "all" || purchase.category === category)
      .filter((purchase) => purchase.productName.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [category, search, state.purchases]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Datenbasis</Text>
        <Text style={styles.title}>Meine Einkäufe</Text>
        <Text style={styles.text}>
          Simulierte digitale Kassenbons aus einem bestehenden Händlerprofil. Diese Ansicht zeigt bewusst keine
          manuelle Erfassung, kein OCR und keine Kamera.
        </Text>
      </View>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Produkt suchen"
        placeholderTextColor={colors.disabled}
        style={styles.input}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        <Text onPress={() => setCategory("all")} style={[styles.chip, category === "all" && styles.activeChip]}>
          Alle
        </Text>
        {categories.map((item) => (
          <Text
            key={item}
            onPress={() => setCategory(item)}
            style={[styles.chip, category === item && styles.activeChip]}
          >
            {categoryLabels[item]}
          </Text>
        ))}
      </ScrollView>
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Digitale Kassenbons</Text>
        <Text style={styles.infoText}>
          Sortiert nach Datum. Kategorien und wiederkehrende Produktnamen werden lokal für Nachkauf-Vorschläge genutzt.
        </Text>
      </View>
      <Text style={styles.resultCount}>{purchases.length} eBon-Positionen gefunden</Text>
      {purchases.map((purchase) => (
        <PurchaseCard key={purchase.id} purchase={purchase} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.xl,
    borderColor: colors.border,
    borderWidth: 1
  },
  kicker: { color: colors.primary, fontWeight: "900", fontSize: 12, textTransform: "uppercase" },
  title: { color: colors.text, fontSize: 28, fontWeight: "900" },
  text: { color: colors.textMuted, lineHeight: 21, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    color: colors.text
  },
  filters: { gap: spacing.sm },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    color: colors.textMuted,
    overflow: "hidden"
  },
  activeChip: { backgroundColor: colors.primary, color: "#fff", fontWeight: "800" },
  infoBox: { backgroundColor: colors.surfaceMuted, borderRadius: 14, padding: spacing.lg },
  infoTitle: { color: colors.text, fontWeight: "800" },
  infoText: { color: colors.textMuted, marginTop: 4, lineHeight: 20 },
  resultCount: { color: colors.textMuted, fontSize: 13, fontWeight: "800" }
});
