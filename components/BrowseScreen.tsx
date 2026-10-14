import { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, PressableFeedback } from 'heroui-native';
import { Search, X, Clock3, ArrowUpRight, SlidersHorizontal } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
  Easing,
} from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { colors as c } from '@/lib/theme';
import { apps, categories, filterApps, searchApps, estimate, type FeedCategory } from '@/lib/scout';
import { selection, useScout } from '@/lib/store';
import { Logo, Txt, AppCard, AppRow, DemoNotice, EmptyState, SectionHeading } from './ScoutUI';
const openSection = (name: FeedCategory) =>
  router.push({ pathname: '/explore', params: { category: name } });

export default function BrowseScreen({ explore = false }: { explore?: boolean }) {
  const inset = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const params = useLocalSearchParams<{
    category?: string;
    search?: string;
    keyword?: string;
    sort?: string;
  }>();
  const [searching, setSearching] = useState(
    explore || params.search === '1' || Boolean(params.keyword),
  );
  const [query, setQuery] = useState(params.keyword ?? '');
  const expansion = useSharedValue(searching ? 1 : 0);
  useEffect(() => {
    expansion.set(
      withTiming(searching ? 1 : 0, {
        duration: reduced ? 0 : 280,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [searching, expansion, reduced]);
  const [previousKeyword, setPreviousKeyword] = useState(params.keyword);
  if (params.keyword !== previousKeyword) {
    setPreviousKeyword(params.keyword);
    if (params.keyword) {
      setQuery(params.keyword);
      setSearching(true);
    }
  }
  const searchStyle = useAnimatedStyle(() => ({ width: 46 + (width - 90) * expansion.value }));
  const [category, setCategory] = useState<FeedCategory>(
    () => categories.find((cat) => cat === params.category) ?? 'Trending',
  );
  const [previousCategory, setPreviousCategory] = useState(params.category);
  if (params.category !== previousCategory) {
    setPreviousCategory(params.category);
    const routeCategory = categories.find((cat) => cat === params.category);
    if (routeCategory) setCategory(routeCategory);
  }
  const [sort, setSort] = useState(params.sort === 'revenue');
  const [previousSort, setPreviousSort] = useState(params.sort);
  if (params.sort !== previousSort) {
    setPreviousSort(params.sort);
    setSort(params.sort === 'revenue');
  }
  const recent = useScout((s) => s.recent);
  const addRecent = useScout((s) => s.addRecent);
  const clearRecent = useScout((s) => s.clearRecent);
  const filtered = filterApps(category);
  const matching = searchApps(query);
  const results = filtered.filter((a) => matching.some((f) => f.id === a.id));
  const handlePick = (value: string) => {
    setQuery(value);
    selection();
  };
  const shown = sort ? [...results].sort((a, b) => estimate(b).mid - estimate(a).mid) : results;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: inset.top + 16, paddingHorizontal: 22, paddingBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, height: 48 }}>
          {!searching && <Logo size={39} />}
          {searching ? (
            <Animated.View
              entering={FadeIn.duration(250)}
              exiting={FadeOut.duration(160)}
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: c.surface,
                  borderRadius: 25,
                  paddingLeft: 15,
                  overflow: 'hidden',
                },
                searchStyle,
              ]}
            >
              <View style={{ width: 19, flexShrink: 0 }}>
                <Search size={19} color={c.muted} />
              </View>
              <Input
                accessibilityLabel="Search demo apps and keywords"
                autoFocus={!explore}
                placeholder="Apps, games, keywords"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => {
                  if (query.trim()) addRecent(query.trim());
                }}
                returnKeyType="search"
                style={{
                  flexGrow: 1,
                  flexShrink: 1,
                  width: 0,
                  minWidth: 0,
                  height: 46,
                  backgroundColor: c.surface,
                  fontFamily: 'Inter_400Regular',
                  fontSize: 14,
                  borderRadius: 24,
                }}
              />
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                style={{ flexShrink: 0 }}
                onPress={() => {
                  setQuery('');
                  if (!explore) setSearching(false);
                }}
                accessibilityLabel={query ? 'Clear search' : 'Close search'}
              >
                <X size={18} color={c.muted} />
              </Button>
            </Animated.View>
          ) : (
            <>
              <View style={{ flex: 1 }} />
              <View
                style={{
                  backgroundColor: c.surface,
                  borderRadius: 20,
                  paddingHorizontal: 11,
                  paddingVertical: 6,
                }}
              >
                <Txt style={{ fontSize: 11, color: c.muted }}>Demo</Txt>
              </View>
              <Button
                isIconOnly
                variant="tertiary"
                onPress={() => setSearching(true)}
                accessibilityLabel="Search apps"
                className="bg-surface rounded-full"
              >
                <Search size={21} color={c.ink} />
              </Button>
            </>
          )}
        </View>
        {!searching && (
          <View style={{ marginTop: 26, marginBottom: 12 }}>
            <Txt style={{ fontFamily: 'Inter_700Bold', fontSize: 29, letterSpacing: -0.8 }}>
              Your next big idea.
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9 }}>
              <View
                style={{ height: 6, width: 6, borderRadius: 3, backgroundColor: c.moneyBright }}
              />
              <Txt style={{ color: c.muted, fontSize: 13 }}>Discover what apps could earn</Txt>
            </View>
          </View>
        )}
        {searching && <DemoNotice compact />}
        {searching && explore && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingTop: 8 }}
          >
            {categories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={cat === category ? 'primary' : 'tertiary'}
                className="rounded-full"
                onPress={() => {
                  setCategory(cat);
                  selection();
                }}
              >
                <Button.Label>{cat}</Button.Label>
              </Button>
            ))}
          </ScrollView>
        )}
      </View>
      {searching ? (
        <FlatList
          data={shown}
          keyExtractor={(a) => a.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: 120 }}
          ListHeaderComponent={
            query.trim() ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 22,
                }}
              >
                <Txt style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18 }}>
                  {shown.length} {shown.length === 1 ? 'result' : 'results'}
                </Txt>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    setSort(!sort);
                    selection();
                  }}
                >
                  <SlidersHorizontal size={14} color={c.accent} />
                  <Button.Label>{sort ? 'Revenue' : 'Relevant'}</Button.Label>
                </Button>
              </View>
            ) : (
              <View>
                {recent.length > 0 && (
                  <>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                      }}
                    >
                      <Txt style={{ fontSize: 19, fontFamily: 'Inter_600SemiBold' }}>
                        Recent searches
                      </Txt>
                      <Button variant="ghost" size="sm" onPress={clearRecent}>
                        <Button.Label>Clear</Button.Label>
                      </Button>
                    </View>
                    {recent.map((q) => (
                      <PressableFeedback
                        key={q}
                        onPress={() => handlePick(q)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 14,
                          gap: 12,
                        }}
                      >
                        <Clock3 size={17} color={c.muted} />
                        <Txt style={{ flex: 1 }}>{q}</Txt>
                        <ArrowUpRight size={17} color={c.muted} />
                      </PressableFeedback>
                    ))}
                  </>
                )}
                <Txt
                  style={{
                    fontSize: 20,
                    fontFamily: 'Inter_600SemiBold',
                    marginTop: 22,
                    marginBottom: 16,
                  }}
                >
                  Try a keyword
                </Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
                  {['focus', 'budget', 'puzzle', 'sleep', 'habit tracker', 'language learning'].map(
                    (q) => (
                      <Button
                        key={q}
                        variant="tertiary"
                        size="sm"
                        className="bg-surface rounded-full"
                        onPress={() => handlePick(q)}
                      >
                        <Button.Label>{q}</Button.Label>
                      </Button>
                    ),
                  )}
                </View>
                <Txt
                  style={{
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 20,
                    marginTop: 36,
                    marginBottom: 22,
                  }}
                >
                  Discover apps
                </Txt>
              </View>
            )
          }
          renderItem={({ item }) => (
            <AppRow
              app={item}
              onOpen={() => {
                if (query.trim()) addRecent(query.trim());
              }}
            />
          )}
          ListEmptyComponent={
            query.trim() ? (
              <EmptyState
                title="No demo apps match this search"
                action="Clear search"
                onPress={() => {
                  setQuery('');
                  setCategory('Trending');
                }}
              />
            ) : null
          }
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 125 }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 22, gap: 9, paddingBottom: 22 }}
          >
            {categories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={cat === category ? 'primary' : 'tertiary'}
                className={cat === category ? 'bg-accent rounded-full' : 'bg-surface rounded-full'}
                onPress={() => {
                  setCategory(cat);
                  selection();
                }}
              >
                <Button.Label>{cat}</Button.Label>
              </Button>
            ))}
          </ScrollView>
          <View style={{ paddingHorizontal: 22 }}>
            <SectionHeading
              title={
                category === 'Trending'
                  ? 'Rising this week'
                  : category === 'New'
                    ? 'New and earning'
                    : category === 'Rising'
                      ? 'On the rise'
                      : `${category} apps`
              }
              onPress={() => openSection(category === 'Trending' ? 'Rising' : category)}
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 22, gap: 18, paddingBottom: 12 }}
          >
            {(category === 'Trending'
              ? filterApps('Rising').filter((a) => estimate(a).mid >= 10000)
              : filtered
            )
              .slice(0, 5)
              .map((a) => (
                <AppCard key={a.id} app={a} />
              ))}
          </ScrollView>
          <View style={{ paddingHorizontal: 22, marginTop: 27 }}>
            <SectionHeading title="Made for momentum" onPress={() => openSection('Rising')} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 22, gap: 25 }}
          >
            {[filtered.slice(0, 3), filtered.slice(3, 6)]
              .filter((group) => group.length > 0)
              .map((group) => (
                <View
                  key={group.map((app) => app.id).join(':')}
                  style={{ width: Math.min(380, width - 44) }}
                >
                  {group.map((a) => (
                    <AppRow key={a.id} app={a} />
                  ))}
                </View>
              ))}
          </ScrollView>
          <View style={{ paddingHorizontal: 22, marginTop: 8 }}>
            <SectionHeading title="New and earning" onPress={() => openSection('New')} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 22, gap: 18, paddingBottom: 12 }}
          >
            {filterApps('New').map((a) => (
              <AppCard key={a.id} app={a} />
            ))}
          </ScrollView>
          <View style={{ paddingHorizontal: 22, marginTop: 28 }}>
            <SectionHeading
              title="Top earners"
              onPress={() =>
                router.push({
                  pathname: '/explore',
                  params: { sort: 'revenue', category: 'Trending' },
                })
              }
            />
            {[...apps]
              .sort((a, b) => estimate(b).mid - estimate(a).mid)
              .slice(0, 3)
              .map((a) => (
                <AppRow key={a.id} app={a} />
              ))}
            <DemoNotice />
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
