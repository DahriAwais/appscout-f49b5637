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
            marginTop: 3,
          },
          tabBarItemStyle: { paddingTop: 10, paddingBottom: 10 },
          tabBarStyle: {
            position: 'absolute',
            bottom: Math.max(inset.bottom, 16),
            left: 20,
            right: 20,
            marginHorizontal: 20,
            height: 72,
            paddingBottom: 0,
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
          options={{ title: 'Home', tabBarIcon: ({ color }) => <Home size={22} color={color} /> }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color }) => <Compass size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="watchlist"
          options={{
            title: 'Watchlist',
            tabBarIcon: ({ color }) => <Bookmark size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <UserRound size={22} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}
