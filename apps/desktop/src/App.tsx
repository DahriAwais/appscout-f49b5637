import { useCallback, useEffect, useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Compass,
  Search,
  Bookmark,
  GitCompareArrows,
  Sparkles,
  KeyRound,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Download,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { compact, money, dateLabel, type ScoutApp } from '@appscout/core';
import type { Page } from '../electron/contracts';
import { desktop } from './api';
import { useWorkspace, useFeed, message } from './hooks';
import { modeled } from './model';
import { Browse, Empty, AppIcon } from './components/Browse';
import { Detail } from './components/Detail';
import { EstimatorDrawer } from './components/EstimatorDrawer';
import { Onboarding } from './components/Onboarding';
import { CommandPalette } from './components/CommandPalette';
const links = [
  { id: 'discover' as const, label: 'Discover', icon: Compass },
  { id: 'explore' as const, label: 'Explore', icon: Search },
  { id: 'watchlist' as const, label: 'Watchlist', icon: Bookmark },
  { id: 'compare' as const, label: 'Compare', icon: GitCompareArrows },
];
function readRoute(): { page: Page; id: string | null } {
  const route = window.location.hash.slice(2);
  if (route.startsWith('app/')) {
    const [encoded, query = ''] = route.slice(4).split('?');
    const origin = new URLSearchParams(query).get('from');
    const page: Page =
      origin === 'explore' || origin === 'watchlist' || origin === 'compare' ? origin : 'discover';
    try {
      return { page, id: decodeURIComponent(encoded) };
    } catch {
      return { page: 'discover', id: null };
    }
  }
  const page =
    route === 'discover' ||
    route === 'explore' ||
    route === 'watchlist' ||
    route === 'compare' ||
    route === 'settings'
      ? route
      : 'discover';
  return { page, id: null };
}
export default function App() {
  const workspace = useWorkspace();
  const { state, watch, settings, scenario, busy, setError, load, completeOnboarding } = workspace;
  const [route, setRoute] = useState(readRoute),
    [backPage, setBackPage] = useState<Page>(() => readRoute().page),
    [category, setCategory] = useState('All'),
    [query, setQuery] = useState(''),
    [search, setSearch] = useState(''),
    [developer, setDeveloper] = useState(''),
    [keyword, setKeyword] = useState(''),
    [palette, setPalette] = useState(false),
    [drawer, setDrawer] = useState<ScoutApp | null>(null),
    [comparison, setComparison] = useState<ScoutApp[]>([]),
    [notice, setNotice] = useState(''),
    [update, setUpdate] = useState(''),
    [updating, setUpdating] = useState(false);
  const feed = useFeed(
    category,
    search,
    developer,
    state?.onboarded ? state.settings : undefined,
    keyword,
  );
  useEffect(() => {
    const listener = () => setRoute(readRoute());
    window.addEventListener('hashchange', listener);
    return () => window.removeEventListener('hashchange', listener);
  }, []);
  useEffect(() => desktop.onUpdate(setUpdate), []);
  useEffect(() => {
    if (route.page === 'watchlist' && !route.id) void load();
  }, [route.page, route.id, load]);
  useEffect(() => {
    const focused = () => {
      void load();
    };
    window.addEventListener('focus', focused);
    return () => window.removeEventListener('focus', focused);
  }, [load]);
  const navigate = useCallback((page: Page) => {
    window.location.hash = `/${page}`;
    setRoute({ page, id: null });
    setDrawer(null);
  }, []);
  const open = useCallback(
    (app: ScoutApp) => {
      setBackPage(route.page);
      window.location.hash = `/app/${encodeURIComponent(app.id)}?from=${route.page}`;
      setRoute({ page: route.page, id: app.id });
      setDrawer(null);
    },
    [route.page],
  );
  const closeDrawer = useCallback(() => setDrawer(null), []);
  const closePalette = useCallback(() => setPalette(false), []);
  const list = useMemo(
    () =>
      route.page === 'watchlist'
        ? (state?.watchlist ?? [])
        : route.page === 'compare'
          ? comparison
          : feed.apps,
    [route.page, state?.watchlist, feed.apps, comparison],
  );
  const activeApp =
    list.find((a) => a.id === route.id) ?? state?.watchlist.find((a) => a.id === route.id);
  const step = useCallback(
    (offset: number) => {
      const i = list.findIndex((a) => a.id === route.id);
      if (list.length) open(list[(Math.max(0, i) + offset + list.length) % list.length]);
    },
    [list, route.id, open],
  );
  const addCompare = useCallback(
    async (app: ScoutApp) => {
      try {
        if (comparison.some((a) => a.id === app.id)) {
          navigate('compare');
          return;
        }
        if (comparison.length >= 4) {
          setNotice('Compare up to four apps. Remove one to add another.');
          return;
        }
        const detail = (await desktop.detail(app.id)).value;
        setComparison((rows) =>
          rows.some((a) => a.id === detail.id) ? rows : rows.length >= 4 ? rows : [...rows, detail],
        );
        setNotice(`${detail.name} added to Compare.`);
      } catch (e) {
        setError(message(e));
      }
    },
    [comparison, navigate, setError],
  );
  const commandSearch = useCallback(
    (term: string, isDeveloper: boolean, isKeyword = false) => {
      setQuery(term);
      setSearch(isDeveloper || isKeyword ? '' : term);
      setDeveloper(isDeveloper ? term : '');
      setKeyword(isKeyword ? term : '');
      navigate('explore');
    },
    [navigate],
  );
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (!state?.onboarded) return;
      const target = e.target;
      const input =
        target instanceof HTMLElement &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((v) => !v);
        return;
      }
      if (palette || drawer || e.defaultPrevented) return;
      if (e.key === 'Escape') {
        if (route.id) {
          e.preventDefault();
          navigate(backPage);
        }
        return;
      }
      if (input) return;
      if (e.ctrlKey && e.key.toLowerCase() === 'd' && route.id) {
        e.preventDefault();
        if (activeApp) void watch(activeApp);
        else
          void desktop
            .detail(route.id)
            .then((result) => watch(result.value))
            .catch((error) => setError(message(error)));
      }
      if (route.id && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        step(e.key === 'ArrowLeft' ? -1 : 1);
      }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [
    state?.onboarded,
    palette,
    drawer,
    route.id,
    backPage,
    navigate,
    activeApp,
    watch,
    step,
    setError,
  ]);
  const exportCSV = useCallback(
    async (ids?: string[]) => {
      try {
        if (
          await desktop.exportCSV(
            ids ?? (route.page === 'compare' ? comparison : list).map((a) => a.id),
          )
        )
          setNotice('CSV exported.');
      } catch (e) {
        setError(message(e));
      }
    },
    [comparison, list, route.page, setError],
  );
  const exportPDF = useCallback(async () => {
    try {
      if (await desktop.exportPDF()) setNotice('PDF exported.');
    } catch (e) {
      setError(message(e));
    }
  }, [setError]);
  async function checkUpdate() {
    setUpdating(true);
    try {
      setUpdate(await desktop.checkUpdate());
    } catch (e) {
      setUpdate(message(e));
    } finally {
      setUpdating(false);
    }
  }
  if (!state)
    return (
      <div className="startup">
        <img src="./logo.svg" width={64} height={64} alt="AppScout" />
        <h1>AppScout</h1>
        {workspace.error ? (
          <div className="error">
            {workspace.error}
            <button onClick={() => void workspace.load()}>Retry</button>
          </div>
        ) : (
          <p>Opening workspace…</p>
        )}
      </div>
    );
  if (!state.onboarded) return <Onboarding complete={completeOnboarding} />;
  const collapsed = state.settings.collapsed;
  return (
    <div className={`desktop-shell ${collapsed ? 'collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <img src="./logo.svg" width={36} height={36} alt="" />
          {!collapsed && <span>AppScout</span>}
        </div>
        <nav aria-label="Main navigation">
          {links.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              title={collapsed ? label : undefined}
              aria-current={route.page === id && !route.id ? 'page' : undefined}
              className={route.page === id ? 'active' : ''}
              onClick={() => {
                if (id === 'discover') {
                  setSearch('');
                  setKeyword('');
                  setDeveloper('');
                  setQuery('');
                }
                navigate(id);
              }}
            >
              <Icon size={20} />
              {!collapsed && (
                <span>
                  {label}
                  {id === 'watchlist' && <small>{state.watchlist.length}</small>}
                </span>
              )}
            </button>
          ))}
          <button disabled title="Keywords: coming soon">
            <KeyRound size={20} />
            {!collapsed && (
              <span>
                Keywords<small>Soon</small>
              </span>
            )}
          </button>
        </nav>
        <div className="sidebar-bottom">
          {state.settings.offline && (
            <span className="offline-indicator">
              <WifiOff size={17} />
              {!collapsed && 'Offline mode'}
            </span>
          )}
          <button
            title="Settings"
            className={route.page === 'settings' ? 'active' : ''}
            onClick={() => navigate('settings')}
          >
            <Settings size={20} />
            {!collapsed && <span>Settings</span>}
          </button>
          <button
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => void settings({ ...state.settings, collapsed: !collapsed })}
          >
            {collapsed ? (
              <PanelLeftOpen size={20} />
            ) : (
              <>
                <PanelLeftClose size={20} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
      <div className="workspace">
        <div className="topbar">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) commandSearch(query.trim(), false);
            }}
          >
            <Search size={20} />
            <input
              aria-label="Search Google Play apps"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search apps, developers and listing keywords"
            />
            <button type="button" onClick={() => setPalette(true)} title="Open command palette">
              <kbd>Ctrl K</kbd>
            </button>
          </form>
          <span className="observed-badge">
            {state.settings.offline ? 'Cached data' : 'Google Play · Public data'}
          </span>
          <button
            className="primary upgrade-button"
            onClick={() => void desktop.showBetaInfo().catch((error) => setError(message(error)))}
          >
            <Sparkles size={16} /> Upgrade
          </button>
        </div>
        <main className="content">
          {workspace.error && (
            <div className="error" role="alert">
              <span>{workspace.error}</span>
              <button onClick={() => void load()}>Retry</button>
              <button onClick={() => setError('')}>Dismiss</button>
            </div>
          )}
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button className="text-button" onClick={() => setNotice('')}>
                Dismiss
              </button>
            </div>
          )}
          {route.id ? (
            <Detail
              key={route.id}
              id={route.id}
              custom={state.scenarios[route.id]}
              saved={state.watchlist.some((a) => a.id === route.id)}
              busy={busy}
              watch={(app) => void watch(app)}
              compare={(app) => void addCompare(app)}
              open={open}
              back={() => navigate(backPage)}
              previous={() => step(-1)}
              next={() => step(1)}
              estimate={setDrawer}
              developer={(id) => commandSearch(id, true)}
              exportPDF={() => void exportPDF()}
            />
          ) : route.page === 'compare' ? (
            <section>
              <div className="page-heading">
                <h1>Compare apps</h1>
                <span className="muted" style={{ fontSize: 11 }}>
                  Revenue and DAU are modeled, not reported.
                </span>
                <div className="button-row">
                  <button
                    className="secondary"
                    disabled={comparison.length < 2}
                    onClick={() => void exportCSV()}
                  >
                    <Download size={16} />
                    CSV
                  </button>
                  <button
                    className="secondary"
                    disabled={comparison.length < 2}
                    onClick={() => void exportPDF()}
                  >
                    PDF report
                  </button>
                </div>
              </div>
              {comparison.length < 2 && (
                <Empty
                  title="Add two to four apps to compare public signals and estimates."
                  action="Find apps"
                  onAction={() => navigate('discover')}
                />
              )}
              <div
                className="compare-grid"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(2, comparison.length)}, minmax(210px, 1fr))`,
                }}
              >
                {comparison.map((app) => {
                  const model = modeled(app, state.scenarios[app.id]);
                  return (
                    <section className="panel compare-column" key={app.id}>
                      <div className="section-heading">
                        <AppIcon app={app} size={56} />
                        <button
                          className="icon-button"
                          aria-label={`Remove ${app.name} from compare`}
                          onClick={() =>
                            setComparison((rows) => rows.filter((a) => a.id !== app.id))
                          }
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <button className="text-button" onClick={() => open(app)}>
                        <h2>{app.name}</h2>
                      </button>
                      <p className="muted">{app.developer}</p>
                      <dl>
                        <div>
                          <dt>Estimated monthly revenue</dt>
                          <dd className="money-text">
                            {model ? `${money(model.result.mid)} /mo` : 'Unavailable'}
                          </dd>
                        </div>
                        <div>
                          <dt>Downloads lower bound</dt>
                          <dd>{app.installsText ?? 'Not listed'}</dd>
                        </div>
                        <div>
                          <dt>Estimated DAU</dt>
                          <dd>{model ? compact(model.dau) : 'Unavailable'}</dd>
                        </div>
                        <div>
                          <dt>Rating</dt>
                          <dd>{app.rating?.toFixed(1) ?? '—'} /5</dd>
                        </div>
                        <div>
                          <dt>Category</dt>
                          <dd>{app.category ?? '—'}</dd>
                        </div>
                        <div>
                          <dt>Updated</dt>
                          <dd>{dateLabel(app.updated)}</dd>
                        </div>
                      </dl>
                      <button className="secondary full" onClick={() => setDrawer(app)}>
                        Edit estimate
                      </button>
                    </section>
                  );
                })}
              </div>
            </section>
          ) : route.page === 'settings' ? (
            <section className="settings-page">
              <h1>Settings</h1>
              <section className="panel">
                <h2>Data & workspace</h2>
                <label className="settings-row">
                  <span>
                    Offline mode<small>Use cached observations without scraper requests.</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={state.settings.offline}
                    onChange={(e) =>
                      void settings({ ...state.settings, offline: e.target.checked })
                    }
                  />
                </label>
                <label className="settings-row">
                  <span>Google Play market</span>
                  <select
                    value={state.settings.country}
                    onChange={(e) => {
                      setComparison([]);
                      void settings({ ...state.settings, country: e.target.value });
                    }}
                  >
                    <option value="us">United States</option>
                    <option value="gb">United Kingdom</option>
                    <option value="in">India</option>
                    <option value="pk">Pakistan</option>
                    <option value="de">Germany</option>
                  </select>
                </label>
                <div className="settings-row">
                  <span>Paid conversion default</span>
                  <strong>6% · Assumed</strong>
                </div>
                <div className="settings-row">
                  <span>Cache refresh</span>
                  <strong>24 hours</strong>
                </div>
                <p className="muted">
                  Watchlist snapshots collect while AppScout runs, and on the next launch.
                  Closed-app days are not backfilled.
                </p>
              </section>
              <section className="panel">
                <h2>App updates</h2>
                {!state.updatesAvailable && (
                  <p className="muted">Automatic updates are unavailable in this build.</p>
                )}
                <label className="settings-row">
                  <span>Check for updates on launch</span>
                  <input
                    type="checkbox"
                    checked={state.settings.autoUpdates}
                    disabled={!state.updatesAvailable}
                    onChange={(e) =>
                      void settings({ ...state.settings, autoUpdates: e.target.checked })
                    }
                  />
                </label>
                <div className="button-row">
                  <button
                    className="secondary"
                    disabled={updating || !state.updatesAvailable}
                    onClick={() => void checkUpdate()}
                  >
                    <RefreshCw size={16} />
                    {updating ? 'Checking…' : 'Check for updates'}
                  </button>
                  {update.startsWith('Update ready') && (
                    <button
                      className="primary"
                      onClick={() =>
                        void desktop.installUpdate().catch((e) => setUpdate(message(e)))
                      }
                    >
                      Restart & install
                    </button>
                  )}
                </div>
                {update && <p role="status">{update}</p>}
                <p className="muted">AppScout MRR · v1.0.0</p>
              </section>
              <section className="panel">
                <h2>Keyboard shortcuts</h2>
                <dl>
                  <div>
                    <dt>Command palette</dt>
                    <dd>
                      <kbd>Ctrl K</kbd>
                    </dd>
                  </div>
                  <div>
                    <dt>Watch current app</dt>
                    <dd>
                      <kbd>Ctrl D</kbd>
                    </dd>
                  </div>
                  <div>
                    <dt>Previous / next app</dt>
                    <dd>
                      <kbd>← / →</kbd>
                    </dd>
                  </div>
                  <div>
                    <dt>Close panel / back to results</dt>
                    <dd>
                      <kbd>Esc</kbd>
                    </dd>
                  </div>
                </dl>
              </section>
            </section>
          ) : route.page === 'watchlist' && !state.watchlist.length ? (
            <section>
              <h1>Watchlist</h1>
              <Empty
                title="Saved apps and their daily observations will appear here."
                action="Discover apps"
                onAction={() => navigate('discover')}
              />
            </section>
          ) : (
            <Browse
              apps={route.page === 'watchlist' ? state.watchlist : feed.apps}
              loading={route.page === 'watchlist' ? false : feed.loading}
              error={route.page === 'watchlist' ? '' : feed.error}
              stale={feed.stale}
              category={category}
              setCategory={(value) => {
                setCategory(value);
                setSearch('');
                setKeyword('');
                setDeveloper('');
              }}
              open={open}
              watch={(app) => void watch(app)}
              compare={(app) => void addCompare(app)}
              watched={state.watchlist}
              scenarios={state.scenarios}
              refresh={() => {
                feed.refresh();
                void workspace.load();
              }}
              title={
                route.page === 'watchlist'
                  ? 'Watchlist'
                  : keyword
                    ? `Listing text matches for “${keyword}”`
                    : developer
                      ? `Apps by ${developer}`
                      : search
                        ? `Results for “${search}”`
                        : route.page === 'explore'
                          ? 'Explore Google Play'
                          : 'Discover apps'
              }
              exportCSV={(ids) => void exportCSV(ids)}
              busy={busy}
            />
          )}
        </main>
      </div>
      <AnimatePresence>
        {drawer && (
          <EstimatorDrawer
            key={drawer.id}
            app={drawer}
            custom={state.scenarios[drawer.id]}
            close={closeDrawer}
            save={scenario}
          />
        )}
      </AnimatePresence>
      {palette && (
        <CommandPalette
          close={closePalette}
          open={open}
          navigate={navigate}
          search={commandSearch}
        />
      )}
    </div>
  );
}
