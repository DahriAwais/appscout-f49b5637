import { useEffect } from 'react';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import BrowseScreen from '@/components/BrowseScreen';
import { useScout } from '@/lib/store';
export default function HomeScreen() {
  const onboarded = useScout((s) => s.onboarded);
  const pathname = usePathname();
  const { browse } = useLocalSearchParams<{ browse?: string }>();
  useEffect(() => {
    const check = (completed: boolean) => {
      if (!completed && browse !== '1' && pathname === '/') router.replace('/onboarding');
    };
    if (useScout.persist.hasHydrated()) check(onboarded);
    return useScout.persist.onFinishHydration((state) => check(state.onboarded));
  }, [onboarded, browse, pathname]);
  return <BrowseScreen />;
}
