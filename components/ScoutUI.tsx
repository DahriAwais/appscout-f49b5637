import { Text, View, Image, Platform, StyleSheet, type TextProps } from 'react-native';
import { PressableFeedback, Skeleton } from 'heroui-native';
import { GlassButton as Button } from './GlassControls';
import { router } from 'expo-router';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import {
  ArrowRight,
  Search,
  Info,
  Star,
  Bookmark,
  ImageOff,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { colors as c } from '@/lib/theme';
import { money, type ScoutApp } from '@/lib/scout';
import { useRevenueScenario } from '@/lib/revenue';
import { useScout } from '@/lib/store';
export function Txt({ style, ...props }: TextProps) {
  const resolved = StyleSheet.flatten([
    { fontFamily: 'Inter_400Regular', color: c.ink, fontSize: 13, includeFontPadding: false },
    style,
  ]);
  const weight = resolved.fontFamily?.includes('700')
    ? '700'
    : resolved.fontFamily?.includes('600')
      ? '600'
      : resolved.fontFamily?.includes('500')
        ? '500'
        : '400';
  return (
    <Text
      {...props}
      style={[
        resolved,
        Platform.OS === 'web' && { fontFamily: 'Inter, system-ui, sans-serif', fontWeight: weight },
      ]}
    />
  );
}
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      accessibilityLabel="AppScout logo: a lens discovering an upward signal"
    >
      <Rect x="2" y="2" width="60" height="60" rx="19" fill={c.accent} />
      <Circle cx="28" cy="28" r="16" stroke={c.white} strokeWidth="5" fill="none" />
      <Path d="m40 40 11 11" stroke={c.white} strokeWidth="6" strokeLinecap="round" />
      <Path
        d="m18 33 8-8 6 5 12-14"
        stroke={c.white}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="45" cy="15" r="5" fill={c.moneyBright} />
    </Svg>
  );
}
export function AppIcon({
  app,
  size = 80,
}: {
  app: Pick<ScoutApp, 'icon' | 'name'>;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.23,
        overflow: 'hidden',
        backgroundColor: c.surface,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {app.icon && !failed ? (
        <Image
          source={{ uri: app.icon }}
          resizeMode="contain"
          accessibilityLabel={`${app.name} icon`}
          onError={() => setFailed(true)}
          style={{ width: size, height: size, resizeMode: 'contain' }}
        />
      ) : (
        <ImageOff size={Math.min(24, size / 2)} color={c.muted} />
      )}
    </View>
  );
}
export function Revenue({ app }: { app: ScoutApp }) {
  const { result: value } = useRevenueScenario(app);
  return (
    <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
      <Txt
        numberOfLines={1}
        style={{
          color: value ? c.money : c.muted,
          fontSize: 11,
          flexShrink: 1,
          fontFamily: value ? 'Inter_600SemiBold' : 'Inter_400Regular',
        }}
      >
        {value
          ? `Est. ${money(value.mid)}/mo`
          : app.metadataState === 'loading'
            ? 'Calculating…'
            : app.metadataState === 'error'
              ? 'Retry estimate'
              : 'Est. unavailable'}
      </Txt>
      <PressableFeedback
        onPress={() => router.push('/methodology')}
        accessibilityLabel="How we estimate"
        style={{ paddingVertical: 8, paddingHorizontal: 2, minHeight: 32 }}
      >
        <Info size={12} color={value ? c.money : c.muted} />
      </PressableFeedback>
    </View>
  );
}
export function AppCard({ app }: { app: ScoutApp }) {
  return (
    <View style={{ width: 94 }}>
      <PressableFeedback
        onPress={() => router.push({ pathname: '/app/[id]', params: { id: app.id } })}
        accessibilityLabel={`${app.name}, ${app.rating?.toFixed(1) ?? 'unrated'}, open research`}
      >
        <AppIcon app={app} size={64} />
        <Txt
          numberOfLines={2}
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 12,
            lineHeight: 16,
            marginTop: 6,
            minHeight: 32,
          }}
        >
          {app.name}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center', marginTop: 3 }}>
          <Star size={11} color={c.accent} />
          <Txt numberOfLines={1} style={{ fontSize: 11, color: c.muted }}>
            {app.rating?.toFixed(1) ?? '—'} · {app.priceText ?? app.category ?? 'Google Play'}
          </Txt>
        </View>
      </PressableFeedback>
      <Revenue app={app} />
    </View>
  );
}
export function AppRow({
  app,
  removable = false,
  onOpen,
}: {
  app: ScoutApp;
  removable?: boolean;
  onOpen?: () => void;
}) {
  const toggle = useScout((s) => s.toggleWatch);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 7 }}>
      <PressableFeedback
        onPress={() => {
          onOpen?.();
          router.push({ pathname: '/app/[id]', params: { id: app.id } });
        }}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 }}
      >
        <AppIcon app={app} size={42} />
        <View style={{ flex: 1 }}>
          <Txt numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold' }}>
            {app.name}
          </Txt>
          <Txt numberOfLines={1} style={{ fontSize: 11, color: c.muted, marginTop: 3 }}>
            {app.developer}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Star size={11} color={c.accent} />
            <Txt style={{ fontSize: 11, color: c.muted }}>{app.rating?.toFixed(1) ?? '—'}</Txt>
          </View>
        </View>
      </PressableFeedback>
      <View style={{ maxWidth: 106 }}>
        <Revenue app={app} />
      </View>
      {removable && (
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          onPress={() => toggle(app.id)}
          accessibilityLabel={`Remove ${app.name}`}
        >
          <Bookmark size={18} color={c.accent} fill={c.accent} />
        </Button>
      )}
    </View>
  );
}
export function SectionHeading({ title, onPress }: { title: string; onPress?: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}
    >
      <Txt style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, flex: 1 }}>{title}</Txt>
      {onPress && (
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          onPress={onPress}
          accessibilityLabel={`See ${title}`}
        >
          <ArrowRight color={c.accent} size={18} />
        </Button>
      )}
    </View>
  );
}
export function SourceNotice() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}>
      <Info size={12} color={c.muted} />
      <Txt style={{ fontSize: 11, color: c.muted }}>Google Play · US · English</Txt>
    </View>
  );
}
export function EmptyState({
  title,
  action,
  onPress,
  icon: Icon = Search,
}: {
  title: string;
  action: string;
  onPress: () => void;
  icon?: LucideIcon;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 36, paddingHorizontal: 8, gap: 16 }}>
      <Icon size={30} color={c.accent} />
      <Txt style={{ textAlign: 'center', fontSize: 14, lineHeight: 21 }}>{title}</Txt>
      <Button variant="secondary" onPress={onPress}>
        <Button.Label>{action}</Button.Label>
      </Button>
    </View>
  );
}
export function LoadingRows() {
  return (
    <View style={{ gap: 16, paddingVertical: 12 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Skeleton className="h-10 w-10 rounded-xl" />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton className="h-4 w-4/5 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md" />
          </View>
        </View>
      ))}
    </View>
  );
}
