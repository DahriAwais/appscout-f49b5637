import Database from 'better-sqlite3';
import type { ScoutApp, Snapshot, Scenario } from '@appscout/core';
import { CACHE_TTL_MS } from '@appscout/core';
import type { CacheResult, DesktopSettings, LocalState } from './contracts';
interface CacheRow {
  payload: string;
  saved_at: number;
}
export class Cache {
  private db: Database.Database;
  constructor(path: string) {
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db
      .exec(`CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY,payload TEXT NOT NULL,saved_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS watchlist (id TEXT PRIMARY KEY,payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS market_snapshots (country TEXT NOT NULL,app_id TEXT NOT NULL,day TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(country,app_id,day));
      CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY,payload TEXT NOT NULL);`);
  }
  get<T>(key: string): CacheResult<T> | null {
    const row = this.db.prepare('SELECT payload,saved_at FROM cache WHERE key=?').get(key) as
      | CacheRow
      | undefined;
    return row
      ? {
          value: JSON.parse(row.payload) as T,
          stale: Date.now() - row.saved_at > CACHE_TTL_MS,
          cached: true,
          savedAt: row.saved_at,
        }
      : null;
  }
  put<T>(key: string, value: T): CacheResult<T> {
    const savedAt = Date.now();
    this.db
      .prepare('INSERT OR REPLACE INTO cache VALUES (?,?,?)')
      .run(key, JSON.stringify(value), savedAt);
    return { value, stale: false, cached: false, savedAt };
  }
  preference<T>(key: string, fallback: T): T {
    const row = this.db.prepare('SELECT payload FROM preferences WHERE key=?').get(key) as
      | { payload: string }
      | undefined;
    return row ? (JSON.parse(row.payload) as T) : fallback;
  }
  setPreference(key: string, value: unknown) {
    this.db
      .prepare('INSERT OR REPLACE INTO preferences VALUES (?,?)')
      .run(key, JSON.stringify(value));
  }
  state(): LocalState {
    const rows = this.db.prepare('SELECT payload FROM watchlist ORDER BY rowid DESC').all() as {
      payload: string;
    }[];
    const settings = this.preference<DesktopSettings>('settings', {
      offline: false,
      collapsed: false,
      country: 'us',
      autoUpdates: false,
    });
    return {
      onboarded: this.preference<boolean>('onboarded', false),
      updatesAvailable: false,
      watchlist: rows.map((r) => {
        const saved = JSON.parse(r.payload) as ScoutApp;
        const observed = this.get<ScoutApp>(`${settings.country}:app:${saved.id}`)?.value;
        return (
          observed ?? {
            ...saved,
            installs: null,
            installsText: null,
            rating: null,
            ratings: null,
            offersIAP: null,
            adSupported: null,
            price: null,
            priceText: null,
            histogram: null,
            metadataState: 'loading' as const,
          }
        );
      }),
      scenarios: this.preference<Record<string, Scenario>>('scenarios', {}),
      settings,
    };
  }
  watch(app: ScoutApp, saved: boolean) {
    if (saved) {
      this.db
        .prepare('INSERT OR REPLACE INTO watchlist VALUES (?,?)')
        .run(app.id, JSON.stringify(app));
      this.snapshot(app);
    } else this.db.prepare('DELETE FROM watchlist WHERE id=?').run(app.id);
  }
  snapshot(app: ScoutApp, country = this.state().settings.country) {
    const observationDay = app.fetchedAt.slice(0, 10);
    const row: Snapshot = {
      day: observationDay,
      ratings: app.ratings,
      score: app.rating,
      min_installs: app.installs,
      updated_at: app.updated ? new Date(app.updated).toISOString() : null,
      version: app.version,
    };
    // Use the observation date: stale cached data never creates a new day's measurement.
    this.db
      .prepare('INSERT OR REPLACE INTO market_snapshots VALUES (?,?,?,?)')
      .run(country, app.id, observationDay, JSON.stringify(row));
    if (
      country === this.state().settings.country &&
      this.db.prepare('SELECT id FROM watchlist WHERE id=?').get(app.id)
    )
      this.db.prepare('UPDATE watchlist SET payload=? WHERE id=?').run(JSON.stringify(app), app.id);
  }
  history(id: string): Snapshot[] {
    return (
      this.db
        .prepare('SELECT payload FROM market_snapshots WHERE country=? AND app_id=? ORDER BY day')
        .all(this.state().settings.country, id) as {
        payload: string;
      }[]
    ).map((r) => JSON.parse(r.payload) as Snapshot);
  }
  close() {
    this.db.close();
  }
}
