import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Car,
  Edit3,
  FileCheck2,
  FileWarning,
  Gauge,
  Loader2,
  Lock,
  PauseCircle,
  PlayCircle,
  PlusCircle,
  Save,
  Wrench,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
  useCommissionConfig,
  useOwnerAccount,
  useOwnerVehicles,
} from '@/hooks/useOwner';
import {
  ACCEPTED_DOC_MIME_TYPES,
  MAX_VEHICLE_DOC_BYTES,
  VEHICLE_STATUS_META,
  type OwnerVehicleRow,
  type VehicleDocType,
} from '@/lib/owner';
import { formatINR } from '@/lib/utils';
import { calculateHourlyPriceInr } from '@/lib/pricing';
import { OwnerAuthGate } from '@/components/owner/OwnerAuthGate';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { CommissionCalculatorCard } from '@/components/owner/CommissionCalculatorCard';
import {
  PrivateFileUploadField,
  type UploadedPrivateAsset,
} from '@/components/owner/PrivateFileUpload';
import { Button } from '@/components/ui/button';

export function OwnerVehiclesPage() {
  const { user } = useAuth();
  const { data: ownerData } = useOwnerAccount();
  const { data: vehicles = [], isLoading, invalidate } = useOwnerVehicles();
  const { data: commissionConfig } = useCommissionConfig();

  const [editingVehicle, setEditingVehicle] = useState<OwnerVehicleRow | null>(null);
  const [editPriceINR, setEditPriceINR] = useState(3000);
  const [editDepositINR, setEditDepositINR] = useState(5000);
  const [editMinDays, setEditMinDays] = useState(1);
  const [editMaxDays, setEditMaxDays] = useState(30);
  const [editPickupPrefs, setEditPickupPrefs] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [odometerInput, setOdometerInput] = useState<string>('');
  const [odometerNotes, setOdometerNotes] = useState('');
  const [savingOdometer, setSavingOdometer] = useState(false);
  const [serviceDate, setServiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [serviceType, setServiceType] = useState('Scheduled Service');
  const [serviceCentre, setServiceCentre] = useState('');
  const [serviceOdo, setServiceOdo] = useState<string>('');
  const [serviceDetails, setServiceDetails] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [savingService, setSavingService] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const isVerifiedOwner = ownerData?.profile?.verification_status === 'VERIFIED';

  const openEditor = (v: OwnerVehicleRow) => {
    setEditingVehicle(v);
    setEditPriceINR(Math.round(Number(v.price_per_day_paise) / 100));
    setEditDepositINR(Math.round(Number(v.security_deposit_paise) / 100));
    setEditMinDays(v.min_rental_days || 1);
    setEditMaxDays(v.max_rental_days || 30);
    setEditPickupPrefs(v.pickup_preferences || '');
    setOdometerInput(v.kilometres_driven != null ? String(v.kilometres_driven) : '');
    setOdometerNotes('');
    setServiceOdo(v.kilometres_driven != null ? String(v.kilometres_driven) : '');
    setServiceCentre('');
    setServiceDetails('');
    setNextServiceDate('');
    setActionErr(null);
    setActionMsg(null);
  };

  const togglePause = async (v: OwnerVehicleRow) => {
    if (!supabase || !user?.id) return;
    setActionErr(null);
    setActionMsg(null);
    const nextPaused = !v.is_paused;
    const { error } = await supabase
      .from('vehicles')
      .update({ is_paused: nextPaused })
      .eq('id', v.id)
      .eq('owner_id', user.id);

    if (error) {
      setActionErr(error.message);
      return;
    }
    setActionMsg(
      nextPaused
        ? `${v.name} has been paused and hidden from public marketplace results.`
        : `${v.name} has been unpaused.`
    );
    await invalidate();
  };

  const handleSavePermittedEdits = async () => {
    if (!supabase || !user?.id || !editingVehicle) return;
    setSavingEdit(true);
    setActionErr(null);
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({
          price_per_day_paise: Math.max(500, Math.round(editPriceINR)) * 100,
          security_deposit_paise: Math.max(0, Math.round(editDepositINR)) * 100,
          min_rental_days: Math.max(1, editMinDays),
          max_rental_days: Math.max(editMinDays, editMaxDays),
          pickup_preferences: editPickupPrefs.trim(),
        })
        .eq('id', editingVehicle.id)
        .eq('owner_id', user.id);

      if (error) throw new Error(error.message);
      setActionMsg('Pricing & availability preferences updated.');
      setEditingVehicle(null);
      await invalidate();
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : 'Unable to save edits.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleLogOdometer = async () => {
    if (!supabase || !user?.id || !editingVehicle) return;
    const km = Number(odometerInput);
    if (!Number.isFinite(km) || km < 0) {
      setActionErr('Enter a valid non-negative odometer reading in kilometres.');
      return;
    }
    setSavingOdometer(true);
    setActionErr(null);
    try {
      const nowIso = new Date().toISOString();
      const { error: logErr } = await supabase.from('vehicle_odometer_logs').insert({
        vehicle_id: editingVehicle.id,
        odometer_km: Math.round(km),
        recorded_by: user.id,
        source_type: 'owner_submission',
        notes: odometerNotes.trim() || null,
      });
      if (logErr) throw new Error(logErr.message);

      await supabase
        .from('vehicles')
        .update({ kilometres_driven: Math.round(km), odometer_updated_at: nowIso })
        .eq('id', editingVehicle.id)
        .eq('owner_id', user.id);

      setActionMsg(`Odometer reading (${Math.round(km).toLocaleString('en-IN')} km) added to Vehicle Passport.`);
      setOdometerNotes('');
      await invalidate();
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : 'Unable to log odometer reading.');
    } finally {
      setSavingOdometer(false);
    }
  };

  const handleAddServiceRecord = async () => {
    if (!supabase || !user?.id || !editingVehicle) return;
    if (!serviceDate || !serviceDetails.trim()) {
      setActionErr('Provide both service date and maintenance performed.');
      return;
    }
    setSavingService(true);
    setActionErr(null);
    try {
      const parsedOdo = serviceOdo.trim() ? Math.round(Number(serviceOdo)) : null;
      const { error } = await supabase.from('vehicle_service_records').insert({
        vehicle_id: editingVehicle.id,
        service_date: serviceDate,
        odometer_km: parsedOdo != null && Number.isFinite(parsedOdo) && parsedOdo >= 0 ? parsedOdo : null,
        service_centre: serviceCentre.trim() || null,
        service_type: serviceType,
        maintenance_performed: serviceDetails.trim(),
        next_recommended_service_date: nextServiceDate || null,
        created_by: user.id,
      });
      if (error) throw new Error(error.message);

      setActionMsg('Maintenance record added to Vehicle Passport.');
      setServiceDetails('');
      setServiceCentre('');
      setNextServiceDate('');
      await invalidate();
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : 'Unable to add service record.');
    } finally {
      setSavingService(false);
    }
  };

  const handleReplaceDocument = async (
    vehicle: OwnerVehicleRow,
    docType: VehicleDocType,
    isMandatory: boolean,
    asset: UploadedPrivateAsset
  ) => {
    if (!supabase || !user?.id) return;
    setActionErr(null);
    setActionMsg(null);

    const existing = vehicle.vehicle_documents?.find((d) => d.document_type === docType);
    const { error } = await supabase.from('vehicle_documents').upsert(
      {
        vehicle_id: vehicle.id,
        owner_id: user.id,
        document_type: docType,
        is_mandatory: isMandatory,
        document_number: existing?.document_number || null,
        issue_date: existing?.issue_date || null,
        expiry_date: existing?.expiry_date || null,
        commercial_rental_coverage_flag: existing?.commercial_rental_coverage_flag ?? false,
        storage_bucket: asset.storage_bucket,
        storage_path: asset.storage_path,
        file_name: asset.file_name,
        mime_type: asset.mime_type,
        file_size_bytes: asset.file_size_bytes,
      },
      { onConflict: 'vehicle_id,document_type' }
    );
    if (error) {
      setActionErr(error.message);
      return;
    }

    setActionMsg(
      vehicle.listing_status === 'APPROVED'
        ? `Document replaced cleanly. Listing status automatically moved to PENDING_REVIEW for re-verification.`
        : `Document ${docType.toUpperCase()} uploaded for review.`
    );
    await invalidate();
  };

  return (
    <OwnerAuthGate>
      <OwnerLayout
        title="My Vehicles"
        subtitle="Manage drafts, moderation reviews, pricing, availability pauses, and document renewals."
        action={
          isVerifiedOwner ? (
            <Link to="/owner/vehicles/add">
              <Button variant="champagne">
                <PlusCircle className="h-4 w-4" />
                Add a Vehicle
              </Button>
            </Link>
          ) : null
        }
      >
        {actionErr && (
          <div className="border border-red-500/40 bg-red-950/20 px-4 py-3 rounded-sm text-xs text-red-200">
            {actionErr}
          </div>
        )}
        {actionMsg && (
          <div className="border border-emerald-500/40 bg-emerald-950/20 px-4 py-3 rounded-sm text-xs text-emerald-200">
            {actionMsg}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-[#8E8E98]">Loading owner vehicles...</p>
        ) : vehicles.length === 0 ? (
          <div className="border border-[#2A2A30] bg-[#111114] p-10 rounded-sm text-center space-y-4">
            <Car className="h-7 w-7 text-[#C8A97E] mx-auto" />
            <h2 className="font-display text-xl text-[#F4F1EA]">No vehicles submitted yet</h2>
            <p className="text-sm text-[#8E8E98] max-w-md mx-auto">
              {isVerifiedOwner
                ? 'Start a vehicle submission to upload documents, 9 photographs, and configure daily pricing.'
                : 'Complete your Owner Identity Verification to unlock vehicle submissions.'}
            </p>
            {isVerifiedOwner ? (
              <Link to="/owner/vehicles/add">
                <Button variant="champagne">Add Your First Vehicle</Button>
              </Link>
            ) : (
              <Link to="/owner/verification">
                <Button variant="outline">View Verification Status</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {vehicles.map((v) => {
              const meta = VEHICLE_STATUS_META[v.listing_status];
              const sub = Array.isArray(v.vehicle_submissions)
                ? v.vehicle_submissions[0]
                : v.vehicle_submissions;
              const expiredDocs = (v.vehicle_documents ?? []).filter(
                (d) => d.expiry_date && new Date(d.expiry_date) < new Date()
              );

              return (
                <div
                  key={v.id}
                  className="border border-[#2A2A30] bg-[#111114] p-6 rounded-sm space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`border px-2.5 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.14em] ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                        {v.is_paused && (
                          <span className="border border-amber-500/40 bg-amber-950/20 px-2.5 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.14em] text-amber-300">
                            Paused by Owner
                          </span>
                        )}
                        {expiredDocs.length > 0 && (
                          <span className="inline-flex items-center gap-1 border border-red-500/40 bg-red-950/20 px-2.5 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.14em] text-red-300">
                            <FileWarning className="h-3 w-3" />
                            Expired Document — Hidden from Public
                          </span>
                        )}
                      </div>
                      <h2 className="font-display text-xl font-medium text-[#F4F1EA]">
                        {v.name} ({v.year})
                      </h2>
                      <p className="text-xs text-[#8E8E98]">
                        {v.location} · Reg:{' '}
                        <strong className="text-[#E8E4DC]">
                          {sub?.registration_number || 'Locked draft'}
                        </strong>{' '}
                        · {formatINR(Math.round(v.price_per_day_paise / 100))}/day ·{' '}
                        <span className="text-[#C8A97E]">
                          {formatINR(calculateHourlyPriceInr(Math.round(v.price_per_day_paise / 100)))}/hr
                        </span>
                      </p>
                      {v.rejection_reason && (
                        <p className="flex items-center gap-2 text-xs text-red-300 pt-1">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          Review Note: {v.rejection_reason}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {(v.listing_status === 'DRAFT' ||
                        v.listing_status === 'REJECTED' ||
                        v.listing_status === 'RESUBMISSION_REQUIRED') && (
                        <Link to={`/owner/vehicles/add?draft=${v.id}`}>
                          <Button variant="champagne" size="sm">
                            {v.listing_status === 'DRAFT' ? 'Resume Draft' : 'Update & Resubmit'}
                          </Button>
                        </Link>
                      )}

                      {v.listing_status === 'APPROVED' && (
                        <Button variant="outline" size="sm" onClick={() => togglePause(v)}>
                          {v.is_paused ? (
                            <>
                              <PlayCircle className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Resume Listing</span>
                            </>
                          ) : (
                            <>
                              <PauseCircle className="h-3.5 w-3.5 text-amber-300" />
                              <span>Pause Listing</span>
                            </>
                          )}
                        </Button>
                      )}

                      <Button variant="outline" size="sm" onClick={() => openEditor(v)}>
                        <Edit3 className="h-3.5 w-3.5 text-[#C8A97E]" />
                        <span>Pricing & Docs</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pricing, Availability & Document Replacement Drawer */}
        {editingVehicle && user && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-2xl w-full border border-[#2A2A30] bg-[#111114] p-6 sm:p-8 rounded-sm space-y-6 my-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#C8A97E]">
                    Manage Listing
                  </p>
                  <h2 className="font-display text-2xl font-semibold text-[#F4F1EA]">
                    {editingVehicle.name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="text-[#8E8E98] hover:text-[#F4F1EA] cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border border-[#2A2A30] bg-[#0A0A0B] p-3.5 rounded-sm flex items-center gap-2.5 text-xs text-[#8E8E98]">
                <Lock className="h-4 w-4 text-[#C8A97E] shrink-0" />
                <span>
                  Registration numbers and ownership transfer cannot be changed by owners without
                  formal re-verification. Replacing RC, Insurance, or PUC automatically triggers
                  re-review.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                    Daily Rental Price (₹)
                  </label>
                  <input
                    type="number"
                    min={500}
                    max={100000}
                    value={editPriceINR}
                    onChange={(e) => setEditPriceINR(Number(e.target.value))}
                    className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                  />
                  <p className="text-[11px] text-[#C8A97E]">
                    Auto-calculated Hourly Rate: {formatINR(calculateHourlyPriceInr(editPriceINR))}/hr
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                    Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={200000}
                    value={editDepositINR}
                    onChange={(e) => setEditDepositINR(Number(e.target.value))}
                    className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                    Min Days
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={editMinDays}
                    onChange={(e) => setEditMinDays(Number(e.target.value))}
                    className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                    Max Days
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={editMaxDays}
                    onChange={(e) => setEditMaxDays(Number(e.target.value))}
                    className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                    Pickup & Return Preferences
                  </label>
                  <input
                    type="text"
                    value={editPickupPrefs}
                    onChange={(e) => setEditPickupPrefs(e.target.value)}
                    className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                  />
                </div>
              </div>

              <CommissionCalculatorCard dailyRateINR={editPriceINR} config={commissionConfig} />

              <div className="space-y-3 border-t border-[#2A2A30] pt-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#C8A97E]">
                  Replace Expired or Updated Documents
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['rc', 'insurance', 'puc'] as VehicleDocType[]).map((docType) => {
                    const row = editingVehicle.vehicle_documents?.find(
                      (d) => d.document_type === docType
                    );
                    return (
                      <PrivateFileUploadField
                        key={docType}
                        label={docType.toUpperCase()}
                        hint={
                          row?.expiry_date ? `Exp: ${row.expiry_date}` : 'Upload latest document'
                        }
                        required
                        bucket="owner-vehicle-documents"
                        ownerId={user.id}
                        folder={`vehicles/${editingVehicle.id}/${docType}`}
                        allowedMimes={ACCEPTED_DOC_MIME_TYPES}
                        maxBytes={MAX_VEHICLE_DOC_BYTES}
                        acceptAttr=".jpg,.jpeg,.png,.webp,.pdf"
                        currentFile={
                          row
                            ? {
                                storage_bucket: row.storage_bucket,
                                storage_path: row.storage_path,
                                file_name: row.file_name,
                                mime_type: row.mime_type,
                                file_size_bytes: row.file_size_bytes,
                              }
                            : null
                        }
                        onUploaded={(asset) =>
                          handleReplaceDocument(editingVehicle, docType, true, asset)
                        }
                      />
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 border-t border-[#2A2A30] pt-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#C8A97E] flex items-center gap-1.5">
                    <FileCheck2 className="h-3.5 w-3.5" />
                    Vehicle Passport Updates (Odometer &amp; Maintenance)
                  </p>
                  <Link
                    to={`/passport/${editingVehicle.slug}`}
                    className="text-[11px] text-[#C8A97E] hover:underline"
                  >
                    Open Public Passport →
                  </Link>
                </div>

                <div className="border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm space-y-3">
                  <p className="text-xs font-medium text-[#F4F1EA] flex items-center gap-1.5">
                    <Gauge className="h-3.5 w-3.5 text-[#C8A97E]" />
                    Log Current Odometer Reading
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="number"
                      min={0}
                      placeholder="Odometer (km)"
                      value={odometerInput}
                      onChange={(e) => setOdometerInput(e.target.value)}
                      className="h-9 bg-[#111114] border border-[#2A2A30] px-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Optional note (e.g. Monthly check)"
                      value={odometerNotes}
                      onChange={(e) => setOdometerNotes(e.target.value)}
                      className="h-9 sm:col-span-2 bg-[#111114] border border-[#2A2A30] px-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={savingOdometer}
                    onClick={handleLogOdometer}
                  >
                    {savingOdometer ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gauge className="h-3.5 w-3.5" />}
                    <span>Record Odometer Log</span>
                  </Button>
                </div>

                <div className="border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm space-y-3">
                  <p className="text-xs font-medium text-[#F4F1EA] flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5 text-[#C8A97E]" />
                    Add Service / Maintenance Entry
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="date"
                      value={serviceDate}
                      onChange={(e) => setServiceDate(e.target.value)}
                      className="h-9 bg-[#111114] border border-[#2A2A30] px-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      className="h-9 bg-[#111114] border border-[#2A2A30] px-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    >
                      <option value="Scheduled Service">Scheduled Service</option>
                      <option value="Oil & Filter">Oil &amp; Filter</option>
                      <option value="Brake Service">Brake Service</option>
                      <option value="Tyre Replacement">Tyre Replacement</option>
                      <option value="General Inspection">General Inspection</option>
                      <option value="Repair">Repair</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      placeholder="Odometer at service (km)"
                      value={serviceOdo}
                      onChange={(e) => setServiceOdo(e.target.value)}
                      className="h-9 bg-[#111114] border border-[#2A2A30] px-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Service centre (optional)"
                      value={serviceCentre}
                      onChange={(e) => setServiceCentre(e.target.value)}
                      className="h-9 bg-[#111114] border border-[#2A2A30] px-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Maintenance performed (e.g. 20k km service, synthetic oil)"
                      value={serviceDetails}
                      onChange={(e) => setServiceDetails(e.target.value)}
                      className="h-9 sm:col-span-2 bg-[#111114] border border-[#2A2A30] px-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                    <div className="sm:col-span-2 flex items-center gap-2 text-[11px] text-[#8E8E98]">
                      <span>Next recommended service (optional):</span>
                      <input
                        type="date"
                        value={nextServiceDate}
                        onChange={(e) => setNextServiceDate(e.target.value)}
                        className="h-8 bg-[#111114] border border-[#2A2A30] px-2 text-xs text-[#F4F1EA] rounded-sm focus:border-[#C8A97E] focus:outline-none"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={savingService}
                    onClick={handleAddServiceRecord}
                  >
                    {savingService ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wrench className="h-3.5 w-3.5" />}
                    <span>Add Service Record</span>
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#2A2A30] pt-4">
                <Button variant="outline" onClick={() => setEditingVehicle(null)}>
                  Close
                </Button>
                <Button variant="champagne" disabled={savingEdit} onClick={handleSavePermittedEdits}>
                  {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Save Pricing Changes</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </OwnerLayout>
    </OwnerAuthGate>
  );
}
