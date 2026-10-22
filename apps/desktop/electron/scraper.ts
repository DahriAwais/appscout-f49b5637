import gplay from 'google-play-scraper';
import { setTimeout as sleep } from 'node:timers/promises';
import {
  adaptApp,
  adaptReview,
  CATEGORY_IDS,
  type RawRecord,
  type ScoutApp,
  type StoreReview,
} from '@appscout/core';
import { Cache } from './cache';
import type { CacheResult, FeedEvent } from './contracts';
const sort = gplay.sort as unknown as {
  NEWEST: NonNullable<Parameters<typeof gplay.reviews>[0]['sort']>;
};
const collection = gplay.collection as unknown as {
  TOP_FREE: NonNullable<Parameters<typeof gplay.list>[0]['collection']>;
};
class RequestQueue {
  private active = 0;
  private waiting: (() => void)[] = [];
  async run<T>(work: () => Promise<T>): Promise<T> {
    if (this.active >= 3) await new Promise<void>((resolve) => this.waiting.push(resolve));
    else this.active++;
    try {
      await sleep(350 + Math.random() * 250);
      for (let attempt = 0; ; attempt++) {
        try {
          return await work();
        } catch (error) {
          if (attempt >= 2) throw error;
          await sleep(900 * 2 ** attempt + Math.random() * 400);
        }
      }
    } finally {
      const next = this.waiting.shift();
      if (next) next();
      else this.active--;
    }
  }
}
const raw = (value: unknown): RawRecord => {
  if (!value || typeof value !== 'object') throw new Error('Google Play returned incomplete data.');
  return value as RawRecord;
};
export class ScraperService {
  private queue = new RequestQueue();
  private pending = new Map<string, Promise<unknown>>();
  constructor(public cache: Cache) {}
  private country() {
    return this.cache.state().settings.country;
  }
  private key(kind: string, id: string, country = this.country()) {
    return `${country}:${kind}:${id}`;
  }
  private async request<T>(key: string, fetcher: () => Promise<T>): Promise<CacheResult<T>> {
    const cached = this.cache.get<T>(key);
    if (cached && (!cached.stale || this.cache.state().settings.offline)) return cached;
    if (this.cache.state().settings.offline)
      throw new Error('This app is not cached yet. Turn off offline mode to fetch it.');
    const existing = this.pending.get(key) as Promise<CacheResult<T>> | undefined;
    if (existing) return existing;
    const promise = this.queue
      .run(async () => {
        if (this.cache.state().settings.offline)
          throw new Error('Offline mode is on. This observation has not been cached.');
        return this.cache.put(key, await fetcher());
      })
      .catch((error) => {
        if (cached) return { ...cached, stale: true };
        throw error;
      });
    this.pending.set(key, promise);
    try {
      return await promise;
    } finally {
      this.pending.delete(key);
    }
  }
  async detail(id: string, country = this.country()) {
    const result = await this.request<ScoutApp>(this.key('app', id, country), async () =>
      adaptApp(raw(await gplay.app({ appId: id, country, lang: 'en' }))),
    );
    if (this.cache.state().watchlist.some((a) => a.id === id) && !result.stale)
      this.cache.snapshot(result.value, country);
    return result;
  }
  search(term: string, country = this.country()) {
    return this.request(this.key('search', term, country), async () =>
      (await gplay.search({ term, num: 50, country, lang: 'en' })).map((v) =>
        adaptApp(raw(v), false),
      ),
    );
  }
  async keywords(term: string) {
    const country = this.country(),
      key = this.key('keywords', term, country),
      cached = this.cache.get<ScoutApp[]>(key);
    if (cached && (!cached.stale || this.cache.state().settings.offline)) return cached;
    const candidates = await this.search(term, country);
    const observations = await Promise.allSettled(
      candidates.value.map((a) => this.detail(a.id, country)),
    );
    const found = observations.filter(
      (r): r is PromiseFulfilledResult<CacheResult<ScoutApp>> => r.status === 'fulfilled',
    );
    if (candidates.value.length && !found.length) {
      if (cached) return { ...cached, stale: true };
      throw new Error('Listing details could not load. Retry this keyword search.');
    }
    const words = term.toLowerCase().split(/\s+/).filter(Boolean);
    const matches = found
      .map((r) => r.value.value)
      .filter((a) =>
        words.every((w) => `${a.name} ${a.tagline} ${a.description}`.toLowerCase().includes(w)),
      );
    // Search scope is the first 50 store candidates, not the whole store or keyword rankings.
    const stale = candidates.stale || found.some((r) => r.value.stale);
    if (stale || found.length < candidates.value.length)
      return { value: matches, stale: true, cached: true, savedAt: candidates.savedAt };
    return this.cache.put(key, matches);
  }
  developer(id: string) {
    const country = this.country();
    return this.request(this.key('developer', id, country), async () =>
      (await gplay.developer({ devId: id, num: 50, country, lang: 'en' })).map((v) =>
        adaptApp(raw(v), false),
      ),
    );
  }
  similar(id: string) {
    const country = this.country();
    return this.request(this.key('similar', id, country), async () =>
      (await gplay.similar({ appId: id, country, lang: 'en' }))
        .slice(0, 12)
        .map((v) => adaptApp(raw(v), false)),
    );
  }
  reviews(id: string) {
    const country = this.country();
    return this.request<StoreReview[]>(this.key('reviews', id, country), async () =>
      (
        await gplay.reviews({ appId: id, sort: sort.NEWEST, num: 200, country, lang: 'en' })
      ).data.map((v) => adaptReview(raw(v))),
    );
  }
  async feed(category: string, token: string, send: (event: FeedEvent) => void) {
    const country = this.country(),
      categoryID = CATEGORY_IDS[category as keyof typeof CATEGORY_IDS];
    const result = await this.request<ScoutApp[]>(this.key('feed', category, country), async () =>
      (
        await gplay.list({
          category: categoryID as Parameters<typeof gplay.list>[0]['category'],
          collection: collection.TOP_FREE,
          num: 50,
          country,
          lang: 'en',
        })
      ).map((v) => adaptApp(raw(v), false)),
    );
    const list = result.value.map(
      (a) => this.cache.get<ScoutApp>(this.key('app', a.id, country))?.value ?? a,
    );
    void Promise.all(
      list.map(async (app) => {
        try {
          const detail = await this.detail(app.id, country);
          send({ token, app: detail.value });
        } catch (error) {
          send({
            token,
            app: { ...app, metadataState: 'error' },
            error: error instanceof Error ? error.message : 'Could not fetch app details.',
          });
        }
      }),
    ).then(() => send({ token, done: true }));
    return { ...result, value: list };
  }
  async dailySnapshots() {
    if (this.cache.state().settings.offline) return;
    const country = this.country();
    await Promise.allSettled(this.cache.state().watchlist.map((a) => this.detail(a.id, country)));
  }
}
