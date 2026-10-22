import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { Input, Label } from 'heroui-native';
import { GlassButton as Button } from './GlassControls';
import { Plus, Hash, Trash2 } from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAsyncStorage } from '@/hooks/useAsyncStorage';
import { playRequest, useErrorFeedback } from '@/lib/play-store';
import { colors as c } from '@/lib/theme';
import { success } from '@/lib/store';
import { Txt, EmptyState } from './ScoutUI';
import { InsightCard } from './InsightCard';
interface TrackedKeyword {
  term: string;
  observations: { rank: number | null; at: string }[];
}
const EMPTY_KEYWORDS: TrackedKeyword[] = [];
export function KeywordTable({ id }: { id: string }) {
  const [tracked, setTracked, , loading] = useAsyncStorage<TrackedKeyword[]>(
    `play-keywords-${id}`,
    EMPTY_KEYWORDS,
  );
  const data = tracked ?? [];
  const [term, setTerm] = useState('');
  const [validation, setValidation] = useState('');
  const measure = useMutation({
    mutationFn: (terms: string[]) =>
      playRequest<{ ranks: { term: string; rank: number | null }[]; fetchedAt: string }>({
        action: 'keywords',
        id,
        terms,
      }),
    onSuccess: async (result) => {
      const current = data;
      const next = result.ranks.map((r) => ({
        term: r.term,
        observations: [
          ...(current.find((k) => k.term === r.term)?.observations ?? []),
          { rank: r.rank, at: result.fetchedAt },
        ].slice(-30),
      }));
      await setTracked(next);
      setTerm('');
      success();
    },
  });
  useErrorFeedback(measure.error);
  const add = () => {
    const q = term.trim();
    if (
      !q ||
      q.length > 60 ||
      data.length >= 5 ||
      data.some((k) => k.term.toLowerCase() === q.toLowerCase())
    ) {
      setValidation('Add a unique keyword (60 characters max), up to 5.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setValidation('');
    measure.mutate([...data.map((k) => k.term), q]);
  };
  return (
    <InsightCard
      title="Tracked keywords"
      insight="Live search positions · US · top 50 results"
      detail={
        <Txt style={{ color: c.muted, lineHeight: 20 }}>
          Ranks are observed search positions, not personalized rankings. Google Play results vary
          by country and device. Changes compare your saved checks; difficulty needs search-volume
          and competitor data and is not inferred.
        </Txt>
      }
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <Txt style={{ color: c.muted }}>Loading keywords…</Txt>
        ) : !data.length ? (
          <EmptyState
            icon={Hash}
            title="Track keywords to measure search positions"
            action="Start tracking"
            onPress={() => {
              setValidation('Enter your first keyword below.');
            }}
          />
        ) : (
          <View>
            <View style={{ flexDirection: 'row', gap: 6, paddingBottom: 10 }}>
              <Txt style={{ flex: 1, fontSize: 11, color: c.muted }}>Keyword</Txt>
              <Txt style={{ width: 40, fontSize: 11, color: c.muted }}>Rank</Txt>
              <Txt style={{ width: 40, fontSize: 11, color: c.muted }}>Trend</Txt>
              <Txt style={{ width: 38, fontSize: 11, color: c.muted }}>Level</Txt>
              <View style={{ width: 30 }} />
            </View>
            {data.map((k) => {
              const last = k.observations.at(-1);
              const prev = k.observations.at(-2);
              const change = last?.rank && prev?.rank ? prev.rank - last.rank : null;
              const ranks = k.observations.flatMap((o) => (o.rank !== null ? [o.rank] : []));
              const path = ranks
                .map(
                  (r, i) =>
                    `${i ? 'L' : 'M'}${(i / (ranks.length - 1)) * 36},${2 + ((r - 1) / 49) * 20}`,
                )
                .join(' ');
              return (
                <Animated.View
                  key={k.term}
                  entering={FadeIn}
                  exiting={FadeOut}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 12,
                    borderTopWidth: 1,
                    borderColor: c.line,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Txt numberOfLines={1} style={{ fontSize: 12, fontFamily: 'Inter_500Medium' }}>
                      {k.term}
                    </Txt>
                    <Txt
                      style={{
                        fontSize: 11,
                        color:
                          change !== null && change < 0
                            ? c.red
                            : change !== null && change > 0
                              ? c.money
                              : c.muted,
                        marginTop: 4,
                      }}
                    >
                      {change === null
                        ? 'First check'
                        : change === 0
                          ? 'No change'
                          : `${change > 0 ? '+' : ''}${change}`}
                    </Txt>
                  </View>
                  <Txt style={{ width: 40, fontSize: 12, color: c.accent }}>
                    {last?.rank ? `#${last.rank}` : '>50'}
                  </Txt>
                  <View style={{ width: 40 }}>
                    {ranks.length >= 2 ? (
                      <Svg width={38} height={24}>
                        <Path d={path} fill="none" stroke={c.accent} strokeWidth={2} />
                      </Svg>
                    ) : (
                      <Txt style={{ color: c.muted, fontSize: 11 }}>—</Txt>
                    )}
                  </View>
                  <Txt style={{ width: 38, color: c.muted, fontSize: 11 }}>—</Txt>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    onPress={() => {
                      void setTracked(data.filter((t) => t.term !== k.term));
                      success();
                    }}
                    accessibilityLabel={`Remove ${k.term}`}
                  >
                    <Trash2 size={13} color={c.accent} />
                  </Button>
                </Animated.View>
              );
            })}
          </View>
        )}
        <View style={{ gap: 8, marginTop: 12 }}>
          <Label>Keyword</Label>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Input
              value={term}
              onChangeText={setTerm}
              placeholder="e.g. habit tracker"
              accessibilityLabel="Keyword to track"
              maxLength={60}
              onSubmitEditing={add}
              style={{ flex: 1, minWidth: 0, fontSize: 12 }}
            />
            <Button
              isIconOnly
              onPress={add}
              isDisabled={measure.isPending || loading || data.length >= 5}
              accessibilityLabel="Add and measure keyword"
            >
              <Plus size={18} color={c.white} />
            </Button>
          </View>
        </View>
        {validation.length > 0 && (
          <Txt style={{ color: c.muted, fontSize: 11, lineHeight: 18, marginTop: 8 }}>
            {validation}
          </Txt>
        )}
        {measure.isError && (
          <Button
            variant="secondary"
            size="sm"
            onPress={() => measure.mutate(data.length ? data.map((k) => k.term) : [term.trim()])}
          >
            <Button.Label>Could not check ranks · Retry</Button.Label>
          </Button>
        )}
        {data.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onPress={() => measure.mutate(data.map((k) => k.term))}
            isDisabled={measure.isPending}
            style={{ marginTop: 8 }}
          >
            <Button.Label>{measure.isPending ? 'Checking ranks…' : 'Refresh ranks'}</Button.Label>
          </Button>
        )}
        {measure.isPending && !data.length && (
          <Txt style={{ color: c.accent, marginTop: 10, fontSize: 12 }}>Checking Google Play…</Txt>
        )}
      </KeyboardAvoidingView>
    </InsightCard>
  );
}
