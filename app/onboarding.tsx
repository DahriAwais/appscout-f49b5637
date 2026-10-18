import { useEffect, useState } from 'react';
import { View, Image, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassButton as Button } from '@/components/GlassControls';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowRight,
  Search,
  Sparkles,
  Music2,
  Camera,
  Gamepad2,
  Check,
  MapPin,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInRight,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  useReducedMotion,
  useAnimatedProps,
  createAnimatedComponent,
} from 'react-native-reanimated';
import { colors as c } from '@/lib/theme';
import { useScout, selection, success } from '@/lib/store';
import { Logo, Txt } from '@/components/ScoutUI';
import { GlassClip } from '@/components/GlassControls';
const headlines = ['Discover global potential.', 'See revenue potential.', 'Find your next idea.'];
const finish = () => {
  useScout.getState().completeOnboarding();
  success();
  router.replace('/');
};

function GlobeVisual({ size }: { size: number }) {
  const reduced = useReducedMotion();
  const rotate = useSharedValue(0);
  useEffect(() => {
    if (!reduced)
      rotate.set(withRepeat(withTiming(360, { duration: 40000, easing: Easing.linear }), -1));
  }, [reduced, rotate]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={style}>
        <Image
          source={require('@/assets/globe.png')}
          resizeMode="contain"
          style={{ width: size, height: size, resizeMode: 'contain' }}
        />
      </Animated.View>
      {[
        { label: '$48K', x: 0.02, y: 0.16, Icon: Music2 },
        { label: '$12K', x: 0.61, y: 0.48, Icon: Camera },
        { label: '$8K', x: 0.16, y: 0.77, Icon: Gamepad2 },
      ].map((pin, i) => (
        <Animated.View
          key={pin.label}
          entering={FadeIn.delay(250 + i * 300).duration(300)}
          style={{ position: 'absolute', left: size * pin.x, top: size * pin.y }}
        >
          <GlassClip>
            <View
              style={{
                flexDirection: 'row',
                gap: 7,
                paddingHorizontal: 11,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <pin.Icon size={18} color={c.glassBlue} strokeWidth={1.8} />
              <Txt style={{ color: c.money, fontFamily: 'Inter_600SemiBold' }}>{pin.label}</Txt>
            </View>
          </GlassClip>
          <MapPin size={15} color={c.glassBlue} style={{ alignSelf: 'center', marginTop: 3 }} />
        </Animated.View>
      ))}
    </View>
  );
}
const AnimatedPath = createAnimatedComponent(Path);
function IllustrationTrend() {
  const trace = useSharedValue(1);
  useEffect(() => {
    trace.set(withTiming(0, { duration: 1600, easing: Easing.out(Easing.cubic) }));
  }, [trace]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: trace.value * 340 }));
  return (
    <Svg width="100%" height={94} viewBox="0 0 250 94">
      {[20, 50, 80].map((y) => (
        <Line key={y} x1={0} x2={250} y1={y} y2={y} stroke={c.money} strokeOpacity={0.14} />
      ))}
      <Path
        d="M 5 78 C 30 78 35 63 55 65 S 85 50 105 54 S 135 35 155 40 S 190 12 210 19 S 235 8 245 9 L245 90 L5 90Z"
        fill={c.moneyBright}
        fillOpacity={0.1}
      />
      <AnimatedPath
        animatedProps={props}
        d="M 5 78 C 30 78 35 63 55 65 S 85 50 105 54 S 135 35 155 40 S 190 12 210 19 S 235 8 245 9"
        fill="none"
        stroke={c.money}
        strokeWidth={3}
        strokeDasharray="340"
        strokeLinecap="round"
      />
      <Circle cx={245} cy={9} r={4} fill={c.money} />
    </Svg>
  );
}
function RevenueVisual({ size }: { size: number }) {
  const [amount, setAmount] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return undefined;
    const start = Date.now();
    const timer = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / 1600);
      setAmount(Math.round(12400 * (1 - (1 - t) ** 3)));
      if (t === 1) clearInterval(timer);
    }, 32);
    return () => clearInterval(timer);
  }, [reduced]);
  return (
    <View
      style={{
        width: size - 16,
        shadowColor: c.shadow,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 5,
      }}
    >
      <GlassClip>
        <View style={{ padding: 22, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Logo size={48} />
            <Txt style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, flex: 1 }}>
              Your next app
            </Txt>
            <Sparkles size={20} color={c.accent} />
          </View>
          <Txt style={{ fontSize: 11, color: c.glassBlue }}>Illustrative estimate</Txt>
          <Txt
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ fontSize: 38, fontFamily: 'Inter_700Bold', color: c.money }}
          >
            ${(reduced ? 12400 : amount).toLocaleString('en-US')}
            <Txt style={{ fontSize: 15, color: c.money }}>/mo</Txt>
          </Txt>
          <IllustrationTrend />
        </View>
      </GlassClip>
    </View>
  );
}
function SearchVisual({ size }: { size: number }) {
  const reduced = useReducedMotion();
  const position = useSharedValue(0);
  useEffect(() => {
    if (!reduced)
      position.set(
        withRepeat(withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }), -1, true),
      );
  }, [position, reduced]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: -size * 0.22 + position.value * size * 0.44 },
      { translateY: -8 + position.value * 26 },
    ],
  }));
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          width: size * 0.8,
          gap: 14,
          justifyContent: 'center',
        }}
      >
        {[
          { id: 'music', Icon: Music2 },
          { id: 'camera', Icon: Camera },
          { id: 'game', Icon: Gamepad2 },
          { id: 'check', Icon: Check },
          { id: 'sparkles', Icon: Sparkles },
          { id: 'map', Icon: MapPin },
        ].map(({ id, Icon }, i) => (
          <Animated.View
            key={id}
            entering={FadeIn.delay(i * 90).duration(250)}
            style={{ transform: [{ rotate: `${i % 2 ? 5 : -5}deg` }] }}
          >
            <GlassClip>
              <View
                style={{
                  width: size * 0.21,
                  height: size * 0.21,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Icon size={28} color={[c.accent, c.teal, c.violet][i % 3]} strokeWidth={1.8} />
              </View>
            </GlassClip>
          </Animated.View>
        ))}
      </View>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: 130,
            height: 130,
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
      >
        <View
          style={{
            position: 'absolute',
            left: 5,
            top: 5,
            width: 92,
            height: 92,
            borderRadius: 46,
            backgroundColor: c.glassTint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sparkles size={34} color={c.accent} />
        </View>
        <Search size={124} strokeWidth={1.5} color={c.glassBlue} />
        <View
          style={{
            position: 'absolute',
            left: 62,
            top: -12,
            backgroundColor: c.moneySoft,
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 7,
            flexDirection: 'row',
            gap: 5,
            alignItems: 'center',
          }}
        >
          <Check size={13} color={c.money} />
          <Txt style={{ color: c.money, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>$8K</Txt>
        </View>
      </Animated.View>
    </View>
  );
}
export default function OnboardingScreen() {
  const { page: initialPage } = useLocalSearchParams<{ page?: string }>();
  const [page, setPage] = useState(() => (initialPage === '2' ? 1 : initialPage === '3' ? 2 : 0));
  const inset = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const size = Math.min(width - 44, height * 0.4, 310);
  const reduced = useReducedMotion();
  return (
    <View style={{ flex: 1, backgroundColor: c.white }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: inset.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 18,
        }}
      >
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Logo size={36} />
          <Button variant="ghost" size="sm" onPress={finish}>
            <Button.Label>Skip</Button.Label>
          </Button>
        </View>
        <Animated.View
          key={page}
          entering={
            reduced
              ? FadeIn.duration(220)
              : FadeInRight.duration(280).withInitialValues({
                  opacity: 0,
                  transform: [{ translateX: 18 }],
                })
          }
          exiting={FadeOut.duration(100)}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 24,
            gap: 32,
          }}
        >
          <View
            style={{
              width: size,
              height: size + 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {page === 0 ? (
              <GlobeVisual size={size} />
            ) : page === 1 ? (
              <RevenueVisual size={size} />
            ) : (
              <SearchVisual size={size} />
            )}
          </View>
          <Txt
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: width < 360 ? 26 : 30,
              lineHeight: 38,
              letterSpacing: -0.8,
              textAlign: 'center',
            }}
          >
            {headlines[page]}
          </Txt>
          {(page === 0 || page === 2) && (
            <Txt style={{ fontSize: 11, color: c.muted }}>Illustrative estimates</Txt>
          )}
        </Animated.View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 22 }}>
          {headlines.map((h, i) => (
            <View
              key={h}
              style={{
                width: i === page ? 24 : 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: i === page ? c.glassBlue : c.line,
              }}
            />
          ))}
        </View>
        <Button
          className="rounded-full"
          onPress={() => {
            if (page === 2) finish();
            else {
              setPage(page + 1);
              selection();
            }
          }}
        >
          <Button.Label>{page === 2 ? 'Get Started' : 'Continue'}</Button.Label>
          <ArrowRight size={18} color={c.accent} />
        </Button>
        <View style={{ height: inset.bottom + 6 }} />
      </ScrollView>
    </View>
  );
}
