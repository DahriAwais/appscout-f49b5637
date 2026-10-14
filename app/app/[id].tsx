import { useState } from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Button, PressableFeedback } from 'heroui-native';
import {
  Bookmark,
  Info,
  Star,
  Download,
  ArrowUpRight,
  ChevronRight,
  Check,
  MessageSquare,
  Hash,
} from 'lucide-react-native';
import { colors as c } from '@/lib/theme';
import { apps, estimate, money, compact } from '@/lib/scout';
import { useScout, selection } from '@/lib/store';
import { Txt, AppIcon, Growth, Sparkline, DemoNotice, EmptyState } from '@/components/ScoutUI';
export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const app = apps.find((a) => a.id === id);
  const watched = useScout((s) => s.watched);
  const toggle = useScout((s) => s.toggleWatch);
  const [tab, setTab] = useState('Overview');
  const [period, setPeriod] = useState('30 days');
  const [scenario, setScenario] = useState(1);
  const { width } = useWindowDimensions();
  if (!app)
    return (
      <View style={{ flex: 1, backgroundColor: c.white, padding: 24 }}>
        <EmptyState
          title="This app is not in the demo collection"
          action="Explore apps"
          onPress={() => router.replace('/explore')}
        />
      </View>
    );
  const revenue = estimate(app, scenario);
  const saved = watched.includes(app.id);
  const values = period === '7 days' ? app.trend.slice(-7) : app.trend;
  return (
    <>
      <Stack.Screen
        options={{
          title: 'App research',
          headerRight: () => (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={() => toggle(app.id)}
              accessibilityLabel={saved ? 'Remove from watchlist' : 'Save to watchlist'}
            >
              <Bookmark size={21} color={c.accent} fill={saved ? c.accent : 'none'} />
            </Button>
          ),
        }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: c.white }}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 15, paddingBottom: 50 }}
      >
        <View style={{ flexDirection: 'row', gap: 17, alignItems: 'center' }}>
          <AppIcon app={app} size={88} />
          <View style={{ flex: 1 }}>
            <Txt
              style={{
                fontSize: 24,
                lineHeight: 29,
                fontFamily: 'Inter_700Bold',
                letterSpacing: -0.6,
              }}
            >
              {app.name}
            </Txt>
            <Txt style={{ color: c.muted, fontSize: 12, marginTop: 7 }}>{app.developer}</Txt>
            <Txt style={{ color: c.muted, fontSize: 12, marginTop: 5 }}>
              {app.category} · {app.model}
            </Txt>
          </View>
        </View>
        <DemoNotice compact />
        <View
          style={{
            flexDirection: 'row',
            marginTop: 14,
            marginBottom: 24,
            paddingVertical: 16,
            backgroundColor: c.surface,
            borderRadius: 22,
          }}
        >
          {[
            { Icon: Star, value: String(app.rating), label: `${compact(app.ratings)} ratings` },
            { Icon: Download, value: `${compact(app.installs)}+`, label: 'Installs' },
            { Icon: Info, value: app.size, label: 'App size' },
          ].map(({ Icon, value, label }) => (
            <View key={label} style={{ flex: 1, alignItems: 'center', gap: 7 }}>
              <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                <Icon size={14} color={c.muted} />
                <Txt style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>{value}</Txt>
              </View>
              <Txt style={{ color: c.muted, fontSize: 11 }}>{label}</Txt>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 26 }}>
          {['Overview', 'Insights', 'Keywords'].map((t) => (
            <Button
              key={t}
              size="sm"
              variant={tab === t ? 'primary' : 'tertiary'}
              className={tab === t ? 'bg-accent rounded-full' : 'bg-surface rounded-full'}
              onPress={() => {
                setTab(t);
                selection();
              }}
            >
              <Button.Label>{t}</Button.Label>
            </Button>
          ))}
        </View>
        {tab === 'Overview' ? (
          <>
            <View style={{ backgroundColor: c.moneySoft, borderRadius: 24, padding: 22 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Txt style={{ color: c.money, fontFamily: 'Inter_500Medium', fontSize: 13 }}>
                  Est. monthly revenue
                </Txt>
                <PressableFeedback
                  onPress={() => router.push('/methodology')}
                  accessibilityLabel="About this estimate"
                >
                  <Info size={15} color={c.money} />
                </PressableFeedback>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  marginTop: 12,
                  gap: 5,
                  flexWrap: 'wrap',
                }}
              >
                <Txt
                  style={{
                    color: c.money,
                    fontFamily: 'Inter_700Bold',
                    fontSize: 43,
                    letterSpacing: -1.8,
                  }}
                >
                  {money(revenue.mid)}
                </Txt>
                <Txt style={{ color: c.money, fontSize: 16 }}>/mo</Txt>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 11 }}>
                <View style={{ height: 5, width: 5, borderRadius: 3, backgroundColor: c.amber }} />
                <Txt style={{ color: c.money, fontSize: 12 }}>Low confidence · USD</Txt>
              </View>
              <View
                style={{
                  height: 1,
                  backgroundColor: c.moneyBright,
                  opacity: 0.13,
                  marginVertical: 19,
                }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Txt style={{ color: c.money, fontSize: 11 }}>Low scenario</Txt>
                  <Txt
                    style={{
                      color: c.money,
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 17,
                      marginTop: 6,
                    }}
                  >
                    {money(revenue.low)}
                  </Txt>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Txt style={{ color: c.money, fontSize: 11 }}>High scenario</Txt>
                  <Txt
                    style={{
                      color: c.money,
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 17,
                      marginTop: 6,
                    }}
                  >
                    {money(revenue.high)}
                  </Txt>
                </View>
              </View>
            </View>
            <View style={{ marginTop: 31 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Txt style={{ fontFamily: 'Inter_600SemiBold', fontSize: 21 }}>Growth signal</Txt>
                <Growth value={app.growth} />
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 17, marginBottom: 15 }}>
                {['7 days', '30 days'].map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={p === period ? 'secondary' : 'ghost'}
                    onPress={() => {
                      setPeriod(p);
                      selection();
                    }}
                  >
                    <Button.Label>{p}</Button.Label>
                  </Button>
                ))}
              </View>
              <Sparkline
                values={values}
                width={width - 44}
                height={145}
                decline={app.growth < 0}
                fill
              />
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}
              >
                <Txt style={{ fontSize: 11, color: c.muted }}>
                  {period === '7 days' ? '7' : '30'} days ago
                </Txt>
                <Txt style={{ fontSize: 11, color: c.muted }}>Today</Txt>
              </View>
              <Txt style={{ fontSize: 11, color: c.muted, marginTop: 14 }}>
                Illustrative momentum, not measured revenue growth.
              </Txt>
            </View>
            <Txt
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 21,
                marginTop: 34,
                marginBottom: 14,
              }}
            >
              About this app
            </Txt>
            <Txt style={{ color: c.muted, lineHeight: 23 }}>{app.description}</Txt>
            <View style={{ marginTop: 20, gap: 12 }}>
              {[
                [
                  'Launched',
                  new Date(app.launched).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  }),
                ],
                [
                  'Updated',
                  new Date(app.updated).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }),
                ],
                ['Revenue model', app.model],
              ].map(([label, value]) => (
                <View
                  key={label}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}
                >
                  <Txt style={{ color: c.muted, fontSize: 13 }}>{label}</Txt>
                  <Txt style={{ fontFamily: 'Inter_500Medium', fontSize: 13 }}>{value}</Txt>
                </View>
              ))}
            </View>
            <Txt
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 21,
                marginTop: 34,
                marginBottom: 7,
              }}
            >
              Concept previews
            </Txt>
            <Txt style={{ fontSize: 11, color: c.muted, marginBottom: 17 }}>
              Illustrations, not Play Store screenshots.
            </Txt>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 14 }}
            >
              {['Your daily space', 'Find your rhythm', 'Little wins add up'].map((title, i) => (
                <View
                  key={title}
                  style={{
                    width: 153,
                    height: 244,
                    backgroundColor: c.surface,
                    borderRadius: 24,
                    padding: 15,
                  }}
                >
                  <AppIcon app={app} size={32} />
                  <Txt
                    style={{
                      fontSize: 19,
                      fontFamily: 'Inter_700Bold',
                      lineHeight: 24,
                      marginTop: 17,
                    }}
                  >
                    {title}
                  </Txt>
                  <View
                    style={{
                      backgroundColor: c.white,
                      borderRadius: 18,
                      padding: 12,
                      marginTop: 20,
                    }}
                  >
                    {i === 1 ? (
                      <Sparkline values={app.trend} width={100} height={66} fill />
                    ) : i === 0 ? (
                      <>
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 21,
                            backgroundColor: c.accentSoft,
                            alignSelf: 'center',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Check size={23} color={c.accent} />
                        </View>
                        <Txt style={{ fontSize: 12, textAlign: 'center', marginTop: 9 }}>
                          Today’s focus
                        </Txt>
                      </>
                    ) : (
                      <View style={{ gap: 14 }}>
                        {['Daily routine', 'Your progress', 'Next steps'].map((t) => (
                          <View
                            key={t}
                            style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}
                          >
                            <Check size={12} color={c.accent} />
                            <Txt style={{ fontSize: 11 }}>{t}</Txt>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </>
        ) : tab === 'Insights' ? (
          <>
            <Txt style={{ fontFamily: 'Inter_600SemiBold', fontSize: 23 }}>Inside the estimate</Txt>
            <Txt style={{ color: c.muted, lineHeight: 22, marginTop: 10 }}>
              Change the assumed paying share to compare revenue scenarios. These inputs are not
              measured.
            </Txt>
            <View style={{ flexDirection: 'row', gap: 7, marginTop: 20, marginBottom: 22 }}>
              {[
                { v: 0.5, t: 'Cautious' },
                { v: 1, t: 'Base' },
                { v: 1.5, t: 'Optimistic' },
              ].map((s) => (
                <Button
                  key={s.v}
                  size="sm"
                  variant={scenario === s.v ? 'primary' : 'tertiary'}
                  className="rounded-full"
                  onPress={() => {
                    setScenario(s.v);
                    selection();
                  }}
                >
                  <Button.Label>{s.t}</Button.Label>
                </Button>
              ))}
            </View>
            <View style={{ backgroundColor: c.moneySoft, borderRadius: 24, padding: 22 }}>
              <Txt style={{ color: c.money, fontSize: 12 }}>
                Est. monthly revenue · Low confidence
              </Txt>
              <Txt
                style={{ color: c.money, fontSize: 36, fontFamily: 'Inter_700Bold', marginTop: 10 }}
              >
                {money(revenue.mid)}
                <Txt style={{ color: c.money }}>/mo</Txt>
              </Txt>
            </View>
            <View style={{ marginTop: 25, gap: 19 }}>
              {[
                ['Monthly active share', `${(app.activeRate * 100).toFixed(0)}%`],
                ['Modeled active users', compact(revenue.active)],
                ['Assumed paying share', `${(app.paidRate * scenario * 100).toFixed(1)}%`],
                ['Spend / paying user', `$${app.arppu.toFixed(2)}/mo`],
                ['Purchase revenue', money(revenue.purchases)],
                ['Advertising revenue', money(revenue.ads)],
              ].map(([k, v]) => (
                <View
                  key={k}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}
                >
                  <Txt style={{ color: c.muted, fontSize: 13, flex: 1 }}>{k}</Txt>
                  <Txt style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>{v}</Txt>
                </View>
              ))}
            </View>
            <Button
              variant="secondary"
              className="mt-7 rounded-full"
              onPress={() => router.push('/methodology')}
            >
              <Button.Label>View the formula</Button.Label>
              <ChevronRight size={17} color={c.accent} />
            </Button>
            <Txt
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 21,
                marginTop: 34,
                marginBottom: 18,
              }}
            >
              Sample review themes
            </Txt>
            {[
              {
                title: 'Simple to use',
                note: 'A possible strength to validate in actual reviews.',
              },
              {
                title: 'More customization',
                note: 'An example of a potential feature opportunity.',
              },
            ].map((r) => (
              <View key={r.title} style={{ marginBottom: 19 }}>
                <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}>
                  <MessageSquare size={17} color={c.muted} />
                  <Txt style={{ fontFamily: 'Inter_500Medium' }}>{r.title}</Txt>
                </View>
                <Txt style={{ color: c.muted, fontSize: 12, lineHeight: 19, marginTop: 8 }}>
                  {r.note}
                </Txt>
              </View>
            ))}
          </>
        ) : (
          <>
            <Txt style={{ fontFamily: 'Inter_600SemiBold', fontSize: 23 }}>
              Keyword opportunities
            </Txt>
            <Txt
              style={{
                color: c.muted,
                fontSize: 13,
                lineHeight: 22,
                marginTop: 10,
                marginBottom: 24,
              }}
            >
              Suggested keywords from the demo app description. No live rank or search volume is
              available.
            </Txt>
            {app.keywords.map((k) => (
              <PressableFeedback
                key={k}
                onPress={() => router.push({ pathname: '/explore', params: { keyword: k } })}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 18, gap: 12 }}
              >
                <Hash size={20} color={c.accent} />
                <Txt style={{ fontSize: 16, fontFamily: 'Inter_500Medium', flex: 1 }}>{k}</Txt>
                <ArrowUpRight size={18} color={c.muted} />
              </PressableFeedback>
            ))}
            <View
              style={{ backgroundColor: c.surface, borderRadius: 23, padding: 21, marginTop: 18 }}
            >
              <Txt style={{ fontFamily: 'Inter_600SemiBold' }}>Validate before you build</Txt>
              <Txt style={{ color: c.muted, lineHeight: 22, marginTop: 10 }}>
                Search related apps and compare pricing, reviews and positioning. Keyword rankings
                require a connected store-data provider.
              </Txt>
            </View>
          </>
        )}
        <View style={{ marginTop: 32 }}>
          <Button
            size="lg"
            variant={saved ? 'secondary' : 'primary'}
            className="rounded-full"
            onPress={() => toggle(app.id)}
          >
            <Bookmark
              size={18}
              color={saved ? c.accent : c.white}
              fill={saved ? c.accent : 'none'}
            />
            <Button.Label>{saved ? 'Saved to watchlist' : 'Add to watchlist'}</Button.Label>
          </Button>
        </View>
        <DemoNotice />
      </ScrollView>
    </>
  );
}
