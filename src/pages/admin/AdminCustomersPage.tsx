import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Search, ShieldCheck, X } from 'lucide-react';
import { useAdminCustomers, useAdminSession } from '@/hooks/useAdmin';
import { callAdminApi } from '@/lib/admin';
import { formatINR } from '@/lib/utils';
import { AdminAuthGate } from '@/components/admin/AdminAuthGate';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';

export function AdminCustomersPage() {
  const { data: adminSession } = useAdminSession();
  const { data: customers = [], isLoading, invalidate } = useAdminCustomers(Boolean(adminSession));

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const filtered = customers.filter((c: any) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.id || '').toLowerCase().includes(q)
    );
  });

  const handleAction = async (customerId: string, decision: 'suspend' | 'reinstate') => {
    setErr(null);
    setMsg(null);
    if (decision === 'suspend' && reason.trim().length < 3) {
      setErr('Suspension reason is required.');
      return;
    }
    setBusy(true);
    try {
      await callAdminApi('manage_customer', { customerId, decision, reason: reason.trim() });
      setMsg(`Customer account ${decision === 'suspend' ? 'suspended' : 'reinstated'}.`);
      setReason('');
      setSelected(null);
      await invalidate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminAuthGate>
      <AdminLayout
        title="Customer Accounts"
        subtitle="Inspect renter profiles, verification states, booking & support complaint history, and moderation controls."
      >
        <div className="relative max-w-md">
          <Search className="h-4 w-4 text-[#8E8E98] absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, city, phone, or ID..."
            className="w-full h-10 bg-[#111114] border border-[#2A2A30] pl-9 pr-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
          />
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
          <p className="text-sm text-[#8E8E98]">Loading customers...</p>
        ) : filtered.length === 0 ? (
          <div className="border border-[#2A2A30] bg-[#111114] p-10 rounded-sm text-center text-sm text-[#8E8E98]">
            No customer profiles found.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c: any) => (
              <div
                key={c.id}
                className="border border-[#2A2A30] bg-[#111114] p-5 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`border px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.14em] ${
                        c.account_status === 'suspended'
                          ? 'border-red-500/40 bg-red-950/30 text-red-300'
                          : 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                      }`}
                    >
                      {c.account_status || 'active'}
                    </span>
                    <span className="text-xs text-[#8E8E98]">
                      DL: {c.dl_verification_status} · Bookings: {c.bookings?.length ?? 0} · Complaints:{' '}
                      {c.tickets?.length ?? 0}
                    </span>
                  </div>
                  <h2 className="font-display text-lg font-medium text-[#F4F1EA]">
                    {c.full_name || 'Customer'}
                  </h2>
                  <p className="text-xs text-[#8E8E98]">
                    {c.city || 'No city'} · {c.phone ? `***${c.phone.slice(-4)}` : 'Phone hidden'} ·
                    Joined {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelected(c);
                    setReason('');
                    setErr(null);
                  }}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-[#C8A97E]" />
                  Inspect Account
                </Button>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-2xl w-full border border-[#2A2A30] bg-[#111114] p-6 sm:p-8 rounded-sm space-y-5 my-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#C8A97E]">
                    Customer Account Inspection
                  </p>
                  <h2 className="font-display text-2xl font-semibold text-[#F4F1EA]">
                    {selected.full_name}
                  </h2>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="text-[#8E8E98] hover:text-[#F4F1EA]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm text-xs space-y-1">
                <p>Account Status: <strong className="uppercase text-[#C8A97E]">{selected.account_status}</strong></p>
                <p>Identity Verification: {selected.verification_status} · DL: {selected.dl_verification_status}</p>
                <p>Restricted Contact View: {selected.city} · Phone ending {selected.phone ? selected.phone.slice(-4) : 'N/A'}</p>
                {selected.suspended_reason && (
                  <p className="text-red-300">Suspension Reason: {selected.suspended_reason}</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#C8A97E]">
                  Booking History ({selected.bookings?.length ?? 0})
                </p>
                {selected.bookings?.length ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs">
                    {selected.bookings.map((b: any) => (
                      <div key={b.id} className="border border-[#2A2A30] bg-[#0A0A0B] p-2.5 flex justify-between">
                        <span>{b.vehicles?.name || b.id}</span>
                        <span className="text-[#C8A97E]">
                          {formatINR(Math.round(Number(b.rental_total_paise) / 100))} · {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#8E8E98]">No customer bookings recorded.</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#C8A97E]">
                  Complaint & Support History ({selected.tickets?.length ?? 0})
                </p>
                {selected.tickets?.length ? (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto text-xs">
                    {selected.tickets.map((t: any) => (
                      <div key={t.id} className="border border-[#2A2A30] bg-[#0A0A0B] p-2.5 flex justify-between">
                        <span>{t.subject}</span>
                        <span className="text-[#8E8E98] uppercase">{t.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#8E8E98]">No support complaints filed.</p>
                )}
              </div>

              <div className="space-y-3 border-t border-[#2A2A30] pt-4">
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for suspension or reinstatement notes..."
                  className="w-full bg-[#0A0A0B] border border-[#2A2A30] p-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
                />
                {err && <p className="text-xs text-red-300">{err}</p>}
                <div className="flex gap-3">
                  {selected.account_status !== 'suspended' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => handleAction(selected.id, 'suspend')}
                      className="border-red-500/40 text-red-300 hover:bg-red-950/30"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Suspend Customer Account
                    </Button>
                  ) : (
                    <Button
                      variant="champagne"
                      size="sm"
                      disabled={busy}
                      onClick={() => handleAction(selected.id, 'reinstate')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Reinstate Account
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminAuthGate>
  );
}
