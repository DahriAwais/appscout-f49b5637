import { useEffect, useState, useRef } from 'react';
import {
  Bookmark,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  GitCompareArrows,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import {
  buildInsights,
  compact,
  dateLabel,
  opportunityScore,
  ratingGrowth,
  reviewTopics,
  type ScoutApp,
  type Snapshot,
  type StoreReview,
  type Scenario,
} from '@appscout/core';
import { desktop } from '../api';
import { message } from '../hooks';
import { RevenueHero, RatingsChart, RatingDistribution } from './Charts';
import { ReviewList } from './ReviewList';
import { AppIcon, Empty } from './Browse';
interface Props {
  id: string;
  custom?: Scenario;
  saved: boolean;
  busy: boolean;
  watch: (app: ScoutApp) => void;
  compare: (app: ScoutApp) => void;
  open: (app: ScoutApp) => void;
  back: () => void;
  previous: () => void;
  next: () => void;
  estimate: (app: ScoutApp) => void;
  developer: (id: string) => void;
  exportPDF: () => void;
}
export function Detail(props: Props) {
  const [app, setApp] = useState<ScoutApp | null>(null),
    [history, setHistory] = useState<Snapshot[]>([]),
    [reviews, setReviews] = useState<StoreReview[]>([]),
    [similar, setSimilar] = useState<ScoutApp[]>([]);
  const [error, setError] = useState(''),
    [secondaryError, setSecondaryError] = useState(''),
    [stale, setStale] = useState(false),
    [retry, setRetry] = useState(0);
  const screenshots = useRef<HTMLDivElement>(null);
  const { id } = props;
  const requestKey = `${id}:${retry}`;
  const [previousRequest, setPreviousRequest] = useState(requestKey);
  if (previousRequest !== requestKey) {
    setPreviousRequest(requestKey);
    setApp(null);
    setError('');
    setSecondaryError('');
    setHistory([]);
    setReviews([]);
    setSimilar([]);
  }
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const response = await desktop.detail(id);
        if (!alive) return;
        setApp(response.value);
        setStale(response.stale);
        const results = await Promise.allSettled([
          desktop.history(id),
          desktop.reviews(id),
          desktop.similar(id),
        ] as const);
        if (!alive) return;
        if (results[0].status === 'fulfilled') setHistory(results[0].value);
        if (results[1].status === 'fulfilled') setReviews(results[1].value.value);
        if (results[2].status === 'fulfilled') setSimilar(results[2].value.value);
        if (results.some((r) => r.status === 'rejected'))
          setSecondaryError('Some reviews or related apps could not load.');
      } catch (e) {
        if (alive) setError(message(e));
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [id, retry]);
  if (error)
    return (
      <div className="error" role="alert">
        <span>{error}</span>
        <button onClick={() => setRetry((v) => v + 1)}>Retry</button>
        <button onClick={props.back}>Back to Discover</button>
      </div>
    );
  if (!app)
    return (
      <div className="detail-skeleton" aria-label="Loading app details">
        <div className="skeleton-line" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
    );
  const score = opportunityScore(app, history),
    growth = ratingGrowth(history),
    insights = buildInsights(app, history);
  const words = app.description.toLowerCase().match(/[a-z]{4,}/g) ?? [];
  const excluded = new Set([
    'with',
    'your',
    'that',
    'this',
    'from',
    'have',
    'more',
    'will',
    'https',
    'them',
    'they',
    'into',
    'when',
    'about',
    'also',
  ]);
  const counts = new Map<string, number>();
  for (const word of words) if (!excluded.has(word)) counts.set(word, (counts.get(word) ?? 0) + 1);
  const keywords = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 12);
  return (
    <>
      <div className="detail-nav">
        <button className="text-button" onClick={props.back}>
          <ArrowLeft size={17} />
          Back to results
        </button>
        <div className="button-row">
          <button
            className="icon-button"
            title="Previous app (Left arrow)"
            onClick={props.previous}
          >
            <ArrowLeft size={17} />
          </button>
          <button className="icon-button" title="Next app (Right arrow)" onClick={props.next}>
            <ArrowRight size={17} />
          </button>
          <button className="secondary" onClick={props.exportPDF}>
            <Download size={16} />
            PDF report
          </button>
        </div>
      </div>
      <div className="detail-header">
        <AppIcon app={app} size={80} />
        <div>
          <h1>{app.name}</h1>
          <button
            className="text-button"
            onClick={() => props.developer(app.developerId ?? app.developer)}
          >
            {app.developer}
          </button>
          <p className="muted">
            {app.category ?? 'Category not listed'} · Updated {dateLabel(app.updated)}
          </p>
        </div>
        <div className="button-row detail-actions">
          <button className="secondary" onClick={() => props.compare(app)}>
            <GitCompareArrows size={17} />
            Compare
          </button>
          <button
            className="primary"
            disabled={props.busy}
            onClick={() => props.watch(app)}
            title="Ctrl+D"
          >
            <Bookmark size={17} fill={props.saved ? 'currentColor' : 'none'} />
            {props.saved ? 'Watching' : 'Watch app'}
          </button>
        </div>
      </div>
      {stale && (
        <div className="notice">
          Cached observation from {dateLabel(app.fetchedAt)}. New data could not be fetched.
        </div>
      )}
      {secondaryError && (
        <div className="error" role="alert">
          {secondaryError}
          <button onClick={() => setRetry((v) => v + 1)}>Retry</button>
        </div>
      )}
      <div className="detail-columns">
        <div className="detail-main">
          <RevenueHero
            app={app}
            custom={props.custom}
            reviews={reviews}
            history={history}
            onEstimate={() => props.estimate(app)}
          />
          <section className="panel">
            <div className="section-heading">
              <h2>Store screenshots</h2>
              <div className="button-row">
                <button
                  className="icon-button"
                  title="Previous screenshot"
                  onClick={() => screenshots.current?.scrollBy({ left: -360, behavior: 'smooth' })}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="icon-button"
                  title="Next screenshot"
                  onClick={() => screenshots.current?.scrollBy({ left: 360, behavior: 'smooth' })}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            {app.screenshots.length ? (
              <div className="screenshots" ref={screenshots}>
                {app.screenshots.map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt={`${app.name} screenshot ${i + 1}`}
                    width={240}
                    height={426}
                    style={{ width: 240, height: 426, objectFit: 'contain' }}
                    loading="lazy"
                  />
                ))}
              </div>
            ) : (
              <div className="inline-empty">No screenshots are listed.</div>
            )}
          </section>
          <section className="panel">
            <div className="section-heading">
              <h2>Ratings growth</h2>
              <span className={growth !== null && growth < 0 ? 'decline' : 'muted'}>
                {growth === null
                  ? 'Collecting observations'
                  : `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`}
              </span>
            </div>
            <RatingsChart history={history} />
          </section>
          <section className="panel">
            <h2>Review insights</h2>
            <RatingDistribution app={app} />
            <div className="review-topics">
              {reviewTopics(reviews, false).map((t) => (
                <span key={t.name}>
                  {t.name}
                  <strong>{t.percent}% of low-rated sample</strong>
                </span>
              ))}
            </div>
            {reviews.length ? (
              <ReviewList reviews={reviews} />
            ) : (
              <Empty
                title="No review sample is available."
                action="Retry reviews"
                onAction={() => setRetry((v) => v + 1)}
              />
            )}
          </section>
          <section className="panel">
            <h2>Listing keywords</h2>
            <p className="muted">Word frequency in the public description, not search rankings.</p>
            {keywords.length ? (
              <div className="keyword-cloud">
                {keywords.map(([word, count]) => (
                  <span key={word}>
                    {word}
                    <strong>{count}</strong>
                  </span>
                ))}
              </div>
            ) : (
              <div className="inline-empty">No description is available for keyword analysis.</div>
            )}
          </section>
          <section className="panel">
            <h2>About this app</h2>
            <details>
              <summary>Read store description</summary>
              <p className="description">{app.description || 'Not listed'}</p>
            </details>
          </section>
        </div>
        <aside className="detail-aside">
          <section className="panel stats-panel">
            <h2>Public signals</h2>
            <dl>
              <div>
                <dt>Store rating</dt>
                <dd>{app.rating?.toFixed(1) ?? '—'} /5</dd>
              </div>
              <div>
                <dt>Quality · rating-derived</dt>
                <dd>{app.rating !== null ? (app.rating * 2).toFixed(1) : '—'} /10</dd>
              </div>
              <div>
                <dt>Opportunity</dt>
                <dd>{score ?? '—'} /10</dd>
              </div>
              <div>
                <dt>Public ratings</dt>
                <dd>{app.ratings !== null ? compact(app.ratings) : '—'}</dd>
              </div>
              <div>
                <dt>Launched</dt>
                <dd>{dateLabel(app.launched)}</dd>
              </div>
            </dl>
            {growth === null && (
              <p className="muted">
                Opportunity is provisional until growth observations are available.
              </p>
            )}
          </section>
          <section className="panel">
            <h2>Revenue model</h2>
            <dl>
              <div>
                <dt>In-app purchases</dt>
                <dd>
                  {app.offersIAP === null ? 'Unknown' : app.offersIAP ? 'Listed' : 'Not listed'}
                </dd>
              </div>
              <div>
                <dt>Ads</dt>
                <dd>
                  {app.adSupported === null ? 'Unknown' : app.adSupported ? 'Listed' : 'Not listed'}
                </dd>
              </div>
              <div>
                <dt>Default paid conversion</dt>
                <dd>6% assumed</dd>
              </div>
            </dl>
            <button className="secondary full" onClick={() => props.estimate(app)}>
              Edit estimate
            </button>
          </section>
          <section className="panel">
            <h2>Signals & benchmarks</h2>
            {insights.map((insight) => (
              <p className="insight" key={`${insight.badge}-${insight.text}`}>
                <strong>{insight.badge}</strong>
                {insight.text}
              </p>
            ))}
            <p className="muted">No independently verified revenue benchmarks are available.</p>
          </section>
          <section className="panel">
            <h2>Developer</h2>
            <button
              className="text-button"
              onClick={() => props.developer(app.developerId ?? app.developer)}
            >
              {app.developer}
              <ArrowRight size={15} />
            </button>
            <button
              className="secondary full"
              onClick={() =>
                void desktop.openStore(app.id).catch((e) => setSecondaryError(message(e)))
              }
            >
              <ExternalLink size={15} />
              Open Google Play
            </button>
          </section>
          <section className="panel">
            <div className="section-heading">
              <h2>Similar apps</h2>
              <button
                className="icon-button"
                title="Reload similar apps"
                onClick={() => setRetry((v) => v + 1)}
              >
                <RefreshCw size={16} />
              </button>
            </div>
            {similar.length ? (
              similar.map((a) => (
                <button className="similar-row" key={a.id} onClick={() => props.open(a)}>
                  <AppIcon app={a} size={36} />
                  <span>
                    {a.name}
                    <small>{a.developer}</small>
                  </span>
                  <ArrowRight size={15} />
                </button>
              ))
            ) : (
              <div className="inline-empty">
                Related apps will appear here.
                <button className="text-button" onClick={() => setRetry((v) => v + 1)}>
                  Retry
                </button>
              </div>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
