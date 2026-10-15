import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, Link, useLocalSearchParams, router } from 'expo-router';
import { Button, Input, Label, FieldError } from 'heroui-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as c } from '@/lib/theme';
import { automaticScenario, estimate, money, type Scenario, type ScoutApp } from '@/lib/scout';
import { useScout, selection } from '@/lib/store';
import { usePlayDetail } from '@/lib/play-store';
import { Txt, AppIcon, EmptyState, LoadingRows } from '@/components/ScoutUI';
import { RevenueAssumptions } from '@/components/RevenueAssumptions';
const fields: { key: keyof Scenario; label: string; max?: number }[] = [
  { key: 'monthlyActiveLow', label: 'Monthly active users · low' },
  { key: 'monthlyActive', label: 'Monthly active users · mid' },
  { key: 'monthlyActiveHigh', label: 'Monthly active users · high' },
  { key: 'payingPercent', label: 'Paying users (%)', max: 100 },
  { key: 'monthlySpend', label: 'Monthly spend per payer (USD)' },
  { key: 'impressions', label: 'Monthly ad impressions per user' },
  { key: 'ecpm', label: 'Ad revenue per 1,000 impressions (USD)' },
];
function fieldValues(inputs: Scenario | undefined): Record<keyof Scenario, string> {
  return {
    monthlyActiveLow: inputs ? String(inputs.monthlyActiveLow) : '',
    monthlyActive: inputs ? String(inputs.monthlyActive) : '',
    monthlyActiveHigh: inputs ? String(inputs.monthlyActiveHigh) : '',
    payingPercent: inputs ? String(inputs.payingPercent) : '',
    monthlySpend: inputs ? String(inputs.monthlySpend) : '',
    impressions: inputs ? String(inputs.impressions) : '',
    ecpm: inputs ? String(inputs.ecpm) : '',
  };
}
function ScenarioForm({ app }: { app: ScoutApp }) {
  const stored = useScout((s) => s.scenarios[app.id]);
  const save = useScout((s) => s.saveScenario);
  const automatic = automaticScenario(app);
  const inset = useSafeAreaInsets();
  const [values, setValues] = useState(() => fieldValues(stored?.inputs ?? automatic?.inputs));
  const [custom, setCustom] = useState(Boolean(stored));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const inputs: Scenario = {
    monthlyActiveLow: Number(values.monthlyActiveLow),
    monthlyActive: Number(values.monthlyActive),
    monthlyActiveHigh: Number(values.monthlyActiveHigh),
    payingPercent: Number(values.payingPercent),
    monthlySpend: Number(values.monthlySpend),
    impressions: Number(values.impressions),
    ecpm: Number(values.ecpm),
  };
  const complete = fields.every(
    (f) =>
      values[f.key].trim() !== '' &&
      Number.isFinite(inputs[f.key]) &&
      inputs[f.key] >= 0 &&
      (f.max === undefined || inputs[f.key] <= f.max),
  );
  const ordered =
    inputs.monthlyActiveLow <= inputs.monthlyActive &&
    inputs.monthlyActive <= inputs.monthlyActiveHigh;
  const result = complete && ordered ? estimate(inputs) : null;
  const submit = () => {
    if (!result) {
      setError(
        !complete
          ? 'Enter a valid non-negative number in every field. Use 0 for a stream that does not apply.'
          : 'Active users must follow low ≤ mid ≤ high.',
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setSaving(true);
    save(app.id, inputs, result.mid);
    router.dismissTo({ pathname: '/app/[id]', params: { id: app.id } });
  };
  return (
    <>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      >
        <Link
          href={{ pathname: '/app/[id]', params: { id: app.id } }}
          style={{ color: c.accent, fontSize: 12, marginBottom: 12 }}
        >
          Back to app
        </Link>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 16 }}>
          <AppIcon app={app} size={40} />
          <Txt style={{ flex: 1, fontSize: 16, fontFamily: 'Inter_600SemiBold' }}>{app.name}</Txt>
        </View>
        <View
          style={{ backgroundColor: c.moneySoft, padding: 16, borderRadius: 24, marginBottom: 16 }}
        >
          <Txt style={{ color: c.money, fontSize: 12 }}>Est. monthly revenue · USD</Txt>
          <Txt style={{ fontFamily: 'Inter_700Bold', color: c.money, fontSize: 28, marginTop: 6 }}>
            {result ? `${money(result.mid)}/mo est.` : 'Not estimated'}
          </Txt>
          {result && (
            <Txt style={{ color: c.money, marginTop: 6, fontSize: 12 }}>
              Low {money(result.low)} · High {money(result.high)}
            </Txt>
          )}
          <Txt style={{ color: c.money, fontSize: 11, marginTop: 8 }}>
            Low confidence · {custom ? 'your assumptions' : 'automatic assumptions'}
          </Txt>
        </View>
        <RevenueAssumptions app={app} inputs={result ? inputs : undefined} custom={custom} />
        {automatic && (
          <Button
            size="sm"
            variant="secondary"
            style={{ alignSelf: 'flex-start', marginTop: 14 }}
            onPress={() => {
              setValues(fieldValues(automatic.inputs));
              setCustom(false);
              setError('');
              selection();
            }}
          >
            <Button.Label>Use automatic defaults</Button.Label>
          </Button>
        )}
        <Txt
          style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, marginTop: 24, marginBottom: 14 }}
        >
          Edit assumptions
        </Txt>
        {fields.map((f) => (
          <View key={f.key} style={{ gap: 6, marginBottom: 14 }}>
            <Label>{f.label}</Label>
            <Input
              accessibilityLabel={f.label}
              keyboardType="decimal-pad"
              value={values[f.key]}
              onChangeText={(value) => {
                setValues((v) => ({ ...v, [f.key]: value }));
                setCustom(true);
                setError('');
              }}
              placeholder="Enter your assumption"
            />
          </View>
        ))}
        {error ? <FieldError>{error}</FieldError> : null}
        <Link href="/methodology" style={{ color: c.accent, marginTop: 12 }}>
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
          <Button.Label>{saving ? 'Saving…' : 'Save assumptions'}</Button.Label>
        </Button>
      </View>
    </>
  );
}
export default function EstimationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = usePlayDetail(id);
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerBackVisible: true }} />
      {detail.isPending ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <LoadingRows />
        </ScrollView>
      ) : detail.isError || !detail.data ? (
        <EmptyState
          title="Could not load this app"
          action="Try again"
          onPress={() => void detail.refetch()}
        />
      ) : (
        <ScenarioForm key={id} app={detail.data.app} />
      )}
    </KeyboardAvoidingView>
  );
}
