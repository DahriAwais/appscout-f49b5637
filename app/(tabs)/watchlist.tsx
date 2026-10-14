import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Bookmark } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useScout } from '@/lib/store';
import { apps } from '@/lib/scout';
import { colors as c } from '@/lib/theme';
import { Txt, AppRow, EmptyState, DemoNotice } from '@/components/ScoutUI';
export default function WatchlistScreen() {
  const watched = useScout((s) => s.watched);
  const inset = useSafeAreaInsets();
  const data = apps.filter((a) => watched.includes(a.id));
  return (
    <View style={{ flex: 1, backgroundColor: c.white, paddingTop: inset.top + 26 }}>
      <FlatList
        data={data}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 120 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 30 }}>
            <Txt style={{ fontSize: 29, fontFamily: 'Inter_700Bold', letterSpacing: -0.8 }}>
              Watchlist
            </Txt>
            <DemoNotice compact />
          </View>
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
