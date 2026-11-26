import { IndianRupee, Info } from 'lucide-react';
import { useCommissionConfig, useOwnerPayouts } from '@/hooks/useOwner';
import { formatINR } from '@/lib/utils';
import { OwnerAuthGate } from '@/components/owner/OwnerAuthGate';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { CommissionCalculatorCard } from '@/components/owner/CommissionCalculatorCard';

export function OwnerEarningsPage() {
  const { data: payouts = [], isLoading } = useOwnerPayouts();
  const { data: commissionConfig } = useCommissionConfig();

  const totalGrossINR = Math.round(
    payouts.reduce((acc, p) => acc + Number(p.gross_rental_paise), 0) / 100
  );
  const totalCommissionINR = Math.round(
    payouts.reduce((acc, p) => acc + Number(p.commission_paise), 0) / 100
  );
  const totalNetINR = Math.round(
    payouts.reduce((acc, p) => acc + Number(p.net_payout_paise), 0) / 100
  );

  return (
    <OwnerAuthGate>
      <OwnerLayout
        title="Earnings & Payout Statements"
        subtitle="Transparent commission breakdown and payout records per booking."
      >
        <div className="border border-[#C8A97E]/30 bg-[#C8A97E]/5 p-4 rounded-sm flex items-start gap-3 text-xs text-[#E8E4DC]">
          <Info className="h-4 w-4 text-[#C8A97E] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Automated bank settlements are intentionally paused in this phase pending payment
            architecture and regulatory compliance confirmation. Real payout statements and
            commission calculations from bookings appear here without simulated figures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-[#2A2A30] bg-[#111114] p-5 rounded-sm space-y-1">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8E8E98]">
              Gross Booking Revenue
            </p>
            <p className="font-display text-2xl font-semibold text-[#F4F1EA]">
              {formatINR(totalGrossINR)}
            </p>
          </div>
          <div className="border border-[#2A2A30] bg-[#111114] p-5 rounded-sm space-y-1">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8E8E98]">
              Platform Commission
            </p>
            <p className="font-display text-2xl font-semibold text-[#E8E4DC]">
              {formatINR(totalCommissionINR)}
            </p>
          </div>
          <div className="border border-[#2A2A30] bg-[#111114] p-5 rounded-sm space-y-1">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8E8E98]">
              Net Owner Payout
            </p>
            <p className="font-display text-2xl font-semibold text-[#C8A97E]">
              {formatINR(totalNetINR)}
            </p>
          </div>
        </div>

        <CommissionCalculatorCard dailyRateINR={3000} config={commissionConfig} />

        {isLoading ? (
          <p className="text-sm text-[#8E8E98]">Loading payout records...</p>
        ) : payouts.length === 0 ? (
          <div className="border border-[#2A2A30] bg-[#111114] p-10 rounded-sm text-center space-y-3">
            <IndianRupee className="h-7 w-7 text-[#C8A97E] mx-auto" />
            <h2 className="font-display text-xl text-[#F4F1EA]">No payout statements yet</h2>
            <p className="text-sm text-[#8E8E98] max-w-md mx-auto">
              Your earnings statement updates automatically when bookings complete on your verified
              vehicles.
            </p>
          </div>
        ) : (
          <div className="border border-[#2A2A30] bg-[#111114] rounded-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#2A2A30] text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                <tr>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Gross</th>
                  <th className="p-4">Commission</th>
                  <th className="p-4">Tax Deduction</th>
                  <th className="p-4">Net Payout</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A30] text-[#E8E4DC]">
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="p-4 font-medium text-[#F4F1EA]">
                      {p.vehicles?.name || p.vehicle_id}
                    </td>
                    <td className="p-4">{formatINR(Math.round(p.gross_rental_paise / 100))}</td>
                    <td className="p-4">
                      {formatINR(Math.round(p.commission_paise / 100))} (
                      {(p.commission_bps / 100).toFixed(1)}%)
                    </td>
                    <td className="p-4">{formatINR(Math.round(p.tax_deduction_paise / 100))}</td>
                    <td className="p-4 font-semibold text-[#C8A97E]">
                      {formatINR(Math.round(p.net_payout_paise / 100))}
                    </td>
                    <td className="p-4 uppercase tracking-[0.1em]">{p.payout_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </OwnerLayout>
    </OwnerAuthGate>
  );
}
