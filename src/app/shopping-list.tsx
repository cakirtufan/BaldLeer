import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { ShoppingListItemCard } from "@/components/ShoppingListItemCard";
import { useAppState } from "@/storage/AppStateProvider";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export default function ShoppingListScreen() {
  const { state, markShoppingItemBought, removeShoppingItem, removeCartItem, clearLists } = useAppState();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Einkaufsliste</Text>
          <Text style={styles.text}>Aus Nachkauf-Vorschlägen hinzugefügt.</Text>
        </View>
        <Pressable style={styles.clearButton} onPress={clearLists}>
          <Text style={styles.clearText}>Liste leeren</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Einkaufsliste</Text>
      {state.shoppingList.length === 0 ? (
        <EmptyState title="Noch keine Artikel" text="Füge Produkte aus Bald leer? zur Einkaufsliste hinzu." />
      ) : (
        state.shoppingList.map((item) => (
          <ShoppingListItemCard
            key={item.id}
            item={item}
            type="list"
            onBought={() => markShoppingItemBought(item)}
            onRemove={() => removeShoppingItem(item.id)}
          />
        ))
      )}

      <Text style={styles.sectionTitle}>Im Warenkorb</Text>
      {state.cart.length === 0 ? (
        <EmptyState title="Warenkorb leer" text="Der Warenkorb ist nur eine Simulation für den Pitch-Prototyp." />
      ) : (
        state.cart.map((item) => (
          <ShoppingListItemCard key={item.id} item={item} type="cart" onRemove={() => removeCartItem(item.id)} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.md },
  title: { color: colors.text, fontSize: 28, fontWeight: "900" },
  text: { color: colors.textMuted, marginTop: 4 },
  clearButton: { backgroundColor: colors.surfaceMuted, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  clearText: { color: colors.textMuted, fontWeight: "800" },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "900" }
});
