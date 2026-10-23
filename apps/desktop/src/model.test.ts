import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adaptApp, automaticScenario, estimate } from '@appscout/core';
import { modeled } from './model';

const app = adaptApp({
  appId: 'com.example.model',
  title: 'An application with a long name for research',
  minInstalls: 100000,
  offersIAP: true,
  adSupported: true,
});

void test('Listed streams retain the shared formula and six percent default', () => {
  const model = modeled(app);
  assert.equal(model.inputs.payingPercent, 6);
  assert.deepEqual(model.result, estimate(automaticScenario(app)!.inputs));
  assert.equal(model.dau, Math.round(model.inputs.monthlyActive * 0.2));
});

void test('Every monetization flag combination returns a finite estimate', () => {
  for (const offersIAP of [true, false, null]) {
    for (const adSupported of [true, false, null]) {
      const model = modeled({ ...app, offersIAP, adSupported });
      assert.ok(Number.isFinite(model.result.mid));
      assert.equal(model.inputs.payingPercent, offersIAP === false ? 0 : 6);
      assert.equal(model.inputs.impressions, adSupported === false ? 0 : 40);
      if (offersIAP === null || adSupported === null) {
        assert.equal(model.basis, 'Assumed monetization');
        assert.match(model.note, /not confirmed earnings/);
      }
    }
  }
});

void test('Confirmed absent streams yield zero, not unavailable or fabricated revenue', () => {
  const model = modeled({ ...app, offersIAP: false, adSupported: false });
  assert.equal(model.result.mid, 0);
  assert.match(model.note, /other revenue is not included/);
});

void test('Missing scale uses an explicitly labeled, editable illustrative audience', () => {
  for (const installs of [null, NaN, Infinity]) {
    const model = modeled({ ...app, installs });
    assert.equal(model.inputs.monthlyActive, 1000);
    assert.equal(model.basis, 'Illustrative audience');
    assert.match(model.note, /assumes 1,000 monthly active users/);
    assert.ok(Number.isFinite(model.result.mid));
  }
});

void test('A reported zero install count does not create an illustrative audience', () => {
  const model = modeled({ ...app, installs: 0 });
  assert.equal(model.inputs.monthlyActive, 0);
  assert.equal(model.result.mid, 0);
  assert.equal(model.basis, 'Listing-based model');
});

void test('Saved custom assumptions override all automatic defaults, including zero', () => {
  const custom = {
    monthlyActiveLow: 100,
    monthlyActive: 500,
    monthlyActiveHigh: 1000,
    payingPercent: 0,
    monthlySpend: 0,
    impressions: 0,
    ecpm: 0,
  };
  const model = modeled({ ...app, installs: null }, custom);
  assert.deepEqual(model.inputs, custom);
  assert.equal(model.basis, 'Custom assumptions');
  assert.equal(model.result.mid, 0);
  assert.equal(model.note, '');
});
