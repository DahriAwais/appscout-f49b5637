import {
  automaticScenario,
  DEFAULT_PAID_CONVERSION,
  estimate,
  type ScoutApp,
  type Scenario,
} from '@appscout/core';

export function modeled(app: ScoutApp, custom?: Scenario) {
  const automatic = automaticScenario(app)?.inputs;
  // A missing audience uses an explicit illustrative scenario, never a store observation.
  const zeroAudience = app.installs === 0;
  const illustrativeAudience = !custom && !automatic && !zeroAudience;
  const unknownMonetization = !custom && (app.offersIAP === null || app.adSupported === null);
  const inputs: Scenario = custom ?? {
    monthlyActiveLow: automatic?.monthlyActiveLow ?? (zeroAudience ? 0 : 200),
    monthlyActive: automatic?.monthlyActive ?? (zeroAudience ? 0 : 1000),
    monthlyActiveHigh: automatic?.monthlyActiveHigh ?? (zeroAudience ? 0 : 3000),
    payingPercent: app.offersIAP === false ? 0 : DEFAULT_PAID_CONVERSION,
    monthlySpend: app.offersIAP === false ? 0 : 5,
    impressions: app.adSupported === false ? 0 : 40,
    ecpm: app.adSupported === false ? 0 : 2,
  };
  const basis = custom
    ? 'Custom assumptions'
    : illustrativeAudience
      ? 'Illustrative audience'
      : unknownMonetization
        ? 'Assumed monetization'
        : 'Listing-based model';
  const note = [
    illustrativeAudience ? 'Install data missing: assumes 1,000 monthly active users.' : '',
    unknownMonetization
      ? 'Unknown IAP/ads flags use assumed monetization, not confirmed earnings.'
      : '',
    !custom && app.offersIAP === false && app.adSupported === false
      ? 'No IAP or ads listed: $0 for these streams; other revenue is not included.'
      : '',
  ]
    .filter(Boolean)
    .join(' ');
  return {
    inputs,
    result: estimate(inputs),
    dau: Math.round(inputs.monthlyActive * 0.2),
    basis,
    note,
  };
}
