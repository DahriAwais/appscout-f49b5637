import { useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Info, Star, Users } from 'lucide-react-native';
import { PressableFeedback } from 'heroui-native';
import { Txt } from './ScoutUI';
import { GlassButton } from './GlassControls';
import { colors as c } from '@/lib/theme';
import { compact, money, type ScoutApp } from '@/lib/scout';
import { useRevenueScenario } from '@/lib/revenue';
import { selection } from '@/lib/store';

type Range = { low: number; mid: number; high: number };
function RangeBar({ ratio, color }: { ratio: number; color: string }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withTiming(ratio, { duration: 550 }));
  }, [progress, ratio]);
  const style = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return (
    <View style={{ height: 6, backgroundColor: c.line, borderRadius: 3, overflow: 'hidden' }}>
      <Animated.View style={[{ height: 6, borderRadius: 3, backgroundColor: color }, style]} />
    </View>
  );
}

// This plots scenario sensitivity, never an invented historical revenue series.
export function ScenarioChart({
  result,
  illustrative = false,
}: {
  result: Range;
  illustrative?: boolean;
}) {
  const [selected, setSelected] = useState<'low' | 'mid' | 'high'>('mid');
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withTiming(1, { duration: 600 }));
  }, [progress]);
  const style = useAnimatedStyle(() => ({ opacity: progress.value }));
  const max = Math.max(1, result.high);
  const points = [result.low, result.mid, result.high].map((value, i) => ({
    x: 14 + i * 126,
    y: 72 - Math.min(1, value / max) * 58,
  }));
  const path = points.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const active = selected === 'low' ? 0 : selected === 'mid' ? 1 : 2;
  return (
    <View style={{ gap: 8, marginTop: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <Txt style={{ color: c.money, fontSize: 11 }}>
          {illustrative ? 'Illustrative scenarios' : 'Revenue scenarios · not history'}
        </Txt>
        <Txt style={{ color: c.money, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>
          {money(result[selected])}
        </Txt>
      </View>
      <Animated.View style={style}>
        <Svg width="100%" height={86} viewBox="0 0 280 86" preserveAspectRatio="none">
          {[16, 44, 72].map((y) => (
            <Line
              key={y}
              x1={0}
              x2={280}
              y1={y}
              y2={y}
              stroke={c.money}
              strokeOpacity={0.13}
              strokeWidth={1}
            />
          ))}
          <Path d={`${path} L 266 80 L 14 80 Z`} fill={c.moneyBright} fillOpacity={0.08} />
          <Path d={path} fill="none" stroke={c.money} strokeWidth={2.5} strokeLinejoin="round" />
          {points.map((point, i) => (
            <Circle
              key={point.x}
              cx={point.x}
              cy={point.y}
              r={i === active ? 5 : 3}
              fill={c.money}
              stroke={c.moneySoft}
              strokeWidth={2}
            />
          ))}
        </Svg>
      </Animated.View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {(['low', 'mid', 'high'] as const).map((key) => (
          <GlassButton
            key={key}
            size="sm"
            onPress={() => {
              if (selected !== key) {
                setSelected(key);
                selection();
              }
            }}
            accessibilityState={{ selected: selected === key }}
            style={{ flex: 1, paddingHorizontal: 6, minHeight: 32 }}
          >
            <GlassButton.Label
              numberOfLines={1}
              style={{ fontSize: 11, color: selected === key ? c.accent : c.ink }}
            >
              {key === 'low' ? 'Low' : key === 'mid' ? 'Mid' : 'High'}
            </GlassButton.Label>
          </GlassButton>
        ))}
      </View>
    </View>
  );
}

export function AudienceQuality({ app }: { app: ScoutApp }) {
  const { dailyActive } = useRevenueScenario(app);
  const { width } = useWindowDimensions();
  const [explanation, setExplanation] = useState<'quality' | 'audience' | null>(null);
  const quality =
    app.rating !== null && Number.isFinite(app.rating)
      ? Math.max(0, Math.min(10, app.rating * 2))
      : null;
  return (
    <View style={{ gap: 10, marginBottom: 16 }}>
      <View style={{ flexDirection: width < 360 ? 'column' : 'row', gap: 10 }}>
        <View
          style={{
            flexGrow: width < 360 ? 0 : 1,
            flexBasis: width < 360 ? 'auto' : 0,
            flexShrink: 0,
            padding: 14,
            borderRadius: 20,
            backgroundColor: c.accentSoft,
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Star size={15} color={c.accent} />
            <Txt style={{ color: c.accent, flex: 1, fontSize: 12 }}>Quality score</Txt>
            <PressableFeedback
              accessibilityLabel="Explain quality score"
              onPress={() => setExplanation(explanation === 'quality' ? null : 'quality')}
              style={{ padding: 4 }}
            >
              <Info size={14} color={c.accent} />
            </PressableFeedback>
          </View>
          <Txt style={{ fontSize: 24, color: c.accent, fontFamily: 'Inter_700Bold' }}>
            {quality?.toFixed(1) ?? '—'}
            <Txt style={{ fontSize: 13, color: c.accent }}> / 10</Txt>
          </Txt>
          <RangeBar ratio={(quality ?? 0) / 10} color={c.accent} />
          <Txt style={{ color: c.accent, fontSize: 11 }}>From Play Store rating</Txt>
        </View>
        <View
          style={{
            flexGrow: width < 360 ? 0 : 1,
            flexBasis: width < 360 ? 'auto' : 0,
            flexShrink: 0,
            padding: 14,
            borderRadius: 20,
            backgroundColor: c.surface,
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Users size={15} color={c.accent} />
            <Txt style={{ flex: 1, fontSize: 12 }}>Estimated DAU</Txt>
            <PressableFeedback
              accessibilityLabel="Explain estimated daily active users"
              onPress={() => setExplanation(explanation === 'audience' ? null : 'audience')}
              style={{ padding: 4 }}
            >
              <Info size={14} color={c.accent} />
            </PressableFeedback>
          </View>
          <Txt style={{ fontSize: 24, fontFamily: 'Inter_700Bold' }}>
            {dailyActive ? compact(dailyActive.mid) : '—'}
          </Txt>
          <Txt style={{ color: c.muted, fontSize: 11 }}>
            {dailyActive
              ? `${compact(dailyActive.low)}–${compact(dailyActive.high)} / day`
              : 'Install count needed'}
          </Txt>
          <Txt style={{ color: c.muted, fontSize: 11 }}>Low-confidence model</Txt>
        </View>
      </View>
      {explanation && (
        <Txt style={{ fontSize: 12, color: c.muted, lineHeight: 19 }}>
          {explanation === 'quality'
            ? 'Quality is the public star rating × 2, rescaled to 10. It is a user-rating proxy, not an independent product audit.'
            : 'Daily active users = modeled monthly active users × assumed daily share. Low / mid / high use 10 / 20 / 30%. These are uncalibrated assumptions, not observed users.'}
        </Txt>
      )}
    </View>
  );
}
