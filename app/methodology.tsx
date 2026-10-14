import { ScrollView, View } from 'react-native';
import { Calculator, TriangleAlert, Activity, Users, CircleDollarSign } from 'lucide-react-native';
import { colors as c } from '@/lib/theme';
import { Txt } from '@/components/ScoutUI';
export default function MethodologyScreen() {
  return (
    <ScrollView
      style={{ backgroundColor: c.white }}
      contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
    >
      <Calculator size={34} color={c.accent} />
      <Txt
        style={{
          fontFamily: 'Inter_700Bold',
          fontSize: 29,
          letterSpacing: -0.8,
          lineHeight: 36,
          marginTop: 20,
        }}
      >
        An estimate.\nNot a revenue report.
      </Txt>
      <Txt style={{ color: c.muted, lineHeight: 23, marginTop: 16 }}>
        Public installs and ratings cannot reveal an app’s actual earnings. AppScout models possible
        monthly revenue using explicit assumptions. This version uses fictional demo data only.
      </Txt>
      <View style={{ backgroundColor: c.surface, borderRadius: 24, padding: 22, marginTop: 30 }}>
        <Txt style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17 }}>The model</Txt>
        <Txt style={{ lineHeight: 25, marginTop: 15 }}>
          Monthly active users =\nInstalls × assumed active share
        </Txt>
        <Txt style={{ lineHeight: 25, marginTop: 17 }}>
          Purchases =\nActive users × paying share × monthly spend
        </Txt>
        <Txt style={{ lineHeight: 25, marginTop: 17 }}>
          Advertising =\nActive users × ad impressions ÷ 1,000 × eCPM
        </Txt>
        <View style={{ height: 1, backgroundColor: c.line, marginVertical: 19 }} />
        <Txt style={{ color: c.money, fontFamily: 'Inter_600SemiBold', lineHeight: 23 }}>
          Est. monthly revenue =\nPurchases + advertising
        </Txt>
      </View>
      <Txt
        style={{ fontFamily: 'Inter_600SemiBold', fontSize: 21, marginTop: 32, marginBottom: 17 }}
      >
        What the signals mean
      </Txt>
      {[
        {
          Icon: Users,
          title: 'Installs are cumulative',
          body: 'An install range is not a monthly active user count. Retention and market mix are unknown.',
        },
        {
          Icon: Activity,
          title: 'Growth is not revenue',
          body: 'Rating-count changes can be a momentum proxy, not verified download or earnings growth. Demo charts are illustrative.',
        },
        {
          Icon: CircleDollarSign,
          title: 'Monthly revenue ≠ MRR',
          body: 'Ads and one-time purchases are not recurring revenue. The /mo label represents modeled monthly earnings, not audited subscription MRR.',
        },
      ].map(({ Icon, title, body }) => (
        <View key={title} style={{ marginBottom: 23 }}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 8 }}>
            <Icon size={19} color={c.muted} />
            <Txt style={{ fontFamily: 'Inter_600SemiBold' }}>{title}</Txt>
          </View>
          <Txt style={{ color: c.muted, lineHeight: 23 }}>{body}</Txt>
        </View>
      ))}
      <View
        style={{
          backgroundColor: c.accentSoft,
          borderRadius: 24,
          padding: 21,
          gap: 10,
          marginTop: 10,
        }}
      >
        <TriangleAlert size={21} color={c.accent} />
        <Txt style={{ fontFamily: 'Inter_600SemiBold', color: c.accent }}>
          Low confidence by design
        </Txt>
        <Txt style={{ lineHeight: 23, color: c.ink }}>
          All demo estimates use a scenario range of 0.35× to 2.4× the midpoint. This is not a
          statistical confidence interval. A reliable live model needs historical observations and
          calibration against verified revenue.
        </Txt>
      </View>
    </ScrollView>
  );
}
