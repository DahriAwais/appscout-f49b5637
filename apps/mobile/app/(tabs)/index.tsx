import { useEffect } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams, useIsFocused } from 'expo-router';
import BrowseScreen from '@/components/BrowseScreen';
import { useScout } from '@/lib/store';
import { useScoutHydrated } from '@/lib/useScoutHydrated';
import { colors as c } from '@/lib/theme';
export default function HomeScreen() {
  const onboarded = useScout((s) => s.onboarded);
  const hydrated = useScoutHydrated();
  const focused = useIsFocused();
  const { browse } = useLocalSearchParams<{ browse?: string }>();
  useEffect(() => {
    if (focused && hydrated && !onboarded && browse !== '1') router.replace('/onboarding');
  }, [focused, hydrated, onboarded, browse]);
  if (!hydrated || (!onboarded && browse !== '1'))
    return <View style={{ flex: 1, backgroundColor: c.white }} />;
  return <BrowseScreen />;
}
