import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as Haptics from 'expo-haptics';
import type { ScoutApp, Scenario } from './scout';
export const selection = () => {
  void Haptics.selectionAsync();
};
export const success = () => {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};
interface ScoutState {
  onboarded: boolean;
  watched: string[];
  recent: string[];
  savedApps: Record<string, ScoutApp>;
  scenarios: Record<string, { mid: number; inputs: Scenario }>;
  rememberApp: (app: ScoutApp) => void;
  saveScenario: (id: string, inputs: Scenario, mid: number) => void;
  completeOnboarding: () => void;
  toggleWatch: (id: string) => void;
  addRecent: (query: string) => void;
  clearRecent: () => void;
}
export const useScout = create<ScoutState>()(
  persist(
    (set) => ({
      onboarded: false,
      watched: [],
      recent: [],
      savedApps: {},
      scenarios: {},
      rememberApp: (app) => set((s) => ({ savedApps: { ...s.savedApps, [app.id]: app } })),
      saveScenario: (id, inputs, mid) => {
        set((s) => ({ scenarios: { ...s.scenarios, [id]: { mid, inputs } } }));
        success();
      },
      completeOnboarding: () => set({ onboarded: true }),
      toggleWatch: (id) => {
        set((s) => ({
          watched: s.watched.includes(id) ? s.watched.filter((x) => x !== id) : [...s.watched, id],
        }));
        success();
      },
      addRecent: (query) =>
        set((s) => ({ recent: [query, ...s.recent.filter((x) => x !== query)].slice(0, 6) })),
      clearRecent: () => {
        set({ recent: [] });
        success();
      },
    }),
    { name: 'appscout-live-v2', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
