import { useEffect, useState } from 'react';
import { View, Image, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'heroui-native';
import { router } from 'expo-router';
import { ArrowRight, TrendingUp, Search, Check } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useReducedMotion,
  Easing,
} from 'react-native-reanimated';
import { colors as c } from '@/lib/theme';
import { apps } from '@/lib/scout';
import { useScout, selection, success } from '@/lib/store';
import { Logo, Txt, AppIcon, Sparkline } from '@/components/ScoutUI';
const headlines = ['See what\napps earn.', 'Spot rising\napps.', 'Find winning\nkeywords.'];
const finish = () => {
  useScout.getState().completeOnboarding();
  success();
  router.replace('/');
};
export default function OnboardingScreen() {
  const [page, setPage] = useState(0);
  const inset = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const size = Math.min(width - 36, 360);
  const reduced = useReducedMotion();
  const float = useSharedValue(0);
  useEffect(() => {
    if (!reduced)
      float.set(
        withRepeat(withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }), -1, true),
      );
  }, [float, reduced]);
  const motion = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value * -7 }, { rotate: `${float.value * 3 - 1.5}deg` }],
  }));
  const pins = [
    { index: 0, label: '$12.4K/mo', left: 0.01, top: 0.16 },
    { index: 1, label: '$24.5K/mo', left: 0.52, top: 0.27 },
    { index: 2, label: '$44.1K/mo', left: 0.14, top: 0.67 },
    { index: 4, label: '$69K/mo', left: 0.59, top: 0.75 },
    { index: 6, label: '$4.3K/mo', left: 0.32, top: 0.01 },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: c.white }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: inset.top + 20,
          paddingHorizontal: 24,
          paddingBottom: 20,
        }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Logo size={40} />
          <Button variant="ghost" size="sm" onPress={finish}>
            <Button.Label className="text-muted">Skip</Button.Label>
          </Button>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 22 }}>
          <Animated.View
            key={page}
            entering={FadeIn.duration(250)}
            exiting={FadeOut.duration(130)}
            style={{ alignSelf: 'center', width: size, height: size + 15 }}
          >
            {page === 0 ? (
              <>
                <Animated.View style={[{ width: size, height: size }, motion]}>
                  <Image
                    source={require('@/assets/globe.png')}
                    resizeMode="contain"
                    style={{ width: size, height: size, resizeMode: 'contain' }}
                  />
                </Animated.View>
                {pins.map((p) => (
                  <View
                    key={p.index}
                    style={{
                      position: 'absolute',
                      left: size * p.left,
                      top: size * p.top,
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: c.white,
                      borderRadius: 17,
                      padding: 7,
                      gap: 7,
                      shadowColor: c.shadow,
                      shadowOpacity: 0.09,
                      shadowOffset: { width: 0, height: 5 },
                      shadowRadius: 15,
                      elevation: 3,
                    }}
                  >
                    <AppIcon app={apps[p.index]} size={28} />
                    <View>
                      <Txt style={{ fontSize: 9 + 2, color: c.muted }}>est.</Txt>
                      <Txt
                        style={{ fontFamily: 'Inter_600SemiBold', color: c.money, fontSize: 12 }}
                      >
                        {p.label}
                      </Txt>
                    </View>
                  </View>
                ))}
                <View
                  style={{ position: 'absolute', bottom: 0, width: '100%', alignItems: 'center' }}
                >
                  <Txt style={{ fontSize: 11, color: c.muted }}>Illustrative earnings · USD</Txt>
                </View>
              </>
            ) : page === 1 ? (
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 16,
                    }}
                  >
                    <AppIcon app={apps[0]} size={40} />
                    <Txt style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17 }}>Focusly</Txt>
                  </View>
                  <Txt style={{ color: c.muted, fontSize: 12 }}>Estimated monthly revenue</Txt>
                  <Txt
                    style={{
                      fontFamily: 'Inter_700Bold',
                      fontSize: 48,
                      color: c.money,
                      letterSpacing: -2,
                      marginTop: 6,
                    }}
                  >
                    $24.8K
                  </Txt>
                  <View
                    style={{
                      flexDirection: 'row',
                      backgroundColor: c.moneySoft,
                      borderRadius: 30,
                      gap: 5,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      marginTop: 13,
                    }}
                  >
                    <TrendingUp size={16} color={c.money} />
                    <Txt style={{ color: c.money, fontFamily: 'Inter_600SemiBold' }}>+40%</Txt>
                  </View>
                </View>
                <Sparkline
                  width={size}
                  height={120}
                  values={[5, 6, 6, 9, 8, 13, 16, 15, 22, 25, 30, 39]}
                  fill
                />
                <Txt style={{ textAlign: 'center', color: c.muted, fontSize: 11, marginTop: 10 }}>
                  Illustrative growth
                </Txt>
              </View>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', gap: 17 }}>
                <View
                  style={{
                    backgroundColor: c.surface,
                    borderRadius: 25,
                    flexDirection: 'row',
                    padding: 16,
                    gap: 10,
                    alignItems: 'center',
                    marginBottom: 15,
                  }}
                >
                  <Search size={21} color={c.muted} />
                  <Txt style={{ color: c.muted }}>Find your next opportunity</Txt>
                </View>
                {[
                  { label: 'habit tracker', rank: '#1', wide: 0 },
                  { label: 'focus timer', rank: '#3', wide: 30 },
                  { label: 'budget planner', rank: '#8', wide: 12 },
                ].map((k, i) => (
                  <View
                    key={k.label}
                    style={{
                      backgroundColor: i === 0 ? c.accentSoft : c.surface,
                      borderRadius: 24,
                      padding: 19,
                      marginLeft: k.wide,
                      marginRight: 30 - k.wide,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Txt
                      style={{
                        fontFamily: 'Inter_500Medium',
                        fontSize: 16,
                        color: i === 0 ? c.accent : c.ink,
                      }}
                    >
                      {k.label}
                    </Txt>
                    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                      {i === 0 && <Check color={c.accent} size={15} />}
                      <Txt
                        style={{
                          color: i === 0 ? c.accent : c.muted,
                          fontFamily: 'Inter_600SemiBold',
                        }}
                      >
                        {k.rank}
                      </Txt>
                    </View>
                  </View>
                ))}
                <Txt style={{ textAlign: 'center', color: c.muted, fontSize: 11, marginTop: 10 }}>
                  Illustrative keyword positions
                </Txt>
              </View>
            )}
          </Animated.View>
          <View style={{ marginTop: 28 }}>
            <Txt
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 38,
                lineHeight: 46,
                letterSpacing: -1.3,
              }}
            >
              {headlines[page]}
            </Txt>
            {page === 0 && (
              <Txt style={{ color: c.muted, fontSize: 14, lineHeight: 22, marginTop: 12 }}>
                Revenue estimates, not exact earnings.
              </Txt>
            )}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 7, marginBottom: 22, alignItems: 'center' }}>
          {headlines.map((headline, i) => (
            <View
              key={headline}
              style={{
                width: i === page ? 26 : 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: i === page ? c.accent : c.line,
              }}
            />
          ))}
        </View>
        <Button
          size="lg"
          className="bg-accent rounded-full"
          onPress={() => {
            if (page === 2) finish();
            else {
              setPage(page + 1);
              selection();
            }
          }}
        >
          <Button.Label>{page === 2 ? 'Get started' : 'Continue'}</Button.Label>
          <ArrowRight color={c.white} size={19} />
        </Button>
        <View style={{ height: inset.bottom + 6 }} />
      </ScrollView>
    </View>
  );
}
