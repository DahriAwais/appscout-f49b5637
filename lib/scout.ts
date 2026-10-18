export interface ScoutApp {
  id: string;
  name: string;
  tagline: string;
  category: string | null;
  developer: string;
  developerId: string | null;
  icon: string | null;
  installs: number | null;
  installsText: string | null;
  rating: number | null;
  ratings: number | null;
  launched: string | null;
  updated: number | null;
  price: number | null;
  priceText: string | null;
  currency: string | null;
  free: boolean | null;
  offersIAP: boolean | null;
  adSupported: boolean | null;
  iapRange: string | null;
  screenshots: string[];
  histogram: Record<string, number> | null;
  description: string;
  version: string | null;
  recentChanges: string | null;
  url: string;
  fetchedAt: string;
  metadataState?: 'loading' | 'error' | 'ready';
}
export interface Snapshot {
  day: string;
  ratings: number | null;
  score: number | null;
  min_installs: number | null;
  updated_at: string | null;
  version: string | null;
}
export interface StoreReview {
  id: string;
  userName: string;
  score: number;
  text: string;
  date: string;
}
export interface Scenario {
  monthlyActiveLow: number;
  monthlyActive: number;
  monthlyActiveHigh: number;
  payingPercent: number;
  monthlySpend: number;
  impressions: number;
  ecpm: number;
}
export interface AutomaticScenario {
  inputs: Scenario;
  activeShares: readonly [number, number, number];
  ageMonths: number | null;
}

// Scenario defaults are product assumptions, not measured retention or industry benchmarks.
export function automaticScenario(app: ScoutApp, now = Date.now()): AutomaticScenario | null {
  if (app.installs === null || !Number.isFinite(app.installs) || app.installs <= 0) return null;
  const launched = app.launched ? new Date(app.launched).getTime() : NaN;
  const ageMonths =
    Number.isFinite(launched) && launched <= now
      ? Math.max(1, (now - launched) / (30.4375 * 86400000))
      : null;
  const activeShares: readonly [number, number, number] =
    ageMonths === null
      ? [1, 5, 15]
      : ageMonths <= 12
        ? [3, 10, 25]
        : ageMonths <= 36
          ? [2, 7, 18]
          : [1, 4, 12];
  return {
    ageMonths,
    activeShares,
    inputs: {
      monthlyActiveLow: Math.round((app.installs * activeShares[0]) / 100),
      monthlyActive: Math.round((app.installs * activeShares[1]) / 100),
      monthlyActiveHigh: Math.round((app.installs * activeShares[2]) / 100),
      payingPercent: app.offersIAP === true ? 1 : 0,
      monthlySpend: app.offersIAP === true ? 5 : 0,
      impressions: app.adSupported === true ? 40 : 0,
      ecpm: app.adSupported === true ? 2 : 0,
    },
  };
}

export function estimate(s: Scenario) {
  const purchases = ((s.monthlyActive * s.payingPercent) / 100) * s.monthlySpend;
  const ads = ((s.monthlyActive * s.impressions) / 1000) * s.ecpm;
  const mid = purchases + ads;
  const perUser = (s.payingPercent / 100) * s.monthlySpend + (s.impressions / 1000) * s.ecpm;
  return {
    purchases,
    ads,
    mid,
    low: s.monthlyActiveLow * perUser,
    high: s.monthlyActiveHigh * perUser,
  };
}
export function money(n: number) {
  return n >= 1e6
    ? `$${+(n / 1e6).toFixed(1)}M`
    : n >= 1e3
      ? `$${+(n / 1e3).toFixed(1)}K`
      : `$${Math.round(n).toLocaleString('en-US')}`;
}
export function compact(n: number) {
  return n >= 1e9
    ? `${+(n / 1e9).toFixed(1)}B`
    : n >= 1e6
      ? `${+(n / 1e6).toFixed(1)}M`
      : n >= 1e3
        ? `${+(n / 1e3).toFixed(1)}K`
        : n.toLocaleString('en-US');
}
export const categories = [
  'All',
  'Productivity',
  'Tools',
  'Games',
  'Health',
  'Education',
  'Finance',
] as const;
export type FeedCategory = (typeof categories)[number];
export function dateLabel(value: string | number | null) {
  if (value === null) return 'Not listed';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
export function ago(value: string | number | null) {
  if (value === null) return 'Not listed';
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return String(value);
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
  if (days === 0) return 'Today';
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  const months = Math.floor(days / 30);
  if (months < 24) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}
