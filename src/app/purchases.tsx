import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { PurchaseCard } from "@/components/PurchaseCard";
import { ProductCategory, Purchase } from "@/domain/types";
import { useAppState } from "@/storage/AppStateProvider";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type PurchaseArea = "all" | "baby" | "haushalt" | "pflege" | "gesundheit" | "sommer" | "vorrat";

const areaFilters: Array<{ id: PurchaseArea; label: string; description: string }> = [
  { id: "all", label: "Alle", description: "Alle eBons" },
  { id: "baby", label: "Baby", description: "Windeln, Feuchttücher, Pflege" },
  { id: "haushalt", label: "Haushalt", description: "Papier, Wäsche, Reinigung" },
  { id: "pflege", label: "Pflege", description: "Shampoo, Deo, Zahnpasta" },
  { id: "gesundheit", label: "Gesundheit", description: "Vitamine, Tee, Erkältung" },
  { id: "sommer", label: "Sommer", description: "Sonne, After Sun" },
  { id: "vorrat", label: "Vorrat", description: "Angebote und Stock-up" }
];

function matchesArea(purchase: Purchase, area: PurchaseArea): boolean {
  const text = `${purchase.productName} ${purchase.category}`.toLowerCase();
  if (area === "all") return true;
  if (area === "baby") return purchase.category === "diapers" || purchase.category === "baby_wipes" || text.includes("baby") || text.includes("kinder");
  if (area === "haushalt") {
    return ["toilet_paper", "kitchen_paper", "laundry_detergent", "dishwasher_tabs", "cleaning_spray", "soap"].includes(
      purchase.category
    );
  }
  if (area === "pflege") {
    return (
      ["shampoo", "toothpaste", "soap"].includes(purchase.category) ||
      text.includes("deo") ||
      text.includes("duschgel") ||
      text.includes("handcreme") ||
      text.includes("mundsp")
    );
  }
  if (area === "gesundheit") {
    return text.includes("vitamin") || text.includes("erkält") || text.includes("tee") || text.includes("nasenspray") || text.includes("taschent");
  }
  if (area === "sommer") return text.includes("sonnen") || text.includes("after sun") || text.includes("lsf");
  if (area === "vorrat") return Boolean(purchase.isPromo || purchase.isStockup || purchase.discountPercent);
  return true;
}

export default function PurchasesScreen() {
  const { state } = useAppState();
  const [search, setSearch] = useState("");
  const [area, setArea] = useState<PurchaseArea>("all");

  const receiptGroups = useMemo(() => {
    const groups = state.purchases.reduce<Record<string, Purchase[]>>((acc, purchase) => {
      acc[purchase.receiptId] = acc[purchase.receiptId] ? [...acc[purchase.receiptId], purchase] : [purchase];
      return acc;
    }, {});

    return Object.values(groups)
      .filter((receiptPurchases) => {
        const matchesSelectedArea = receiptPurchases.some((purchase) => matchesArea(purchase, area));
        const normalizedSearch = search.trim().toLowerCase();
        const matchesSearch =
          normalizedSearch.length === 0 ||
          receiptPurchases.some((purchase) => purchase.productName.toLowerCase().includes(normalizedSearch));
        return matchesSelectedArea && matchesSearch;
      })
      .map((receiptPurchases) =>
        [...receiptPurchases]
          .filter((purchase) => matchesArea(purchase, area))
          .filter((purchase) => search.trim().length === 0 || purchase.productName.toLowerCase().includes(search.trim().toLowerCase()))
          .sort((a, b) => a.id.localeCompare(b.id))
      )
      .filter((receiptPurchases) => receiptPurchases.length > 0)
      .sort((a, b) => b[0].date.localeCompare(a[0].date));
  }, [area, search, state.purchases]);

  const activeArea = areaFilters.find((filter) => filter.id === area);

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
        {areaFilters.map((item) => (
          <Text
            key={item.id}
            onPress={() => setArea(item.id)}
            style={[styles.chip, area === item.id && styles.activeChip]}
          >
            {item.label}
          </Text>
        ))}
      </ScrollView>
      <Text style={styles.filterDescription}>{activeArea?.description}</Text>
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Digitale Kassenbons</Text>
        <Text style={styles.infoText}>
          Sortiert nach Datum. Kategorien und wiederkehrende Produktnamen werden lokal für Nachkauf-Vorschläge genutzt.
        </Text>
      </View>
      <Text style={styles.resultCount}>{receiptGroups.length} passende digitale Kassenbons gefunden</Text>
      {receiptGroups.map((receiptPurchases) => (
        <PurchaseCard key={receiptPurchases[0].receiptId} purchases={receiptPurchases} />
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
  filterDescription: { color: colors.textMuted, fontSize: 13, fontWeight: "700" },
  infoBox: { backgroundColor: colors.surfaceMuted, borderRadius: 14, padding: spacing.lg },
  infoTitle: { color: colors.text, fontWeight: "800" },
  infoText: { color: colors.textMuted, marginTop: 4, lineHeight: 20 },
  resultCount: { color: colors.textMuted, fontSize: 13, fontWeight: "800" }
});
