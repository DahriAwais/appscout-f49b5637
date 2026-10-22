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
  feeds: Record<string, { apps: ScoutApp[]; fetchedAt: string; country: string }>;
  rememberApps: (apps: ScoutApp[]) => void;
  rememberFeed: (
    key: string,
    feed: { apps: ScoutApp[]; fetchedAt: string; country: string },
  ) => void;
  scenarios: Record<string, { mid: number; inputs: Scenario; feePercent?: number }>;
  rememberApp: (app: ScoutApp) => void;
  saveScenario: (id: string, inputs: Scenario, mid: number, feePercent?: number) => void;
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
      feeds: {},
      rememberApps: (apps) =>
        set((s) => ({
          savedApps: { ...s.savedApps, ...Object.fromEntries(apps.map((a) => [a.id, a])) },
        })),
      rememberFeed: (key, feed) => set((s) => ({ feeds: { ...s.feeds, [key]: feed } })),
      scenarios: {},
      rememberApp: (app) => set((s) => ({ savedApps: { ...s.savedApps, [app.id]: app } })),
      saveScenario: (id, inputs, mid, feePercent) => {
        set((s) => ({ scenarios: { ...s.scenarios, [id]: { mid, inputs, feePercent } } }));
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
