import { useState } from 'react';
import { View, Image, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'heroui-native';
import { router } from 'expo-router';
import {
  ArrowRight,
  Search,
  Bookmark,
  Smartphone,
  Calculator,
  Star,
  Globe2,
} from 'lucide-react-native';
import { colors as c } from '@/lib/theme';
import { useScout, selection, success } from '@/lib/store';
import { Logo, Txt } from '@/components/ScoutUI';
const headlines = ['Explore real apps.', 'Understand the signals.', 'Build your watchlist.'];
const finish = () => {
  useScout.getState().completeOnboarding();
  success();
  router.replace('/');
};
export default function OnboardingScreen() {
  const [page, setPage] = useState(0);
  const inset = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const size = Math.min(width - 48, height * 0.34, 280);
  return (
    <View style={{ flex: 1, backgroundColor: c.white }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: inset.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 16,
        }}
      >
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Logo size={38} />
          <Button variant="ghost" size="sm" onPress={finish}>
            <Button.Label>Skip</Button.Label>
          </Button>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 24 }}>
          <View
            style={{
              width: size,
              height: size + 30,
              alignSelf: 'center',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {page === 0 ? (
              <>
                <Image
                  source={require('@/assets/globe.png')}
                  resizeMode="contain"
                  style={{ width: size, height: size }}
                />
                {[
                  { Icon: Smartphone, label: 'Store data', left: 0, top: 0.22 },
                  { Icon: Star, label: 'Real reviews', left: 0.5, top: 0.54 },
                  { Icon: Calculator, label: 'Your estimates', left: 0.12, top: 0.82 },
                ].map((p) => (
                  <View
                    key={p.label}
                    style={{
                      position: 'absolute',
                      left: size * p.left,
                      top: size * p.top,
                      backgroundColor: c.white,
                      borderRadius: 18,
                      padding: 10,
                      flexDirection: 'row',
                      gap: 6,
                      alignItems: 'center',
                      shadowColor: c.shadow,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.09,
                      shadowRadius: 14,
                      elevation: 2,
                    }}
                  >
                    <p.Icon size={16} color={c.accent} />
                    <Txt style={{ fontSize: 11 }}>{p.label}</Txt>
                  </View>
                ))}
              </>
            ) : page === 1 ? (
              <View style={{ gap: 20, width: '100%' }}>
                {[
                  { Icon: Globe2, label: 'Public store facts' },
                  { Icon: Calculator, label: 'Explicit revenue assumptions' },
                  { Icon: Star, label: 'Ratings, not invented trends' },
                ].map((p) => (
                  <View
                    key={p.label}
                    style={{
                      flexDirection: 'row',
                      gap: 12,
                      alignItems: 'center',
                      paddingVertical: 15,
                      borderBottomWidth: 1,
                      borderColor: c.line,
                    }}
                  >
                    <p.Icon size={26} color={c.accent} />
                    <Txt style={{ flex: 1, fontFamily: 'Inter_500Medium' }}>{p.label}</Txt>
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ alignItems: 'center', gap: 24 }}>
                <Bookmark size={88} color={c.accent} fill={c.accentSoft} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  <Search size={20} color={c.accent} />
                  <Txt>Search. Save. Research.</Txt>
                </View>
              </View>
            )}
          </View>
          <Txt
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 30,
              lineHeight: 38,
              letterSpacing: -0.8,
              marginTop: 38,
            }}
          >
            {headlines[page]}
          </Txt>
          {page === 0 && (
            <Txt style={{ color: c.muted, lineHeight: 21, marginTop: 10 }}>
              Google Play listings. No made-up earnings.
            </Txt>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 7, marginBottom: 18 }}>
          {headlines.map((h, i) => (
            <View
              key={h}
              style={{
                width: i === page ? 24 : 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: i === page ? c.accent : c.line,
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
          <Button.Label>{page === 2 ? 'Get started' : 'Continue'}</Button.Label>
          <ArrowRight size={18} color={c.white} />
        </Button>
        <View style={{ height: inset.bottom + 6 }} />
      </ScrollView>
    </View>
  );
}
