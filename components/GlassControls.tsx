import { useEffect, type ReactNode, type RefObject, type ComponentProps } from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Button } from 'heroui-native';
import type { LucideIcon } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors as c } from '@/lib/theme';

function GlassButtonRoot({ children, style, variant, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      variant="secondary"
      style={[
        {
          backgroundColor: variant === 'primary' || !variant ? c.glassSelected : c.glassTint,
          borderWidth: 1,
          borderColor: c.glassBorder,
          borderRadius: 24,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <BlurView pointerEvents="none" tint="light" intensity={35} style={StyleSheet.absoluteFill} />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 10,
          right: 10,
          height: 1,
          backgroundColor: c.glassHighlight,
        }}
      />
      <View
        pointerEvents="box-none"
        style={{
          zIndex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          maxWidth: '100%',
        }}
      >
        {children}
      </View>
    </Button>
  );
}
export const GlassButton = Object.assign(GlassButtonRoot, { Label: Button.Label });

export function GlassBackground({ target }: { target?: RefObject<View | null> }) {
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: c.glassBorder },
      ]}
    >
      <BlurView
        tint="light"
        intensity={55}
        blurTarget={target}
        blurMethod="dimezisBlurViewSdk31Plus"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.glassTint }]} />
      <View style={{ height: 1, backgroundColor: c.glassHighlight, marginHorizontal: 18 }} />
    </View>
  );
}
export function AnimatedTabIcon({ Icon, focused }: { Icon: LucideIcon; focused: boolean }) {
  const active = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    active.set(withTiming(focused ? 1 : 0, { duration: 220, easing: Easing.out(Easing.cubic) }));
  }, [active, focused]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -active.value * 2 }, { scale: 1 + active.value * 0.12 }],
    backgroundColor: c.glassSelected,
    opacity: 0.55 + active.value * 0.45,
  }));
  return (
    <Animated.View
      style={[
        { width: 42, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      <Icon size={21} strokeWidth={1.8} color={c.glassBlue} />
    </Animated.View>
  );
}
export function GlassChip({
  selected,
  label,
  onPress,
}: {
  selected: boolean;
  label: string;
  onPress: () => void;
}) {
  const active = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    active.set(
      withTiming(selected ? 1 : 0, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [active, selected]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + active.value * 0.025 }, { translateY: -active.value }],
  }));
  return (
    <Animated.View style={style}>
      <GlassButton
        size="sm"
        variant="tertiary"
        className="rounded-full"
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        onPress={onPress}
        style={{
          backgroundColor: selected ? c.glassSelected : c.glassTint,
          borderWidth: 1,
          borderColor: selected ? c.glassBlue : c.glassBorder,
          minHeight: 36,
          paddingHorizontal: 14,
        }}
      >
        <Button.Label numberOfLines={1} style={{ color: c.glassBlue }}>
          {label}
        </Button.Label>
      </GlassButton>
    </Animated.View>
  );
}
export function GlassClip({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: c.glassBorder,
        backgroundColor: c.glassTint,
      }}
    >
      {children}
    </View>
  );
}
