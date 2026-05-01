import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useAppState } from "@/storage/AppStateProvider";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export default function SettingsScreen() {
  const { state, updateSettings, resetSuppressed, resetProfile } = useAppState();
  const settings = state.settings;

  function setSetting(key: keyof typeof settings, value: boolean) {
    updateSettings({ ...settings, [key]: value });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Kontrolle & Transparenz</Text>
        <Text style={styles.title}>Einstellungen</Text>
        <Text style={styles.intro}>
          Für eine echte Händler-App wäre diese Funktion freiwillig aktivierbar und jederzeit steuerbar.
        </Text>
      </View>
      <SettingRow
        label="Nachkauf-Vorschläge aktivieren"
        value={settings.refillSuggestionsEnabled}
        onValueChange={(value) => setSetting("refillSuggestionsEnabled", value)}
      />
      <SettingRow
        label="Einkaufshistorie für Vorhersagen verwenden"
        value={settings.usePurchaseHistory}
        onValueChange={(value) => setSetting("usePurchaseHistory", value)}
      />
      <SettingRow
        label="Erinnerungs-Hinweise anzeigen"
        value={settings.reminderHintsEnabled}
        onValueChange={(value) => setSetting("reminderHintsEnabled", value)}
      />

      <Pressable style={styles.button} onPress={resetSuppressed}>
        <Text style={styles.buttonText}>Unterdrückte Kategorien zurücksetzen</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => void resetProfile()}>
        <Text style={styles.buttonText}>Demo-Daten zurücksetzen</Text>
      </Pressable>
      <Link href="/demo" style={styles.demoLink}>Demo-Profil wechseln</Link>

      <View style={styles.privacy}>
        <Text style={styles.privacyTitle}>Datenschutz in dieser MVP-Version</Text>
        <Text style={styles.privacyText}>
          Diese Demo speichert alle Daten lokal auf dem Gerät. Es werden keine Daten an einen Server gesendet. In einer
          echten Händler-App müsste die Funktion transparent, freiwillig und mit klarer Zustimmung aktiviert werden.
        </Text>
      </View>
    </ScrollView>
  );
}

function SettingRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.primary, false: colors.disabled }} />
    </View>
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
  intro: { color: colors.textMuted, lineHeight: 21, marginTop: spacing.sm },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  rowLabel: { flex: 1, color: colors.text, fontWeight: "800" },
  button: { backgroundColor: colors.surfaceMuted, borderRadius: 12, padding: spacing.lg },
  buttonText: { color: colors.primaryDark, fontWeight: "900" },
  demoLink: { color: colors.primaryDark, fontWeight: "900", fontSize: 16 },
  privacy: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, borderColor: colors.border, borderWidth: 1 },
  privacyTitle: { color: colors.text, fontWeight: "900", fontSize: 18, marginBottom: spacing.sm },
  privacyText: { color: colors.textMuted, lineHeight: 21 }
});
