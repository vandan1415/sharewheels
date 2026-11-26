import { useState } from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { useCommissionConfig, useOwnerBookings } from '@/hooks/useOwner';
import { calculateCommissionBreakdown } from '@/lib/owner';
import { formatBookingDateTime, formatBookingDuration, type RentalMode } from '@/lib/pricing';
import { formatINR } from '@/lib/utils';
import { OwnerAuthGate } from '@/components/owner/OwnerAuthGate';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { StateNotice } from '@/components/ui/StateNotice';

type BookingFilter = 'upcoming' | 'current' | 'completed' | 'cancelled';

export function OwnerBookingsPage() {
  const { data: bookings = [], isLoading } = useOwnerBookings();
  const { data: commissionConfig } = useCommissionConfig();
  const [tab, setTab] = useState<BookingFilter>('upcoming');

  const nowMs = Date.now();
  const filtered = bookings.filter((b) => {
    if (tab === 'current') return b.status === 'active';
    if (tab === 'completed') return b.status === 'completed';
    if (tab === 'cancelled') return b.status === 'cancelled' || b.status === 'expired';
    return (
      (b.status === 'pending' || b.status === 'accepted' || b.status === 'confirmed') &&
      new Date(b.end_at).getTime() >= nowMs
    );
  });

  return (
    <OwnerAuthGate>
      <OwnerLayout
        title="Vehicle Bookings"
        subtitle="Track upcoming, active, completed, and cancelled reservations with transparent commission calculation."
      >
        <div className="flex flex-wrap gap-2 border-b border-[#2A2A30] pb-4">
          {(
            [
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'current', label: 'Current' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ] as { id: BookingFilter; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-sm text-xs uppercase tracking-[0.14em] transition-colors cursor-pointer ${
                tab === t.id
                  ? 'bg-[#C8A97E] text-[#0A0A0B] font-medium'
                  : 'border border-[#2A2A30] bg-[#111114] text-[#E8E4DC] hover:border-[#C8A97E]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <StateNotice variant="loading" title="Loading vehicle bookings..." />
        ) : filtered.length === 0 ? (
          <StateNotice
            variant="empty"
            icon={<Calendar className="h-7 w-7 text-[#C8A97E] mx-auto" />}
            title={`No ${tab} bookings yet`}
            description="Once your vehicles are approved and live on SHAREWHEELS, hourly and daily bookings, trip timestamps, commission deductions, and net payouts appear here in real time."
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((b) => {
              const grossINR = Math.round(Number(b.rental_total_paise) / 100);
              const advanceINR = Math.round(Number(b.advance_paid_paise ?? 0) / 100);
              const balanceINR = Math.round(Number(b.balance_due_paise ?? 0) / 100);
              const isAdvancePaid = b.payment_status === 'advance_50_paid' || Boolean(b.razorpay_payment_id);
              const mode: RentalMode = b.rental_mode === 'HOURLY' ? 'HOURLY' : 'DAILY';
              const units = Math.max(1, Number(b.billable_units ?? 1));
              const appliedRateINR = Math.round(Number(b.applied_rate_paise ?? 0) / 100);
              const breakdown = commissionConfig
                ? calculateCommissionBreakdown(grossINR, commissionConfig)
                : null;

              return (
                <div
                  key={b.id}
                  className="border border-[#2A2A30] bg-[#111114] p-5 rounded-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center"
                >
                  <div className="md:col-span-2 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-lg font-medium text-[#F4F1EA]">
                        {b.vehicles?.name || 'Vehicle Booking'}
                      </p>
                      <span className="border border-[#C8A97E]/40 bg-[#C8A97E]/10 px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.12em] text-[#C8A97E]">
                        {mode} · {formatBookingDuration(mode, units)}
                      </span>
                      {isAdvancePaid && (
                        <span className="inline-flex items-center gap-1 border border-emerald-500/40 bg-emerald-950/30 px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.12em] text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          Razorpay 50% Advance Confirmed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#8E8E98]">
                      {formatBookingDateTime(b.start_at)} → {formatBookingDateTime(b.end_at)} · Status:{' '}
                      <strong className="uppercase text-[#C8A97E]">{b.status}</strong>
                    </p>
                    {appliedRateINR > 0 && (
                      <p className="text-[11px] text-[#8E8E98]">
                        Applied Rate: <span className="text-[#E8E4DC]">{formatINR(appliedRateINR)} / {mode === 'HOURLY' ? 'hr' : 'day'}</span>
                      </p>
                    )}
                    {b.razorpay_payment_id && (
                      <p className="text-[11px] text-[#E8E4DC]">
                        Razorpay Payment ID:{' '}
                        <code className="text-[#C8A97E]">{b.razorpay_payment_id}</code>
                      </p>
                    )}
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="text-[#8E8E98]">
                      Total Booking: <strong className="text-[#F4F1EA]">{formatINR(grossINR)}</strong>
                    </p>
                    {isAdvancePaid && (
                      <p className="text-[#8E8E98]">
                        50% Advance Paid:{' '}
                        <strong className="text-emerald-300">{formatINR(advanceINR)}</strong> · Due:{' '}
                        <span className="text-[#E8E4DC]">{formatINR(balanceINR)}</span>
                      </p>
                    )}
                    {breakdown && (
                      <p className="text-[#8E8E98]">
                        Platform Commission & Tax:{' '}
                        <span className="text-[#E8E4DC]">
                          −{formatINR(breakdown.totalDeductionsINR)}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="text-xs md:text-right space-y-1">
                    <p className="text-[#8E8E98]">Estimated Owner Payout</p>
                    <p className="font-display text-lg font-semibold text-[#C8A97E]">
                      {breakdown ? formatINR(breakdown.estimatedOwnerPayoutINR) : formatINR(grossINR)}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-[#8E8E98]">
                      Payment: {isAdvancePaid ? '50% Advance Verified' : b.payment_status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </OwnerLayout>
    </OwnerAuthGate>
  );
}
