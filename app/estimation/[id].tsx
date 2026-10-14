import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, Link, useLocalSearchParams, router } from 'expo-router';
import { Button, Input, Label, FieldError } from 'heroui-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as c } from '@/lib/theme';
import { estimate, money, type Scenario } from '@/lib/scout';
import { useScout } from '@/lib/store';
import { usePlayDetail } from '@/lib/play-store';
import { Txt, AppIcon, EmptyState, LoadingRows } from '@/components/ScoutUI';
const fields: { key: keyof Scenario; label: string; max?: number }[] = [
  { key: 'monthlyActiveLow', label: 'Monthly active users · low' },
  { key: 'monthlyActive', label: 'Monthly active users · mid' },
  { key: 'monthlyActiveHigh', label: 'Monthly active users · high' },
  { key: 'payingPercent', label: 'Paying users (%)', max: 100 },
  { key: 'monthlySpend', label: 'Monthly spend per payer (USD)' },
  { key: 'impressions', label: 'Monthly ad impressions per user' },
  { key: 'ecpm', label: 'Ad revenue per 1,000 impressions (USD)' },
];
export default function EstimationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = usePlayDetail(id);
  const stored = useScout((s) => s.scenarios[id]);
  const save = useScout((s) => s.saveScenario);
  const inset = useSafeAreaInsets();
  const [values, setValues] = useState<Record<keyof Scenario, string>>({
    monthlyActiveLow: stored ? String(stored.inputs.monthlyActiveLow) : '',
    monthlyActive: stored ? String(stored.inputs.monthlyActive) : '',
    monthlyActiveHigh: stored ? String(stored.inputs.monthlyActiveHigh) : '',
    payingPercent: stored ? String(stored.inputs.payingPercent) : '',
    monthlySpend: stored ? String(stored.inputs.monthlySpend) : '',
    impressions: stored ? String(stored.inputs.impressions) : '',
    ecpm: stored ? String(stored.inputs.ecpm) : '',
  });
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
    if (!complete || !ordered) {
      setError(
        !complete
          ? 'Enter a valid non-negative number in every field. Use 0 for a stream that does not apply.'
          : 'Active users must follow low ≤ mid ≤ high.',
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setSaving(true);
    save(id, inputs, estimate(inputs).mid);
    router.dismissTo({ pathname: '/app/[id]', params: { id } });
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerBackVisible: true }} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      >
        <Link
          href={{ pathname: '/app/[id]', params: { id } }}
          style={{ color: c.accent, fontSize: 12, marginBottom: 16 }}
        >
          Back to app
        </Link>
        {detail.isPending ? (
          <LoadingRows />
        ) : detail.isError ? (
          <EmptyState
            title="Could not load this app"
            action="Try again"
            onPress={() => void detail.refetch()}
          />
        ) : (
          detail.data && (
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 22 }}>
              <AppIcon app={detail.data.app} size={48} />
              <Txt style={{ flex: 1, fontSize: 18, fontFamily: 'Inter_600SemiBold' }}>
                {detail.data.app.name}
              </Txt>
            </View>
          )
        )}
        <View
          style={{ backgroundColor: c.moneySoft, padding: 20, borderRadius: 24, marginBottom: 22 }}
        >
          <Txt style={{ color: c.money, fontSize: 12 }}>Your monthly revenue scenario · USD</Txt>
          <Txt style={{ fontFamily: 'Inter_700Bold', color: c.money, fontSize: 32, marginTop: 8 }}>
            {result ? `${money(result.mid)}/mo est.` : 'Not estimated'}
          </Txt>
          {result && (
            <Txt style={{ color: c.money, marginTop: 8, fontSize: 12 }}>
              Low {money(result.low)} · High {money(result.high)}
            </Txt>
          )}
        </View>
        <Txt style={{ color: c.muted, fontSize: 12, lineHeight: 20, marginBottom: 22 }}>
          These are your assumptions, not Google Play facts. Cumulative installs do not reveal
          monthly active users. Enter 0 for purchases or ads that do not apply.
        </Txt>
        {fields.map((f) => (
          <View key={f.key} style={{ gap: 8, marginBottom: 18 }}>
            <Label>{f.label}</Label>
            <Input
              accessibilityLabel={f.label}
              keyboardType="decimal-pad"
              value={values[f.key]}
              onChangeText={(value) => {
                setValues((v) => ({ ...v, [f.key]: value }));
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
          <Button.Label>{saving ? 'Saving…' : 'Save scenario'}</Button.Label>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
