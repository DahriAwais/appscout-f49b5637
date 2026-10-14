import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, PressableFeedback } from 'heroui-native';
import {
  ChevronRight,
  Calculator,
  Globe2,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react-native';
import { colors as c } from '@/lib/theme';
import { useScout } from '@/lib/store';
import { Txt, Logo, DemoNotice } from '@/components/ScoutUI';
export default function ProfileScreen() {
  const inset = useSafeAreaInsets();
  const watched = useScout((s) => s.watched);
  const clearRecent = useScout((s) => s.clearRecent);
  return (
    <ScrollView
      style={{ backgroundColor: c.white }}
      contentContainerStyle={{
        paddingTop: inset.top + 26,
        paddingHorizontal: 22,
        paddingBottom: 130,
      }}
    >
      <Txt style={{ fontSize: 29, fontFamily: 'Inter_700Bold', letterSpacing: -0.8 }}>
        Your research space
      </Txt>
      <View style={{ paddingVertical: 35, alignItems: 'center', gap: 12 }}>
        <Logo size={64} />
        <Txt style={{ fontFamily: 'Inter_700Bold', fontSize: 22 }}>AppScout</Txt>
        <Txt style={{ color: c.muted }}>See what apps could earn.</Txt>
      </View>
      <View style={{ backgroundColor: c.surface, borderRadius: 24, padding: 22, marginBottom: 30 }}>
        <Txt style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17 }}>Demo mode</Txt>
        <Txt style={{ color: c.muted, lineHeight: 22, marginTop: 9 }}>
          Browse fictional apps and explore how revenue estimates work. Live store search is not
          connected.
        </Txt>
        <DemoNotice compact />
      </View>
      {[
        { Icon: Calculator, label: 'How estimates work', press: () => router.push('/methodology') },
        {
          Icon: Globe2,
          label: 'Market · Google Play / USD',
          press: () => router.push('/methodology'),
        },
        { Icon: RotateCcw, label: 'Replay introduction', press: () => router.push('/onboarding') },
        { Icon: Trash2, label: 'Clear recent searches', press: clearRecent },
      ].map(({ Icon, label, press }) => (
        <PressableFeedback
          key={label}
          onPress={press}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 19, gap: 14 }}
        >
          <Icon size={21} color={c.muted} />
          <Txt style={{ flex: 1, fontFamily: 'Inter_500Medium' }}>{label}</Txt>
          <ChevronRight size={18} color={c.muted} />
        </PressableFeedback>
      ))}
      <View style={{ height: 1, backgroundColor: c.line, marginVertical: 23 }} />
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <ShieldCheck size={21} color={c.accent} />
        <Txt style={{ color: c.muted, fontSize: 12, lineHeight: 20, flex: 1 }}>
          Your watchlist and searches stay on this device. No account is needed.
        </Txt>
      </View>
      <Button
        variant="tertiary"
        className="bg-surface mt-6 rounded-full"
        onPress={() => router.push('/watchlist')}
      >
        <Button.Label>
          {watched.length} saved {watched.length === 1 ? 'app' : 'apps'}
        </Button.Label>
      </Button>
    </ScrollView>
  );
}
