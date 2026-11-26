import { useState } from 'react';
import { Calendar, Search, ShieldCheck, X } from 'lucide-react';
import { useAdminBookings, useAdminSession } from '@/hooks/useAdmin';
import { callAdminApi } from '@/lib/admin';
import { formatBookingDateTime, formatBookingDuration, type RentalMode } from '@/lib/pricing';
import { formatINR } from '@/lib/utils';
import { AdminAuthGate } from '@/components/admin/AdminAuthGate';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { StateNotice } from '@/components/ui/StateNotice';

export function AdminBookingsPage() {
  const { data: adminSession } = useAdminSession();
  const { data: bookings = [], isLoading, invalidate } = useAdminBookings(Boolean(adminSession));

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'DAILY' | 'HOURLY'>('ALL');
  const [selected, setSelected] = useState<any | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const filtered = bookings.filter((b: any) => {
    const q = search.trim().toLowerCase();
    const matchesQ =
      !q ||
      (b.vehicles?.name || '').toLowerCase().includes(q) ||
      (b.vehicles?.location || '').toLowerCase().includes(q) ||
      (b.customer?.full_name || '').toLowerCase().includes(q) ||
      (b.owner?.full_legal_name || '').toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q);
    if (!matchesQ) return false;
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    const rowMode = b.rental_mode === 'HOURLY' ? 'HOURLY' : 'DAILY';
    if (modeFilter !== 'ALL' && rowMode !== modeFilter) return false;
    return true;
  });

  const handleBookingAction = async (
    bookingId: string,
    bookingAction: 'cancel' | 'confirm' | 'complete' | 'flag_overdue' | 'add_note'
  ) => {
    setErr(null);
    setMsg(null);
    if (reason.trim().length < 3) {
      setErr('An audit reason is required for all administrative booking actions.');
      return;
    }
    setBusy(true);
    try {
      await callAdminApi('manage_booking', {
        bookingId,
        bookingAction,
        reason: reason.trim(),
      });
      setMsg(`Booking action "${bookingAction}" applied and audit-logged.`);
      setReason('');
      setSelected(null);
      await invalidate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Booking update failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminAuthGate>
      <AdminLayout
        title="Booking Management"
        subtitle="Inspect customer, owner, vehicle, city, payment states, handover inspections, and administrative overrides."
      >
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="h-4 w-4 text-[#8E8E98] absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search booking ID, customer, owner, vehicle, or city..."
              className="w-full h-10 bg-[#111114] border border-[#2A2A30] pl-9 pr-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
            />
          </div>
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as 'ALL' | 'DAILY' | 'HOURLY')}
            className="h-10 bg-[#111114] border border-[#2A2A30] px-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
          >
            <option value="ALL">All Rental Modes</option>
            <option value="DAILY">Daily Bookings</option>
            <option value="HOURLY">Hourly Bookings</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 bg-[#111114] border border-[#2A2A30] px-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {msg && (
          <div className="border border-emerald-500/40 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-200 rounded-sm">
            {msg}
          </div>
        )}
        {err && (
          <div className="border border-red-500/40 bg-red-950/20 px-4 py-3 text-xs text-red-200 rounded-sm">
            {err}
          </div>
        )}

        {isLoading ? (
          <StateNotice variant="loading" title="Loading marketplace bookings..." />
        ) : filtered.length === 0 ? (
          <StateNotice
            variant="empty"
            icon={<Calendar className="h-7 w-7 text-[#C8A97E] mx-auto" />}
            title="No matching bookings"
            description="Adjust search terms, rental mode (Daily/Hourly), or status filters."
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((b: any) => {
              const mode: RentalMode = b.rental_mode === 'HOURLY' ? 'HOURLY' : 'DAILY';
              const units = Math.max(1, Number(b.billable_units ?? 1));
              const rateINR = Math.round(Number(b.applied_rate_paise ?? 0) / 100);
              return (
                <div
                  key={b.id}
                  className="border border-[#2A2A30] bg-[#111114] p-5 rounded-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="border border-[#C8A97E]/40 bg-[#C8A97E]/10 px-2 py-0.5 rounded-sm uppercase tracking-[0.12em] text-[#C8A97E]">
                        {b.status}
                      </span>
                      <span className="border border-white/15 bg-[#0A0A0B] px-2 py-0.5 rounded-sm uppercase tracking-[0.12em] text-[#E8E4DC]">
                        {mode} · {formatBookingDuration(mode, units)}
                      </span>
                      <span className="border border-[#2A2A30] bg-[#0A0A0B] px-2 py-0.5 rounded-sm uppercase text-[#8E8E98]">
                        Pay: {b.payment_status}
                      </span>
                      <span className="text-[#8E8E98]">
                        Inspections: {b.inspections?.length ?? 0}
                      </span>
                    </div>
                    <h2 className="font-display text-lg font-medium text-[#F4F1EA]">
                      {b.vehicles?.name || 'Vehicle'} · {b.vehicles?.location || ''}
                    </h2>
                    <p className="text-[#8E8E98]">
                      Customer: <strong className="text-[#E8E4DC]">{b.customer?.full_name || b.customer_id}</strong> ·
                      Owner: <strong className="text-[#E8E4DC]">{b.owner?.full_legal_name || 'Prototype Fleet'}</strong> ·{' '}
                      {formatBookingDateTime(b.start_at)} → {formatBookingDateTime(b.end_at)}
                      {rateINR > 0 ? ` · Rate: ${formatINR(rateINR)}/${mode === 'HOURLY' ? 'hr' : 'day'}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-display text-lg font-semibold text-[#C8A97E]">
                      {formatINR(Math.round(Number(b.rental_total_paise) / 100))}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelected(b);
                        setReason('');
                        setErr(null);
                      }}
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-[#C8A97E]" />
                      Inspect
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-2xl w-full border border-[#2A2A30] bg-[#111114] p-6 sm:p-8 rounded-sm space-y-5 my-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#C8A97E]">
                    Booking Inspection · {selected.id.slice(0, 8)}
                  </p>
                  <h2 className="font-display text-xl font-semibold text-[#F4F1EA]">
                    {selected.vehicles?.name}
                  </h2>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="text-[#8E8E98] hover:text-[#F4F1EA]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="border border-[#2A2A30] bg-[#0A0A0B] p-3.5 rounded-sm space-y-1">
                  <p className="text-[#8E8E98] uppercase">Financials & Schedule</p>
                  <p>
                    Mode:{' '}
                    <strong className="text-[#C8A97E]">
                      {selected.rental_mode === 'HOURLY' ? 'HOURLY' : 'DAILY'} ·{' '}
                      {formatBookingDuration(
                        selected.rental_mode === 'HOURLY' ? 'HOURLY' : 'DAILY',
                        Math.max(1, Number(selected.billable_units ?? 1))
                      )}
                    </strong>
                  </p>
                  {Number(selected.applied_rate_paise ?? 0) > 0 && (
                    <p>
                      Applied Rate:{' '}
                      {formatINR(Math.round(Number(selected.applied_rate_paise) / 100))} /{' '}
                      {selected.rental_mode === 'HOURLY' ? 'hr' : 'day'}
                    </p>
                  )}
                  <p>Rental Total: <strong className="text-[#F4F1EA]">{formatINR(Math.round(Number(selected.rental_total_paise) / 100))}</strong></p>
                  <p>Security Deposit: {formatINR(Math.round(Number(selected.deposit_paise) / 100))}</p>
                  <p>Payment Status: {selected.payment_status}</p>
                </div>
                <div className="border border-[#2A2A30] bg-[#0A0A0B] p-3.5 rounded-sm space-y-1">
                  <p className="text-[#8E8E98] uppercase">Inspections ({selected.inspections?.length ?? 0})</p>
                  {selected.inspections?.length ? (
                    selected.inspections.map((ins: any) => (
                      <p key={ins.id} className="text-[#E8E4DC]">
                        {ins.stage} · {ins.odometer_km ? `${ins.odometer_km} km` : 'Recorded'}
                      </p>
                    ))
                  ) : (
                    <p className="text-[#8E8E98]">No handover/return inspection records yet.</p>
                  )}
                </div>
              </div>

              {selected.admin_notes && (
                <p className="text-xs text-[#C8A97E] border border-[#2A2A30] bg-[#0A0A0B] p-3 rounded-sm">
                  Latest Admin Note: {selected.admin_notes}
                </p>
              )}

              <div className="space-y-3 border-t border-[#2A2A30] pt-4">
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter mandatory audit reason for booking action or note..."
                  className="w-full bg-[#0A0A0B] border border-[#2A2A30] p-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
                />
                {err && <p className="text-xs text-red-300">{err}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button variant="champagne" size="sm" disabled={busy} onClick={() => handleBookingAction(selected.id, 'add_note')}>
                    Save Audit Note
                  </Button>
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => handleBookingAction(selected.id, 'flag_overdue')}>
                    Flag Overdue
                  </Button>
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => handleBookingAction(selected.id, 'complete')}>
                    Mark Completed
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => handleBookingAction(selected.id, 'cancel')}
                    className="border-red-500/40 text-red-300 hover:bg-red-950/30"
                  >
                    Cancel Booking
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminAuthGate>
  );
}
