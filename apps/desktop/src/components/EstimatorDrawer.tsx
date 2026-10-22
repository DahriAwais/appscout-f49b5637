import { useEffect, useRef, useState, useMemo } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  automaticScenario,
  compact,
  estimate,
  money,
  type ScoutApp,
  type Scenario,
} from '@appscout/core';
import { message } from '../hooks';
interface Props {
  app: ScoutApp;
  custom?: Scenario;
  close: () => void;
  save: (id: string, value: Scenario) => Promise<void>;
}
const fields: {
  key: keyof Scenario;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
}[] = [
  { key: 'payingPercent', label: 'Paid conversion', min: 0, max: 20, step: 0.1, suffix: '%' },
  {
    key: 'monthlySpend',
    label: 'Monthly spend per payer',
    min: 0,
    max: 100,
    step: 0.5,
    suffix: ' USD',
  },
  {
    key: 'impressions',
    label: 'Monthly ad impressions per active user',
    min: 0,
    max: 1000,
    step: 5,
    suffix: '',
  },
  { key: 'ecpm', label: 'Ad eCPM', min: 0, max: 50, step: 0.1, suffix: ' USD' },
];
export function EstimatorDrawer({ app, custom, close, save }: Props) {
  const defaults = automaticScenario(app)?.inputs;
  const initial = custom ?? defaults;
  const [inputs, setInputs] = useState<Scenario>(
    initial ?? {
      monthlyActiveLow: 0,
      monthlyActive: 0,
      monthlyActiveHigh: 0,
      payingPercent: app.offersIAP ? 6 : 0,
      monthlySpend: app.offersIAP ? 5 : 0,
      impressions: app.adSupported ? 40 : 0,
      ecpm: app.adSupported ? 2 : 0,
    },
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const reduced = useReducedMotion();
  const container = useRef<HTMLElement>(null);
  const result = estimate(inputs);
  const data = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => {
        const conversion = i * 2;
        return { conversion, amount: estimate({ ...inputs, payingPercent: conversion }).mid };
      }),
    [inputs],
  );
  useEffect(() => {
    const previous = document.activeElement;
    container.current?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        close();
      }
      if (e.key === 'Tab') {
        const elements = container.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input,select,[tabindex="0"]',
        );
        if (!elements?.length) return;
        const first = elements[0],
          last = elements[elements.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === container.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', key, true);
    return () => {
      document.removeEventListener('keydown', key, true);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [close]);
  async function submit() {
    setBusy(true);
    setError('');
    try {
      await save(app.id, inputs);
      close();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-layer">
      <button className="scrim" aria-label="Close estimate" onClick={close} />
      <motion.aside
        ref={container}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="estimate-title"
        className="estimator-drawer"
        initial={{ x: reduced ? 0 : 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: reduced ? 0 : 24, opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <header>
          <div>
            <h2 id="estimate-title">Estimate {app.name}</h2>
            <p className="muted">Assumptions, not reported earnings</p>
          </div>
          <button className="icon-button" title="Close estimate" onClick={close}>
            <X size={20} />
          </button>
        </header>
        <div className="drawer-body">
          <div className="drawer-estimate">
            <span>Estimated monthly revenue</span>
            <strong>
              {money(result.mid)} <small>/mo</small>
            </strong>
            <span>Estimated DAU: {compact(Math.round(inputs.monthlyActive * 0.2))}</span>
          </div>
          <section>
            <h3>Conversion sensitivity</h3>
            <p className="muted">How this estimate changes with the assumed paid conversion.</p>
            <div className="standard-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="conversion" tickFormatter={(n) => `${n}%`} />
                  <YAxis width={64} tickFormatter={money} />
                  <Tooltip
                    formatter={(value) => money(Number(value))}
                    labelFormatter={(value) => `${Number(value)}% assumed conversion`}
                  />
                  <Line
                    dataKey="amount"
                    name="Modeled revenue"
                    stroke="var(--money-text)"
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive={!reduced}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
          <label className="field">
            Monthly active users
            <input
              type="number"
              min={0}
              max={1e12}
              value={inputs.monthlyActive}
              onChange={(e) => {
                const n = Math.max(0, Math.min(1e12, Number(e.target.value)));
                setInputs((v) => ({
                  ...v,
                  monthlyActive: n,
                  monthlyActiveLow: Math.min(v.monthlyActiveLow, n),
                  monthlyActiveHigh: Math.max(v.monthlyActiveHigh, n),
                }));
              }}
            />
          </label>
          {fields.map((field) => (
            <label className="slider-field" key={field.key}>
              <span>
                {field.label}
                <strong>
                  {inputs[field.key].toFixed(field.step < 1 ? 1 : 0)}
                  {field.suffix}
                </strong>
              </span>
              <input
                type="range"
                min={field.min}
                max={Math.max(field.max, inputs[field.key])}
                step={field.step}
                value={inputs[field.key]}
                onChange={(e) => setInputs((v) => ({ ...v, [field.key]: Number(e.target.value) }))}
              />
            </label>
          ))}
          <section className="assumptions">
            <h3>How we estimate</h3>
            <p>
              Purchases = monthly active users × paid conversion × monthly spend. Ads = active users
              × ad impressions × eCPM ÷ 1,000.
            </p>
            <p>
              Store installs are a cumulative lower bound. Active users, 6% paid conversion and ad
              economics are uncalibrated assumptions. DAU assumes 20% of modeled monthly active
              users. The model includes ads and purchases, so this is not verified recurring
              subscription revenue.
            </p>
            <dl>
              <div>
                <dt>Purchase revenue</dt>
                <dd>{money(result.purchases)}</dd>
              </div>
              <div>
                <dt>Ad revenue</dt>
                <dd>{money(result.ads)}</dd>
              </div>
            </dl>
          </section>
          {error && (
            <div className="error" role="alert">
              {error}
              <button onClick={() => void submit()}>Retry</button>
            </div>
          )}
        </div>
        <footer>
          <button
            className="secondary"
            disabled={busy || !defaults}
            onClick={() => {
              if (defaults) setInputs(defaults);
            }}
          >
            <RotateCcw size={15} />
            Defaults
          </button>
          <button className="primary" disabled={busy} onClick={() => void submit()}>
            {busy ? 'Saving…' : 'Save estimate'}
          </button>
        </footer>
      </motion.aside>
    </div>
  );
}
