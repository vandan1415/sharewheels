import { useState } from 'react';
import { CheckCircle2, FileWarning, Loader2, Search, ShieldCheck, X } from 'lucide-react';
import { useAdminSession, useAdminVehicles } from '@/hooks/useAdmin';
import { callAdminApi } from '@/lib/admin';
import { VEHICLE_STATUS_META, type VehicleListingStatus } from '@/lib/owner';
import { formatINR } from '@/lib/utils';
import { AdminAuthGate } from '@/components/admin/AdminAuthGate';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminSignedDocViewer } from '@/components/admin/AdminSignedDocViewer';
import { Button } from '@/components/ui/button';

export function AdminVehiclesPage({ defaultPending = false }: { defaultPending?: boolean }) {
  const { data: adminSession } = useAdminSession();
  const { data: vehicles = [], isLoading, invalidate } = useAdminVehicles(Boolean(adminSession));

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(defaultPending ? 'pending_queue' : 'ALL');
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [busyDecision, setBusyDecision] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const todayIso = new Date().toISOString().slice(0, 10);

  const filtered = vehicles.filter((v: any) => {
    const q = search.trim().toLowerCase();
    const regNo = v.submission?.registration_number || '';
    const matchesQ =
      !q ||
      (v.name || '').toLowerCase().includes(q) ||
      (v.location || '').toLowerCase().includes(q) ||
      regNo.toLowerCase().includes(q);
    if (!matchesQ) return false;

    if (statusFilter === 'pending_queue') {
      return ['PENDING_REVIEW', 'UNDER_REVIEW', 'RESUBMISSION_REQUIRED'].includes(v.listing_status);
    }
    if (statusFilter === 'expired_docs') {
      return (v.documents ?? []).some((d: any) => d.expiry_date && d.expiry_date < todayIso);
    }
    if (statusFilter !== 'ALL') return v.listing_status === statusFilter;
    return true;
  });

  const handleDecision = async (
    vehicleId: string,
    decision: 'approve' | 'reject' | 'request_documents' | 'request_photos' | 'suspend' | 'reinstate'
  ) => {
    setErr(null);
    setMsg(null);
    if (
      ['reject', 'request_documents', 'request_photos', 'suspend'].includes(decision) &&
      reasonInput.trim().length < 3
    ) {
      setErr('A clear administrative reason is required for this decision.');
      return;
    }

    setBusyDecision(decision);
    try {
      const res = await callAdminApi<{ listingStatus: string }>('review_vehicle', {
        vehicleId,
        decision,
        reason: reasonInput.trim(),
      });
      setMsg(`Vehicle listing updated to ${res.listingStatus} and audit-logged.`);
      setReasonInput('');
      setSelectedVehicle(null);
      await invalidate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Vehicle moderation failed.');
    } finally {
      setBusyDecision(null);
    }
  };

  return (
    <AdminAuthGate>
      <AdminLayout
        title={defaultPending ? 'Pending Vehicle Approvals' : 'Fleet & Vehicle Verification'}
        subtitle="Verify RC, Motor Insurance, PUC, 9+ photos, expiry dates, and owner status before publishing."
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="h-4 w-4 text-[#8E8E98] absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search model, city, or registration number..."
              className="w-full h-10 bg-[#111114] border border-[#2A2A30] pl-9 pr-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 bg-[#111114] border border-[#2A2A30] px-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
          >
            <option value="pending_queue">Pending Moderation Queue</option>
            <option value="ALL">All Vehicles</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="expired_docs">Expired Documents Alert</option>
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
          <p className="text-sm text-[#8E8E98]">Loading marketplace fleet...</p>
        ) : filtered.length === 0 ? (
          <div className="border border-[#2A2A30] bg-[#111114] p-10 rounded-sm text-center text-sm text-[#8E8E98]">
            No vehicles match the selected criteria.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((v: any) => {
              const meta = VEHICLE_STATUS_META[v.listing_status as VehicleListingStatus];
              const expiredDocs = (v.documents ?? []).filter(
                (d: any) => d.expiry_date && d.expiry_date < todayIso
              );
              return (
                <div
                  key={v.id}
                  className="border border-[#2A2A30] bg-[#111114] p-5 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`border px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.14em] ${meta?.badgeClass || ''}`}>
                        {meta?.label || v.listing_status}
                      </span>
                      {v.is_demo && (
                        <span className="border border-[#2A2A30] bg-[#0A0A0B] px-2 py-0.5 rounded-sm text-[10px] uppercase text-[#8E8E98]">
                          Prototype Seed
                        </span>
                      )}
                      {v.is_paused && (
                        <span className="border border-amber-500/40 bg-amber-950/20 px-2 py-0.5 rounded-sm text-[10px] uppercase text-amber-300">
                          Paused
                        </span>
                      )}
                      {expiredDocs.length > 0 && (
                        <span className="inline-flex items-center gap-1 border border-red-500/40 bg-red-950/20 px-2 py-0.5 rounded-sm text-[10px] uppercase text-red-300">
                          <FileWarning className="h-3 w-3" />
                          Expired Doc
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-lg font-medium text-[#F4F1EA]">
                      {v.name} ({v.year})
                    </h2>
                    <p className="text-xs text-[#8E8E98]">
                      {v.location} · {v.vehicle_categories?.name || 'Vehicle'} ·{' '}
                      {formatINR(Math.round(Number(v.price_per_day_paise) / 100))}/day
                      {v.submission?.registration_number
                        ? ` · Reg: ${v.submission.registration_number}`
                        : ''}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedVehicle(v);
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

        {selectedVehicle && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-4xl w-full border border-[#2A2A30] bg-[#111114] p-6 sm:p-8 rounded-sm space-y-6 my-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#C8A97E]">
                    Vehicle Moderation & Compliance Inspection
                  </p>
                  <h2 className="font-display text-2xl font-semibold text-[#F4F1EA]">
                    {selectedVehicle.name} ({selectedVehicle.year})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVehicle(null)}
                  className="text-[#8E8E98] hover:text-[#F4F1EA]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm space-y-1">
                  <p className="uppercase tracking-[0.14em] text-[#8E8E98]">Specs & Pricing</p>
                  <p className="text-[#F4F1EA]">
                    {selectedVehicle.transmission} · {selectedVehicle.fuel_type} · {selectedVehicle.seats} Seats · {selectedVehicle.drivetrain}
                  </p>
                  <p className="text-[#C8A97E]">
                    Daily Rate: {formatINR(Math.round(Number(selectedVehicle.price_per_day_paise) / 100))} · Deposit:{' '}
                    {formatINR(Math.round(Number(selectedVehicle.security_deposit_paise) / 100))}
                  </p>
                  {selectedVehicle.submission && (
                    <p className="text-[#E8E4DC]">
                      Reg No: {selectedVehicle.submission.registration_number} ({selectedVehicle.submission.registration_state})
                    </p>
                  )}
                </div>

                <div className="border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm space-y-1">
                  <p className="uppercase tracking-[0.14em] text-[#8E8E98]">Owner Verification</p>
                  {selectedVehicle.ownerProfile ? (
                    <>
                      <p className="text-[#F4F1EA]">{selectedVehicle.ownerProfile.full_legal_name}</p>
                      <p className="text-[#8E8E98]">{selectedVehicle.ownerProfile.mobile_number}</p>
                      <p className="text-[#C8A97E]">
                        KYC Status: {selectedVehicle.ownerProfile.verification_status}
                      </p>
                    </>
                  ) : (
                    <p className="text-[#8E8E98]">Prototype Seed Fleet Listing</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#C8A97E]">
                  Vehicle Compliance Documents ({selectedVehicle.documents?.length ?? 0})
                </p>
                {selectedVehicle.documents?.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedVehicle.documents.map((doc: any) => (
                      <div key={doc.id} className="space-y-1">
                        <p className="text-[11px] uppercase text-[#E8E4DC]">
                          {doc.document_type.toUpperCase()} · {doc.review_status}
                          {doc.expiry_date ? ` · Exp ${doc.expiry_date}` : ''}
                          {doc.document_type === 'insurance'
                            ? doc.commercial_rental_coverage_flag
                              ? ' · Commercial/Rental Endorsed'
                              : ' · Private Insurance Flagged'
                            : ''}
                        </p>
                        <AdminSignedDocViewer
                          bucket={doc.storage_bucket}
                          storagePath={doc.storage_path}
                          fileName={doc.file_name}
                          mimeType={doc.mime_type}
                          entityType="vehicle_document"
                          entityId={doc.id}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#8E8E98]">No uploaded compliance documents.</p>
                )}
              </div>

              {selectedVehicle.photos?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#C8A97E]">
                    Private Submission Photographs ({selectedVehicle.photos.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {selectedVehicle.photos.map((p: any) => (
                      <div key={p.id} className="space-y-1">
                        <p className="text-[10px] uppercase text-[#8E8E98]">{p.slot_type}</p>
                        <AdminSignedDocViewer
                          bucket={p.storage_bucket}
                          storagePath={p.storage_path}
                          fileName={p.file_name}
                          mimeType={p.mime_type}
                          entityType="vehicle_submission_photo"
                          entityId={p.id}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 border-t border-[#2A2A30] pt-4">
                <label className="block text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  Reason / Inspection Remarks (Required for Reject, Requests, or Suspend)
                </label>
                <textarea
                  rows={2}
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="Enter rejection reason, requested docs/photos, or suspension rationale..."
                  className="w-full bg-[#0A0A0B] border border-[#2A2A30] p-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
                />
                {err && <p className="text-xs text-red-300">{err}</p>}

                <div className="flex flex-wrap gap-2.5">
                  <Button
                    variant="champagne"
                    size="sm"
                    disabled={Boolean(busyDecision)}
                    onClick={() => handleDecision(selectedVehicle.id, 'approve')}
                  >
                    {busyDecision === 'approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    <span>Approve Vehicle</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={Boolean(busyDecision)}
                    onClick={() => handleDecision(selectedVehicle.id, 'request_documents')}
                  >
                    Request Docs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={Boolean(busyDecision)}
                    onClick={() => handleDecision(selectedVehicle.id, 'request_photos')}
                  >
                    Request Better Photos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={Boolean(busyDecision)}
                    onClick={() => handleDecision(selectedVehicle.id, 'reject')}
                    className="border-red-500/40 text-red-300 hover:bg-red-950/30"
                  >
                    Reject Vehicle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={Boolean(busyDecision)}
                    onClick={() => handleDecision(selectedVehicle.id, 'suspend')}
                    className="border-red-500/40 text-red-300 hover:bg-red-950/30"
                  >
                    Suspend Listing
                  </Button>
                  {selectedVehicle.listing_status === 'SUSPENDED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={Boolean(busyDecision)}
                      onClick={() => handleDecision(selectedVehicle.id, 'reinstate')}
                    >
                      Reinstate
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
