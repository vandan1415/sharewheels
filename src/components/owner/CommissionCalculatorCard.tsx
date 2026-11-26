import { Info } from 'lucide-react';
import { calculateCommissionBreakdown, type CommissionConfig } from '@/lib/owner';
import { calculateHourlyPriceInr, HOURLY_FORMULA_LABEL } from '@/lib/pricing';
import { formatINR } from '@/lib/utils';

interface CommissionCalculatorCardProps {
  dailyRateINR: number;
  config: CommissionConfig | null | undefined;
}

export function CommissionCalculatorCard({
  dailyRateINR,
  config,
}: CommissionCalculatorCardProps) {
  if (!config) {
    return (
      <div className="border border-[#2A2A30] bg-[#111114] p-5 rounded-sm text-xs text-[#8E8E98]">
        Loading live SHAREWHEELS commission configuration...
      </div>
    );
  }

  const b = calculateCommissionBreakdown(dailyRateINR, config);
  const hourlyRateINR = calculateHourlyPriceInr(dailyRateINR);

  return (
    <div className="border border-[#C8A97E]/30 bg-[#111114] p-5 rounded-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#C8A97E]">
          Daily & Hourly Earnings Breakdown
        </p>
        <span className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
          Rate Config: {config.config_key}
        </span>
      </div>

      <div className="space-y-2.5 text-sm">
        <div className="flex items-center justify-between text-[#E8E4DC]">
          <span>Customer daily price (base)</span>
          <span className="font-medium">{formatINR(b.dailyRateINR)} / day</span>
        </div>

        <div className="flex items-center justify-between text-[#C8A97E]">
          <span>Auto-calculated hourly price</span>
          <span className="font-medium">{formatINR(hourlyRateINR)} / hr</span>
        </div>

        <div className="flex items-center justify-between text-[#8E8E98]">
          <span>SHAREWHEELS commission ({b.commissionPercent.toFixed(1)}%)</span>
          <span>− {formatINR(b.commissionINR)}</span>
        </div>

        {b.gstOnCommissionINR > 0 && (
          <div className="flex items-center justify-between text-[#8E8E98]">
            <span>GST on commission ({b.gstOnCommissionPercent.toFixed(1)}%)</span>
            <span>− {formatINR(b.gstOnCommissionINR)}</span>
          </div>
        )}

        {b.tdsINR > 0 && (
          <div className="flex items-center justify-between text-[#8E8E98]">
            <span>Applicable tax deduction / TDS ({b.tdsPercent.toFixed(1)}%)</span>
            <span>− {formatINR(b.tdsINR)}</span>
          </div>
        )}

        <div className="border-t border-[#2A2A30] pt-3 flex items-center justify-between">
          <span className="font-medium text-[#F4F1EA]">Estimated owner payout / day</span>
          <span className="font-display text-xl font-semibold text-[#C8A97E]">
            {formatINR(b.estimatedOwnerPayoutINR)}
          </span>
        </div>
      </div>

      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-[#8E8E98]">
        <Info className="h-3.5 w-3.5 text-[#C8A97E] shrink-0 mt-0.5" />
        <span>
          {HOURLY_FORMULA_LABEL}.{' '}
          {config.notes ||
            'Commission and tax deductions are calculated dynamically from server configuration and disclosed prior to publishing.'}
        </span>
      </p>
    </div>
  );
}
