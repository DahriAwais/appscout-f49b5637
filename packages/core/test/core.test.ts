import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  adaptApp,
  automaticScenario,
  DEFAULT_PAID_CONVERSION,
  estimate,
  opportunityScore,
  ratingGrowth,
  reviewTrend,
} from '../src/index';
const app = adaptApp({
  appId: 'com.example.test',
  title: 'A realistic long application title for compact cards',
  minInstalls: 1000000,
  offersIAP: true,
  adSupported: true,
  score: 4.2,
  released: '2020-01-01',
  updated: 1700000000000,
});
void test('Default paid conversion is 6% for listed purchases only', () => {
  assert.equal(DEFAULT_PAID_CONVERSION, 6);
  assert.equal(automaticScenario(app)?.inputs.payingPercent, 6);
  assert.equal(automaticScenario({ ...app, offersIAP: false })?.inputs.payingPercent, 0);
});
void test('Model preserves ad + purchase math and internal uncertainty', () => {
  assert.deepEqual(
    estimate({
      monthlyActiveLow: 1000,
      monthlyActive: 5000,
      monthlyActiveHigh: 15000,
      payingPercent: 6,
      monthlySpend: 5,
      impressions: 40,
      ecpm: 2,
    }),
    { purchases: 1500, ads: 400, mid: 1900, low: 380, high: 5700 },
  );
});
void test('Missing installs never creates invented revenue', () =>
  assert.equal(automaticScenario({ ...app, installs: null }), null));
void test('Opportunity uses /10 and sparse history is not a growth claim', () => {
  const score = opportunityScore(app, []);
  assert.ok(score !== null && score >= 0 && score <= 10);
  assert.equal(ratingGrowth([]), null);
});
void test('Sparse reviews never fabricate a history chart', () =>
  assert.deepEqual(reviewTrend([], { low: 1, mid: 2, high: 3 }, 6), []));
void test('Adapter preserves missing facts and source date', () => {
  const minimal = adaptApp({ appId: 'com.example.empty', title: 'Empty' }, false);
  assert.equal(minimal.installs, null);
  assert.equal(minimal.offersIAP, null);
  assert.equal(minimal.metadataState, 'loading');
  assert.deepEqual(minimal.screenshots, []);
});
