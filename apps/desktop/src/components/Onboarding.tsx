import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Camera,
  Check,
  Gamepad2,
  MapPin,
  Music2,
  Search,
  Sparkles,
} from 'lucide-react';
import { message } from '../hooks';
import './Onboarding.css';

const headlines = ['Discover global potential.', 'See revenue potential.', 'Find your next idea.'];
const globe = new URL('../../../mobile/assets/globe.png', import.meta.url).href;

function GlobeVisual() {
  return (
    <div className="onboarding-globe" aria-hidden="true">
      <img src={globe} width={360} height={360} alt="" />
      {[
        { label: '$48K', Icon: Music2 },
        { label: '$12K', Icon: Camera },
        { label: '$8K', Icon: Gamepad2 },
      ].map(({ label, Icon }, index) => (
        <div key={label} className={`onboarding-pin pin-${index}`}>
          <div className="onboarding-glass">
            <Icon size={22} strokeWidth={1.8} />
            <strong>{label}</strong>
          </div>
          <MapPin size={18} strokeWidth={1.8} />
        </div>
      ))}
    </div>
  );
}
function RevenueVisual() {
  const reduced = useReducedMotion();
  const [amount, setAmount] = useState(0);
  useEffect(() => {
    if (reduced) return undefined;
    const start = Date.now();
    const timer = setInterval(() => {
      const progress = Math.min(1, (Date.now() - start) / 1600);
      setAmount(Math.round(12400 * (1 - (1 - progress) ** 3)));
      if (progress === 1) clearInterval(timer);
    }, 32);
    return () => clearInterval(timer);
  }, [reduced]);
  return (
    <div className="onboarding-revenue-wrap">
      <div className="onboarding-glass onboarding-revenue">
        <div className="onboarding-app-label">
          <img src="./startup-logo.svg" width={48} height={48} alt="" />
          <strong>Your next app</strong>
          <Sparkles size={22} strokeWidth={1.8} />
        </div>
        <small>Illustrative estimate</small>
        <div
          className="onboarding-amount"
          aria-label="Illustrative estimate: 12,400 dollars per month"
        >
          ${(reduced ? 12400 : amount).toLocaleString('en-US')}
          <span>/mo</span>
        </div>
        <svg viewBox="0 0 250 94" width="100%" height="125" aria-hidden="true">
          {[20, 50, 80].map((y) => (
            <line key={y} x1="0" x2="250" y1={y} y2={y} className="onboarding-chart-grid" />
          ))}
          <path
            d="M5 78 C30 78 35 63 55 65 S85 50 105 54 S135 35 155 40 S190 12 210 19 S235 8 245 9 L245 90 L5 90Z"
            className="onboarding-chart-area"
          />
          <path
            d="M5 78 C30 78 35 63 55 65 S85 50 105 54 S135 35 155 40 S190 12 210 19 S235 8 245 9"
            className="onboarding-chart-line"
            pathLength="1"
          />
          <circle cx="245" cy="9" r="4" className="onboarding-chart-dot" />
        </svg>
      </div>
    </div>
  );
}
function SearchVisual() {
  return (
    <div className="onboarding-search" aria-hidden="true">
      <div className="onboarding-app-icons">
        {[
          { id: 'music', Icon: Music2 },
          { id: 'camera', Icon: Camera },
          { id: 'games', Icon: Gamepad2 },
          { id: 'check', Icon: Check },
          { id: 'sparkles', Icon: Sparkles },
          { id: 'location', Icon: MapPin },
        ].map(({ id, Icon }) => (
          <div key={id} className="onboarding-glass">
            <Icon size={34} strokeWidth={1.8} />
          </div>
        ))}
      </div>
      <div className="onboarding-lens">
        <div className="onboarding-lens-tint">
          <Sparkles size={36} strokeWidth={1.8} />
        </div>
        <Search size={140} strokeWidth={1.5} />
        <span>
          <Check size={15} /> $8K
        </span>
      </div>
    </div>
  );
}
export function Onboarding({ complete }: { complete: () => Promise<void> }) {
  const [page, setPage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const reduced = useReducedMotion();
  async function finish() {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await complete();
    } catch (failure) {
      setError(message(failure));
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="onboarding">
      <header className="onboarding-header">
        <img src="./startup-logo.svg" width={40} height={40} alt="AppScout" />
        <button
          className="onboarding-glass onboarding-skip"
          disabled={saving}
          onClick={() => void finish()}
        >
          Skip
        </button>
      </header>
      <main className="onboarding-body">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={page}
            className="onboarding-slide"
            initial={{ opacity: 0, x: reduced ? 0 : 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduced ? 0 : -10 }}
            transition={{ duration: reduced ? 0.1 : 0.22, ease: 'easeOut' }}
          >
            <div className="onboarding-art">
              {page === 0 ? <GlobeVisual /> : page === 1 ? <RevenueVisual /> : <SearchVisual />}
            </div>
            <div className="onboarding-copy">
              <h1 aria-live="polite">{headlines[page]}</h1>
              {page !== 1 && <p className="onboarding-caption">Illustrative estimates</p>}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="onboarding-footer">
        {error && (
          <div className="error" role="alert">
            {error}
            <button disabled={saving} onClick={() => void finish()}>
              Retry
            </button>
          </div>
        )}
        <div className="onboarding-dots" aria-label={`Step ${page + 1} of 3`}>
          {headlines.map((headline, index) => (
            <span key={headline} className={index === page ? 'active' : ''} />
          ))}
        </div>
        <button
          className="onboarding-glass onboarding-next"
          disabled={saving}
          onClick={() => {
            if (page === 2) void finish();
            else setPage((value) => value + 1);
          }}
        >
          {saving ? 'Opening…' : page === 2 ? 'Get Started' : 'Continue'}
          <ArrowRight size={22} strokeWidth={1.8} />
        </button>
      </footer>
    </div>
  );
}
