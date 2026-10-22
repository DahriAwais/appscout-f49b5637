import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpDown,
  Bookmark,
  Columns3,
  Grid2X2,
  List,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  Star,
  Download,
  ExternalLink,
  GitCompareArrows,
} from 'lucide-react';
import {
  categories,
  compact,
  dateLabel,
  money,
  ratingGrowth,
  type ScoutApp,
  type Scenario,
} from '@appscout/core';
import { desktop } from '../api';
import { modeled } from '../model';
export function AppIcon({ app, size = 48 }: { app: ScoutApp; size?: number }) {
  return app.icon ? (
    <img
      className="app-icon"
      src={app.icon}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'cover' }}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.hidden = true;
      }}
    />
  ) : (
    <div className="app-icon icon-fallback" style={{ width: size, height: size }}>
      {app.name.slice(0, 1)}
    </div>
  );
}
export function Empty({
  title,
  action,
  onAction,
}: {
  title: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="empty">
      <Search size={28} />
      <p>{title}</p>
      <button className="primary" onClick={onAction}>
        {action}
      </button>
    </div>
  );
}
interface BrowseProps {
  apps: ScoutApp[];
  loading: boolean;
  error: string;
  stale: boolean;
  category: string;
  setCategory: (value: string) => void;
  open: (app: ScoutApp) => void;
  watch: (app: ScoutApp) => void;
  compare: (app: ScoutApp) => void;
  watched: ScoutApp[];
  scenarios: Record<string, Scenario>;
  refresh: () => void;
  title: string;
  exportCSV: (ids: string[]) => void;
  busy: boolean;
}
type Column = 'category' | 'mrr' | 'growth' | 'rating' | 'installs' | 'updated';
const labels: Record<Column, string> = {
  category: 'Category',
  mrr: 'Est. MRR*',
  growth: 'Growth',
  rating: 'Rating',
  installs: 'Installs',
  updated: 'Updated',
};
export function Browse(props: BrowseProps) {
  const {
    apps,
    loading,
    error,
    stale,
    category,
    setCategory,
    open,
    watch,
    compare,
    watched,
    scenarios,
    refresh,
    title,
    exportCSV,
    busy,
  } = props;
  const [view, setView] = useState<'grid' | 'table'>('grid'),
    [sort, setSort] = useState<'name' | Column>('mrr'),
    [descending, setDescending] = useState(true),
    [minRating, setMinRating] = useState(0),
    [iapOnly, setIapOnly] = useState(false),
    [columns, setColumns] = useState<Column[]>([
      'category',
      'mrr',
      'growth',
      'rating',
      'installs',
      'updated',
    ]);
  const [context, setContext] = useState<{ app: ScoutApp; x: number; y: number } | null>(null);
  const [actionError, setActionError] = useState('');
  const grid = useRef<HTMLDivElement>(null);
  const [growths, setGrowths] = useState<Record<string, number | null>>({});
  const ids = apps.map((a) => a.id).join('|');
  useEffect(() => {
    let alive = true;
    const keys = ids ? ids.split('|') : [];
    void Promise.all(
      keys.map(async (id) => {
        try {
          return [id, ratingGrowth(await desktop.history(id))] as const;
        } catch {
          return [id, null] as const;
        }
      }),
    ).then((entries) => {
      if (alive) setGrowths(Object.fromEntries(entries));
    });
    return () => {
      alive = false;
    };
  }, [ids]);
  const rows = useMemo(
    () =>
      apps
        .filter((a) => (a.rating ?? 0) >= minRating && (!iapOnly || a.offersIAP))
        .sort((a, b) => {
          const val = (app: ScoutApp): string | number =>
            sort === 'name'
              ? app.name
              : sort === 'mrr'
                ? (modeled(app, scenarios[app.id])?.result.mid ?? -1)
                : sort === 'category'
                  ? (app.category ?? '')
                  : sort === 'rating'
                    ? (app.rating ?? -1)
                    : sort === 'installs'
                      ? (app.installs ?? -1)
                      : sort === 'updated'
                        ? (app.updated ?? -1)
                        : (growths[app.id] ?? -Infinity);
          const x = val(a),
            y = val(b);
          return (
            (typeof x === 'string' && typeof y === 'string'
              ? x.localeCompare(y)
              : Number(x) - Number(y)) * (descending ? -1 : 1)
          );
        }),
    [apps, minRating, iapOnly, sort, descending, scenarios, growths],
  );
  function sortBy(column: 'name' | Column) {
    if (column === sort) setDescending((v) => !v);
    else {
      setSort(column);
      setDescending(column !== 'name' && column !== 'category');
    }
  }
  const watchedID = new Set(watched.map((a) => a.id));
  return (
    <section>
      {actionError && (
        <div className="error" role="alert">
          {actionError}
          <button onClick={() => setActionError('')}>Dismiss</button>
        </div>
      )}
      <div className="page-heading">
        <div className="browse-title">
          <h1>{title}</h1>
          <span className="muted" style={{ fontSize: 11 }}>
            Modeled monthly revenue · Not verified subscription MRR
          </span>
        </div>
        <div className="button-row">
          <button
            className="secondary"
            onClick={() => exportCSV(rows.map((a) => a.id))}
            disabled={!rows.length}
          >
            <Download size={16} />
            Export CSV
          </button>
          <button className="icon-button" onClick={refresh} title="Refresh listings">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
      <div className="browse-toolbar">
        <div className="category-tabs">
          {categories.map((c) => (
            <button
              key={c}
              className={category === c ? 'active' : ''}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="segments">
          <button
            title="Grid view"
            aria-label="Grid view"
            className={view === 'grid' ? 'selected' : ''}
            onClick={() => setView('grid')}
          >
            <Grid2X2 size={17} />
          </button>
          <button
            title="Table view"
            aria-label="Table view"
            className={view === 'table' ? 'selected' : ''}
            onClick={() => setView('table')}
          >
            <List size={17} />
          </button>
        </div>
      </div>
      <div className="filter-bar">
        <label>
          Rating
          <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
            <option value={0}>Any rating</option>
            <option value={4}>4 stars and up</option>
            <option value={4.5}>4.5 stars and up</option>
          </select>
        </label>
        <label className="check-label">
          <input type="checkbox" checked={iapOnly} onChange={(e) => setIapOnly(e.target.checked)} />
          In-app purchases
        </label>
        <span className="muted">
          {rows.length} {rows.length === 1 ? 'app' : 'apps'}
          {stale ? ' · Cached observations' : ''}
        </span>
        {view === 'table' && (
          <details className="column-picker">
            <summary>
              <Columns3 size={16} />
              Columns
            </summary>
            <div>
              {(Object.keys(labels) as Column[]).map((col) => (
                <label key={col}>
                  <input
                    type="checkbox"
                    checked={columns.includes(col)}
                    onChange={() =>
                      setColumns((v) =>
                        v.includes(col) ? v.filter((c) => c !== col) : [...v, col],
                      )
                    }
                  />
                  {labels[col]}
                </label>
              ))}
            </div>
          </details>
        )}
      </div>
      {error ? (
        <div className="error" role="alert">
          <span>{error}</span>
          <button onClick={refresh}>Retry</button>
        </div>
      ) : loading ? (
        <div className="app-grid">
          {Array.from({ length: 12 }, (_, i) => (
            <div className="skeleton-card" key={`skeleton-${i}`}>
              <div className="skeleton-icon" />
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
              <div className="skeleton-line" />
            </div>
          ))}
        </div>
      ) : !rows.length ? (
        <Empty
          title={apps.length ? 'No apps match these filters.' : 'Your apps will appear here.'}
          action={apps.length ? 'Clear filters' : 'Refresh'}
          onAction={() => {
            setMinRating(0);
            setIapOnly(false);
            if (!apps.length) refresh();
          }}
        />
      ) : view === 'grid' ? (
        <>
          <div className="section-heading">
            <h2>Store observations</h2>
            <div className="button-row">
              <button
                className="icon-button"
                title="Previous row"
                onClick={() => grid.current?.scrollBy({ top: -300, behavior: 'smooth' })}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="icon-button"
                title="Next row"
                onClick={() => grid.current?.scrollBy({ top: 300, behavior: 'smooth' })}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div className="app-grid scroll-grid" ref={grid}>
            {rows.map((app) => {
              const model = modeled(app, scenarios[app.id]);
              return (
                <article
                  className="app-card"
                  key={app.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContext({
                      app,
                      x: Math.min(e.clientX, window.innerWidth - 230),
                      y: Math.min(e.clientY, window.innerHeight - 230),
                    });
                  }}
                >
                  <div className="card-top">
                    <button
                      className="app-open"
                      onClick={() => open(app)}
                      title={`Open ${app.name}`}
                    >
                      <AppIcon app={app} />
                    </button>
                    <button
                      className={`icon-button bookmark ${watchedID.has(app.id) ? 'saved' : ''}`}
                      disabled={busy}
                      title="Toggle watchlist"
                      onClick={() => watch(app)}
                    >
                      <Bookmark size={17} fill={watchedID.has(app.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <button className="card-main" onClick={() => open(app)}>
                    <h3 title={app.name}>{app.name}</h3>
                    <p>{app.category ?? app.developer}</p>
                    <div className="card-money">
                      {app.metadataState === 'loading' ? (
                        <span className="skeleton-line" />
                      ) : model ? (
                        <>
                          {money(model.result.mid)}
                          <small> /mo</small>
                        </>
                      ) : (
                        <span className="unavailable">
                          {app.metadataState === 'error' ? 'Retry details' : 'Estimate unavailable'}
                        </span>
                      )}
                    </div>
                    <div className="card-meta">
                      <span>
                        <Star size={13} />
                        {app.rating?.toFixed(1) ?? '—'}
                      </span>
                      <span>
                        {app.installsText ??
                          (app.installs !== null
                            ? `${compact(app.installs)}+`
                            : 'Installs not listed')}
                      </span>
                    </div>
                  </button>
                  <button className="card-compare" onClick={() => compare(app)}>
                    <GitCompareArrows size={14} />
                    Compare
                  </button>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <button onClick={() => sortBy('name')}>
                    Name
                    <ArrowUpDown size={13} />
                  </button>
                </th>
                {columns.map((col) => (
                  <th key={col}>
                    <button onClick={() => sortBy(col)}>
                      {labels[col]}
                      <ArrowUpDown size={13} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((app) => {
                const model = modeled(app, scenarios[app.id]);
                const values: Record<Column, string> = {
                  category: app.category ?? '—',
                  mrr: model
                    ? `${money(model.result.mid)} /mo`
                    : app.metadataState === 'loading'
                      ? 'Loading…'
                      : 'Unavailable',
                  growth:
                    growths[app.id] !== null && growths[app.id] !== undefined
                      ? `${growths[app.id]! >= 0 ? '+' : ''}${growths[app.id]!.toFixed(1)}%`
                      : 'Collecting history',
                  rating: app.rating?.toFixed(1) ?? '—',
                  installs:
                    app.installsText ?? (app.installs !== null ? `${compact(app.installs)}+` : '—'),
                  updated: dateLabel(app.updated),
                };
                return (
                  <tr key={app.id}>
                    <td>
                      <button className="table-app" onClick={() => open(app)}>
                        <AppIcon app={app} size={32} />
                        <span>
                          {app.name}
                          <small>{app.developer}</small>
                        </span>
                      </button>
                    </td>
                    {columns.map((col) => (
                      <td key={col} className={col === 'mrr' ? 'money-text' : ''}>
                        {values[col]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {context && (
        <>
          <button
            className="context-dismiss"
            aria-label="Close context menu"
            onClick={() => setContext(null)}
          />
          <div role="menu" className="context-menu" style={{ left: context.x, top: context.y }}>
            <button
              onClick={() => {
                open(context.app);
                setContext(null);
              }}
            >
              Open app
            </button>
            <button
              disabled={busy}
              onClick={() => {
                watch(context.app);
                setContext(null);
              }}
            >
              <Bookmark size={15} />
              Toggle watchlist
            </button>
            <button
              onClick={() => {
                compare(context.app);
                setContext(null);
              }}
            >
              <GitCompareArrows size={15} />
              Add to compare
            </button>
            <button
              onClick={() => {
                void desktop
                  .openStore(context.app.id)
                  .catch((e) =>
                    setActionError(
                      e instanceof Error
                        ? e.message
                        : 'Google Play could not open. Please try again.',
                    ),
                  );
                setContext(null);
              }}
            >
              <ExternalLink size={15} />
              Open Google Play
            </button>
          </div>
        </>
      )}
    </section>
  );
}
