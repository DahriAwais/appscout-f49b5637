import { ago, compact, type ScoutApp, type Snapshot, type StoreReview } from './scout';
export interface Insight {
  badge: 'Rising' | 'Opportunity' | 'New' | 'Declining' | 'Signal';
  text: string;
}
export function ratingGrowth(history: Snapshot[]): number | null {
  const first = history[0],
    last = history.at(-1);
  if (
    history.length < 7 ||
    !first ||
    !last ||
    new Date(last.day).getTime() - new Date(first.day).getTime() < 6 * 86400000 ||
    !first.ratings ||
    last.ratings === null
  )
    return null;
  return ((last.ratings - first.ratings) / first.ratings) * 100;
}
export function buildInsights(app: ScoutApp, history: Snapshot[]): Insight[] {
  const lines: Insight[] = [];
  const growth = ratingGrowth(history);
  if (growth !== null)
    lines.push({
      badge: growth >= 0 ? 'Rising' : 'Declining',
      text: `Ratings ${growth >= 0 ? '+' : ''}${growth.toFixed(1)}% over ${history.length} observations`,
    });
  if (app.rating !== null && app.rating < 4 && app.installs !== null && app.installs >= 100000)
    lines.push({
      badge: 'Opportunity',
      text: `${compact(app.installs)}+ installs with a ${app.rating.toFixed(1)} rating`,
    });
  const launched = app.launched ? new Date(app.launched).getTime() : NaN;
  if (Number.isFinite(launched) && Date.now() - launched < 90 * 86400000)
    lines.push({ badge: 'New', text: `Launched ${ago(app.launched).toLowerCase()}` });
  if (app.updated)
    lines.push({ badge: 'Signal', text: `Last updated ${ago(app.updated).toLowerCase()}` });
  if (app.offersIAP)
    lines.push({ badge: 'Signal', text: 'In-app purchases listed on Google Play' });
  if (app.ratings !== null)
    lines.push({ badge: 'Signal', text: `${compact(app.ratings)} public ratings` });
  return lines.slice(0, 4);
}
export function opportunityScore(app: ScoutApp, history: Snapshot[]) {
  const growth = ratingGrowth(history);
  if (growth === null || app.installs === null || app.rating === null) return null;
  const demand = Math.min(100, (Math.log10(Math.max(1, app.installs)) / 7) * 100);
  const gap = ((5 - app.rating) / 4) * 100;
  return Math.round(demand * 0.4 + gap * 0.3 + Math.min(100, Math.max(0, growth * 5)) * 0.3);
}
const topics: Record<string, RegExp> = {
  Ads: /\bads?\b|advertis/i,
  Stability: /crash|bug|freez|lag/i,
  Pricing: /price|expensive|subscription|payment|paywall/i,
  Usability: /easy|simple|interface|design|navigation/i,
  Features: /feature|function|option|tool/i,
  Support: /support|customer service|response/i,
};
export function reviewTopics(reviews: StoreReview[], positive: boolean) {
  const subset = reviews.filter((r) => (positive ? r.score >= 4 : r.score <= 2));
  return Object.entries(topics)
    .map(([name, regex]) => ({
      name,
      percent: subset.length
        ? Math.round((subset.filter((r) => regex.test(r.text)).length / subset.length) * 100)
        : 0,
    }))
    .filter((t) => t.percent > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3);
}
