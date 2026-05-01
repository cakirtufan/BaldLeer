import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppStateProvider } from "@/storage/AppStateProvider";
import { colors } from "@/theme/colors";

export default function RootLayout() {
  return (
    <AppStateProvider>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTitleStyle: { color: colors.text, fontWeight: "800" },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { borderTopColor: colors.border }
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "BaldLeer",
            tabBarLabel: "Start",
            tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={color} size={size} />
          }}
        />
        <Tabs.Screen
          name="predictions"
          options={{
            title: "BaldLeer",
            tabBarLabel: "Vorschläge",
            tabBarIcon: ({ color, size }) => <Ionicons name="refresh-circle-outline" color={color} size={size} />
          }}
        />
        <Tabs.Screen
          name="purchases"
          options={{
            title: "Meine Einkäufe",
            tabBarLabel: "Einkäufe",
            tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" color={color} size={size} />
          }}
        />
        <Tabs.Screen
          name="shopping-list"
          options={{
            title: "Einkaufsliste",
            tabBarLabel: "Liste",
            tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" color={color} size={size} />
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Einstellungen",
            tabBarLabel: "Mehr",
            tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} />
          }}
        />
        <Tabs.Screen
          name="demo"
          options={{
            title: "Demo",
            href: null
          }}
        />
      </Tabs>
    </AppStateProvider>
  );
}
