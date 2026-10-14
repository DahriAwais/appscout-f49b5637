import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as Haptics from 'expo-haptics';
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
    { name: 'appscout-device-v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
