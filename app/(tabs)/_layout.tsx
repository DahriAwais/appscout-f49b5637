import { Platform } from 'react-native';
import { Home, Compass, Bookmark, UserRound } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as c } from '@/lib/theme';
import { selection } from '@/lib/store';
export default function TabLayout() {
  const inset = useSafeAreaInsets();
  return (
    <>
      {/* eslint-disable-next-line react/style-prop-object -- Expo StatusBar defines style as 'auto' | 'inverted' | 'light' | 'dark', not a View style object. */}
      <StatusBar style="dark" />
      <Tabs
        safeAreaInsets={{ bottom: 0 }}
        screenListeners={({ navigation, route }) => ({
          tabPress: () => {
            const state = navigation.getState();
            if (state.routes[state.index]?.key !== route.key) selection();
          },
        })}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: c.white },
          tabBarActiveTintColor: c.accent,
          tabBarInactiveTintColor: c.muted,
          tabBarLabelStyle: {
            fontFamily: Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : 'Inter_500Medium',
            fontWeight: '500',
            fontSize: 11,
            marginTop: 0,
            lineHeight: 14,
          },
          tabBarItemStyle: { paddingTop: 5, paddingBottom: 0 },
          tabBarIconStyle: { height: 25 },
          tabBarStyle: {
            position: 'absolute',
            bottom: Math.max(inset.bottom, 12),
            marginHorizontal: 16,
            height: 60,
            paddingBottom: 8,
            paddingTop: 0,
            borderRadius: 26,
            backgroundColor: c.white,
            borderTopWidth: 0,
            shadowColor: c.shadow,
            shadowOffset: { width: 0, height: 5 },
            shadowRadius: 22,
            shadowOpacity: 0.12,
            elevation: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <Home size={21} color={c.accent} fill={focused ? c.accentSoft : 'none'} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ focused }) => (
              <Compass size={21} color={c.teal} fill={focused ? c.moneySoft : 'none'} />
            ),
          }}
        />
        <Tabs.Screen
          name="watchlist"
          options={{
            title: 'Watchlist',
            tabBarIcon: ({ focused }) => (
              <Bookmark size={21} color={c.amber} fill={focused ? c.yellow : 'none'} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <UserRound size={21} color={c.violet} fill={focused ? c.accentSoft : 'none'} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
