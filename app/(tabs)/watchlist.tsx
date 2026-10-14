import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Bookmark } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useScout } from '@/lib/store';
import { colors as c } from '@/lib/theme';
import { Txt, AppRow, EmptyState } from '@/components/ScoutUI';
export default function WatchlistScreen() {
  const watched = useScout((s) => s.watched);
  const savedApps = useScout((s) => s.savedApps);
  const inset = useSafeAreaInsets();
  const data = watched.flatMap((id) => (savedApps[id] ? [savedApps[id]] : []));
  return (
    <View style={{ flex: 1, backgroundColor: c.white, paddingTop: inset.top + 18 }}>
      <FlatList
        data={data}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110 }}
        ListHeaderComponent={
          <Txt style={{ fontSize: 25, fontFamily: 'Inter_700Bold', marginBottom: 22 }}>
            Watchlist
          </Txt>
        }
        renderItem={({ item }) => (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <AppRow app={item} removable />
          </Animated.View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={Bookmark}
            title="Save apps to research later"
            action="Explore apps"
            onPress={() => router.push('/explore')}
          />
        }
      />
    </View>
  );
}
