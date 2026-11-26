import { useEffect, useState, type FormEvent } from 'react';
import { IndianRupee, Info, Loader2, Save } from 'lucide-react';
import { useAdminFinance, useAdminSession } from '@/hooks/useAdmin';
import { callAdminApi } from '@/lib/admin';
import { formatINR } from '@/lib/utils';
import { AdminAuthGate } from '@/components/admin/AdminAuthGate';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';

export function AdminFinancePage({ defaultTab = 'transactions' }: { defaultTab?: 'transactions' | 'payouts' }) {
  const { data: adminSession } = useAdminSession();
  const { data: finance, isLoading, invalidate } = useAdminFinance(Boolean(adminSession));

  const [tab, setTab] = useState<'transactions' | 'payouts' | 'refunds' | 'deposits' | 'failures' | 'commission'>(
    defaultTab === 'payouts' ? 'payouts' : 'transactions'
  );
  const [commPct, setCommPct] = useState(18);
  const [gstPct, setGstPct] = useState(18);
  const [tdsPct, setTdsPct] = useState(0);
  const [notes, setNotes] = useState('');
  const [savingCfg, setSavingCfg] = useState(false);
  const [cfgMsg, setCfgMsg] = useState<string | null>(null);
  const [cfgErr, setCfgErr] = useState<string | null>(null);

  useEffect(() => {
    if (finance?.commission) {
      setCommPct(finance.commission.commission_bps / 100);
      setGstPct(finance.commission.gst_on_commission_bps / 100);
      setTdsPct(finance.commission.tds_bps / 100);
      setNotes(finance.commission.notes || '');
    }
  }, [finance]);

  const bookings = finance?.bookings ?? [];
  const payouts = finance?.payouts ?? [];

  const totalCommissionINR = Math.round(
    payouts.reduce((s: number, p: any) => s + Number(p.commission_paise), 0) / 100
  );
  const depositsHeld = bookings.filter((b: any) => ['confirmed', 'active'].includes(b.status));
  const cancelledRefunds = bookings.filter((b: any) => b.status === 'cancelled');
  const paymentFailures = bookings.filter((b: any) => b.payment_status === 'failed');

  const handleSaveCommission = async (e: FormEvent) => {
    e.preventDefault();
    setCfgErr(null);
    setCfgMsg(null);
    setSavingCfg(true);
    try {
      await callAdminApi('update_commission_config', {
        commissionBps: Math.round(commPct * 100),
        gstOnCommissionBps: Math.round(gstPct * 100),
        tdsBps: Math.round(tdsPct * 100),
        notes,
      });
      setCfgMsg('Central platform commission updated cleanly across Owner Portal disclosures.');
      await invalidate();
    } catch (err) {
      setCfgErr(err instanceof Error ? err.message : 'Unable to save commission config.');
    } finally {
      setSavingCfg(false);
    }
  };

  return (
    <AdminAuthGate>
      <AdminLayout
        title={defaultTab === 'payouts' ? 'Owner Payout Ledger' : 'Payments & Central Commission'}
        subtitle="Audit booking ledger totals, deposits, failures, payouts, and centralized fee rules."
      >
        <div className="border border-[#C8A97E]/30 bg-[#C8A97E]/5 p-4 rounded-sm flex items-start gap-3 text-xs text-[#E8E4DC]">
          <Info className="h-4 w-4 text-[#C8A97E] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Real payment gateway webhooks, nodal settlement accounts, and automated GST/TDS
            remittances are not simulated or marked settled prematurely. All numbers reflect live
            PostgreSQL records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-[#2A2A30] pb-4">
          {[
            { id: 'transactions', label: `Transactions (${bookings.length})` },
            { id: 'payouts', label: `Owner Payouts (${payouts.length})` },
            { id: 'deposits', label: `Security Deposits (${depositsHeld.length})` },
            { id: 'refunds', label: `Refunds / Cancelled (${cancelledRefunds.length})` },
            { id: 'failures', label: `Payment Failures (${paymentFailures.length})` },
            { id: 'commission', label: 'Commission Config' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as any)}
              className={`px-3.5 py-2 rounded-sm text-xs uppercase tracking-[0.12em] cursor-pointer ${
                tab === t.id
                  ? 'bg-[#C8A97E] text-[#0A0A0B] font-medium'
                  : 'border border-[#2A2A30] bg-[#111114] text-[#E8E4DC] hover:border-[#C8A97E]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'commission' && (
          <form
            onSubmit={handleSaveCommission}
            className="max-w-xl border border-[#2A2A30] bg-[#111114] p-6 rounded-sm space-y-5"
          >
            <h2 className="font-display text-xl font-medium text-[#F4F1EA]">
              Central Marketplace Commission Settings
            </h2>
            {cfgMsg && (
              <p className="text-xs text-emerald-300 border border-emerald-500/40 bg-emerald-950/20 p-3 rounded-sm">
                {cfgMsg}
              </p>
            )}
            {cfgErr && (
              <p className="text-xs text-red-300 border border-red-500/40 bg-red-950/20 p-3 rounded-sm">
                {cfgErr}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  Commission (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min={0}
                  max={50}
                  value={commPct}
                  onChange={(e) => setCommPct(Number(e.target.value))}
                  className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  GST on Fee (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min={0}
                  max={30}
                  value={gstPct}
                  onChange={(e) => setGstPct(Number(e.target.value))}
                  className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  TDS Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={10}
                  value={tdsPct}
                  onChange={(e) => setTdsPct(Number(e.target.value))}
                  className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                Disclosure Notes Shown to Owners
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#2A2A30] p-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
              />
            </div>

            <Button type="submit" variant="champagne" disabled={savingCfg}>
              {savingCfg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save Commission Config</span>
            </Button>
          </form>
        )}

        {tab !== 'commission' && isLoading && (
          <p className="text-sm text-[#8E8E98]">Loading financial records...</p>
        )}

        {tab === 'transactions' && !isLoading && (
          <div className="space-y-3">
            <div className="text-xs text-[#8E8E98]">
              Recorded Platform Commission Ledger Total:{' '}
              <strong className="text-[#C8A97E]">{formatINR(totalCommissionINR)}</strong>
            </div>
            {bookings.length === 0 ? (
              <div className="border border-[#2A2A30] bg-[#111114] p-10 rounded-sm text-center text-sm text-[#8E8E98]">
                No booking transactions recorded yet.
              </div>
            ) : (
              bookings.map((b: any) => (
                <div key={b.id} className="border border-[#2A2A30] bg-[#111114] p-4 rounded-sm flex justify-between items-center text-xs">
                  <div>
                    <p className="font-medium text-[#F4F1EA]">{b.vehicles?.name || b.id}</p>
                    <p className="text-[#8E8E98]">
                      Status: {b.status} · Payment: {b.payment_status} · {new Date(b.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-display text-base font-semibold text-[#C8A97E]">
                    {formatINR(Math.round(Number(b.rental_total_paise) / 100))}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'payouts' && !isLoading && (
          payouts.length === 0 ? (
            <div className="border border-[#2A2A30] bg-[#111114] p-10 rounded-sm text-center space-y-2">
              <IndianRupee className="h-6 w-6 text-[#C8A97E] mx-auto" />
              <p className="text-sm text-[#8E8E98]">No owner payouts generated yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payouts.map((p: any) => (
                <div key={p.id} className="border border-[#2A2A30] bg-[#111114] p-4 rounded-sm flex justify-between text-xs">
                  <span>{p.vehicles?.name || p.vehicle_id} · {p.payout_status}</span>
                  <span className="text-[#C8A97E]">
                    Net: {formatINR(Math.round(p.net_payout_paise / 100))} (Fee: {formatINR(Math.round(p.commission_paise / 100))})
                  </span>
                </div>
              ))}
            </div>
          )
        )}

        {(tab === 'deposits' || tab === 'refunds' || tab === 'failures') && !isLoading && (
          <div className="space-y-2">
            {(tab === 'deposits' ? depositsHeld : tab === 'refunds' ? cancelledRefunds : paymentFailures).length === 0 ? (
              <div className="border border-[#2A2A30] bg-[#111114] p-10 rounded-sm text-center text-sm text-[#8E8E98]">
                No records in this category.
              </div>
            ) : (
              (tab === 'deposits' ? depositsHeld : tab === 'refunds' ? cancelledRefunds : paymentFailures).map((b: any) => (
                <div key={b.id} className="border border-[#2A2A30] bg-[#111114] p-4 rounded-sm flex justify-between text-xs">
                  <span>{b.vehicles?.name || b.id} · {b.status}</span>
                  <span className="text-[#C8A97E]">
                    Deposit: {formatINR(Math.round(Number(b.deposit_paise) / 100))} · Rental: {formatINR(Math.round(Number(b.rental_total_paise) / 100))}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </AdminLayout>
    </AdminAuthGate>
  );
}
