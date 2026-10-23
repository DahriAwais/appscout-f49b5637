import { useState, useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  ComposedChart,
} from 'recharts';
import { motion, useReducedMotion } from 'framer-motion';
import { SlidersHorizontal, TrendingUp, Download, Users } from 'lucide-react';
import {
  compact,
  money,
  reviewTrend,
  estimate,
  automaticScenario,
  type ScoutApp,
  type Scenario,
  type Snapshot,
  type StoreReview,
} from '@appscout/core';
import { modeled } from '../model';
interface Props {
  app: ScoutApp;
  custom?: Scenario;
  history: Snapshot[];
  reviews: StoreReview[];
  onEstimate: () => void;
}
export function RevenueHero({ app, custom, history, reviews, onEstimate }: Props) {
  const model = useMemo(() => modeled(app, custom), [app, custom]);
  const dailyActive = model.dau;
  const [metric, setMetric] = useState<'mrr' | 'downloads' | 'dau'>('mrr');
  const [months, setMonths] = useState(6);
  const reduced = useReducedMotion();
  const data = useMemo(() => {
    if (metric === 'mrr')
      return reviewTrend(reviews, model.result, months).map((p) => ({
        label: p.label,
        value: p.mid,
        band: [p.low, p.high],
        count: p.count,
      }));
    const observations = history
      .slice(-Math.round(months * 31))
      .filter((h) => h.min_installs !== null)
      .map((h) => {
        const observed = { ...app, installs: h.min_installs };
        const inputs = automaticScenario(observed, new Date(h.day).getTime())?.inputs;
        const active =
          custom && app.installs && h.min_installs !== null
            ? (custom.monthlyActive * h.min_installs) / app.installs
            : (inputs?.monthlyActive ?? modeled(observed).inputs.monthlyActive);
        return {
          label: new Date(h.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: metric === 'downloads' ? h.min_installs : Math.round(active * 0.2),
        };
      })
      .filter((point) => point.value !== null);
    if (observations.length) return observations;
    const active = model.inputs;
    const baseline = metric === 'downloads' ? app.installs : Math.round(active.monthlyActive * 0.2);
    return baseline !== null
      ? [
          {
            label:
              metric === 'dau'
                ? model.basis === 'Illustrative audience'
                  ? 'Assumed audience'
                  : 'Modeled DAU baseline'
                : 'Listing baseline',
            value: baseline,
          },
        ]
      : [];
  }, [app, history, reviews, months, metric, model, custom]);
  const sensitivity = metric === 'mrr' && data.length < 2;
  const sensitivityPurchases = !!model.inputs.monthlySpend;
  const chartData = sensitivity
    ? Array.from({ length: 11 }, (_, i) => {
        const assumption =
          (i / 10) *
          (sensitivityPurchases
            ? Math.max(12, model.inputs.payingPercent * 2)
            : Math.max(4, model.inputs.ecpm * 2));
        const result = estimate({
          ...model.inputs,
          ...(sensitivityPurchases ? { payingPercent: assumption } : { ecpm: assumption }),
        });
        return {
          label: sensitivityPurchases ? `${assumption.toFixed(1)}%` : `$${assumption.toFixed(1)}`,
          value: result.mid,
          band: [result.low, result.high],
        };
      })
    : data;
  return (
    <section className="revenue-outer">
      <motion.div
        aria-hidden
        className="orb orb-one"
        animate={reduced ? {} : { x: [0, 28, 0], y: [0, 16, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="orb orb-two"
        animate={reduced ? {} : { x: [0, -24, 0], y: [0, -18, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="revenue-glass">
        <div className="section-heading">
          <span className="money-label">Estimated monthly revenue</span>
          <button className="icon-button" title="Edit revenue assumptions" onClick={onEstimate}>
            <SlidersHorizontal size={18} />
          </button>
        </div>
        <button className="mrr-number" title="Open estimation drawer" onClick={onEstimate}>
          <motion.span
            key={Math.round(model.result.mid)}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
          >
            {money(model.result.mid)}
          </motion.span>
          <span className="per-month"> /mo</span>
        </button>
        <p className="provenance">{model.basis} · Not verified subscription MRR</p>
        {model.note && <p className="provenance small">{model.note}</p>}
        <div className="hero-stats">
          <button
            className={metric === 'downloads' ? 'selected' : ''}
            onClick={() => setMetric('downloads')}
          >
            <Download size={17} />
            <span>
              Total downloads
              <strong>
                {app.installsText ??
                  (app.installs !== null ? `${compact(app.installs)}+` : 'Not listed')}
              </strong>
            </span>
          </button>
          <button className={metric === 'dau' ? 'selected' : ''} onClick={() => setMetric('dau')}>
            <Users size={17} />
            <span>
              Estimated DAU
              <strong>{compact(dailyActive)}</strong>
            </span>
          </button>
          <button className={metric === 'mrr' ? 'selected' : ''} onClick={() => setMetric('mrr')}>
            <TrendingUp size={17} />
            <span>
              Revenue model
              <strong>
                {custom ? 'Custom' : model.basis === 'Listing-based model' ? 'Listing' : 'Assumed'}
              </strong>
            </span>
          </button>
        </div>
        <div className="chart-toolbar">
          <span>
            {sensitivity
              ? `${sensitivityPurchases ? 'Conversion' : 'Ad eCPM'} sensitivity · Not a history chart`
              : metric === 'mrr'
                ? 'Review-activity revenue proxy'
                : metric === 'downloads'
                  ? 'Observed install lower bound'
                  : 'Modeled daily active users'}
          </span>
          {!sensitivity && (
            <div className="segments">
              {[3, 6, 12].map((n) => (
                <button
                  key={n}
                  className={months === n ? 'selected' : ''}
                  onClick={() => setMonths(n)}
                >
                  {n === 12 ? '1Y' : `${n}M`}
                </button>
              ))}
            </div>
          )}
        </div>
        {chartData.length ? (
          <div className="hero-chart">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--green-grid)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={36} />
                <YAxis
                  tickFormatter={metric === 'mrr' ? money : compact}
                  width={62}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) =>
                    metric === 'mrr' ? money(Number(value)) : compact(Number(value))
                  }
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: 'var(--green-grid)',
                    background: 'var(--white)',
                    color: 'var(--slate)',
                  }}
                />
                {metric === 'mrr' && (
                  <Area
                    type="monotone"
                    dataKey="band"
                    fill="var(--emerald)"
                    fillOpacity={0.09}
                    stroke="none"
                    name="Assumption band"
                    tooltipType="none"
                    isAnimationActive={!reduced}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  name={
                    metric === 'mrr'
                      ? 'Modeled revenue'
                      : metric === 'downloads'
                        ? 'Minimum installs'
                        : 'Modeled DAU'
                  }
                  stroke="var(--money-text)"
                  strokeWidth={3}
                  dot={chartData.length === 1 ? { r: 5, fill: 'var(--money-text)' } : false}
                  activeDot={{ r: 5 }}
                  isAnimationActive={!reduced}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="chart-empty">
            <TrendingUp size={24} />
            <span>This listing does not provide an install lower bound.</span>
            <button className="text-button" onClick={onEstimate}>
              View assumptions
            </button>
          </div>
        )}
        <p className="provenance small">
          Downloads are a store lower bound. DAU and revenue use assumptions; the chart band shows
          uncertainty.
        </p>
      </div>
    </section>
  );
}
export function RatingsChart({ history }: { history: Snapshot[] }) {
  const data = history
    .filter((h) => h.ratings !== null)
    .map((h) => ({ label: new Date(h.day).toLocaleDateString(), ratings: h.ratings }));
  return data.length > 1 ? (
    <div className="standard-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="label" minTickGap={50} />
          <YAxis tickFormatter={compact} />
          <Tooltip />
          <Area
            dataKey="ratings"
            name="Public ratings"
            stroke="var(--indigo)"
            fill="var(--indigo-soft)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  ) : (
    <div className="inline-empty">
      <TrendingUp size={20} />
      Daily rating observations will appear here after your next watchlist refresh.
    </div>
  );
}
export function RatingDistribution({ app }: { app: ScoutApp }) {
  const data = Object.entries(app.histogram ?? {}).map(([rating, count]) => ({
    rating: `${rating} stars`,
    count,
  }));
  return data.length ? (
    <div className="distribution">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <XAxis type="number" tickFormatter={compact} />
          <YAxis type="category" dataKey="rating" width={60} />
          <Tooltip />
          <Bar dataKey="count" name="Ratings" fill="var(--indigo)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  ) : (
    <p className="muted">Rating breakdown is not listed.</p>
  );
}
