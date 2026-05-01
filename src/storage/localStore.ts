import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMockPurchases } from "@/data/mockPurchases";
import { AppState, DemoProfileId } from "@/domain/types";

const stateKey = "baldleer.appState.v1";

export const defaultSettings = {
  refillSuggestionsEnabled: true,
  usePurchaseHistory: true,
  reminderHintsEnabled: true,
  suppressedKeys: []
};

export function createInitialState(profileId: DemoProfileId = "family"): AppState {
  return {
    activeProfileId: profileId,
    purchases: getMockPurchases(profileId),
    feedback: [],
    shoppingList: [],
    cart: [],
    settings: { ...defaultSettings }
  };
}

export async function loadAppState(): Promise<AppState> {
  const raw = await AsyncStorage.getItem(stateKey);
  if (!raw) return createInitialState();
  return JSON.parse(raw) as AppState;
}

export async function saveAppState(state: AppState): Promise<void> {
  await AsyncStorage.setItem(stateKey, JSON.stringify(state));
}

export async function resetDemoData(profileId: DemoProfileId = "family"): Promise<AppState> {
  const state = createInitialState(profileId);
  await saveAppState(state);
  return state;
}
