import { ScrollView, View } from 'react-native';
import { Calculator, TriangleAlert, Activity, Users, CircleDollarSign } from 'lucide-react-native';
import { colors as c } from '@/lib/theme';
import { Txt } from '@/components/ScoutUI';
export default function MethodologyScreen() {
  return (
    <ScrollView
      style={{ backgroundColor: c.white }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Calculator size={34} color={c.accent} />
      <Txt
        style={{
          fontFamily: 'Inter_700Bold',
          fontSize: 23,
          letterSpacing: -0.5,
          lineHeight: 30,
          marginTop: 16,
        }}
      >
        An estimate, not a revenue report.
      </Txt>
      <Txt style={{ color: c.muted, lineHeight: 23, marginTop: 16 }}>
        Public installs and ratings cannot reveal an app’s actual earnings. Store facts come from
        Google Play. Automatic scenarios use the install lower bound and listed monetization
        streams, with explicit, editable defaults. They are not earnings reports.
      </Txt>
      <View style={{ backgroundColor: c.surface, borderRadius: 24, padding: 22, marginTop: 30 }}>
        <Txt style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17 }}>The model</Txt>
        <Txt style={{ lineHeight: 25, marginTop: 15 }}>
          Monthly active users = installs × assumed active share
        </Txt>
        <Txt style={{ lineHeight: 25, marginTop: 17 }}>
          Purchases = active users × paying share × monthly spend
        </Txt>
        <Txt style={{ lineHeight: 25, marginTop: 17 }}>
          Advertising = active users × ad impressions ÷ 1,000 × eCPM
        </Txt>
        <Txt style={{ lineHeight: 22, marginTop: 14, color: c.muted }}>
          Automatic active shares (low / mid / high): 3 / 10 / 25% for apps up to 12 months old, 2 /
          7 / 18% for 13–36 months, and 1 / 4 / 12% for older apps. Unknown launch age uses 1 / 5 /
          15%. These are chosen assumptions, not measured retention or benchmarks.
        </Txt>
        <Txt style={{ lineHeight: 22, marginTop: 12, color: c.muted }}>
          Listed purchases use 1% paying users at $5 per month. Listed ads use 40 impressions per
          active user at $2 per 1,000 impressions. Unknown streams and upfront app sales are
          excluded, as are platform fees and taxes. Missing signals leave the automatic estimate
          unavailable.
        </Txt>
        <Txt style={{ lineHeight: 22, marginTop: 12, color: c.muted }}>
          Only active users vary across the default range. Actual earnings may fall outside it;
          conversion, spending, ad rates and geography are also unknown. Saved assumptions override
          defaults.
        </Txt>
        <View style={{ height: 1, backgroundColor: c.line, marginVertical: 19 }} />
        <Txt style={{ color: c.money, fontFamily: 'Inter_600SemiBold', lineHeight: 23 }}>
          Est. monthly revenue = purchases + advertising
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
          body: 'Rating-count changes are observed on app visits and can be a momentum proxy, not verified download or earnings growth. Missing days are not invented.',
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
          Low and high scenarios vary the assumed active-user bounds, not observed earnings. These
          are assumption ranges, not statistical confidence intervals. A calibrated earnings model
          needs verified revenue and market data.
        </Txt>
      </View>
    </ScrollView>
  );
}
