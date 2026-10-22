import { View } from 'react-native';
import { LoadingSkeleton as Skeleton } from './LoadingSkeleton';
import { GlassButton as Button } from './GlassControls';
import { MessageSquare } from 'lucide-react-native';
import { colors as c } from '@/lib/theme';
import { compact, dateLabel, type ScoutApp } from '@/lib/scout';
import { reviewTopics } from '@/lib/insights';
import { usePlayReviews } from '@/lib/play-store';
import { Txt, EmptyState } from './ScoutUI';
import { InsightCard, Unavailable } from './InsightCard';
export function ReviewInsights({ app }: { app: ScoutApp }) {
  const query = usePlayReviews(app.id);
  const reviews = query.data?.reviews ?? [];
  const failed = query.isError || query.data?.error;
  const positive = reviews.filter((r) => r.score >= 4).length;
  const neutral = reviews.filter((r) => r.score === 3).length;
  const negative = reviews.filter((r) => r.score <= 2).length;
  const groups = [
    { name: 'Positive', value: positive, color: c.accent },
    { name: 'Neutral', value: neutral, color: c.line },
    { name: 'Negative', value: negative, color: c.accentSoft },
  ];
  const hist = app.histogram;
  const max = Math.max(...Object.values(hist ?? {}), 1);
  const quotes = [reviews.find((r) => r.score >= 4), reviews.find((r) => r.score <= 2)].filter(
    (r) => r !== undefined,
  );
  if (!quotes.length && reviews[0]) quotes.push(reviews[0]);
  return (
    <InsightCard
      title="Ratings & reviews"
      insight={
        reviews.length
          ? `${positive} of ${reviews.length} sampled reviews rated 4–5 stars`
          : 'Public star ratings, not a complete review analysis'
      }
      detail={
        <Txt style={{ color: c.muted, lineHeight: 20 }}>
          Sentiment is a star-score proxy: 4–5 positive, 3 neutral, 1–2 negative. Topic bars use
          keyword matching within each sampled group and can overlap. This is a small
          newest-English-review sample, not all users.
        </Txt>
      }
    >
      {hist ? (
        <View style={{ gap: 7 }}>
          {[5, 4, 3, 2, 1].map((star) => (
            <View key={star} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Txt style={{ fontSize: 11, width: 9, color: c.muted }}>{star}</Txt>
              <View style={{ flex: 1, height: 7, borderRadius: 4, backgroundColor: c.surface }}>
                <View
                  style={{
                    width: `${((hist[String(star)] ?? 0) / max) * 100}%`,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: c.accent,
                  }}
                />
              </View>
              <Txt style={{ fontSize: 11, color: c.muted, width: 45, textAlign: 'right' }}>
                {compact(hist[String(star)] ?? 0)}
              </Txt>
            </View>
          ))}
        </View>
      ) : (
        <Unavailable text="The store did not provide a rating distribution." />
      )}
      {query.isPending ? (
        <View style={{ gap: 10, marginTop: 18 }}>
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </View>
      ) : failed ? (
        <EmptyState
          icon={MessageSquare}
          title="Could not load reviews"
          action="Retry reviews"
          onPress={() => void query.refetch()}
        />
      ) : !reviews.length ? (
        <EmptyState
          icon={MessageSquare}
          title="No public reviews returned for this market"
          action="Refresh reviews"
          onPress={() => void query.refetch()}
        />
      ) : (
        <>
          <View
            style={{
              flexDirection: 'row',
              height: 10,
              borderRadius: 5,
              overflow: 'hidden',
              marginTop: 22,
            }}
          >
            {groups.map((g) => (
              <View key={g.name} style={{ flex: g.value, backgroundColor: g.color }} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            {groups.map((g) => (
              <Txt key={g.name} style={{ fontSize: 11, color: c.muted }}>
                {g.name} {Math.round((g.value / reviews.length) * 100)}%
              </Txt>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 22 }}>
            {[true, false].map((likes) => (
              <View key={String(likes)} style={{ flex: 1 }}>
                <Txt style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, marginBottom: 11 }}>
                  {likes ? 'What users like' : 'Complaints'}
                </Txt>
                {reviewTopics(reviews, likes).length ? (
                  reviewTopics(reviews, likes).map((t) => (
                    <View key={t.name} style={{ marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Txt style={{ fontSize: 11, color: c.muted }}>{t.name}</Txt>
                        <Txt style={{ fontSize: 11, color: c.muted }}>{t.percent}%</Txt>
                      </View>
                      <View
                        style={{
                          height: 4,
                          backgroundColor: c.surface,
                          borderRadius: 2,
                          marginTop: 5,
                        }}
                      >
                        <View
                          style={{
                            width: `${t.percent}%`,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: c.accent,
                          }}
                        />
                      </View>
                    </View>
                  ))
                ) : (
                  <Txt style={{ color: c.muted, fontSize: 11, lineHeight: 17 }}>
                    No matching topics in sample
                  </Txt>
                )}
              </View>
            ))}
          </View>
          {quotes.map((r) => (
            <View
              key={r.id}
              style={{ backgroundColor: c.surface, borderRadius: 16, padding: 14, marginTop: 12 }}
            >
              <Txt numberOfLines={4} style={{ fontSize: 12, lineHeight: 20 }}>
                “{r.text}”
              </Txt>
              <Txt style={{ color: c.muted, fontSize: 11, marginTop: 10 }}>
                {r.score}/5 · {r.userName} · {dateLabel(r.date)}
              </Txt>
            </View>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onPress={() => void query.refetch()}
            isDisabled={query.isFetching}
            style={{ marginTop: 10 }}
          >
            <Button.Label>
              {query.isFetching ? 'Refreshing…' : 'Refresh review sample'}
            </Button.Label>
          </Button>
        </>
      )}
    </InsightCard>
  );
}
