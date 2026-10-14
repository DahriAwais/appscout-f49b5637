import { useId } from 'react';
import { Text, View, Platform, StyleSheet, type TextProps } from 'react-native';
import { PressableFeedback, Button } from 'heroui-native';
import { router } from 'expo-router';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Search,
  Info,
  Star,
  Bookmark,
  type LucideIcon,
} from 'lucide-react-native';
import { colors as c } from '@/lib/theme';
import { estimate, money, type ScoutApp } from '@/lib/scout';
import { useScout } from '@/lib/store';

export function Txt({ style, ...props }: TextProps) {
  const resolved = StyleSheet.flatten([
    { fontFamily: 'Inter_400Regular', color: c.ink, fontSize: 14 },
    style,
  ]);
  const webWeight = resolved.fontFamily?.includes('700')
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
        Platform.OS === 'web' && {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: webWeight,
        },
      ]}
    />
  );
}
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessibilityLabel="AppScout">
      <Rect x="1" y="1" width="38" height="38" rx="13" fill={c.accent} />
      <Path d="M11 27 19 12h3l7 15h-5l-4-9-5 9Z" fill={c.white} />
      <Circle cx="28" cy="12" r="3" fill={c.moneyBright} />
    </Svg>
  );
}
export function AppIcon({ app, size = 100 }: { app: ScoutApp; size?: number }) {
  const bg = c[app.tint];
  const gradientId = `icon${useId().replace(/:/g, '')}`;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.24, overflow: 'hidden' }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={bg} />
            <Stop offset="1" stopColor={bg} stopOpacity=".78" />
          </LinearGradient>
        </Defs>
        <Rect width="100" height="100" rx="24" fill={`url(#${gradientId})`} />
        <Circle cx="90" cy="0" r="55" fill={c.white} opacity=".1" />
        {app.icon === 'focus' && (
          <>
            <Circle
              cx="50"
              cy="50"
              r="25"
              fill="none"
              stroke={c.white}
              strokeWidth="9"
              strokeDasharray="120 38"
              strokeLinecap="round"
            />
            <Path
              d="M50 32v18l12 7"
              fill="none"
              stroke={c.white}
              strokeWidth="6"
              strokeLinecap="round"
            />
          </>
        )}
        {app.icon === 'leaf' && (
          <>
            <Path d="M50 74C14 61 25 24 48 31c1-14 33-12 32 10-1 22-18 33-30 33Z" fill={c.white} />
            <Path d="m50 74 7-28" stroke={bg} strokeWidth="4" strokeLinecap="round" />
          </>
        )}
        {app.icon === 'wallet' && (
          <>
            <Rect x="22" y="31" width="56" height="42" rx="12" fill={c.white} />
            <Path d="m28 31 34-9 6 9" stroke={c.white} strokeWidth="5" fill="none" />
            <Rect x="57" y="44" width="24" height="18" rx="6" fill={bg} />
            <Circle cx="65" cy="53" r="3" fill={c.white} />
          </>
        )}
        {app.icon === 'wave' && (
          <>
            <Path
              d="M20 57q15-30 30 0t30 0M20 42q15-30 30 0t30 0M20 72q15-30 30 0t30 0"
              fill="none"
              stroke={c.white}
              strokeWidth="7"
              strokeLinecap="round"
            />
          </>
        )}
        {app.icon === 'puzzle' && (
          <>
            <Rect x="23" y="23" width="25" height="25" rx="7" fill={c.white} />
            <Rect x="53" y="23" width="25" height="25" rx="7" fill={c.white} opacity=".6" />
            <Rect x="23" y="53" width="25" height="25" rx="7" fill={c.white} opacity=".6" />
            <Rect x="53" y="53" width="25" height="25" rx="7" fill={c.white} />
          </>
        )}
        {app.icon === 'book' && (
          <>
            <Path d="M22 28q16-5 28 6 12-11 28-6v44q-16-5-28 4-12-9-28-4Z" fill={c.white} />
            <Path d="M50 34v42" stroke={bg} strokeWidth="4" />
          </>
        )}
        {app.icon === 'orbit' && (
          <>
            <Circle cx="50" cy="50" r="15" fill={c.white} />
            <Path
              d="M24 69C5 50 53 7 75 28c21 21-29 63-51 41Z"
              fill="none"
              stroke={c.white}
              strokeWidth="5"
            />
            <Circle cx="74" cy="29" r="7" fill={c.white} />
          </>
        )}
        {app.icon === 'spark' && (
          <Path d="m50 20 9 21 21 9-21 9-9 21-9-21-21-9 21-9Z" fill={c.white} />
        )}
      </Svg>
    </View>
  );
}
export function Sparkline({
  values,
  width = 100,
  height = 30,
  decline = false,
  fill = false,
}: {
  values: number[];
  width?: number;
  height?: number;
  decline?: boolean;
  fill?: boolean;
}) {
  const gradientId = `chart${useId().replace(/:/g, '')}`;
  const min = Math.min(...values),
    max = Math.max(...values);
  const pts = values.map(
    (v, i) =>
      `${(i / (values.length - 1)) * (width - 6) + 3},${height - 5 - ((v - min) / (max - min || 1)) * (height - 12)}`,
  );
  const path = `M${pts.join(' L')}`;
  const color = decline ? c.red : c.moneyBright;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity=".15" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {fill && (
        <Path d={`${path} L${width - 3},${height} L3,${height}Z`} fill={`url(#${gradientId})`} />
      )}
      <Path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={fill ? 3 : 2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}
export function Growth({ value }: { value: number }) {
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <Icon size={13} color={value >= 0 ? c.money : c.red} />
      <Txt
        style={{ fontSize: 12, color: value >= 0 ? c.money : c.red, fontFamily: 'Inter_500Medium' }}
      >
        {Math.abs(value)}%
      </Txt>
    </View>
  );
}
export function Revenue({ app, large = false }: { app: ScoutApp; large?: boolean }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
        <Txt style={{ fontSize: 11, color: c.muted }}>est.</Txt>
        <Txt style={{ fontFamily: 'Inter_700Bold', fontSize: large ? 22 : 17, color: c.money }}>
          {money(estimate(app).mid)}
          <Txt style={{ color: c.money, fontSize: 11 }}>/mo</Txt>
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.amber }} />
        <Txt style={{ fontSize: 11, color: c.muted }}>Low confidence</Txt>
      </View>
    </View>
  );
}
export function AppCard({ app }: { app: ScoutApp }) {
  return (
    <PressableFeedback
      onPress={() => router.push({ pathname: '/app/[id]', params: { id: app.id } })}
      accessibilityLabel={`${app.name}, estimated ${money(estimate(app).mid)} per month, demo`}
      style={{ width: 124 }}
    >
      <AppIcon app={app} size={124} />
      <Txt
        numberOfLines={1}
        style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, marginTop: 11 }}
      >
        {app.name}
      </Txt>
      <Txt style={{ color: c.muted, fontSize: 11, marginTop: 3, marginBottom: 9 }}>
        {app.category}
      </Txt>
      <Revenue app={app} />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 8,
        }}
      >
        <Sparkline values={app.trend} width={64} height={22} decline={app.growth < 0} />
        <Growth value={app.growth} />
      </View>
    </PressableFeedback>
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 22 }}>
      <PressableFeedback
        onPress={() => {
          onOpen?.();
          router.push({ pathname: '/app/[id]', params: { id: app.id } });
        }}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 13 }}
      >
        <AppIcon app={app} size={64} />
        <View style={{ flex: 1 }}>
          <Txt numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>
            {app.name}
          </Txt>
          <Txt numberOfLines={1} style={{ color: c.muted, fontSize: 12, marginTop: 4 }}>
            {app.tagline}
          </Txt>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 5,
              marginTop: 7,
            }}
          >
            <Txt style={{ color: c.muted, fontSize: 11 }}>{app.category}</Txt>
            <Growth value={app.growth} />
          </View>
        </View>
        <Revenue app={app} />
      </PressableFeedback>
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
        marginBottom: 18,
      }}
    >
      <Txt style={{ fontFamily: 'Inter_600SemiBold', fontSize: 21, flex: 1 }}>{title}</Txt>
      {onPress && (
        <Button
          isIconOnly
          size="sm"
          variant="tertiary"
          onPress={onPress}
          accessibilityLabel={`See ${title}`}
          className="bg-surface rounded-full"
        >
          <ArrowRight color={c.ink} size={19} />
        </Button>
      )}
    </View>
  );
}
export function DemoNotice({ compact = false }: { compact?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 9 }}>
      <Info size={13} color={c.muted} />
      <Txt style={{ fontSize: 11, color: c.muted, flex: 1 }}>
        {compact
          ? 'Demo data · Not verified earnings'
          : 'Demo collection · Fictional apps & revenue estimates'}
      </Txt>
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
    <View style={{ alignItems: 'center', paddingVertical: 64, gap: 18 }}>
      <Icon size={34} color={c.muted} />
      <Txt style={{ textAlign: 'center', fontSize: 16 }}>{title}</Txt>
      <Button variant="secondary" onPress={onPress}>
        <Button.Label>{action}</Button.Label>
      </Button>
    </View>
  );
}
export function Rating({ app }: { app: ScoutApp }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Star size={12} color={c.muted} />
      <Txt style={{ fontSize: 12, color: c.muted }}>{app.rating}</Txt>
    </View>
  );
}
