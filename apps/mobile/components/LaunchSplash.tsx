import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { Logo, Txt } from './ScoutUI';
import { colors as c } from '@/lib/theme';

export function LaunchSplash({ onFinish }: { onFinish: () => void }) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(reduced ? 1 : 0.75);
  const fade = useSharedValue(0);
  const progress = useSharedValue(0);
  useEffect(() => {
    scale.set(withSpring(1, { damping: 14, stiffness: 130 }));
    fade.set(withDelay(450, withTiming(1, { duration: 350 })));
    progress.set(
      withDelay(500, withTiming(1, { duration: 1250, easing: Easing.out(Easing.cubic) })),
    );
    const timer = setTimeout(onFinish, 2000);
    return () => clearTimeout(timer);
  }, [fade, onFinish, progress, scale]);
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const lineStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.white,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
      }}
    >
      <Animated.View style={logoStyle}>
        <Logo size={88} />
      </Animated.View>
      <Animated.View style={[{ alignItems: 'center', gap: 24 }, fadeStyle]}>
        <Txt style={{ fontSize: 18, fontFamily: 'Inter_600SemiBold' }}>Discover app potential.</Txt>
        <View style={{ height: 2, width: 150, backgroundColor: c.line, overflow: 'hidden' }}>
          <Animated.View style={[{ height: 2, backgroundColor: c.glassBlue }, lineStyle]} />
        </View>
      </Animated.View>
    </View>
  );
}
