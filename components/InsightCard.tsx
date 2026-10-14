import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { PressableFeedback } from 'heroui-native';
import { ChevronDown, ChevronUp, Clock3 } from 'lucide-react-native';
import { Txt } from './ScoutUI';
import { colors as c } from '@/lib/theme';
import { selection } from '@/lib/store';
export function InsightCard({
  title,
  insight,
  children,
  detail,
}: {
  title: string;
  insight: string;
  children: ReactNode;
  detail?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View
      style={{
        backgroundColor: c.white,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: c.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.065,
        shadowRadius: 14,
        elevation: 2,
      }}
    >
      <PressableFeedback
        onPress={() => {
          setExpanded(!expanded);
          selection();
        }}
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${title}`}
        accessibilityState={{ expanded }}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: 44,
          marginTop: -8,
          marginBottom: 12,
        }}
      >
        <Txt style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, flex: 1 }}>{title}</Txt>
        {expanded ? (
          <ChevronUp size={17} color={c.accent} />
        ) : (
          <ChevronDown size={17} color={c.accent} />
        )}
      </PressableFeedback>
      {children}
      <Txt numberOfLines={1} style={{ color: c.muted, fontSize: 11, marginTop: 14 }}>
        {insight}
      </Txt>
      {expanded && (
        <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderColor: c.line }}>
          {detail ?? <Txt style={{ color: c.muted, lineHeight: 20 }}>{insight}</Txt>}
        </View>
      )}
    </View>
  );
}
export function Unavailable({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 15 }}>
      <Clock3 size={19} color={c.accent} />
      <Txt style={{ flex: 1, fontSize: 12, lineHeight: 19, color: c.muted }}>{text}</Txt>
    </View>
  );
}
