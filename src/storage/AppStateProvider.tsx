import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { createFeedback, createPurchaseFromPrediction, createShoppingListItem, createCartItem, suppressPrediction } from "@/domain/feedback";
import { calculateRefillPredictions } from "@/domain/prediction";
import { AppState, DemoProfileId, FeedbackAction, RefillPrediction, ShoppingListItem } from "@/domain/types";
import { createInitialState, loadAppState, resetDemoData, saveAppState } from "./localStore";

type AppStateContextValue = {
  state: AppState;
  predictions: RefillPrediction[];
  loading: boolean;
  handlePredictionAction: (prediction: RefillPrediction, action: FeedbackAction) => void;
  markShoppingItemBought: (item: ShoppingListItem) => void;
  removeShoppingItem: (itemId: string) => void;
  removeCartItem: (itemId: string) => void;
  clearLists: () => void;
  updateSettings: (settings: AppState["settings"]) => void;
  resetSuppressed: () => void;
  resetProfile: (profileId?: DemoProfileId) => Promise<void>;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppState>(createInitialState());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppState()
      .then(setState)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) void saveAppState(state);
  }, [loading, state]);

  const predictions = useMemo(
    () => calculateRefillPredictions(state.purchases, state.feedback, state.settings),
    [state.feedback, state.purchases, state.settings]
  );

  function handlePredictionAction(prediction: RefillPrediction, action: FeedbackAction) {
    setState((current) => {
      const feedback = [...current.feedback, createFeedback(prediction, action)];
      if (action === "add_to_list") {
        return { ...current, feedback, shoppingList: [...current.shoppingList, createShoppingListItem(prediction)] };
      }
      if (action === "add_to_cart") {
        return { ...current, feedback, cart: [...current.cart, createCartItem(prediction)] };
      }
      if (action === "bought_already") {
        return { ...current, feedback, purchases: [createPurchaseFromPrediction(prediction), ...current.purchases] };
      }
      if (action === "not_relevant") {
        return { ...current, feedback, settings: suppressPrediction(current.settings, prediction) };
      }
      return { ...current, feedback };
    });
  }

  function markShoppingItemBought(item: ShoppingListItem) {
    const matchingPrediction = predictions.find((prediction) => prediction.id === item.sourcePredictionId);
    setState((current) => ({
      ...current,
      shoppingList: current.shoppingList.map((listItem) =>
        listItem.id === item.id ? { ...listItem, status: "bought" } : listItem
      ),
      purchases: matchingPrediction ? [createPurchaseFromPrediction(matchingPrediction), ...current.purchases] : current.purchases
    }));
  }

  function removeShoppingItem(itemId: string) {
    setState((current) => ({ ...current, shoppingList: current.shoppingList.filter((item) => item.id !== itemId) }));
  }

  function removeCartItem(itemId: string) {
    setState((current) => ({ ...current, cart: current.cart.filter((item) => item.id !== itemId) }));
  }

  function clearLists() {
    setState((current) => ({ ...current, shoppingList: [], cart: [] }));
  }

  function updateSettings(settings: AppState["settings"]) {
    setState((current) => ({ ...current, settings }));
  }

  function resetSuppressed() {
    setState((current) => ({ ...current, settings: { ...current.settings, suppressedKeys: [] } }));
  }

  async function resetProfile(profileId: DemoProfileId = state.activeProfileId) {
    const next = await resetDemoData(profileId);
    setState(next);
  }

  return (
    <AppStateContext.Provider
      value={{
        state,
        predictions,
        loading,
        handlePredictionAction,
        markShoppingItemBought,
        removeShoppingItem,
        removeCartItem,
        clearLists,
        updateSettings,
        resetSuppressed,
        resetProfile
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used inside AppStateProvider");
  return context;
}
