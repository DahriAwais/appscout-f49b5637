import type { StoreReview } from './scout';
export type RevenueRange = { low: number; mid: number; high: number };
export type TrendPoint = RevenueRange & { label: string; date: string; count: number };
// Unsampled older months are not zero activity.
export function reviewTrend(
  reviews: StoreReview[],
  range: RevenueRange,
  months: number,
  now = new Date(),
): TrendPoint[] {
  const dates = [...new Map(reviews.map((r) => [r.id, new Date(r.date)])).values()]
    .filter((d) => Number.isFinite(d.getTime()) && d <= now)
    .sort((a, b) => a.getTime() - b.getTime());
  if (dates.length < 20) return [];
  const first = dates[0];
  const coveredStart = new Date(first.getFullYear(), first.getMonth() + 1, 1),
    requestedStart = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  const start = coveredStart > requestedStart ? coveredStart : requestedStart;
  const buckets: { date: Date; count: number; rate: number }[] = [];
  for (let d = new Date(start); d <= now; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    const count = dates.filter(
      (x) => x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth(),
    ).length;
    const days =
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        ? Math.max(1, now.getDate())
        : new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    buckets.push({ date: d, count, rate: count / days });
  }
  if (buckets.length < 2 || buckets.at(-1)!.rate === 0) return [];
  const base = buckets.at(-1)!.rate;
  return buckets.map((b) => ({
    date: b.date.toISOString(),
    label: b.date.toLocaleDateString('en-US', { month: 'short' }),
    count: b.count,
    low: (range.low * b.rate) / base,
    mid: (range.mid * b.rate) / base,
    high: (range.high * b.rate) / base,
  }));
}
