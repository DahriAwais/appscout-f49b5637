import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, Link, useLocalSearchParams, router } from 'expo-router';
import { Input, Label, FieldError, TextField } from 'heroui-native';
import { GlassButton as Button } from '@/components/GlassControls';
import { ScenarioChart } from '@/components/EstimateVisuals';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as c } from '@/lib/theme';
import { automaticScenario, estimate, type Scenario, type ScoutApp } from '@/lib/scout';
import { useScout, selection } from '@/lib/store';
import { useScoutHydrated } from '@/lib/useScoutHydrated';
import { usePlayDetail } from '@/lib/play-store';
import { Txt, AppIcon, LoadingRows } from '@/components/ScoutUI';
import { RevenueAssumptions } from '@/components/RevenueAssumptions';

const fields: { key: keyof Scenario; label: string; max?: number; group: string }[] = [
  { key: 'monthlyActiveLow', label: 'Active users · low', group: 'Monthly audience' },
  { key: 'monthlyActive', label: 'Active users · mid', group: 'Monthly audience' },
  { key: 'monthlyActiveHigh', label: 'Active users · high', group: 'Monthly audience' },
  { key: 'payingPercent', label: 'Paying users (%)', max: 100, group: 'Purchases / subscriptions' },
  { key: 'monthlySpend', label: 'Monthly spend per payer ($)', group: 'Purchases / subscriptions' },
  { key: 'impressions', label: 'Monthly impressions per user', group: 'Advertising' },
  { key: 'ecpm', label: 'Revenue per 1,000 impressions ($)', group: 'Advertising' },
];
function fieldValues(inputs?: Scenario): Record<keyof Scenario, string> {
  return {
    monthlyActiveLow: inputs ? String(inputs.monthlyActiveLow) : '',
    monthlyActive: inputs ? String(inputs.monthlyActive) : '',
    monthlyActiveHigh: inputs ? String(inputs.monthlyActiveHigh) : '',
    payingPercent: String(inputs?.payingPercent ?? 0),
    monthlySpend: String(inputs?.monthlySpend ?? 0),
    impressions: String(inputs?.impressions ?? 0),
    ecpm: String(inputs?.ecpm ?? 0),
  };
}
const usd = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const parse = (value: string) => Number(value.trim().replace(/,/g, ''));

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
  const inset = useSafeAreaInsets();
  const [values, setValues] = useState(() => fieldValues(stored?.inputs ?? automatic?.inputs));
  const [custom, setCustom] = useState(Boolean(stored) || !automatic);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [sourceKey, setSourceKey] = useState(app?.fetchedAt);
  // A late real listing can prefill untouched fields, never erase a user's edits.
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
  const ordered =
    inputs.monthlyActiveLow <= inputs.monthlyActive &&
    inputs.monthlyActive <= inputs.monthlyActiveHigh;
  const calculated = !invalid && ordered ? estimate(inputs) : null;
  const canModelRevenue = custom || app?.offersIAP === true || app?.adSupported === true;
  const result =
    canModelRevenue && calculated && Object.values(calculated).every(Number.isFinite)
      ? calculated
      : null;
  const submit = () => {
    if (!result) {
      setError(
        invalid
          ? `${invalid.label}: enter ${invalid.max ? 'a number from 0 to 100' : 'a valid non-negative number'}.`
          : !ordered
            ? 'Active users must follow low ≤ mid ≤ high.'
            : !canModelRevenue
              ? 'No ads or purchases are listed. Enter your own monetization assumptions.'
              : 'These values are too large. Enter smaller numbers.',
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setSaving(true);
    save(id, inputs, result.mid);
    router.dismissTo({ pathname: '/app/[id]', params: { id } });
  };
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
          style={{ backgroundColor: c.moneySoft, padding: 18, borderRadius: 24, marginBottom: 18 }}
        >
          <Txt
            style={{
              color: c.money,
              fontSize: 11,
              fontFamily: 'Inter_600SemiBold',
              marginBottom: 8,
            }}
          >
            Estimated by AppScout
          </Txt>
          <Txt style={{ color: c.money, fontSize: 12 }}>Estimated monthly revenue · USD</Txt>
          <Txt
            adjustsFontSizeToFit
            numberOfLines={result ? 1 : 2}
            style={{
              fontFamily: 'Inter_700Bold',
              color: c.money,
              fontSize: result ? 30 : 20,
              marginTop: 8,
            }}
          >
            {result
              ? usd(result.mid)
              : automatic && !canModelRevenue
                ? 'No listed revenue stream'
                : 'Enter your audience'}
          </Txt>
          <View style={{ gap: 8, marginTop: 16 }}>
            {(['low', 'mid', 'high'] as const).map((key) => (
              <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Txt style={{ color: c.money, fontSize: 11, width: 32 }}>
                  {key === 'low' ? 'Low' : key === 'mid' ? 'Mid' : 'High'}
                </Txt>
                <Txt
                  style={{ flex: 1, color: c.money, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}
                >
                  {result ? usd(result[key]) : '—'}
                </Txt>
              </View>
            ))}
          </View>
          {result && <ScenarioChart result={result} />}
          <Txt style={{ color: c.money, fontSize: 11, marginTop: 16 }}>
            Low confidence · {custom ? 'your assumptions' : 'automatic assumptions'}
          </Txt>
        </View>
        <Txt style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>
          Ads and purchases are modeled monthly revenue, not verified subscription MRR. Values
          update as you edit.
        </Txt>
        {(!app || failed) && (
          <View style={{ gap: 8, marginTop: 14 }}>
            <Txt style={{ color: c.muted, fontSize: 12 }}>
              {failed
                ? 'Store data could not refresh. You can still calculate with your own assumptions.'
                : 'Loading store data. You can enter your own assumptions now.'}
            </Txt>
            <Button size="sm" variant="secondary" isDisabled={refreshing} onPress={retry}>
              <Button.Label>{refreshing ? 'Loading…' : 'Retry store data'}</Button.Label>
            </Button>
          </View>
        )}
        {automatic && (
          <Button
            size="sm"
            variant="secondary"
            style={{ alignSelf: 'flex-start', marginTop: 14 }}
            onPress={() => {
              setValues(fieldValues(automatic.inputs));
              setCustom(false);
              setDirty(false);
              setError('');
              selection();
            }}
          >
            <Button.Label>Use automatic defaults</Button.Label>
          </Button>
        )}
        {fields.map((f, i) => (
          <View key={f.key}>
            {(i === 0 || fields[i - 1].group !== f.group) && (
              <Txt
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 16,
                  marginTop: 24,
                  marginBottom: 14,
                }}
              >
                {f.group}
              </Txt>
            )}
            <TextField
              style={{ gap: 6, marginBottom: 14 }}
              isInvalid={Boolean(error && invalid?.key === f.key)}
            >
              <Label>{f.label}</Label>
              <Input
                accessibilityLabel={f.label}
                keyboardType="decimal-pad"
                value={values[f.key]}
                onChangeText={(value) => {
                  setValues((v) => ({ ...v, [f.key]: value }));
                  setCustom(true);
                  setDirty(true);
                  setError('');
                }}
                placeholder="Enter a number"
              />
            </TextField>
          </View>
        ))}
        <Txt style={{ color: c.muted, fontSize: 12 }}>
          Use 0 for a revenue stream that does not apply.
        </Txt>
        {error ? <FieldError isInvalid>{error}</FieldError> : null}
        {result && (
          <View style={{ gap: 10, marginTop: 24, marginBottom: 24 }}>
            <Txt style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>
              Calculation breakdown
            </Txt>
            <Txt>Purchases / subscriptions: {usd(result.purchases)}</Txt>
            <Txt style={{ color: c.muted, fontSize: 12 }}>
              {inputs.monthlyActive.toLocaleString()} × {inputs.payingPercent}% ×{' '}
              {usd(inputs.monthlySpend)}
            </Txt>
            <Txt>Advertising: {usd(result.ads)}</Txt>
            <Txt style={{ color: c.muted, fontSize: 12 }}>
              {inputs.monthlyActive.toLocaleString()} × {inputs.impressions} ÷ 1,000 ×{' '}
              {usd(inputs.ecpm)}
            </Txt>
          </View>
        )}
        {app && (
          <RevenueAssumptions app={app} inputs={result ? inputs : undefined} custom={custom} />
        )}
        <Link href="/methodology" style={{ color: c.accent, marginTop: 18 }}>
          How we estimate
        </Link>
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
      <Stack.Screen options={{ title: 'MRR estimator', headerBackVisible: true }} />
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
