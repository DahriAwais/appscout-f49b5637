import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScoutApp, Scenario } from '@appscout/core';
import type { DesktopSettings, LocalState } from '../electron/contracts';
import { desktop } from './api';
export const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';
export function useWorkspace() {
  const [state, setState] = useState<LocalState | null>(null),
    [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const onboardingCompleted = useRef(false);
  const applyState = useCallback((response: LocalState) => {
    setState({ ...response, onboarded: response.onboarded || onboardingCompleted.current });
  }, []);
  const load = useCallback(
    () =>
      desktop
        .state()
        .then(async (response) => {
          setError('');
          applyState(response);
          const refreshed = await Promise.allSettled(
            response.watchlist.map((a) => desktop.detail(a.id)),
          );
          applyState(await desktop.state());
          if (refreshed.some((r) => r.status === 'rejected'))
            setError(
              'Some watchlist apps could not refresh. Cached observations are still available.',
            );
        })
        .catch((e: unknown) => {
          setError(message(e));
        }),
    [applyState],
  );
  useEffect(() => {
    void load();
  }, [load]);
  const watch = useCallback(
    async (app: ScoutApp) => {
      if (busy) return;
      setBusy(true);
      try {
        setError('');
        setState(await desktop.watch(app.id, !state?.watchlist.some((a) => a.id === app.id)));
      } catch (e) {
        setError(message(e));
      } finally {
        setBusy(false);
      }
    },
    [busy, state],
  );
  const settings = useCallback(async (value: DesktopSettings) => {
    try {
      await desktop.settings(value);
      setState(await desktop.state());
      setError('');
    } catch (e) {
      setError(message(e));
    }
  }, []);
  const scenario = useCallback(async (id: string, value: Scenario) => {
    await desktop.scenario(id, value);
    setState((s) => (s ? { ...s, scenarios: { ...s.scenarios, [id]: value } } : s));
  }, []);
  const completeOnboarding = useCallback(async () => {
    await desktop.completeOnboarding();
    onboardingCompleted.current = true;
    setState((current) => (current ? { ...current, onboarded: true } : current));
  }, []);
  return { state, error, setError, load, watch, settings, scenario, busy, completeOnboarding };
}
export function useFeed(
  category: string,
  search: string,
  developer: string,
  settings: DesktopSettings | undefined,
  keyword = '',
) {
  const [apps, setApps] = useState<ScoutApp[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [stale, setStale] = useState(false),
    [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const refresh = useCallback(() => setRetry((v) => v + 1), []);
  const country = settings?.country;
  const offline = settings?.offline;
  const ready = settings !== undefined;
  const requestKey = JSON.stringify([
    category,
    search,
    developer,
    keyword,
    country,
    offline,
    retry,
    ready,
  ]);
  const [previousRequest, setPreviousRequest] = useState(requestKey);
  if (previousRequest !== requestKey) {
    setPreviousRequest(requestKey);
    setLoading(true);
    setError('');
    setApps([]);
    setStale(false);
  }
  useEffect(() => {
    if (!ready) return undefined;
    const current = ++generation.current;
    const token = crypto.randomUUID();
    let alive = true;
    const pending = new Map<string, ScoutApp>();
    const unsubscribe = desktop.onFeed((event) => {
      if (!alive || event.token !== token || !event.app) return;
      const app = event.app;
      pending.set(app.id, app);
      setApps((list) => list.map((a) => (a.id === app.id ? app : a)));
    });
    async function fetchApps() {
      try {
        const response = keyword
          ? await desktop.keywords(keyword)
          : developer
            ? await desktop.developer(developer)
            : search
              ? await desktop.search(search)
              : await desktop.feed(category, token);
        if (!alive || current !== generation.current) return;
        const list = response.value.map((a) => pending.get(a.id) ?? a);
        setApps(list);
        setStale(response.stale);
        setLoading(false);
        if (search || developer)
          void Promise.allSettled(
            list.map(async (app) => {
              try {
                const result = await desktop.detail(app.id);
                if (alive) setApps((rows) => rows.map((a) => (a.id === app.id ? result.value : a)));
              } catch {
                if (alive)
                  setApps((rows) =>
                    rows.map((a) => (a.id === app.id ? { ...a, metadataState: 'error' } : a)),
                  );
              }
            }),
          );
      } catch (e) {
        if (alive) {
          setError(message(e));
          setLoading(false);
        }
      }
    }
    void fetchApps();
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [category, search, developer, keyword, country, offline, retry, ready]);
  return { apps, loading, error, stale, refresh };
}
