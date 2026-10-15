import { automaticScenario, estimate, type ScoutApp } from './scout';
import { useScout } from './store';

export function useRevenueScenario(app: ScoutApp | undefined) {
  const saved = useScout((s) => (app ? s.scenarios[app.id] : undefined));
  const observed = useScout((s) => (app ? s.savedApps[app.id] : undefined));
  // Browse responses can omit metadata; reuse real observations from a prior detail visit.
  const evidence =
    app && observed
      ? {
          ...app,
          installs: app.installs ?? observed.installs,
          launched: app.launched ?? observed.launched,
          offersIAP: app.offersIAP ?? observed.offersIAP,
          adSupported: app.adSupported ?? observed.adSupported,
        }
      : app;
  const automatic = evidence ? automaticScenario(evidence) : null;
  const inputs = saved?.inputs ?? automatic?.inputs;
  return {
    result: inputs ? estimate(inputs) : null,
    inputs,
    automatic,
    source: saved ? ('custom' as const) : automatic ? ('automatic' as const) : null,
  };
}
