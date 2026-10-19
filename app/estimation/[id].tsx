import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, Link, useLocalSearchParams, router } from 'expo-router';
import { Input, Label, FieldError, TextField, Slider } from 'heroui-native';
import { GlassButton as Button } from '@/components/GlassControls';
import { RevenueHero } from '@/components/RevenueHero';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as c } from '@/lib/theme';
import { automaticScenario, estimate, money, type Scenario, type ScoutApp } from '@/lib/scout';
import { useScout, selection } from '@/lib/store';
import { useScoutHydrated } from '@/lib/useScoutHydrated';
import { usePlayDetail, usePlayReviews } from '@/lib/play-store';
import { Txt, AppIcon, LoadingRows } from '@/components/ScoutUI';
import { RevenueAssumptions } from '@/components/RevenueAssumptions';
const fields: {
  key: Exclude<keyof Scenario, 'monthlyActive'>;
  label: string;
  max?: number;
  step: number;
}[] = [
  { key: 'monthlyActiveLow', label: 'Est. monthly audience · from', step: 100 },
  { key: 'monthlyActiveHigh', label: 'Est. monthly audience · to', step: 100 },
  { key: 'payingPercent', label: 'Est. paying users (%)', max: 100, step: 0.1 },
  { key: 'monthlySpend', label: 'Est. spend per payer ($/mo)', step: 0.5 },
  { key: 'impressions', label: 'Est. ad impressions per user /mo', step: 1 },
  { key: 'ecpm', label: 'Est. revenue per 1,000 ads ($)', step: 0.1 },
];
function fieldValues(s?: Scenario): Record<keyof Scenario, string> {
  return {
    monthlyActiveLow: s ? String(s.monthlyActiveLow) : '',
    monthlyActive: s ? String(s.monthlyActive) : '',
    monthlyActiveHigh: s ? String(s.monthlyActiveHigh) : '',
    payingPercent: String(s?.payingPercent ?? 0),
    monthlySpend: String(s?.monthlySpend ?? 0),
    impressions: String(s?.impressions ?? 0),
    ecpm: String(s?.ecpm ?? 0),
  };
}
const parse = (s: string) => Number(s.trim().replace(/,/g, ''));
function ScenarioForm({
  id,
  app,
  retry,
  refreshing,
  failed,
}: {
  id: string;
  app?: ScoutApp;
  retry: () => void;
  refreshing: boolean;
  failed: boolean;
}) {
  const stored = useScout((s) => s.scenarios[id]);
  const save = useScout((s) => s.saveScenario);
  const automatic = app ? automaticScenario(app) : null;
  const reviews = usePlayReviews(id);
  const inset = useSafeAreaInsets();
  const [values, setValues] = useState(() => fieldValues(stored?.inputs ?? automatic?.inputs));
  const [custom, setCustom] = useState(Boolean(stored) || !automatic);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [net, setNet] = useState(false);
  const [fee, setFee] = useState(stored?.feePercent ?? 15);
  const [sourceKey, setSourceKey] = useState(app?.fetchedAt);
  if (sourceKey !== app?.fetchedAt) {
    setSourceKey(app?.fetchedAt);
    if (!dirty && !stored && automatic) {
      setValues(fieldValues(automatic.inputs));
      setCustom(false);
    }
  }
  const inputs: Scenario = {
    monthlyActiveLow: parse(values.monthlyActiveLow),
    monthlyActive: parse(values.monthlyActive),
    monthlyActiveHigh: parse(values.monthlyActiveHigh),
    payingPercent: parse(values.payingPercent),
    monthlySpend: parse(values.monthlySpend),
    impressions: parse(values.impressions),
    ecpm: parse(values.ecpm),
  };
  const invalid = fields.find(
    (f) =>
      values[f.key].trim() === '' ||
      !Number.isFinite(inputs[f.key]) ||
      inputs[f.key] < 0 ||
      (f.max !== undefined && inputs[f.key] > f.max),
  );
  const ordered = inputs.monthlyActiveLow <= inputs.monthlyActiveHigh;
  const valid =
    !invalid &&
    ordered &&
    Number.isFinite(inputs.monthlyActive) &&
    inputs.monthlyActive >= inputs.monthlyActiveLow &&
    inputs.monthlyActive <= inputs.monthlyActiveHigh;
  const canModelRevenue = custom || app?.offersIAP === true || app?.adSupported === true;
  const gross = valid && canModelRevenue ? estimate(inputs) : null;
  const result =
    gross && Object.values(gross).every(Number.isFinite)
      ? net
        ? estimate({ ...inputs, monthlySpend: inputs.monthlySpend * (1 - fee / 100) })
        : gross
      : null;
  const update = (key: keyof Scenario, value: string) => {
    setValues((v) => {
      const next = { ...v, [key]: value };
      if (key === 'monthlyActiveLow' || key === 'monthlyActiveHigh')
        next.monthlyActive = String(
          (parse(next.monthlyActiveLow) + parse(next.monthlyActiveHigh)) / 2,
        );
      return next;
    });
    setCustom(true);
    setDirty(true);
    setError('');
  };
  const submit = () => {
    if (!gross || !result) {
      setError(
        invalid
          ? `${invalid.label}: enter a valid non-negative number${invalid.max ? ' up to 100' : ''}.`
          : !ordered
            ? 'Audience range must start at the smaller value.'
            : !canModelRevenue
              ? 'No ads or purchases are listed. Enter your own revenue assumptions.'
              : 'Enter a valid audience range.',
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setSaving(true);
    save(id, inputs, gross.mid, fee);
    router.dismissTo({ pathname: '/app/[id]', params: { id } });
  };
  const purchasesPerUser =
    (inputs.payingPercent / 100) * inputs.monthlySpend * (net ? 1 - fee / 100 : 1);
  const adsPerUser = (inputs.impressions / 1000) * inputs.ecpm;
  return (
    <>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      >
        <Link
          href={{ pathname: '/app/[id]', params: { id } }}
          style={{ color: c.accent, fontSize: 12, marginBottom: 14 }}
        >
          Back to app
        </Link>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 16 }}>
          {app && <AppIcon app={app} size={40} />}
          <Txt style={{ flex: 1, fontSize: 16, fontFamily: 'Inter_600SemiBold' }}>
            {app?.name ?? id}
          </Txt>
        </View>
        <View
          style={{
            flexDirection: 'row',
            gap: 6,
            alignSelf: 'center',
            padding: 4,
            borderRadius: 24,
            backgroundColor: c.glassTint,
            marginBottom: 16,
          }}
        >
          {[false, true].map((n) => (
            <Button
              key={String(n)}
              size="sm"
              accessibilityState={{ selected: net === n }}
              onPress={() => {
                setNet(n);
                selection();
              }}
              style={{ backgroundColor: net === n ? c.glassSelected : c.glassTint, minWidth: 90 }}
            >
              <Button.Label style={{ color: c.glassBlue }}>{n ? 'Net' : 'Gross'}</Button.Label>
            </Button>
          ))}
        </View>
        <RevenueHero
          result={result}
          app={app}
          reviews={reviews.data?.reviews}
          reviewError={Boolean(reviews.error || reviews.data?.error)}
          onRetryReviews={() => void reviews.refetch()}
          loading={!app && refreshing}
        />
        <Txt style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>
          Est. {net ? 'net' : 'gross'} monthly revenue · USD. Assumption-based, not verified
          subscription MRR.
          {net
            ? ' Net deducts the assumed store fee from purchases only; taxes and operating costs are excluded.'
            : ''}
        </Txt>
        {(!app || failed) && (
          <View style={{ gap: 8, marginTop: 14 }}>
            <Txt style={{ color: c.muted, fontSize: 12 }}>
              {failed
                ? 'Store data could not refresh. Enter your own assumptions or retry.'
                : 'Loading store data. You can enter your own assumptions now.'}
            </Txt>
            <Button size="sm" isDisabled={refreshing} onPress={retry}>
              <Button.Label>{refreshing ? 'Loading…' : 'Retry store data'}</Button.Label>
            </Button>
          </View>
        )}
        <View
          style={{
            marginTop: 26,
            marginBottom: 14,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Txt style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17 }}>Adjust assumptions</Txt>
          {automatic && (
            <Button
              size="sm"
              onPress={() => {
                setValues(fieldValues(automatic.inputs));
                setCustom(false);
                setDirty(false);
                setError('');
                selection();
              }}
            >
              <Button.Label>Reset</Button.Label>
            </Button>
          )}
        </View>
        {fields.map((f) => {
          const number = inputs[f.key];
          const baseline = automatic?.inputs[f.key] ?? stored?.inputs[f.key] ?? 0;
          const max =
            f.max ??
            Math.max(
              f.key.startsWith('monthlyActive') ? 10000 : f.key === 'impressions' ? 200 : 50,
              baseline * 3,
              number > 0 ? number * 1.5 : 0,
            );
          return (
            <TextField
              key={f.key}
              style={{ gap: 8, marginBottom: 22 }}
              isInvalid={Boolean(error && invalid?.key === f.key)}
            >
              <Label>{f.label}</Label>
              <Input
                accessibilityLabel={f.label}
                keyboardType="decimal-pad"
                value={values[f.key]}
                onChangeText={(v) => update(f.key, v)}
                placeholder="Enter a number"
              />
              <Slider
                accessibilityLabel={f.label}
                minValue={0}
                maxValue={max}
                step={f.step}
                value={Number.isFinite(number) ? Math.min(max, Math.max(0, number)) : 0}
                onChange={(v) => {
                  if (typeof v === 'number') update(f.key, String(v));
                }}
                onChangeEnd={() => selection()}
              >
                <Slider.Track>
                  <Slider.Fill />
                  <Slider.Thumb />
                </Slider.Track>
              </Slider>
            </TextField>
          );
        })}
        {net && (
          <View style={{ gap: 10, marginBottom: 22 }}>
            <Txt>Est. store fee · {fee.toFixed(0)}%</Txt>
            <Slider
              accessibilityLabel="Est. store fee percent"
              value={fee}
              minValue={0}
              maxValue={30}
              step={1}
              onChange={(v) => {
                if (typeof v === 'number') setFee(v);
              }}
              onChangeEnd={() => selection()}
            >
              <Slider.Track>
                <Slider.Fill />
                <Slider.Thumb />
              </Slider.Track>
            </Slider>
          </View>
        )}
        <Txt style={{ color: c.muted, fontSize: 12 }}>
          Use 0 for a revenue stream that does not apply.
        </Txt>
        {error ? <FieldError isInvalid>{error}</FieldError> : null}
        {result && (
          <View style={{ gap: 10, marginTop: 24, marginBottom: 24 }}>
            <Txt style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>
              Est. revenue sources
            </Txt>
            <Txt>
              Est. purchases: {money(inputs.monthlyActiveLow * purchasesPerUser)} –{' '}
              {money(inputs.monthlyActiveHigh * purchasesPerUser)} /mo
            </Txt>
            <Txt>
              Est. advertising: {money(inputs.monthlyActiveLow * adsPerUser)} –{' '}
              {money(inputs.monthlyActiveHigh * adsPerUser)} /mo
            </Txt>
          </View>
        )}
        {app && (
          <RevenueAssumptions app={app} inputs={result ? inputs : undefined} custom={custom} />
        )}
      </ScrollView>
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: Math.max(inset.bottom, 12),
          backgroundColor: c.white,
          borderTopWidth: 1,
          borderColor: c.line,
        }}
      >
        <Button onPress={submit} isDisabled={saving}>
          <Button.Label>{saving ? 'Saving…' : 'Save estimate'}</Button.Label>
        </Button>
      </View>
    </>
  );
}
export default function EstimationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const hydrated = useScoutHydrated();
  const detail = usePlayDetail(id);
  const observed = useScout((s) => s.savedApps[id]);
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen
        options={{ title: 'MRR estimator', headerBackVisible: true, animation: 'fade' }}
      />
      {!hydrated ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <LoadingRows />
        </ScrollView>
      ) : (
        <ScenarioForm
          key={id}
          id={id}
          app={detail.data?.app ?? observed}
          retry={() => void detail.refetch()}
          refreshing={detail.isFetching}
          failed={detail.isError}
        />
      )}
    </KeyboardAvoidingView>
  );
}
