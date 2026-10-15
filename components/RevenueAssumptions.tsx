import { View } from 'react-native';
import { Txt } from './ScoutUI';
import { automaticScenario, compact, dateLabel, type Scenario, type ScoutApp } from '@/lib/scout';
import { colors as c } from '@/lib/theme';

export function RevenueAssumptions({
  app,
  inputs,
  custom = false,
}: {
  app: ScoutApp;
  inputs: Scenario | undefined;
  custom?: boolean;
}) {
  const automatic = automaticScenario(app);
  return (
    <View style={{ gap: 10 }}>
      <Txt style={{ fontFamily: 'Inter_600SemiBold' }}>Observed on Google Play</Txt>
      <Txt style={{ fontSize: 12, color: c.muted, lineHeight: 19 }}>
        Installs: {app.installs === null ? 'Not listed' : `${compact(app.installs)}+`} · Launch:{' '}
        {dateLabel(app.launched)}
      </Txt>
      <Txt style={{ fontSize: 12, color: c.muted, lineHeight: 19 }}>
        Purchases: {app.offersIAP === null ? 'Unknown' : app.offersIAP ? 'Listed' : 'Not listed'} ·
        Ads: {app.adSupported === null ? 'Unknown' : app.adSupported ? 'Listed' : 'Not listed'}
      </Txt>
      <Txt style={{ fontFamily: 'Inter_600SemiBold', marginTop: 6 }}>
        {custom ? 'Your assumptions' : 'Automatic assumptions · not measured'}
      </Txt>
      {!custom && automatic && (
        <Txt style={{ fontSize: 12, color: c.muted, lineHeight: 19 }}>
          Active share: {automatic.activeShares.join(' / ')}% of the install lower bound (low / mid
          / high).
          {automatic.ageMonths === null
            ? ' Launch age unknown.'
            : ` Launch age: about ${Math.floor(automatic.ageMonths)} ${Math.floor(automatic.ageMonths) === 1 ? 'month' : 'months'}.`}
        </Txt>
      )}
      {inputs ? (
        <>
          <Txt style={{ fontSize: 12, color: c.muted, lineHeight: 19 }}>
            Active users: {compact(inputs.monthlyActiveLow)} / {compact(inputs.monthlyActive)} /{' '}
            {compact(inputs.monthlyActiveHigh)} per month.
          </Txt>
          <Txt style={{ fontSize: 12, color: c.muted, lineHeight: 19 }}>
            Purchases: {inputs.payingPercent}% pay × ${inputs.monthlySpend} per month. Ads:{' '}
            {inputs.impressions} impressions per user × ${inputs.ecpm} per 1,000.
          </Txt>
        </>
      ) : (
        <Txt style={{ fontSize: 12, color: c.muted, lineHeight: 19 }}>
          Automatic modeling needs an install count and a listed ads or purchases stream. You can
          enter your own assumptions instead.
        </Txt>
      )}
      <Txt style={{ fontSize: 12, color: c.muted, lineHeight: 19 }}>
        Low confidence. Defaults are uncalibrated assumptions, not industry benchmarks. Upfront app
        sales, external payments, fees and taxes are excluded. Unknown streams are not modeled; a
        missing estimate does not mean zero earnings.
      </Txt>
    </View>
  );
}
