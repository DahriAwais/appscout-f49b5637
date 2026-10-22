import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Platform, View } from 'react-native';
import { Home, Compass, Bookmark, UserRound } from 'lucide-react-native';
import { Tabs, useIsFocused } from 'expo-router';
import { BlurTargetView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as c } from '@/lib/theme';
import { selection } from '@/lib/store';
import { AnimatedTabIcon, GlassBackground } from '@/components/GlassControls';

function GlassScene({
  children,
  onTarget,
}: {
  children: ReactNode;
  onTarget: (target: RefObject<View | null>) => void;
}) {
  const target = useRef<View>(null);
  const focused = useIsFocused();
  useEffect(() => {
    if (focused) onTarget(target);
  }, [focused, onTarget]);
  return (
    <BlurTargetView ref={target} style={{ flex: 1 }}>
      {children}
    </BlurTargetView>
  );
}
export default function TabLayout() {
  const inset = useSafeAreaInsets();
  const [target, setTarget] = useState<RefObject<View | null>>();
  return (
    <>
      {/* oxlint-disable-next-line react/style-prop-object -- StatusBar's style is a theme enum. */}
      <StatusBar style="dark" />
      <Tabs
        safeAreaInsets={{ bottom: 0 }}
        screenLayout={({ children }) => <GlassScene onTarget={setTarget}>{children}</GlassScene>}
        screenListeners={({ navigation, route }) => ({
          tabPress: () => {
            const state = navigation.getState();
            if (state.routes[state.index]?.key !== route.key) selection();
          },
        })}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: c.white },
          tabBarActiveTintColor: c.glassBlue,
          tabBarInactiveTintColor: c.glassBlue,
          tabBarBackground: () => <GlassBackground target={target} />,
          tabBarLabelStyle: {
            fontFamily: Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : 'Inter_500Medium',
            fontWeight: '500',
            fontSize: 11,
            marginTop: 0,
            lineHeight: 14,
          },
          tabBarItemStyle: { paddingTop: 5, paddingBottom: 0 },
          tabBarIconStyle: { height: 28 },
          tabBarStyle: {
            position: 'absolute',
            bottom: Math.max(inset.bottom, 12),
            marginHorizontal: 16,
            height: 62,
            paddingBottom: 8,
            paddingTop: 0,
            borderRadius: 26,
            backgroundColor: c.transparent,
            borderTopWidth: 0,
            shadowColor: c.shadow,
            shadowOffset: { width: 0, height: 5 },
            shadowRadius: 18,
            shadowOpacity: 0.1,
            elevation: 6,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => <AnimatedTabIcon Icon={Home} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ focused }) => <AnimatedTabIcon Icon={Compass} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="watchlist"
          options={{
            title: 'Watchlist',
            tabBarIcon: ({ focused }) => <AnimatedTabIcon Icon={Bookmark} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => <AnimatedTabIcon Icon={UserRound} focused={focused} />,
          }}
        />
      </Tabs>
    </>
  );
}
