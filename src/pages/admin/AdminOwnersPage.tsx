import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Search, ShieldCheck, X } from 'lucide-react';
import { useAdminOwners, useAdminSession } from '@/hooks/useAdmin';
import { callAdminApi } from '@/lib/admin';
import { OWNER_STATUS_META, type OwnerVerificationStatus } from '@/lib/owner';
import { AdminAuthGate } from '@/components/admin/AdminAuthGate';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminSignedDocViewer } from '@/components/admin/AdminSignedDocViewer';
import { Button } from '@/components/ui/button';

export function AdminOwnersPage({ defaultPending = false }: { defaultPending?: boolean }) {
  const { data: adminSession } = useAdminSession();
  const { data: owners = [], isLoading, invalidate } = useAdminOwners(Boolean(adminSession));

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(defaultPending ? 'pending_queue' : 'ALL');
  const [selectedOwner, setSelectedOwner] = useState<any | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [busyDecision, setBusyDecision] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const filtered = owners.filter((o: any) => {
    const q = search.trim().toLowerCase();
    const matchesQ =
      !q ||
      (o.full_legal_name || '').toLowerCase().includes(q) ||
      (o.email || '').toLowerCase().includes(q) ||
      (o.mobile_number || '').toLowerCase().includes(q);
    if (!matchesQ) return false;
    if (statusFilter === 'pending_queue') {
      return ['PENDING_VERIFICATION', 'UNDER_REVIEW', 'DOCUMENTS_SUBMITTED', 'RESUBMISSION_REQUIRED'].includes(
        o.verification_status
      );
    }
    if (statusFilter !== 'ALL') return o.verification_status === statusFilter;
    return true;
  });

  const handleDecision = async (
    ownerId: string,
    decision: 'approve' | 'reject' | 'request_resubmission' | 'suspend' | 'reopen'
  ) => {
    setErr(null);
    setMsg(null);
    if (['reject', 'request_resubmission', 'suspend'].includes(decision) && reasonInput.trim().length < 3) {
      setErr('Please provide a clear administrative reason before proceeding.');
      return;
    }
    setBusyDecision(decision);
    try {
      const res = await callAdminApi<{ status: string }>('review_owner', {
        ownerId,
        decision,
        reason: reasonInput.trim(),
      });
      setMsg(`Owner updated to ${res.status} and audit-logged.`);
      setReasonInput('');
      setSelectedOwner(null);
      await invalidate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusyDecision(null);
    }
  };

  return (
    <AdminAuthGate>
      <AdminLayout
        title={defaultPending ? 'Pending Owner Verifications' : 'Owner Directory & KYC Moderation'}
        subtitle="Inspect encrypted KYC documents, verify identity compliance, and log every moderation decision."
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="h-4 w-4 text-[#8E8E98] absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search owner name, email, or phone..."
              className="w-full h-10 bg-[#111114] border border-[#2A2A30] pl-9 pr-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 bg-[#111114] border border-[#2A2A30] px-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
          >
            <option value="pending_queue">Pending Moderation Queue</option>
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INCOMPLETE">Incomplete</option>
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
          <p className="text-sm text-[#8E8E98]">Loading owner verification records...</p>
        ) : filtered.length === 0 ? (
          <div className="border border-[#2A2A30] bg-[#111114] p-10 rounded-sm text-center text-sm text-[#8E8E98]">
            No owner records match this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((o: any) => {
              const meta = OWNER_STATUS_META[o.verification_status as OwnerVerificationStatus];
              return (
                <div
                  key={o.id}
                  className="border border-[#2A2A30] bg-[#111114] p-5 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`border px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.14em] ${meta?.badgeClass || ''}`}>
                        {meta?.label || o.verification_status}
                      </span>
                      <span className="text-xs text-[#8E8E98]">
                        Docs: <strong className="text-[#E8E4DC]">{o.documents?.length ?? 0}</strong>
                        {o.documents_submitted_at
                          ? ` · Submitted ${new Date(o.documents_submitted_at).toLocaleDateString()}`
                          : ''}
                      </span>
                    </div>
                    <h2 className="font-display text-lg font-medium text-[#F4F1EA]">
                      {o.full_legal_name || 'Unnamed Owner'}
                    </h2>
                    <p className="text-xs text-[#8E8E98]">
                      {o.email} · {o.mobile_number || 'No mobile'} · PAN:{' '}
                      <span className="text-[#E8E4DC]">{o.pan_number_masked || 'Pending'}</span>
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedOwner(o);
                      setReasonInput('');
                      setErr(null);
                    }}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-[#C8A97E]" />
                    Inspect & Moderate
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {selectedOwner && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-3xl w-full border border-[#2A2A30] bg-[#111114] p-6 sm:p-8 rounded-sm space-y-6 my-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#C8A97E]">
                    Owner KYC Inspection
                  </p>
                  <h2 className="font-display text-2xl font-semibold text-[#F4F1EA]">
                    {selectedOwner.full_legal_name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOwner(null)}
                  className="text-[#8E8E98] hover:text-[#F4F1EA]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm space-y-1.5">
                  <p className="uppercase tracking-[0.14em] text-[#8E8E98]">Personal Identity</p>
                  <p className="text-[#F4F1EA]">Email: {selectedOwner.email}</p>
                  <p className="text-[#F4F1EA]">Mobile: {selectedOwner.mobile_number}</p>
                  <p className="text-[#F4F1EA]">DOB: {selectedOwner.date_of_birth || 'N/A'}</p>
                  <p className="text-[#C8A97E]">Masked PAN: {selectedOwner.pan_number_masked || 'N/A'}</p>
                </div>

                <div className="border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm space-y-1.5">
                  <p className="uppercase tracking-[0.14em] text-[#8E8E98]">Residential Address</p>
                  {selectedOwner.address ? (
                    <>
                      <p className="text-[#F4F1EA]">{selectedOwner.address.address_line_1}</p>
                      {selectedOwner.address.address_line_2 && (
                        <p className="text-[#E8E4DC]">{selectedOwner.address.address_line_2}</p>
                      )}
                      <p className="text-[#8E8E98]">
                        {selectedOwner.address.city}, {selectedOwner.address.state} —{' '}
                        {selectedOwner.address.pin_code}
                      </p>
                    </>
                  ) : (
                    <p className="text-[#8E8E98]">Address not submitted yet.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#C8A97E]">
                  Private Identity Documents ({selectedOwner.documents?.length ?? 0})
                </p>
                {selectedOwner.documents?.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedOwner.documents.map((doc: any) => (
                      <div key={doc.id} className="space-y-1">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-[#E8E4DC]">
                          {doc.document_type.replace(/_/g, ' ')}
                          {doc.gov_id_subtype ? ` (${doc.gov_id_subtype})` : ''} · {doc.review_status}
                        </p>
                        <AdminSignedDocViewer
                          bucket={doc.storage_bucket}
                          storagePath={doc.storage_path}
                          fileName={doc.file_name}
                          mimeType={doc.mime_type}
                          entityType="owner_identity_document"
                          entityId={doc.id}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#8E8E98]">No KYC documents uploaded yet.</p>
                )}
              </div>

              <div className="space-y-3 border-t border-[#2A2A30] pt-4">
                <label className="block text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  Administrative Reason / Review Notes (Mandatory for Reject, Resubmission, Suspend)
                </label>
                <textarea
                  rows={2}
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="Specify clear verification findings or rejection reason..."
                  className="w-full bg-[#0A0A0B] border border-[#2A2A30] p-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
                />
                {err && <p className="text-xs text-red-300">{err}</p>}

                <div className="flex flex-wrap gap-2.5">
                  <Button
                    variant="champagne"
                    size="sm"
                    disabled={Boolean(busyDecision)}
                    onClick={() => handleDecision(selectedOwner.id, 'approve')}
                  >
                    {busyDecision === 'approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    <span>Approve Owner</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={Boolean(busyDecision)}
                    onClick={() => handleDecision(selectedOwner.id, 'request_resubmission')}
                  >
                    Request Additional Docs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={Boolean(busyDecision)}
                    onClick={() => handleDecision(selectedOwner.id, 'reject')}
                    className="border-red-500/40 text-red-300 hover:bg-red-950/30"
                  >
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={Boolean(busyDecision)}
                    onClick={() => handleDecision(selectedOwner.id, 'suspend')}
                    className="border-red-500/40 text-red-300 hover:bg-red-950/30"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Suspend
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={Boolean(busyDecision)}
                    onClick={() => handleDecision(selectedOwner.id, 'reopen')}
                  >
                    Reopen Review
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
