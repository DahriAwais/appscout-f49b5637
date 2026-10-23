import type { ScoutApp, Snapshot, StoreReview, Scenario } from '@appscout/core';
export type Page = 'discover' | 'explore' | 'watchlist' | 'compare' | 'settings';
export interface DesktopSettings {
  offline: boolean;
  collapsed: boolean;
  country: string;
  autoUpdates: boolean;
}
export interface CacheResult<T> {
  value: T;
  stale: boolean;
  cached: boolean;
  savedAt: number;
}
export interface FeedEvent {
  token: string;
  app?: ScoutApp;
  error?: string;
  done?: boolean;
}
export interface LocalState {
  onboarded: boolean;
  updatesAvailable: boolean;
  watchlist: ScoutApp[];
  scenarios: Record<string, Scenario>;
  settings: DesktopSettings;
}
export interface DetailData {
  app: ScoutApp;
  history: Snapshot[];
  reviews: StoreReview[];
  similar: ScoutApp[];
}
export interface DesktopAPI {
  feed(category: string, token: string): Promise<CacheResult<ScoutApp[]>>;
  onFeed(callback: (event: FeedEvent) => void): () => void;
  keywords(term: string): Promise<CacheResult<ScoutApp[]>>;
  search(term: string): Promise<CacheResult<ScoutApp[]>>;
  developer(id: string): Promise<CacheResult<ScoutApp[]>>;
  detail(id: string): Promise<CacheResult<ScoutApp>>;
  reviews(id: string): Promise<CacheResult<StoreReview[]>>;
  similar(id: string): Promise<CacheResult<ScoutApp[]>>;
  history(id: string): Promise<Snapshot[]>;
  state(): Promise<LocalState>;
  completeOnboarding(): Promise<void>;
  showBetaInfo(): Promise<void>;
  watch(id: string, saved: boolean): Promise<LocalState>;
  scenario(id: string, value: Scenario): Promise<void>;
  settings(value: DesktopSettings): Promise<void>;
  exportCSV(ids: string[]): Promise<boolean>;
  exportPDF(): Promise<boolean>;
  window(action: 'minimize' | 'maximize' | 'close'): Promise<void>;
  openStore(id: string): Promise<void>;
  checkUpdate(): Promise<string>;
  installUpdate(): Promise<void>;
  onUpdate(callback: (message: string) => void): () => void;
}
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };
