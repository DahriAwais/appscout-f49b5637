import { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  Share,
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Stack, Link, useLocalSearchParams, router } from 'expo-router';
import { PressableFeedback, Skeleton } from 'heroui-native';
import { GlassButton as Button } from '@/components/GlassControls';
import { AudienceQuality } from '@/components/EstimateVisuals';
import { RevenueHero } from '@/components/RevenueHero';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Info,
  Bookmark,
  Share2,
  Check,
  ExternalLink,
  TrendingUp,
  Sparkles,
  Activity,
  Download,
  Star,
  Calendar,
  RefreshCw,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { colors as c } from '@/lib/theme';
import { compact, money, dateLabel, ago, type ScoutApp, type Snapshot } from '@/lib/scout';
import { useRevenueScenario } from '@/lib/revenue';
import { RevenueAssumptions } from '@/components/RevenueAssumptions';
import { buildInsights, opportunityScore, ratingGrowth } from '@/lib/insights';
import { useScout } from '@/lib/store';
import {
  usePlayDetail,
  usePlayReviews,
  usePlaySection,
  useErrorFeedback,
  playRequest,
} from '@/lib/play-store';
import { Txt, AppIcon, AppCard, EmptyState, LoadingRows } from '@/components/ScoutUI';
import { InsightCard, Unavailable } from '@/components/InsightCard';
import { GrowthChart } from '@/components/GrowthChart';
import { ReviewInsights } from '@/components/ReviewInsights';
import { KeywordTable } from '@/components/KeywordTable';
import { ResearchSheet } from '@/components/ResearchSheet';
function Screenshot({
  uri,
  index,
  open,
}: {
  uri: string;
  index: number;
  open: (uri: string) => void;
}) {
  const [ratio, setRatio] = useState(0.56);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    Image.getSize(
      uri,
      (w, h) => {
        if (alive) setRatio(w / h);
      },
      () => {
        if (alive) setFailed(true);
      },
    );
    return () => {
      alive = false;
    };
  }, [uri]);
  const width = Math.min(200, Math.max(72, 132 * ratio));
  return (
    <PressableFeedback
      onPress={() => open(uri)}
      accessibilityLabel={`Open store screenshot ${index + 1}`}
      style={{
        width,
        height: 132,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: c.surface,
      }}
    >
      {failed ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Txt style={{ fontSize: 11, color: c.muted }}>Image unavailable</Txt>
        </View>
      ) : (
        <Image
          source={{ uri }}
          resizeMode="contain"
          onError={() => setFailed(true)}
          style={{ width, height: 132, resizeMode: 'contain' }}
        />
      )}
    </PressableFeedback>
  );
}
function QuickTake({ app, history }: { app: ScoutApp; history: Snapshot[] }) {
  const insights = buildInsights(app, history);
  const score = opportunityScore(app, history);
  const provisional = ratingGrowth(history) === null;
  return (
    <InsightCard
      title="Quick take"
      insight={
        score === null
          ? 'Install count and rating needed'
          : provisional
            ? 'Provisional score from public listing'
            : 'Heuristic score, not a revenue prediction'
      }
      detail={
        <Txt style={{ color: c.muted, lineHeight: 20 }}>
          Opportunity score is a public-data heuristic out of 10: 40% install-tier demand, 30%
          rating gap, and 30% observed ratings growth. Until 7 daily observations exist, the
          provisional score uses only installs and rating, with their weights normalized. A lower
          rating suggests unmet needs, not guaranteed demand.
        </Txt>
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 70, height: 70, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={70} height={70} style={{ position: 'absolute' }}>
            <Circle cx={35} cy={35} r={30} stroke={c.line} strokeWidth={5} fill="none" />
            {score !== null && (
              <Circle
                cx={35}
                cy={35}
                r={30}
                stroke={c.accent}
                strokeWidth={5}
                fill="none"
                strokeDasharray={`${(score / 10) * 188.5} 188.5`}
                rotation={-90}
                origin="35,35"
                strokeLinecap="round"
              />
            )}
          </Svg>
          <Txt style={{ fontSize: 22, fontFamily: 'Inter_700Bold', color: c.accent }}>
            {score?.toFixed(1) ?? '—'}
          </Txt>
        </View>
        <View style={{ flex: 1 }}>
          <Txt style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Opportunity score</Txt>
          <Txt style={{ color: c.muted, fontSize: 11, marginTop: 5 }}>
            {score === null ? 'Unavailable · /10' : provisional ? 'Provisional · /10' : 'Out of 10'}
          </Txt>
        </View>
      </View>
      <View style={{ gap: 10, marginTop: 12 }}>
        {insights.map((line) => {
          const Icon =
            line.badge === 'Rising'
              ? TrendingUp
              : line.badge === 'Opportunity'
                ? Sparkles
                : Activity;
          const tint =
            line.badge === 'Declining' ? c.red : line.badge === 'Rising' ? c.money : c.accent;
          return (
            <View key={line.text} style={{ gap: 5 }}>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <Icon size={13} color={tint} />
                <Txt style={{ fontSize: 11, color: tint, fontFamily: 'Inter_600SemiBold' }}>
                  {line.badge}
                </Txt>
              </View>
              <Txt numberOfLines={1} style={{ fontSize: 12 }}>
                {line.text}
              </Txt>
            </View>
          );
        })}
      </View>
    </InsightCard>
  );
}
function StatTiles({ app }: { app: ScoutApp }) {
  const stats = [
    {
      label: 'Installs',
      value: app.installs !== null ? `${compact(app.installs)}+` : '—',
      context: 'Cumulative lower bound',
      Icon: Download,
    },
    {
      label: 'Rating',
      value: app.rating?.toFixed(1) ?? '—',
      context: app.ratings !== null ? `${compact(app.ratings)} ratings` : 'Not listed',
      Icon: Star,
    },
    {
      label: 'Launched',
      value: app.launched
        ? new Date(app.launched).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : '—',
      context: ago(app.launched),
      Icon: Calendar,
    },
    {
      label: 'Updated',
      value: app.updated
        ? new Date(app.updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '—',
      context: ago(app.updated),
      Icon: RefreshCw,
    },
  ];
  return (
    <View style={{ gap: 8, marginBottom: 16 }}>
      {[stats.slice(0, 2), stats.slice(2)].map((row) => (
        <View key={row[0].label} style={{ flexDirection: 'row', gap: 10 }}>
          {row.map((s) => (
            <View
              key={s.label}
              style={{ flex: 1, borderRadius: 18, backgroundColor: c.surface, padding: 12 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <s.Icon size={14} color={c.accent} />
                <Txt style={{ color: c.muted, fontSize: 11 }}>{s.label}</Txt>
              </View>
              <Txt
                numberOfLines={1}
                style={{ fontSize: 17, fontFamily: 'Inter_600SemiBold', marginTop: 8 }}
              >
                {s.value}
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 }}>
                {s.label === 'Updated' &&
                app.updated &&
                Date.now() - app.updated < 14 * 86400000 ? (
                  <View
                    style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: c.money }}
                  />
                ) : null}
                <Txt numberOfLines={1} style={{ color: c.muted, fontSize: 11, flex: 1 }}>
                  {s.context}
                </Txt>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
function InstallMilestones({ app }: { app: ScoutApp }) {
  const tiers = [1000, 10000, 100000, 1000000, 10000000];
  const tier =
    app.installs === null ? -1 : tiers.reduce((v, t, i) => (app.installs! >= t ? i : v), -1);
  return (
    <InsightCard
      title="Install milestones"
      insight="A milestone forecast needs observed install growth"
      detail={
        <Txt style={{ color: c.muted, lineHeight: 20 }}>
          Google Play reports cumulative install tiers, not monthly downloads. The next milestone
          cannot be dated from a single observation.
        </Txt>
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
        {tiers.map((t, i) => (
          <View key={t} style={{ flex: 1, alignItems: 'center' }}>
            <View
              style={{ width: '100%', height: 4, backgroundColor: i <= tier ? c.accent : c.line }}
            />
            <View
              style={{
                position: 'absolute',
                top: -4,
                width: i === tier ? 13 : 8,
                height: i === tier ? 13 : 8,
                borderRadius: 7,
                backgroundColor: i <= tier ? c.accent : c.line,
                borderWidth: i === tier ? 2 : 0,
                borderColor: c.white,
              }}
            />
            <Txt style={{ fontSize: 11, color: i === tier ? c.accent : c.muted, marginTop: 13 }}>
              {compact(t)}
            </Txt>
          </View>
        ))}
      </View>
      <Txt style={{ fontSize: 12, color: c.muted, marginTop: 20 }}>
        {app.installs !== null
          ? `Current lower bound: ${compact(app.installs)}+`
          : 'Installs not listed'}
      </Txt>
    </InsightCard>
  );
}
function RevenueModel({ app }: { app: ScoutApp }) {
  const { result: rev, source } = useRevenueScenario(app);
  const chips = [
    { name: 'Free', on: app.free === true },
    { name: 'In-app purchases', on: app.offersIAP === true },
    { name: 'Subscription', on: false },
    { name: 'Ads', on: app.adSupported === true },
    { name: 'Paid', on: app.free === false },
  ];
  const prices =
    app.iapRange?.match(/[\d,]+\.\d{2}/g)?.map((n) => Number(n.replace(/,/g, ''))) ?? [];
  return (
    <InsightCard
      title="Revenue model"
      insight="Store labels show monetization, not earnings"
      detail={
        <Txt style={{ color: c.muted, lineHeight: 20 }}>
          Subscription is not confirmed by the public purchase flag. The stream split is modeled
          from assumptions, not observed revenue. IAP dots mark the published range endpoints, not
          individual products.
        </Txt>
      }
    >
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        {chips.map((p) => (
          <View
            key={p.name}
            style={{
              borderRadius: 14,
              paddingHorizontal: 10,
              paddingVertical: 7,
              backgroundColor: p.on ? c.accentSoft : c.surface,
            }}
          >
            <Txt numberOfLines={1} style={{ fontSize: 11, color: p.on ? c.accent : c.muted }}>
              {p.name}
            </Txt>
          </View>
        ))}
      </View>
      {rev && rev.mid > 0 ? (
        <>
          <View
            style={{
              flexDirection: 'row',
              height: 8,
              borderRadius: 4,
              overflow: 'hidden',
              marginTop: 20,
            }}
          >
            <View style={{ flex: rev.purchases, backgroundColor: c.money }} />
            <View style={{ flex: rev.ads, backgroundColor: c.moneyBright }} />
          </View>
          <Txt style={{ fontSize: 11, color: c.money, marginTop: 8 }}>
            {source === 'custom' ? 'Your scenario' : 'Automatic scenario'}: purchases{' '}
            {Math.round((rev.purchases / rev.mid) * 100)}% · ads{' '}
            {Math.round((rev.ads / rev.mid) * 100)}%
          </Txt>
        </>
      ) : (
        <Unavailable text="Create a scenario to model the stream split." />
      )}
      {!!app.iapRange && (
        <View style={{ marginTop: 10 }}>
          <Txt style={{ fontSize: 12, fontFamily: 'Inter_500Medium' }}>
            In-app purchase price range
          </Txt>
          {prices.length >= 2 && (
            <View style={{ height: 16, justifyContent: 'center', marginVertical: 10 }}>
              <View style={{ height: 3, backgroundColor: c.accentSoft }} />
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  width: 9,
                  height: 9,
                  borderRadius: 5,
                  backgroundColor: c.accent,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  right: 0,
                  width: 9,
                  height: 9,
                  borderRadius: 5,
                  backgroundColor: c.accent,
                }}
              />
            </View>
          )}
          <Txt style={{ color: c.muted, fontSize: 11, marginTop: 6 }}>{app.iapRange}</Txt>
        </View>
      )}
    </InsightCard>
  );
}
function Benchmarks({ app }: { app: ScoutApp }) {
  const [enabled, setEnabled] = useState(false);
  const result = useQuery({
    queryKey: ['play-benchmarks', app.id],
    queryFn: () =>
      playRequest<{
        ratingMedian: number | null;
        sampleSize: number;
        category: string;
        scope: string;
      }>({ action: 'benchmarks', id: app.id }),
    enabled,
  });
  useErrorFeedback(result.error);
  const median = result.data?.ratingMedian;
  return (
    <InsightCard
      title="Benchmarks"
      insight={
        result.data
          ? `Median of ${result.data.sampleSize} top-free app ratings · US`
          : 'Category-wide revenue & growth medians are unavailable'
      }
      detail={
        <Txt style={{ color: c.muted, lineHeight: 20 }}>
          A small top-free listing sample is not the full category. No revenue percentile,
          category-growth comparison or top-X% claim is made.
        </Txt>
      }
    >
      {!enabled ? (
        <Button variant="secondary" size="sm" onPress={() => setEnabled(true)}>
          <Button.Label>Compare public ratings</Button.Label>
        </Button>
      ) : result.isPending ? (
        <Skeleton className="h-20 w-full rounded-xl" />
      ) : result.isError ? (
        <EmptyState
          title="Could not load the category sample"
          action="Retry"
          onPress={() => void result.refetch()}
        />
      ) : (
        <View style={{ gap: 16 }}>
          <Txt style={{ fontSize: 12, fontFamily: 'Inter_500Medium' }}>
            Rating · app {app.rating?.toFixed(1) ?? '—'} / sample {median?.toFixed(1) ?? '—'}
          </Txt>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: c.accentSoft }}>
            {app.rating !== null && (
              <View
                style={{
                  height: 10,
                  borderRadius: 5,
                  width: `${(app.rating / 5) * 100}%`,
                  backgroundColor: c.accent,
                }}
              />
            )}
            {median !== null && median !== undefined && (
              <View
                style={{
                  position: 'absolute',
                  left: `${Math.min(99, (median / 5) * 100)}%`,
                  top: -5,
                  height: 20,
                  width: 2,
                  backgroundColor: c.ink,
                }}
              />
            )}
          </View>
        </View>
      )}
      <View style={{ gap: 10, marginTop: 20 }}>
        {['Est. monthly revenue', 'Growth'].map((label) => (
          <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt style={{ fontSize: 12, color: c.muted }}>{label}</Txt>
            <Txt style={{ fontSize: 11, color: c.muted }}>Not available</Txt>
          </View>
        ))}
      </View>
    </InsightCard>
  );
}
function UpdateActivity({ app, history }: { app: ScoutApp; history: Snapshot[] }) {
  const releases = history.filter(
    (h, i) => h.updated_at && (i === 0 || h.updated_at !== history[i - 1].updated_at),
  );
  const listed = app.updated ? { date: dateLabel(app.updated), version: app.version } : null;
  const insight = app.updated
    ? `Last updated ${ago(app.updated).toLowerCase()}`
    : 'Release dates not provided by the store';
  return (
    <InsightCard
      title="Update activity"
      insight={insight}
      detail={
        <Txt style={{ color: c.muted, lineHeight: 20 }}>
          {app.recentChanges || 'Release notes are not listed.'}
        </Txt>
      }
    >
      {releases.length > 1 ? (
        releases
          .slice(-5)
          .reverse()
          .map((r, i) => (
            <View key={r.day} style={{ flexDirection: 'row', gap: 12, paddingBottom: 16 }}>
              <View style={{ width: 10, alignItems: 'center' }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: c.accent,
                    marginTop: 5,
                  }}
                />
                {i < releases.length - 1 && (
                  <View style={{ width: 1, flex: 1, backgroundColor: c.line, marginTop: 5 }} />
                )}
              </View>
              <View>
                <Txt style={{ fontFamily: 'Inter_500Medium', fontSize: 12 }}>
                  {r.version ?? 'Release'}
                </Txt>
                <Txt style={{ fontSize: 11, color: c.muted, marginTop: 4 }}>
                  {dateLabel(r.updated_at)}
                </Txt>
              </View>
            </View>
          ))
      ) : listed ? (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent }} />
          <View>
            <Txt style={{ fontSize: 13, fontFamily: 'Inter_500Medium' }}>
              {listed.version ?? 'Latest release'}
            </Txt>
            <Txt style={{ fontSize: 11, color: c.muted, marginTop: 5 }}>{listed.date}</Txt>
          </View>
        </View>
      ) : (
        <Unavailable text="No release date listed." />
      )}
      <Txt style={{ color: c.muted, fontSize: 11, marginTop: 16 }}>
        Full release history is not public.
      </Txt>
    </InsightCard>
  );
}
function OtherApps({ id, kind }: { id: string; kind: 'developer' | 'similar' }) {
  const result = usePlaySection(kind, id);
  const apps = result.data?.apps ?? [];
  return (
    <>
      {result.isPending ? (
        <LoadingRows />
      ) : result.isError || result.data?.error ? (
        <EmptyState
          title={`Could not load ${kind === 'developer' ? 'developer' : 'similar'} apps`}
          action="Retry"
          onPress={() => void result.refetch()}
        />
      ) : !apps.length ? (
        <EmptyState
          title={
            kind === 'developer'
              ? 'No other apps returned for this developer'
              : 'No similar apps returned'
          }
          action="Refresh"
          onPress={() => void result.refetch()}
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 14 }}
        >
          {apps.map((a) => (
            <AppCard key={a.id} app={a} />
          ))}
        </ScrollView>
      )}
    </>
  );
}
export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = usePlayDetail(id);
  const reviews = usePlayReviews(id);
  const app = detail.data?.app;
  const history = detail.data?.history ?? [];
  const watched = useScout((s) => s.watched);
  const toggle = useScout((s) => s.toggleWatch);
  const remember = useScout((s) => s.rememberApp);
  const { result: rev, source, inputs } = useRevenueScenario(app);
  const saved = watched.includes(id);
  const inset = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [compactHeader, setCompactHeader] = useState(false);
  const [sheet, setSheet] = useState<'estimate' | 'screenshot' | null>(null);
  const [image, setImage] = useState('');
  useEffect(() => {
    if (app) remember(app);
  }, [app, remember]);
  const info = () => setSheet('estimate');
  const refresh = () => void detail.refetch();
  const share = async () => {
    if (!app) return;
    try {
      await Share.share({ message: `${app.name} on Google Play\n${app.url}`, url: app.url });
    } catch {
      Alert.alert('Could not share', 'Please try again.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: compactHeader && app ? app.name : 'App research',
          headerRight: () =>
            compactHeader ? (
              <Button size="sm" variant="ghost" onPress={info} accessibilityLabel="How we estimate">
                <Button.Label style={{ color: rev ? c.money : c.muted, fontSize: 11 }}>
                  {rev ? `${money(rev.low)} – ${money(rev.high)}/mo est.` : 'Est. —'}
                </Button.Label>
                <Info size={12} color={c.accent} />
              </Button>
            ) : (
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={refresh}
                isDisabled={detail.isFetching}
                accessibilityLabel="Refresh app data"
              >
                <RefreshCw size={18} color={c.accent} />
              </Button>
            ),
        }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={32}
        onScroll={(e) => {
          const next = e.nativeEvent.contentOffset.y > 160;
          if (next !== compactHeader) setCompactHeader(next);
        }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
      >
        {!router.canGoBack() && (
          <Link href="/explore" style={{ color: c.accent, fontSize: 12, marginBottom: 14 }}>
            Browse apps
          </Link>
        )}
        {detail.isPending ? (
          <>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Skeleton className="h-12 w-12 rounded-xl" />
              <View style={{ flex: 1, gap: 10 }}>
                <Skeleton className="h-6 w-full rounded-md" />
                <Skeleton className="h-3 w-2/3 rounded-md" />
              </View>
            </View>
            <Skeleton className="mt-4 h-32 w-full rounded-3xl" />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <Skeleton className="h-32 flex-1 rounded-2xl" />
              <Skeleton className="h-32 flex-1 rounded-2xl" />
              <Skeleton className="h-32 flex-1 rounded-2xl" />
            </View>
            <LoadingRows />
          </>
        ) : !app ? (
          <EmptyState
            title="Could not load this Google Play app"
            action="Try again"
            onPress={refresh}
          />
        ) : (
          <>
            {detail.isError && (
              <Button
                size="sm"
                isDisabled={detail.isFetching}
                onPress={refresh}
                style={{ marginBottom: 12 }}
              >
                <Button.Label>Could not refresh · Retry</Button.Label>
              </Button>
            )}
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12 }}>
              <AppIcon app={app} size={48} />
              <View style={{ flex: 1 }}>
                <Txt
                  style={{
                    fontSize: 18,
                    lineHeight: 24,
                    fontFamily: 'Inter_700Bold',
                    letterSpacing: -0.5,
                  }}
                >
                  {app.name}
                </Txt>
                <PressableFeedback
                  onPress={() =>
                    router.push({ pathname: '/explore', params: { keyword: app.developer } })
                  }
                  accessibilityLabel={`Search apps by ${app.developer}`}
                  style={{ minHeight: 32, justifyContent: 'center' }}
                >
                  <Txt style={{ fontSize: 12, color: c.accent }}>{app.developer}</Txt>
                </PressableFeedback>
                <Txt style={{ color: c.muted, fontSize: 11 }}>{app.category ?? 'Google Play'}</Txt>
              </View>
            </View>
            <RevenueHero
              result={rev}
              app={app}
              reviews={reviews.data?.reviews}
              reviewError={Boolean(reviews.error || reviews.data?.error)}
              onRetryReviews={() => void reviews.refetch()}
              onInfo={info}
              onOpen={() => router.push({ pathname: '/estimation/[id]', params: { id } })}
            />
            <AudienceQuality app={app} />
            {app.screenshots.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0, flexShrink: 0, height: 140 }}
                contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
              >
                {[...new Set(app.screenshots)].map((uri, i) => (
                  <Screenshot
                    key={uri}
                    uri={uri}
                    index={i}
                    open={(screenshotUri) => {
                      setImage(screenshotUri);
                      setSheet('screenshot');
                    }}
                  />
                ))}
              </ScrollView>
            ) : (
              <Unavailable text="No screenshots returned by the store." />
            )}
            <Txt style={{ fontSize: 11, color: c.muted, marginTop: 9, marginBottom: 18 }}>
              Store screenshots · US listing
            </Txt>
            <QuickTake app={app} history={history} />
            <StatTiles app={app} />
            <GrowthChart
              history={history}
              historyError={detail.data?.historyError ?? null}
              retry={refresh}
            />
            <InstallMilestones app={app} />
            <RevenueModel app={app} />
            <ReviewInsights app={app} />
            <KeywordTable id={id} />
            <Benchmarks app={app} />
            <UpdateActivity app={app} history={history} />
            <InsightCard
              title="Developer"
              insight="Combined developer revenue is not publicly available"
              detail={
                <Txt style={{ color: c.muted, lineHeight: 20 }}>
                  This carousel is a sample of this developer’s public apps. No combined revenue or
                  concentration percentage is inferred from store metadata.
                </Txt>
              }
            >
              <Txt style={{ fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 16 }}>
                {app.developer}
              </Txt>
              <OtherApps id={id} kind="developer" />
            </InsightCard>
            <InsightCard title="Similar apps" insight="Similar listings returned by Google Play">
              <OtherApps id={id} kind="similar" />
            </InsightCard>
            <InsightCard
              title="About this app"
              insight={app.tagline || 'Description from Google Play'}
              detail={<Txt style={{ color: c.muted, lineHeight: 21 }}>{app.description}</Txt>}
            >
              <Txt numberOfLines={4} style={{ fontSize: 12, color: c.muted, lineHeight: 21 }}>
                {app.description}
              </Txt>
            </InsightCard>
            <PressableFeedback
              accessibilityRole="link"
              onPress={() => void Linking.openURL(app.url)}
              style={{ marginVertical: 12 }}
            >
              <Txt style={{ color: c.accent, fontSize: 12 }}>
                View on Google Play <ExternalLink size={12} color={c.accent} />
              </Txt>
            </PressableFeedback>
            <Txt style={{ color: c.muted, fontSize: 11, lineHeight: 18 }}>
              Fetched {new Date(app.fetchedAt).toLocaleString('en-US')} · US · English. Refreshes
              may use a cache of up to 5 minutes.
            </Txt>
          </>
        )}
      </ScrollView>
      {app && (
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: Math.max(inset.bottom, 12),
            backgroundColor: c.white,
            borderTopWidth: 1,
            borderColor: c.line,
          }}
        >
          <Button
            variant={saved ? 'secondary' : 'primary'}
            onPress={() => {
              remember(app);
              toggle(id);
            }}
            style={{ flex: 1 }}
          >
            {saved ? (
              <Animated.View
                key="check"
                entering={FadeIn.duration(180)}
                exiting={FadeOut.duration(100)}
              >
                <Check size={18} color={c.accent} />
              </Animated.View>
            ) : (
              <Bookmark size={18} color={c.accent} />
            )}
            <Button.Label>{saved ? 'Added' : 'Add to watchlist'}</Button.Label>
          </Button>
          <Button
            isIconOnly
            variant="tertiary"
            onPress={() => void share()}
            accessibilityLabel="Share this app"
          >
            <Share2 size={19} color={c.accent} />
          </Button>
        </View>
      )}
      <ResearchSheet
        title={sheet === 'screenshot' ? 'Store screenshot' : 'How we estimate'}
        open={sheet !== null}
        onClose={() => setSheet(null)}
      >
        {sheet === 'screenshot' ? (
          <Image
            source={{ uri: image }}
            resizeMode="contain"
            style={{ width: width - 48, height: height * 0.54 }}
          />
        ) : (
          <View style={{ gap: 16 }}>
            {app && <RevenueAssumptions app={app} inputs={inputs} custom={source === 'custom'} />}
            <Txt style={{ lineHeight: 22 }}>
              Actual revenue is private. Public store installs, ratings and prices cannot prove MRR.
            </Txt>
            <Txt style={{ color: c.muted, lineHeight: 22 }}>
              Monthly active users × paying share × monthly spend, plus ad impressions ÷ 1,000 ×
              eCPM. The range varies assumed active users only; real uncertainty can be wider.
            </Txt>
            <Txt style={{ color: c.muted, lineHeight: 22 }}>
              These are explicit assumptions with low confidence, not verified earnings or a
              statistical confidence interval. Ads and one-time purchases are monthly revenue, not
              subscription MRR.
            </Txt>
            <Button
              variant="secondary"
              onPress={() => {
                setSheet(null);
                router.push('/methodology');
              }}
            >
              <Button.Label>Full methodology</Button.Label>
            </Button>
          </View>
        )}
      </ResearchSheet>
    </KeyboardAvoidingView>
  );
}
