import { useEffect, useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from 'heroui-native';
import { GlassButton as Button } from './GlassControls';
import { Search, X, RefreshCw, WifiOff } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors as c } from '@/lib/theme';
import { categories, type FeedCategory } from '@/lib/scout';
import { selection, useScout } from '@/lib/store';
import { usePlayList } from '@/lib/play-store';
import { GlassChip } from './GlassControls';
import {
  Logo,
  Txt,
  AppCard,
  AppRow,
  SourceNotice,
  EmptyState,
  SectionHeading,
  LoadingRows,
} from './ScoutUI';
export default function BrowseScreen({ explore = false }: { explore?: boolean }) {
  const inset = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string; keyword?: string; search?: string }>();
  const [searching, setSearching] = useState(explore || params.search === '1');
  const [query, setQuery] = useState(params.keyword ?? '');
  const [term, setTerm] = useState(query);
  const [category, setCategory] = useState<FeedCategory>(
    categories.find((x) => x === params.category) ?? 'All',
  );
  const recent = useScout((s) => s.recent);
  const addRecent = useScout((s) => s.addRecent);
  useEffect(() => {
    const timer = setTimeout(() => setTerm(query), 550);
    return () => clearTimeout(timer);
  }, [query]);
  const [previousKeyword, setPreviousKeyword] = useState(params.keyword);
  if (params.keyword !== previousKeyword) {
    setPreviousKeyword(params.keyword);
    if (params.keyword) {
      setQuery(params.keyword);
      setSearching(true);
    }
  }
  const feed = usePlayList(term.trim() ? 'All' : category, term);
  const data = feed.data?.apps ?? [];
  const shown = data;
  const refresh = () => {
    void feed.refetch();
  };
  const selectTerm = (q: string) => {
    setQuery(q);
    setSearching(true);
    addRecent(q);
    selection();
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: inset.top + 6, paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}>
          {!searching && <Logo size={30} />}
          {searching ? (
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 24,
                backgroundColor: c.surface,
                paddingLeft: 13,
              }}
            >
              <Search size={18} color={c.accent} />
              <Input
                accessibilityLabel="Search Google Play apps"
                placeholder="Search apps, games, keywords"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => {
                  setTerm(query);
                  if (query.trim()) addRecent(query.trim());
                }}
                returnKeyType="search"
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: 44,
                  backgroundColor: c.surface,
                  fontSize: 13,
                  borderRadius: 24,
                }}
              />
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={() => {
                  setQuery('');
                  if (!explore) setSearching(false);
                }}
                accessibilityLabel="Clear search"
              >
                <X size={18} color={c.muted} />
              </Button>
            </View>
          ) : (
            <>
              <View style={{ flex: 1 }} />
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={refresh}
                isDisabled={feed.isFetching}
                accessibilityLabel="Refresh store apps"
              >
                <RefreshCw size={18} color={c.accent} />
              </Button>
              <Button
                isIconOnly
                variant="tertiary"
                size="sm"
                onPress={() => setSearching(true)}
                accessibilityLabel="Search apps"
              >
                <Search size={19} color={c.accent} />
              </Button>
            </>
          )}
        </View>
        {!searching && (
          <Txt
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 22,
              letterSpacing: -0.7,
              marginTop: 14,
              marginBottom: 4,
            }}
          >
            Find your next big idea.
          </Txt>
        )}
        <SourceNotice />
        {!searching && (
          <Txt style={{ color: c.money, fontSize: 11, marginBottom: 6 }}>
            Estimated by AppScout · monthly revenue
          </Txt>
        )}
        {feed.metadataError ? (
          <Button size="sm" onPress={refresh} isDisabled={feed.metadataPending}>
            <Button.Label>
              {feed.metadataPending ? 'Retrying…' : 'Retry missing estimates'}
            </Button.Label>
          </Button>
        ) : null}
        {!query.trim() && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingVertical: 5 }}
          >
            {categories.map((cat) => (
              <GlassChip
                key={cat}
                label={cat}
                selected={cat === category}
                onPress={() => {
                  if (cat !== category) {
                    setCategory(cat);
                    selection();
                  }
                }}
              />
            ))}
          </ScrollView>
        )}
      </View>
      {searching ? (
        <FlatList
          data={feed.isPending || feed.isError ? [] : shown}
          keyExtractor={(a) => a.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: Math.max(inset.bottom, 12) + 86,
          }}
          ListHeaderComponent={
            <View>
              {!query && recent.length > 0 && (
                <View style={{ marginVertical: 10 }}>
                  <Txt style={{ fontFamily: 'Inter_600SemiBold', marginBottom: 8 }}>
                    Recent searches
                  </Txt>
                  <ScrollView
                    horizontal
                    contentContainerStyle={{ gap: 6 }}
                    showsHorizontalScrollIndicator={false}
                  >
                    {recent.map((q) => (
                      <Button key={q} size="sm" variant="secondary" onPress={() => selectTerm(q)}>
                        <Button.Label numberOfLines={1}>{q}</Button.Label>
                      </Button>
                    ))}
                  </ScrollView>
                </View>
              )}
              <Txt style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, marginVertical: 10 }}>
                {term ? `Results for “${term}”` : 'Popular on Google Play'}
              </Txt>
            </View>
          }
          renderItem={({ item }) => (
            <AppRow
              app={item}
              onOpen={() => {
                if (term) addRecent(term);
              }}
            />
          )}
          ListEmptyComponent={
            feed.isPending ? (
              <LoadingRows />
            ) : feed.isError ? (
              <EmptyState
                icon={WifiOff}
                title="Could not load Google Play apps"
                action="Try again"
                onPress={refresh}
              />
            ) : (
              <EmptyState
                title="No apps match this search"
                action="Clear search & filters"
                onPress={() => {
                  setQuery('');
                  setCategory('All');
                  selection();
                }}
              />
            )
          }
          refreshing={feed.isFetching && !feed.isPending}
          onRefresh={refresh}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: Math.max(inset.bottom, 12) + 86 }}
        >
          {feed.isPending ? (
            <View style={{ paddingHorizontal: 16 }}>
              <LoadingRows />
            </View>
          ) : feed.isError ? (
            <EmptyState
              icon={WifiOff}
              title="Could not load Google Play apps"
              action="Try again"
              onPress={refresh}
            />
          ) : !data.length ? (
            <EmptyState
              title="No apps in this category"
              action="Show all apps"
              onPress={() => {
                setCategory('All');
                selection();
              }}
            />
          ) : (
            <>
              <View style={{ paddingHorizontal: 16 }}>
                <SectionHeading
                  title={category === 'All' ? 'Popular right now' : category}
                  onPress={() => router.push({ pathname: '/explore', params: { category } })}
                />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
              >
                {data.slice(0, 12).map((app) => (
                  <AppCard key={app.id} app={app} />
                ))}
              </ScrollView>
              <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
                <SectionHeading title="More to explore" />
                {data.slice(12).map((app) => (
                  <AppRow key={app.id} app={app} />
                ))}
              </View>
              <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
                <Txt style={{ fontSize: 11, color: c.muted, lineHeight: 17 }}>
                  Google Play listings · revenue scenarios use assumptions, not reported earnings.
                </Txt>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
