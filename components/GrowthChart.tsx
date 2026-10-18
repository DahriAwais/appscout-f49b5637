import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { GlassButton as Button } from './GlassControls';
import type { Snapshot } from '@/lib/scout';
import { compact } from '@/lib/scout';
import { ratingGrowth } from '@/lib/insights';
import { colors as c } from '@/lib/theme';
import { selection } from '@/lib/store';
import { Txt } from './ScoutUI';
import { InsightCard, Unavailable } from './InsightCard';
export function GrowthChart({
  history,
  historyError,
  retry,
}: {
  history: Snapshot[];
  historyError: string | null;
  retry: () => void;
}) {
  const [period, setPeriod] = useState(30);
  const [width, setWidth] = useState(240);
  const [selected, setSelected] = useState<number | null>(null);
  const end = history.at(-1)?.day;
  const data = history.filter(
    (p) =>
      p.ratings !== null &&
      (!end || new Date(end).getTime() - new Date(p.day).getTime() <= period * 86400000),
  );
  const growth = ratingGrowth(data);
  const ready = growth !== null;
  const values = data.map((p) => p.ratings ?? 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const firstTime = data[0] ? new Date(data[0].day).getTime() : 0;
  const lastTime = data.at(-1) ? new Date(data.at(-1)!.day).getTime() : 0;
  const points = data.map((p) => ({
    x: 4 + ((new Date(p.day).getTime() - firstTime) / (lastTime - firstTime || 1)) * (width - 8),
    y: 105 - (((p.ratings ?? 0) - min) / (max - min || 1)) * 85,
  }));
  let path = points[0] ? `M${points[0].x},${points[0].y}` : '';
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1],
      curr = points[i],
      mid = (prev.x + curr.x) / 2;
    path += ` C${mid},${prev.y} ${mid},${curr.y} ${curr.x},${curr.y}`;
  }
  const weekly: { end: number; value: number }[] = [];
  if (ready) {
    for (let i = 0; i < 4; i++) {
      const upper = lastTime - (3 - i) * 7 * 86400000,
        lower = upper - 7 * 86400000;
      let delta = 0;
      for (let j = 1; j < data.length; j++) {
        const t = new Date(data[j].day).getTime();
        if (t > lower && t <= upper)
          delta += Math.max(0, (data[j].ratings ?? 0) - (data[j - 1].ratings ?? 0));
      }
      weekly.push({ end: upper, value: delta });
    }
  }
  const insight = ready
    ? `Ratings ${growth >= 0 ? '+' : ''}${growth.toFixed(1)}% across observed days`
    : 'Collecting data, trend appears soon';
  return (
    <InsightCard
      title="Growth"
      insight={insight}
      detail={
        <Txt style={{ color: c.muted, lineHeight: 20 }}>
          Ratings are a momentum signal, not revenue growth. Observations are saved on app visits;
          gaps are not filled. Weekly bars show observed rating-count increases, not new written
          reviews.
        </Txt>
      }
    >
      <View style={{ flexDirection: 'row', gap: 5, marginBottom: 12 }}>
        {[7, 30, 90].map((p) => (
          <Button
            key={p}
            size="sm"
            variant={p === period ? 'secondary' : 'ghost'}
            onPress={() => {
              setPeriod(p);
              setSelected(null);
              selection();
            }}
          >
            <Button.Label>{p}D</Button.Label>
          </Button>
        ))}
      </View>
      {historyError ? (
        <Button variant="secondary" onPress={retry}>
          <Button.Label>Retry history</Button.Label>
        </Button>
      ) : !ready ? (
        <Unavailable text="At least 7 daily observations are needed." />
      ) : (
        <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          <View
            onStartShouldSetResponder={() => true}
            onResponderGrant={(e) => {
              setSelected(
                Math.round(
                  Math.max(0, Math.min(1, e.nativeEvent.locationX / width)) * (data.length - 1),
                ),
              );
              selection();
            }}
            onResponderMove={(e) =>
              setSelected(
                Math.round(
                  Math.max(0, Math.min(1, e.nativeEvent.locationX / width)) * (data.length - 1),
                ),
              )
            }
            accessibilityLabel={`Ratings growth ${growth.toFixed(1)} percent`}
          >
            <Svg width={width} height={118}>
              <Path d={`${path} L${width - 4},118 L4,118 Z`} fill={c.accentSoft} />
              <Path d={path} fill="none" stroke={c.accent} strokeWidth={2.5} />
              {points.map((p, i) =>
                i > 0 && data[i].updated_at !== data[i - 1].updated_at ? (
                  <Circle
                    key={data[i].day}
                    cx={p.x}
                    cy={p.y}
                    r={4}
                    fill={c.accent}
                    stroke={c.white}
                    strokeWidth={2}
                  />
                ) : null,
              )}
              {selected !== null && points[selected] && (
                <>
                  <Line
                    x1={points[selected].x}
                    x2={points[selected].x}
                    y1={0}
                    y2={118}
                    stroke={c.accent}
                    strokeDasharray="3 4"
                  />
                  <Circle cx={points[selected].x} cy={points[selected].y} r={4} fill={c.accent} />
                </>
              )}
            </Svg>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Txt style={{ fontSize: 11, color: c.muted }}>{data[0]?.day}</Txt>
            <Txt style={{ fontSize: 11, color: c.accent }}>
              {selected !== null
                ? `${data[selected]?.day}: ${compact(data[selected]?.ratings ?? 0)}`
                : data.at(-1)?.day}
            </Txt>
          </View>
          <Txt style={{ fontSize: 11, color: c.muted, marginTop: 18 }}>
            Observed new ratings / week
          </Txt>
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              height: 50,
              alignItems: 'flex-end',
              marginTop: 10,
            }}
          >
            {weekly.map(({ end: weekEnd, value }) => (
              <View key={weekEnd} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <View
                  style={{
                    width: '100%',
                    height: Math.max(
                      2,
                      (value / Math.max(...weekly.map((week) => week.value), 1)) * 30,
                    ),
                    borderRadius: 4,
                    backgroundColor: c.accent,
                  }}
                />
                <Txt style={{ fontSize: 11, color: c.muted }}>{compact(value)}</Txt>
              </View>
            ))}
          </View>
        </View>
      )}
    </InsightCard>
  );
}
