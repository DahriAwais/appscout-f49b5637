import { automaticScenario, estimate, type ScoutApp, type Scenario } from '@appscout/core';
export function modeled(app: ScoutApp, custom?: Scenario) {
  const inputs = custom ?? automaticScenario(app)?.inputs;
  return inputs && (custom || app.offersIAP === true || app.adSupported === true)
    ? { inputs, result: estimate(inputs), dau: Math.round(inputs.monthlyActive * 0.2) }
    : null;
}
