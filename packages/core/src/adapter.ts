import type { ScoutApp, StoreReview } from './scout';
export type RawRecord = Record<string, unknown>;
const text = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const bool = (v: unknown): boolean | null => (typeof v === 'boolean' ? v : null);
export function adaptApp(r: RawRecord, detailed = true): ScoutApp {
  const id = text(r.appId) ?? '';
  if (!id) throw new Error('The store returned an app without an identifier.');
  const histogram =
    r.histogram && typeof r.histogram === 'object'
      ? Object.fromEntries(
          Object.entries(r.histogram).filter(
            (x): x is [string, number] => typeof x[1] === 'number',
          ),
        )
      : null;
  return {
    id,
    name: text(r.title) ?? id,
    tagline: text(r.summary) ?? '',
    category: text(r.genre),
    developer: text(r.developer) ?? '',
    developerId: text(r.developerId),
    icon: text(r.icon),
    installs: num(r.minInstalls),
    installsText: text(r.installs),
    rating: num(r.score),
    ratings: num(r.ratings),
    launched: text(r.released),
    updated: num(r.updated),
    price: num(r.price),
    priceText: text(r.priceText),
    currency: text(r.currency),
    free: bool(r.free),
    offersIAP: bool(r.offersIAP),
    adSupported: bool(r.adSupported),
    iapRange: text(r.IAPRange),
    screenshots: Array.isArray(r.screenshots)
      ? r.screenshots.filter((x): x is string => typeof x === 'string')
      : [],
    histogram,
    description: text(r.description) ?? '',
    version: text(r.version),
    recentChanges: text(r.recentChanges),
    url: text(r.url) ?? `https://play.google.com/store/apps/details?id=${encodeURIComponent(id)}`,
    fetchedAt: new Date().toISOString(),
    metadataState: detailed ? 'ready' : 'loading',
  };
}
export function adaptReview(r: RawRecord): StoreReview {
  const date = r.date instanceof Date ? r.date.toISOString() : (text(r.date) ?? '');
  return {
    id: text(r.id) ?? '',
    userName: text(r.userName) ?? 'Reviewer',
    score: num(r.score) ?? 0,
    text: text(r.text) ?? '',
    date,
  };
}
