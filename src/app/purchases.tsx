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
      <Text style={styles.title}>Meine Einkäufe</Text>
      <Text style={styles.text}>
        Digitale Kassenbons aus dem bestehenden Händlerprofil. Keine manuelle Eingabe, kein OCR, keine Kamera.
      </Text>
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
        <Text style={styles.infoText}>Sortiert nach Datum. Genutzt für lokale Nachkauf-Vorhersagen.</Text>
      </View>
      {purchases.map((purchase) => (
        <PurchaseCard key={purchase.id} purchase={purchase} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, fontSize: 28, fontWeight: "900" },
  text: { color: colors.textMuted, lineHeight: 21 },
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
  infoText: { color: colors.textMuted, marginTop: 4 }
});
