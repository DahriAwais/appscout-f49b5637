import { useEffect, useId, useRef, useState } from 'react';
import {
  Animated as NativeAnimated,
  Platform,
  StyleSheet,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableFeedback } from 'heroui-native';
import { Info, SignalLow, TrendingUp, Trophy, Wallet } from 'lucide-react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Filter,
  FeGaussianBlur,
  G,
  Line,
  LinearGradient as SvgGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  Easing,
  FadeIn,
  createAnimatedComponent,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors as c } from '@/lib/theme';
import { money, type ScoutApp, type StoreReview } from '@/lib/scout';
import { reviewTrend, type RevenueRange } from '@/lib/review-trend';
import { GlassButton } from './GlassControls';
import { Txt } from './ScoutUI';
import { ResearchSheet } from './ResearchSheet';
const AnimatedPath = createAnimatedComponent(Path);
const AnimatedCircle = createAnimatedComponent(Circle);
const rangeText = (r: RevenueRange) => `${money(r.low)} – ${money(r.high)}`;

function RollingRange({
  range,
  width,
  active,
}: {
  range: RevenueRange;
  width: number;
  active: boolean;
}) {
  const text = rangeText(range);
  const [progress, setProgress] = useState(1);
  const [old, setOld] = useState(text);
  const last = useRef(text.replace(/\d/g, '0'));
  const [animation] = useState(() => new NativeAnimated.Value(1));
  const reduced = useReducedMotion();
  const id = useId().replace(/:/g, '');
  useEffect(() => {
    setOld(last.current);
    last.current = text;
    animation.setValue(reduced || active ? 1 : 0);
    const token = animation.addListener(({ value }) => setProgress(value));
    NativeAnimated.timing(animation, { toValue: 1, duration: 700, useNativeDriver: false }).start();
    return () => {
      animation.stopAnimation();
      animation.removeListener(token);
    };
  }, [text, animation, reduced, active]);
  const size = Math.min(32, (width - 36) / (text.length * 0.63 + 2));
  const advance = size * 0.62;
  return (
    <Svg width={width} height={54} accessibilityLabel={`${text} per month, estimated`}>
      <Defs>
        <SvgGradient id={`${id}fill`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={c.emeraldStart} />
          <Stop offset="1" stopColor={c.emeraldEnd} />
        </SvgGradient>
        <ClipPath id={`${id}clip`}>
          <Rect width={width} height={48} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${id}clip)`}>
        {text.split('').map((char, i) => (
          // eslint-disable-next-line react/no-array-index-key -- Keys identify fixed digit slots; changing digits must reuse the slot for rolling transitions.
          <G key={i}>
            {progress < 1 && /\d/.test(char) && (
              <SvgText
                x={i * advance}
                y={36 - progress * 48}
                fontFamily="Inter_700Bold"
                fontWeight="700"
                fontSize={size}
                fill={`url(#${id}fill)`}
              >
                {old[i] ?? '0'}
              </SvgText>
            )}
            <SvgText
              x={i * advance}
              y={36 + (/\d/.test(char) ? (1 - progress) * 48 : 0)}
              fontFamily="Inter_700Bold"
              fontWeight="700"
              fontSize={size}
              fill={`url(#${id}fill)`}
            >
              {char}
            </SvgText>
          </G>
        ))}
        <SvgText x={text.length * advance + 5} y={36} fontSize={13} fill={c.emeraldInk}>
          /mo
        </SvgText>
      </G>
    </Svg>
  );
}
function Orbs() {
  const reduced = useReducedMotion();
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.set(
      reduced
        ? 0
        : withRepeat(
            withTiming(1, { duration: 18000, easing: Easing.inOut(Easing.sin) }),
            -1,
            true,
          ),
    );
  }, [drift, reduced]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.value * 20 }, { translateY: drift.value * -16 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      entering={FadeIn.delay(300)}
      style={[StyleSheet.absoluteFill, style]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 360 400" preserveAspectRatio="none">
        <Defs>
          {[c.emeraldEnd, c.mint, c.mintLight].map((color, i) => (
            <RadialGradient key={color} id={`orb${i}`}>
              <Stop offset="0" stopColor={color} stopOpacity={0.25} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        <Circle cx={40} cy={85} r={150} fill="url(#orb0)" />
        <Circle cx={320} cy={180} r={175} fill="url(#orb1)" />
        <Circle cx={140} cy={380} r={145} fill="url(#orb2)" />
      </Svg>
    </Animated.View>
  );
}
type XY = { x: number; y: number };
function curve(points: XY[]) {
  if (!points.length) return '';
  return (
    `M ${points[0].x} ${points[0].y}` +
    points
      .slice(1)
      .map((p, i) => {
        const a = points[i];
        const x = (a.x + p.x) / 2;
        return ` C ${x} ${a.y}, ${x} ${p.y}, ${p.x} ${p.y}`;
      })
      .join('')
  );
}
export function RevenueHero({
  result,
  app,
  reviews = [],
  onOpen,
  onInfo,
  loading = false,
  reviewError = false,
  onRetryReviews,
}: {
  result: (RevenueRange & { purchases?: number; ads?: number }) | null;
  app?: ScoutApp;
  reviews?: StoreReview[];
  onOpen?: () => void;
  onInfo?: () => void;
  loading?: boolean;
  reviewError?: boolean;
  onRetryReviews?: () => void;
}) {
  const [months, setMonths] = useState(6);
  const [width, setWidth] = useState(300);
  const [selected, setSelected] = useState<number | null>(null);
  const [sheet, setSheet] = useState(false);
  const reduced = useReducedMotion();
  const reveal = useSharedValue(0);
  const pulse = useSharedValue(0);
  const shimmer = useSharedValue(-1);
  const id = useId().replace(/:/g, '');
  const points = result ? reviewTrend(reviews, result, months) : [];
  const usable = points.length >= 2;
  const shown = selected !== null && points[selected] ? points[selected] : result;
  useEffect(() => {
    reveal.set(withDelay(reduced ? 0 : 700, withTiming(1, { duration: reduced ? 200 : 900 })));
    pulse.set(
      reduced ? 0 : withDelay(1600, withRepeat(withTiming(1, { duration: 1800 }), -1, false)),
    );
    shimmer.set(
      reduced
        ? -1
        : withRepeat(withTiming(1, { duration: 6000, easing: Easing.linear }), -1, false),
    );
  }, [reveal, pulse, shimmer, reduced]);
  const draw = useAnimatedProps(() => ({
    strokeDashoffset: reduced ? 0 : 1100 * (1 - reveal.value),
    opacity: reduced ? reveal.value : 1,
  }));
  const bandStyle = useAnimatedStyle(() => ({ opacity: reveal.value }));
  const ripple = useAnimatedProps(() => ({
    r: 4 + pulse.value * 10,
    opacity: (1 - pulse.value) * 0.4,
  }));
  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.13,
    transform: [{ translateX: shimmer.value * (width + 100) }, { rotate: '20deg' }],
  }));
  const top = 28,
    bottom = 142,
    left = 8,
    right = width - 8;
  const max = usable ? Math.max(...points.map((p) => p.high)) * 1.15 || 1 : 1;
  const y = (v: number) => bottom - (v / max) * (bottom - top);
  const x = (i: number) => left + (i * (right - left)) / Math.max(1, points.length - 1);
  const center = usable
    ? points.map((p, i) => ({ x: x(i), y: y(p.mid) }))
    : [
        { x: left, y: 98 },
        { x: width * 0.35, y: 92 },
        { x: width * 0.65, y: 96 },
        { x: right, y: 90 },
      ];
  const upper = usable
    ? points.map((p, i) => ({ x: x(i), y: y(p.high) }))
    : center.map((p) => ({ ...p, y: p.y - 29 }));
  const lower = usable
    ? points.map((p, i) => ({ x: x(i), y: y(p.low) }))
    : center.map((p) => ({ ...p, y: p.y + 29 }));
  const line = curve(center);
  const reversedLower = lower.map((_, i) => lower[lower.length - 1 - i]);
  const band = `${curve(upper)} L ${lower.at(-1)!.x} ${lower.at(-1)!.y} ${curve(reversedLower).replace(/^M [\d.]+ [\d.]+/, '')} Z`;
  const last = center.at(-1)!;
  const scrub = (e: GestureResponderEvent) => {
    if (!usable) return;
    const next = Math.min(
      points.length - 1,
      Math.max(
        0,
        Math.round(((e.nativeEvent.locationX - left) / (right - left)) * (points.length - 1)),
      ),
    );
    if (selected !== next) {
      setSelected(next);
      void Haptics.selectionAsync();
    }
  };
  const growth =
    usable && points[0].mid > 0 ? (points.at(-1)!.mid / points[0].mid - 1) * 100 : null;
  const chips = [
    {
      Icon: TrendingUp,
      label:
        growth === null
          ? 'Growth unavailable'
          : `${growth >= 0 ? '+' : ''}${Math.round(growth)}% est. trend`,
    },
    { Icon: Trophy, label: 'Rank unavailable' },
    {
      Icon: Wallet,
      label:
        result?.purchases !== undefined &&
        result.ads !== undefined &&
        result.purchases + result.ads > 0
          ? result.purchases >= result.ads
            ? 'Mostly IAP · est.'
            : 'Mostly ads · est.'
          : app?.offersIAP
            ? 'IAP listed'
            : app?.adSupported
              ? 'Ads listed'
              : 'Source unknown',
    },
  ];
  const webGlass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px) saturate(160%)' } : {};
  return (
    <>
      <View
        style={{
          flexShrink: 0,
          alignSelf: 'stretch',
          borderRadius: 28,
          marginBottom: 18,
          shadowColor: c.emeraldEnd,
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.18,
          shadowRadius: 25,
          elevation: 4,
        }}
      >
        <PressableFeedback
          onPress={onOpen}
          accessibilityLabel={onOpen ? 'Open estimation page' : undefined}
          animation={
            reduced || !onOpen
              ? false
              : {
                  scale: {
                    value: 0.98,
                    ignoreScaleCoefficient: true,
                    timingConfig: { duration: 160 },
                  },
                }
          }
          style={[
            {
              position: 'relative',
              flexGrow: 0,
              flexShrink: 0,
              alignSelf: 'stretch',
              borderRadius: 28,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: c.revenueBorder,
              backgroundColor: c.white,
            },
            webGlass,
          ]}
        >
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Orbs />
            <BlurView intensity={24} tint="light" style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={[c.revenueGlass, c.revenueWhite]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
          <View
            pointerEvents="none"
            style={{ height: 1, backgroundColor: c.white, marginHorizontal: 22 }}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              { position: 'absolute', top: -40, bottom: -40, width: 40, backgroundColor: c.white },
              shimmerStyle,
            ]}
          />
          <View
            style={{ padding: 16 }}
            onLayout={(e) => setWidth(Math.max(200, e.nativeEvent.layout.width - 32))}
          >
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Txt style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: c.emeraldInk }}>
                  ESTIMATED MONTHLY REVENUE
                </Txt>
                <PressableFeedback
                  onPress={() => (onInfo ? onInfo() : setSheet(true))}
                  accessibilityLabel="How we estimate"
                  style={{ padding: 8 }}
                >
                  <Info size={15} color={c.emeraldInk} />
                </PressableFeedback>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  borderRadius: 20,
                  paddingHorizontal: 9,
                  paddingVertical: 6,
                  backgroundColor: c.revenueChip,
                  borderWidth: 1,
                  borderColor: c.white,
                }}
              >
                <SignalLow size={14} color={c.emeraldInk} />
                <Txt style={{ fontSize: 11, color: c.emeraldInk }}>Low confidence</Txt>
              </View>
            </View>
            <View>
              {shown ? (
                <RollingRange range={shown} width={width} active={selected !== null} />
              ) : (
                <Txt
                  style={{
                    color: c.emeraldInk,
                    fontSize: 23,
                    fontFamily: 'Inter_700Bold',
                    paddingVertical: 10,
                  }}
                >
                  {loading ? 'Loading estimate…' : 'Est. unavailable'}
                </Txt>
              )}
            </View>
            <View
              style={{ height: 174 }}
              onStartShouldSetResponder={() => usable}
              onMoveShouldSetResponder={() => usable}
              onResponderGrant={scrub}
              onResponderMove={scrub}
              onResponderRelease={() => setSelected(null)}
              onResponderTerminate={() => setSelected(null)}
              accessibilityLabel="Review activity trend. Drag to inspect an estimated monthly range."
            >
              <Svg width={width} height={174}>
                <Defs>
                  <Filter id={`${id}glow`} x="-20%" y="-40%" width="140%" height="180%">
                    <FeGaussianBlur stdDeviation={4} />
                  </Filter>
                  <SvgGradient id={`${id}area`} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={c.emeraldEnd} stopOpacity={0.17} />
                    <Stop offset="1" stopColor={c.emeraldEnd} stopOpacity={0} />
                  </SvgGradient>
                  <SvgGradient id={`${id}stroke`} x1="0" x2="1">
                    <Stop offset="0" stopColor={c.emeraldStart} />
                    <Stop offset="1" stopColor={c.emeraldEnd} />
                  </SvgGradient>
                </Defs>
                {[44, 88, 132].map((v) => (
                  <Line
                    key={v}
                    x1={left}
                    x2={right}
                    y1={v}
                    y2={v}
                    stroke={c.revenueGrid}
                    strokeDasharray="3 5"
                  />
                ))}
                <G opacity={usable ? 1 : 0.35}>
                  <Path
                    d={`${line} L ${last.x} ${bottom} L ${left} ${bottom} Z`}
                    fill={`url(#${id}area)`}
                  />
                  <AnimatedPath
                    d={line}
                    stroke={`url(#${id}stroke)`}
                    filter={`url(#${id}glow)`}
                    strokeOpacity={0.28}
                    strokeWidth={12}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="1100"
                    animatedProps={draw}
                  />
                  <AnimatedPath
                    d={line}
                    stroke={`url(#${id}stroke)`}
                    strokeWidth={2.5}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="1100"
                    animatedProps={draw}
                  />
                </G>
                {usable && (
                  <G>
                    <AnimatedCircle
                      cx={last.x}
                      cy={last.y}
                      stroke={c.emeraldEnd}
                      fill="none"
                      animatedProps={ripple}
                    />
                    <Circle
                      cx={last.x}
                      cy={last.y}
                      r={4}
                      fill={c.emeraldEnd}
                      stroke={c.white}
                      strokeWidth={2}
                    />
                  </G>
                )}
                {usable &&
                  points
                    .filter(
                      (_, i) =>
                        i === 0 || i === points.length - 1 || i === Math.floor(points.length / 2),
                    )
                    .map((p) => (
                      <SvgText
                        key={p.date}
                        x={x(points.indexOf(p))}
                        y={168}
                        fontSize={11}
                        fill={c.emeraldInk}
                        textAnchor={
                          points.indexOf(p) === 0
                            ? 'start'
                            : points.indexOf(p) === points.length - 1
                              ? 'end'
                              : 'middle'
                        }
                      >
                        {p.label}
                      </SvgText>
                    ))}
                {usable && selected !== null && (
                  <>
                    <Line
                      x1={x(selected)}
                      x2={x(selected)}
                      y1={top}
                      y2={bottom}
                      stroke={c.emeraldStart}
                      strokeDasharray="3 3"
                    />
                    <Circle
                      cx={x(selected)}
                      cy={y(points[selected].mid)}
                      r={5}
                      fill={c.emeraldStart}
                      stroke={c.white}
                      strokeWidth={2}
                    />
                  </>
                )}
              </Svg>
              <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, bandStyle]}>
                <Svg width={width} height={174}>
                  <Path d={band} fill={c.revenueBand} opacity={usable ? 1 : 0.6} />
                  <Path
                    d={curve(upper)}
                    fill="none"
                    stroke={c.emeraldEnd}
                    strokeOpacity={0.24}
                    strokeDasharray="4 4"
                  />
                  <Path
                    d={curve(lower)}
                    fill="none"
                    stroke={c.emeraldEnd}
                    strokeOpacity={0.24}
                    strokeDasharray="4 4"
                  />
                </Svg>
              </Animated.View>
              {selected !== null && points[selected] && (
                <View
                  pointerEvents="none"
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' }}
                >
                  <View
                    style={{
                      backgroundColor: c.revenueChip,
                      borderRadius: 10,
                      paddingHorizontal: 8,
                      paddingVertical: 5,
                    }}
                  >
                    <Txt numberOfLines={1} style={{ fontSize: 11, color: c.emeraldInk }}>
                      {points[selected].label} · est. {rangeText(points[selected])}
                    </Txt>
                  </View>
                </View>
              )}
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignSelf: 'center',
                gap: 4,
                padding: 4,
                borderRadius: 22,
                backgroundColor: c.revenueChip,
              }}
            >
              {([3, 6, 12] as const).map((n) => (
                <GlassButton
                  key={n}
                  size="sm"
                  onPress={() => {
                    setMonths(n);
                    setSelected(null);
                    void Haptics.selectionAsync();
                  }}
                  accessibilityState={{ selected: months === n }}
                  style={{
                    minWidth: 54,
                    minHeight: 30,
                    paddingHorizontal: 9,
                    backgroundColor: months === n ? c.glassSelected : c.glassTint,
                  }}
                >
                  <GlassButton.Label style={{ color: c.glassBlue, fontSize: 11 }}>
                    {n === 12 ? '1Y' : `${n}M`}
                  </GlassButton.Label>
                </GlassButton>
              ))}
            </View>
            <Txt
              style={{
                fontSize: 11,
                lineHeight: 16,
                color: c.emeraldInk,
                textAlign: 'center',
                marginTop: 10,
              }}
            >
              {usable
                ? 'Trend based on review activity'
                : reviewError
                  ? 'Review activity could not load'
                  : 'Collecting data, trend appears soon'}
            </Txt>
            {usable && (
              <Txt style={{ fontSize: 11, color: c.emeraldInk, textAlign: 'center', marginTop: 3 }}>
                Sampled activity proxy, not revenue history
              </Txt>
            )}
            {reviewError && onRetryReviews && (
              <GlassButton size="sm" onPress={onRetryReviews} style={{ marginTop: 8 }}>
                <GlassButton.Label>Retry trend</GlassButton.Label>
              </GlassButton>
            )}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
              {chips.map((chip, i) => (
                <Animated.View
                  key={chip.label}
                  entering={FadeIn.delay(reduced || !usable ? 0 : 1650 + i * 60).duration(200)}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      borderRadius: 20,
                      backgroundColor: c.revenueChip,
                      borderWidth: 1,
                      borderColor: c.white,
                      paddingHorizontal: 8,
                      paddingVertical: 8,
                    }}
                  >
                    <chip.Icon size={12} color={c.emeraldInk} />
                    <Txt numberOfLines={1} style={{ fontSize: 11, color: c.emeraldInk }}>
                      {chip.label}
                    </Txt>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>
        </PressableFeedback>
      </View>
      <ResearchSheet title="How we estimate" open={sheet} onClose={() => setSheet(false)}>
        <Txt style={{ color: c.muted, lineHeight: 21 }}>
          Public install tiers, release age and listed ads or purchases inform an assumption-based
          monthly revenue range. Defaults are uncalibrated, so confidence is low. The band is an
          assumption range, not a statistical confidence interval. Review dates provide an activity
          proxy only; truncated months are excluded and the current month is normalized by elapsed
          days. Google Play does not publish earnings. This is not verified subscription MRR.
        </Txt>
      </ResearchSheet>
    </>
  );
}
