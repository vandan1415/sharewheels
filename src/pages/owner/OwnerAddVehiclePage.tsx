import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
  useCommissionConfig,
  useOwnerAccount,
  useOwnerFormLookups,
  useOwnerVehicles,
} from '@/hooks/useOwner';
import {
  ACCEPTED_DOC_MIME_TYPES,
  ACCEPTED_PHOTO_MIME_TYPES,
  isValidIndianRegNumber,
  isValidPinCode,
  MAX_VEHICLE_DOC_BYTES,
  MAX_VEHICLE_PHOTO_BYTES,
  normalizeRegNumber,
  uploadPrivateOwnerFile,
  type VehicleDocType,
  type VehiclePhotoRow,
  type VehiclePhotoSlot,
} from '@/lib/owner';
import { calculateHourlyPriceInr } from '@/lib/pricing';
import { formatINR } from '@/lib/utils';
import { OwnerAuthGate } from '@/components/owner/OwnerAuthGate';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { CommissionCalculatorCard } from '@/components/owner/CommissionCalculatorCard';
import {
  PrivateFilePreview,
  PrivateFileUploadField,
  type UploadedPrivateAsset,
} from '@/components/owner/PrivateFileUpload';
import { Button } from '@/components/ui/button';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const VEHICLE_DOC_META: {
  type: VehicleDocType;
  label: string;
  hint: string;
  mandatory: boolean;
}[] = [
  {
    type: 'rc',
    label: 'Registration Certificate (RC)',
    hint: 'Official R.C. smartcard/extract showing owner name and chassis/reg details.',
    mandatory: true,
  },
  {
    type: 'insurance',
    label: 'Valid Motor Insurance Policy',
    hint: 'Active comprehensive policy. Private policies are flagged to confirm paid rental coverage.',
    mandatory: true,
  },
  {
    type: 'puc',
    label: 'Pollution Under Control (PUC)',
    hint: 'Unexpired emission compliance certificate.',
    mandatory: true,
  },
  {
    type: 'permit',
    label: 'Permit or Authorisation',
    hint: 'Conditional: required for tourist/commercial transport permits.',
    mandatory: false,
  },
  {
    type: 'fitness',
    label: 'Fitness Certificate',
    hint: 'Conditional: applicable for commercial permits or vehicles over statutory age.',
    mandatory: false,
  },
  {
    type: 'additional',
    label: 'Additional Jurisdiction Document',
    hint: 'Optional NOC, hypothecation release, or state-specific authorisation.',
    mandatory: false,
  },
];

const MANDATORY_PHOTO_SLOTS: { slot: VehiclePhotoSlot; label: string; hint: string }[] = [
  { slot: 'front', label: 'Front View', hint: 'Clear exterior front three-quarter view.' },
  { slot: 'rear', label: 'Rear View', hint: 'Full rear bumper, tail lamps, and glass.' },
  { slot: 'left_side', label: 'Left Side Profile', hint: 'Full left flank in daylight.' },
  { slot: 'right_side', label: 'Right Side Profile', hint: 'Full right flank in daylight.' },
  { slot: 'dashboard', label: 'Interior Dashboard', hint: 'Steering, infotainment, and centre console.' },
  { slot: 'front_seats', label: 'Front Seats', hint: 'Driver and passenger upholstery.' },
  { slot: 'rear_seats', label: 'Rear Seats', hint: 'Second/third-row seating legroom.' },
  { slot: 'odometer', label: 'Odometer Reading', hint: 'Current illuminated odometer display.' },
  { slot: 'registration_plate', label: 'Registration Plate', hint: 'Visible number plate closeup.' },
];

interface DocDraftState {
  asset: UploadedPrivateAsset;
  document_number: string;
  issue_date: string;
  expiry_date: string;
  commercial_rental_coverage_flag: boolean;
}

export function OwnerAddVehiclePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { data: ownerData } = useOwnerAccount();
  const { data: commissionConfig } = useCommissionConfig();
  const { data: lookups } = useOwnerFormLookups();
  const { data: ownerVehicles = [], invalidate: invalidateVehicles } = useOwnerVehicles();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [vehicleId, setVehicleId] = useState<string | null>(searchParams.get('draft'));
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Step 1: Basic Info
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [year, setYear] = useState(2024);
  const [regNumber, setRegNumber] = useState('');
  const [regState, setRegState] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');
  const [transmission, setTransmission] = useState('Automatic');
  const [seats, setSeats] = useState(5);
  const [categoryId, setCategoryId] = useState('');
  const [colour, setColour] = useState('');
  const [kmDriven, setKmDriven] = useState(12000);
  const [drivetrain, setDrivetrain] = useState('FWD');
  const [engineCapacity, setEngineCapacity] = useState('');

  // Step 2: Vehicle Location
  const [citySlug, setCitySlug] = useState('delhi-ncr');
  const [pickupState, setPickupState] = useState('Delhi / Haryana / UP');
  const [pickupPin, setPickupPin] = useState('');
  const [pickupLocality, setPickupLocality] = useState('');
  const [exactPickupInstructions, setExactPickupInstructions] = useState('');

  // Step 3: Documents
  const [docs, setDocs] = useState<Partial<Record<VehicleDocType, DocDraftState>>>({});

  // Step 4: Photographs
  const [photos, setPhotos] = useState<VehiclePhotoRow[]>([]);
  const [photosConfirmed, setPhotosConfirmed] = useState(false);

  // Step 5: Condition
  const [overallCondition, setOverallCondition] = useState('Excellent');
  const [existingScratches, setExistingScratches] = useState('None reported');
  const [tyreCondition, setTyreCondition] = useState('Good (75%+ tread)');
  const [interiorCondition, setInteriorCondition] = useState('Clean & well-maintained');
  const [serviceHistoryAvail, setServiceHistoryAvail] = useState(true);
  const [knownMechanicalIssues, setKnownMechanicalIssues] = useState('None');
  const [existingModifications, setExistingModifications] = useState('Stock / none');
  const [additionalRemarks, setAdditionalRemarks] = useState('');
  const [damageConfirmed, setDamageConfirmed] = useState(false);

  // Step 6: Rental Pricing
  const [dailyPriceINR, setDailyPriceINR] = useState(3000);
  const [securityDepositINR, setSecurityDepositINR] = useState(5000);
  const [minRentalDays, setMinRentalDays] = useState(1);
  const [maxRentalDays, setMaxRentalDays] = useState(30);
  const [availableDays, setAvailableDays] = useState<string[]>([...DAYS_OF_WEEK]);
  const [pickupPreferences, setPickupPreferences] = useState(
    'Flexible daytime handover (08:00 AM – 09:00 PM)'
  );
  const [commissionAccepted, setCommissionAccepted] = useState(false);

  const profile = ownerData?.profile ?? null;
  const isVerifiedOwner = profile?.verification_status === 'VERIFIED';

  // Default category selection once loaded
  useEffect(() => {
    if (!categoryId && lookups?.categories && lookups.categories.length > 0) {
      setCategoryId(lookups.categories[0].id);
    }
  }, [lookups, categoryId]);

  // Hydrate existing draft/resubmission if ?draft=<id> is provided
  useEffect(() => {
    const draftParam = searchParams.get('draft');
    if (!draftParam) return;
    const match = ownerVehicles.find((v) => v.id === draftParam);
    if (!match) return;

    const sub = Array.isArray(match.vehicle_submissions)
      ? match.vehicle_submissions[0]
      : match.vehicle_submissions;

    setVehicleId(match.id);
    setBrand(match.brand);
    setModel(match.model);
    setVariant(match.variant || '');
    setYear(match.year);
    setFuelType(match.fuel_type);
    setTransmission(match.transmission);
    setSeats(match.seats);
    setCategoryId(match.category_id);
    setColour(match.colour || '');
    setKmDriven(match.kilometres_driven ?? 0);
    setDrivetrain(match.drivetrain || 'FWD');
    setEngineCapacity(match.engine_capacity || '');
    if (match.city_slug) setCitySlug(match.city_slug);
    setPickupLocality(match.pickup_area || '');
    setDailyPriceINR(Math.round(Number(match.price_per_day_paise) / 100));
    setSecurityDepositINR(Math.round(Number(match.security_deposit_paise) / 100));
    setMinRentalDays(match.min_rental_days || 1);
    setMaxRentalDays(match.max_rental_days || 30);
    if (match.available_days?.length) setAvailableDays(match.available_days);
    if (match.pickup_preferences) setPickupPreferences(match.pickup_preferences);

    if (sub) {
      setRegNumber(sub.registration_number);
      setRegState(sub.registration_state);
      setPickupState(sub.pickup_state || '');
      setPickupPin(sub.pickup_pin_code || '');
      setExactPickupInstructions(sub.exact_pickup_instructions || '');
      setOverallCondition(sub.overall_condition || 'Excellent');
      setExistingScratches(sub.existing_scratches_dents || 'None reported');
      setTyreCondition(sub.tyre_condition || 'Good');
      setInteriorCondition(sub.interior_condition || 'Clean');
      setServiceHistoryAvail(Boolean(sub.service_history_available));
      setKnownMechanicalIssues(sub.known_mechanical_issues || 'None');
      setExistingModifications(sub.existing_modifications || 'Stock');
      setAdditionalRemarks(sub.additional_remarks || '');
      setDamageConfirmed(Boolean(sub.damage_disclosure_confirmed));
      setPhotosConfirmed(Boolean(sub.photos_authenticity_confirmed));
      setCommissionAccepted(Boolean(sub.commission_disclosed_accepted));
      if (sub.draft_step >= 1 && sub.draft_step <= 6) {
        setStep(sub.draft_step as 1 | 2 | 3 | 4 | 5 | 6);
      }
    }

    if (match.vehicle_documents?.length) {
      const nextDocs: Partial<Record<VehicleDocType, DocDraftState>> = {};
      for (const d of match.vehicle_documents) {
        nextDocs[d.document_type] = {
          asset: {
            storage_bucket: d.storage_bucket,
            storage_path: d.storage_path,
            file_name: d.file_name,
            mime_type: d.mime_type,
            file_size_bytes: d.file_size_bytes,
          },
          document_number: d.document_number || '',
          issue_date: d.issue_date || '',
          expiry_date: d.expiry_date || '',
          commercial_rental_coverage_flag: Boolean(d.commercial_rental_coverage_flag),
        };
      }
      setDocs(nextDocs);
    }

    if (match.vehicle_submission_photos?.length) {
      setPhotos(match.vehicle_submission_photos);
    }
  }, [searchParams, ownerVehicles]);

  const validateStep1And2 = () => {
    if (!brand.trim() || !model.trim() || !variant.trim()) {
      return 'Manufacturer, model, and variant are required.';
    }
    if (!isValidIndianRegNumber(regNumber)) {
      return 'Enter a valid Indian vehicle registration number (e.g. MH01AB1234).';
    }
    if (!regState.trim()) return 'Registration state is required.';
    if (!colour.trim()) return 'Vehicle colour is required.';
    if (!categoryId) return 'Vehicle category is required.';
    if (kmDriven < 0) return 'Kilometres driven cannot be negative.';
    if (!pickupLocality.trim()) return 'Pickup locality is required.';
    if (!isValidPinCode(pickupPin)) return 'Enter a valid 6-digit pickup PIN code.';
    if (!exactPickupInstructions.trim()) {
      return 'Private pickup instructions (shown only after booking) are required.';
    }
    return null;
  };

  const persistVehicleAndSubmission = async (
    targetStep: 1 | 2 | 3 | 4 | 5 | 6,
    targetStatus: 'DRAFT' | 'PENDING_REVIEW'
  ) => {
    if (!supabase || !user?.id) throw new Error('Authentication required.');
    const selectedLoc = lookups?.locations?.find((l: any) => l.slug === citySlug);
    const cityName = selectedLoc?.name || citySlug;
    const ownerDisplay =
      profile?.full_legal_name
        ?.trim()
        .split(' ')
        .map((part, idx) => (idx === 0 ? part : `${part[0]}.`))
        .join(' ') || 'Verified Owner';

    const vehicleName = `${brand.trim()} ${model.trim()} ${variant.trim()}`;
    const regClean = normalizeRegNumber(regNumber);

    let activeVehicleId = vehicleId;
    if (!activeVehicleId) {
      const slug = `own-${citySlug.slice(0, 3)}-${brand
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}-${crypto.randomUUID().slice(0, 8)}`;

      const { data: inserted, error: insErr } = await supabase
        .from('vehicles')
        .insert({
          slug,
          owner_id: user.id,
          category_id: categoryId,
          location_id: selectedLoc?.id ?? null,
          city_slug: citySlug,
          name: vehicleName,
          brand: brand.trim(),
          model: model.trim(),
          variant: variant.trim(),
          year: Number(year),
          location: `${pickupLocality.trim()}, ${cityName}`,
          pickup_area: `${pickupLocality.trim()}, ${cityName}`,
          price_per_day_paise: Math.max(500, Math.round(dailyPriceINR)) * 100,
          security_deposit_paise: Math.max(0, Math.round(securityDepositINR)) * 100,
          transmission,
          fuel_type: fuelType,
          seats: Number(seats),
          drivetrain,
          colour: colour.trim(),
          kilometres_driven: Math.round(Number(kmDriven)),
          engine_capacity: engineCapacity.trim() || null,
          min_rental_days: Number(minRentalDays),
          max_rental_days: Number(maxRentalDays),
          available_days: availableDays,
          pickup_preferences: pickupPreferences.trim(),
          owner_display_name: ownerDisplay,
          image_url: '',
          gallery_urls: [],
          is_demo: false,
          listing_status: targetStatus,
          available: true,
        })
        .select('id')
        .single();

      if (insErr) throw new Error(insErr.message);
      const createdId = inserted.id as string;
      activeVehicleId = createdId;
      setVehicleId(createdId);
      setSearchParams({ draft: createdId });
    } else {
      const { error: updErr } = await supabase
        .from('vehicles')
        .update({
          category_id: categoryId,
          location_id: selectedLoc?.id ?? null,
          city_slug: citySlug,
          name: vehicleName,
          brand: brand.trim(),
          model: model.trim(),
          variant: variant.trim(),
          year: Number(year),
          location: `${pickupLocality.trim()}, ${cityName}`,
          pickup_area: `${pickupLocality.trim()}, ${cityName}`,
          price_per_day_paise: Math.max(500, Math.round(dailyPriceINR)) * 100,
          security_deposit_paise: Math.max(0, Math.round(securityDepositINR)) * 100,
          transmission,
          fuel_type: fuelType,
          seats: Number(seats),
          drivetrain,
          colour: colour.trim(),
          kilometres_driven: Math.round(Number(kmDriven)),
          engine_capacity: engineCapacity.trim() || null,
          min_rental_days: Number(minRentalDays),
          max_rental_days: Number(maxRentalDays),
          available_days: availableDays,
          pickup_preferences: pickupPreferences.trim(),
          listing_status: targetStatus,
        })
        .eq('id', activeVehicleId)
        .eq('owner_id', user.id);

      if (updErr) throw new Error(updErr.message);
    }

    const { error: subErr } = await supabase.from('vehicle_submissions').upsert(
      {
        vehicle_id: activeVehicleId,
        owner_id: user.id,
        registration_number: regClean,
        registration_state: regState.trim(),
        pickup_city: cityName,
        pickup_state: pickupState.trim(),
        pickup_pin_code: pickupPin.trim(),
        pickup_locality: pickupLocality.trim(),
        exact_pickup_instructions: exactPickupInstructions.trim(),
        overall_condition: overallCondition,
        existing_scratches_dents: existingScratches.trim(),
        tyre_condition: tyreCondition,
        interior_condition: interiorCondition,
        service_history_available: serviceHistoryAvail,
        known_mechanical_issues: knownMechanicalIssues.trim(),
        existing_modifications: existingModifications.trim(),
        additional_remarks: additionalRemarks.trim(),
        damage_disclosure_confirmed: damageConfirmed,
        photos_authenticity_confirmed: photosConfirmed,
        commission_bps_snapshot: commissionConfig?.commission_bps ?? null,
        commission_disclosed_accepted: commissionAccepted,
        submission_status: targetStatus,
        draft_step: targetStep,
      },
      { onConflict: 'vehicle_id' }
    );
    if (subErr) throw new Error(subErr.message);

    await invalidateVehicles();
    return activeVehicleId;
  };

  const handleSaveDraft = async () => {
    setError(null);
    setStatusMsg(null);
    if (!brand.trim() || !model.trim()) {
      setError('Enter Manufacturer and Model before saving a vehicle draft.');
      return;
    }
    setSaving(true);
    try {
      await persistVehicleAndSubmission(step, 'DRAFT');
      setStatusMsg('Vehicle draft saved cleanly. You can return anytime to finish.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleStepNext = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setStatusMsg(null);

    if (step === 1) {
      if (!brand.trim() || !model.trim() || !variant.trim()) {
        setError('Manufacturer, model, and variant are required.');
        return;
      }
      if (!isValidIndianRegNumber(regNumber)) {
        setError('Enter a valid registration number (e.g. MH01AB1234).');
        return;
      }
      if (!regState.trim() || !colour.trim()) {
        setError('Registration state and colour are required.');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      const err = validateStep1And2();
      if (err) {
        setError(err);
        return;
      }
      setSaving(true);
      try {
        await persistVehicleAndSubmission(3, 'DRAFT');
        setStep(3);
      } catch (persistErr) {
        setError(persistErr instanceof Error ? persistErr.message : 'Failed to create draft.');
      } finally {
        setSaving(false);
      }
      return;
    }

    if (step === 3) {
      for (const reqType of ['rc', 'insurance', 'puc'] as VehicleDocType[]) {
        const entry = docs[reqType];
        if (!entry) {
          setError(`${reqType.toUpperCase()} document upload is mandatory.`);
          return;
        }
        if (!entry.document_number.trim() || !entry.expiry_date) {
          setError(`${reqType.toUpperCase()} requires document number and expiry date.`);
          return;
        }
        if (new Date(entry.expiry_date) < new Date(new Date().toISOString().slice(0, 10))) {
          setError(`${reqType.toUpperCase()} appears expired. Upload an unexpired document.`);
          return;
        }
      }
      setSaving(true);
      try {
        await persistVehicleAndSubmission(4, 'DRAFT');
        setStep(4);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (step === 4) {
      const uploadedSlots = new Set(photos.map((p) => p.slot_type));
      const missingSlots = MANDATORY_PHOTO_SLOTS.filter((s) => !uploadedSlots.has(s.slot));
      if (missingSlots.length > 0) {
        setError(
          `Upload all 9 mandatory vehicle photos. Missing: ${missingSlots
            .slice(0, 3)
            .map((m) => m.label)
            .join(', ')}${missingSlots.length > 3 ? '...' : ''}.`
        );
        return;
      }
      if (!photosConfirmed) {
        setError('Please confirm the uploaded photographs depict the actual vehicle.');
        return;
      }
      await persistVehicleAndSubmission(5, 'DRAFT');
      setStep(5);
      return;
    }

    if (step === 5) {
      if (!damageConfirmed) {
        setError('Please confirm existing damage and mechanical condition disclosure.');
        return;
      }
      await persistVehicleAndSubmission(6, 'DRAFT');
      setStep(6);
    }
  };

  const handleUploadVehicleDoc = async (
    docType: VehicleDocType,
    mandatory: boolean,
    asset: UploadedPrivateAsset
  ) => {
    if (!supabase || !user?.id || !vehicleId) return;
    setError(null);
    const existing = docs[docType];
    const nextMeta = {
      document_number: existing?.document_number || '',
      issue_date: existing?.issue_date || '',
      expiry_date: existing?.expiry_date || '',
      commercial_rental_coverage_flag: existing?.commercial_rental_coverage_flag ?? false,
    };

    const { error: dbErr } = await supabase.from('vehicle_documents').upsert(
      {
        vehicle_id: vehicleId,
        owner_id: user.id,
        document_type: docType,
        is_mandatory: mandatory,
        document_number: nextMeta.document_number || null,
        issue_date: nextMeta.issue_date || null,
        expiry_date: nextMeta.expiry_date || null,
        commercial_rental_coverage_flag: nextMeta.commercial_rental_coverage_flag,
        storage_bucket: asset.storage_bucket,
        storage_path: asset.storage_path,
        file_name: asset.file_name,
        mime_type: asset.mime_type,
        file_size_bytes: asset.file_size_bytes,
      },
      { onConflict: 'vehicle_id,document_type' }
    );
    if (dbErr) {
      setError(dbErr.message);
      return;
    }

    setDocs((prev) => ({
      ...prev,
      [docType]: { asset, ...nextMeta },
    }));
    await invalidateVehicles();
  };

  const updateDocMetadataField = async (
    docType: VehicleDocType,
    patch: Partial<Omit<DocDraftState, 'asset'>>
  ) => {
    setDocs((prev) => {
      const current = prev[docType];
      if (!current) return prev;
      return { ...prev, [docType]: { ...current, ...patch } };
    });

    if (!supabase || !user?.id || !vehicleId || !docs[docType]) return;
    await supabase
      .from('vehicle_documents')
      .update({
        document_number:
          patch.document_number !== undefined
            ? patch.document_number || null
            : docs[docType]?.document_number || null,
        issue_date:
          patch.issue_date !== undefined
            ? patch.issue_date || null
            : docs[docType]?.issue_date || null,
        expiry_date:
          patch.expiry_date !== undefined
            ? patch.expiry_date || null
            : docs[docType]?.expiry_date || null,
        commercial_rental_coverage_flag:
          patch.commercial_rental_coverage_flag !== undefined
            ? patch.commercial_rental_coverage_flag
            : docs[docType]?.commercial_rental_coverage_flag ?? false,
      })
      .eq('vehicle_id', vehicleId)
      .eq('owner_id', user.id)
      .eq('document_type', docType);
  };

  const handleUploadPhotoSlot = async (slot: VehiclePhotoSlot, asset: UploadedPrivateAsset) => {
    if (!supabase || !user?.id || !vehicleId) return;
    setError(null);

    if (slot !== 'additional') {
      const existing = photos.find((p) => p.slot_type === slot);
      if (existing) {
        await supabase.storage.from(existing.storage_bucket).remove([existing.storage_path]);
        await supabase.from('vehicle_submission_photos').delete().eq('id', existing.id);
      }
    }

    const { data: row, error: insErr } = await supabase
      .from('vehicle_submission_photos')
      .insert({
        vehicle_id: vehicleId,
        owner_id: user.id,
        slot_type: slot,
        storage_bucket: asset.storage_bucket,
        storage_path: asset.storage_path,
        file_name: asset.file_name,
        mime_type: asset.mime_type,
        file_size_bytes: asset.file_size_bytes,
        sort_order: slot === 'additional' ? photos.length + 1 : 0,
      })
      .select('*')
      .single();

    if (insErr) {
      setError(insErr.message);
      return;
    }
    setPhotos((prev) =>
      slot === 'additional'
        ? [...prev, row as VehiclePhotoRow]
        : [...prev.filter((p) => p.slot_type !== slot), row as VehiclePhotoRow]
    );
  };

  const handleUploadAdditionalPhotos = async (files: FileList | null) => {
    if (!files || !user?.id || !vehicleId) return;
    setUploadingExtra(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const asset = await uploadPrivateOwnerFile({
          bucket: 'owner-vehicle-photos',
          ownerId: user.id,
          folder: `vehicles/${vehicleId}/additional`,
          file,
          allowedMimes: ACCEPTED_PHOTO_MIME_TYPES,
          maxBytes: MAX_VEHICLE_PHOTO_BYTES,
        });
        await handleUploadPhotoSlot('additional', asset);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Additional photo upload failed.');
    } finally {
      setUploadingExtra(false);
    }
  };

  const handleRemovePhoto = async (photo: VehiclePhotoRow) => {
    if (!supabase) return;
    await supabase.storage.from(photo.storage_bucket).remove([photo.storage_path]);
    await supabase.from('vehicle_submission_photos').delete().eq('id', photo.id);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  };

  const handleSubmitForVerification = async () => {
    setError(null);
    if (!isVerifiedOwner) {
      setError('Only verified owners can submit vehicles for review.');
      return;
    }
    if (dailyPriceINR < 500 || maxRentalDays < minRentalDays || availableDays.length === 0) {
      setError('Check daily tariff (min ₹500), rental duration limits, and available days.');
      return;
    }
    if (!commissionAccepted) {
      setError('Please acknowledge the disclosed SHAREWHEELS commission & payout breakdown.');
      return;
    }

    setSubmitting(true);
    try {
      await persistVehicleAndSubmission(6, 'PENDING_REVIEW');
      if (supabase && user?.id) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          title: 'Vehicle Submitted for Review',
          body: `${brand} ${model} entered PENDING_REVIEW. It will remain private until documents, photos, and vehicle verification pass.`,
        });
      }
      navigate('/owner/vehicles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OwnerAuthGate>
      <OwnerLayout
        title="Add a Vehicle"
        subtitle="Six-step vehicle onboarding with private document vaults and transparent tariff disclosure."
      >
        {!isVerifiedOwner ? (
          <div className="border border-[#C8A97E]/40 bg-[#111114] p-8 rounded-sm max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#C8A97E]">
              <Lock className="h-4 w-4" />
              <span>Owner Verification Required First</span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#F4F1EA]">
              Only verified owners can submit vehicles.
            </h2>
            <p className="text-sm text-[#8E8E98] leading-relaxed">
              Your current owner verification status is{' '}
              <strong className="text-[#F4F1EA]">
                {profile?.verification_status || 'INCOMPLETE'}
              </strong>
              . Both our interface and backend database rules prevent unverified accounts from
              submitting or publishing vehicles.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/owner/verification">
                <Button variant="champagne">
                  <ShieldCheck className="h-4 w-4" />
                  View Verification Status
                </Button>
              </Link>
              <Link to="/owner/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { n: 1, label: '01 · Basic Info' },
                { n: 2, label: '02 · Location' },
                { n: 3, label: '03 · Documents' },
                { n: 4, label: '04 · 9+ Photos' },
                { n: 5, label: '05 · Condition' },
                { n: 6, label: '06 · Pricing' },
              ].map((s) => (
                <div
                  key={s.n}
                  className={`border px-3 py-2.5 rounded-sm text-[11px] uppercase tracking-[0.12em] ${
                    step === s.n
                      ? 'border-[#C8A97E] bg-[#C8A97E]/10 text-[#C8A97E]'
                      : step > s.n
                        ? 'border-emerald-500/40 bg-emerald-950/15 text-emerald-300'
                        : 'border-[#2A2A30] bg-[#111114] text-[#8E8E98]'
                  }`}
                >
                  {s.label}
                </div>
              ))}
            </div>

            {error && (
              <div className="border border-red-500/40 bg-red-950/20 px-4 py-3 rounded-sm text-xs text-red-200 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {statusMsg && (
              <div className="border border-emerald-500/40 bg-emerald-950/20 px-4 py-3 rounded-sm text-xs text-emerald-200">
                {statusMsg}
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <form
                onSubmit={handleStepNext}
                className="border border-[#2A2A30] bg-[#111114] p-6 sm:p-8 rounded-sm space-y-6"
              >
                <h2 className="font-display text-xl font-medium text-[#F4F1EA]">
                  Step 1 — Basic Vehicle Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Manufacturer *
                    </label>
                    <input
                      type="text"
                      required
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. Mahindra, Toyota, Hyundai"
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Model *
                    </label>
                    <input
                      type="text"
                      required
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. XUV700, Fortuner"
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Variant *
                    </label>
                    <input
                      type="text"
                      required
                      value={variant}
                      onChange={(e) => setVariant(e.target.value)}
                      placeholder="e.g. AX7L Diesel AT AWD"
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Manufacturing Year *
                    </label>
                    <input
                      type="number"
                      required
                      min={2015}
                      max={2027}
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Registration Number (Private) *
                    </label>
                    <input
                      type="text"
                      required
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                      placeholder="MH01AB1234"
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm uppercase rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Registration State *
                    </label>
                    <input
                      type="text"
                      required
                      value={regState}
                      onChange={(e) => setRegState(e.target.value)}
                      placeholder="e.g. Maharashtra"
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Fuel Type *
                    </label>
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    >
                      {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Transmission *
                    </label>
                    <select
                      value={transmission}
                      onChange={(e) => setTransmission(e.target.value)}
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    >
                      {['Automatic', 'Manual', 'Single-Speed'].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Seating Capacity *
                    </label>
                    <select
                      value={seats}
                      onChange={(e) => setSeats(Number(e.target.value))}
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    >
                      {[2, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          {s} Seats
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Vehicle Category *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    >
                      {(lookups?.categories ?? []).map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Colour *
                    </label>
                    <input
                      type="text"
                      required
                      value={colour}
                      onChange={(e) => setColour(e.target.value)}
                      placeholder="e.g. Pearl White"
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Kilometres Driven *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={kmDriven}
                      onChange={(e) => setKmDriven(Number(e.target.value))}
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Drivetrain *
                    </label>
                    <select
                      value={drivetrain}
                      onChange={(e) => setDrivetrain(e.target.value)}
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    >
                      {['FWD', 'RWD', 'AWD', '4WD', '4x4'].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Engine Capacity (where applicable)
                    </label>
                    <input
                      type="text"
                      value={engineCapacity}
                      onChange={(e) => setEngineCapacity(e.target.value)}
                      placeholder={fuelType === 'Electric' ? 'N/A (Battery EV)' : 'e.g. 1998 cc'}
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end border-t border-[#2A2A30] pt-4">
                  <Button type="submit" variant="champagne">
                    <span>Continue to Vehicle Location</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <form
                onSubmit={handleStepNext}
                className="border border-[#2A2A30] bg-[#111114] p-6 sm:p-8 rounded-sm space-y-6"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <h2 className="font-display text-xl font-medium text-[#F4F1EA]">
                    Step 2 — Vehicle Pickup Location
                  </h2>
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#C8A97E]">
                    <Lock className="h-3.5 w-3.5" />
                    Exact address stays hidden until confirmed booking
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Supported Market City *
                    </label>
                    <select
                      value={citySlug}
                      onChange={(e) => {
                        const nextSlug = e.target.value;
                        setCitySlug(nextSlug);
                        const matchLoc = lookups?.locations?.find((l: any) => l.slug === nextSlug);
                        if (matchLoc?.state) setPickupState(matchLoc.state);
                      }}
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    >
                      {(lookups?.locations ?? []).map((loc: any) => (
                        <option key={loc.slug} value={loc.slug}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={pickupState}
                      onChange={(e) => setPickupState(e.target.value)}
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pickupPin}
                      onChange={(e) => setPickupPin(e.target.value)}
                      placeholder="400050"
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Public Pickup Locality (Shown to Renters) *
                    </label>
                    <input
                      type="text"
                      required
                      value={pickupLocality}
                      onChange={(e) => setPickupLocality(e.target.value)}
                      placeholder="e.g. Bandra West / Indiranagar"
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Detailed Pickup Instructions (Private Until Booking Confirmed) *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={exactPickupInstructions}
                      onChange={(e) => setExactPickupInstructions(e.target.value)}
                      placeholder="Handover landmark, parking bay instructions, or contact gate..."
                      className="w-full bg-[#0A0A0B] border border-[#2A2A30] p-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap justify-between gap-3 border-t border-[#2A2A30] pt-4">
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back
                    </Button>
                    <Button type="button" variant="outline" disabled={saving} onClick={handleSaveDraft}>
                      <Save className="h-3.5 w-3.5" />
                      Save Draft
                    </Button>
                  </div>
                  <Button type="submit" variant="champagne" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    <span>Save Draft & Upload Documents</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 3 */}
            {step === 3 && user && vehicleId && (
              <div className="border border-[#2A2A30] bg-[#111114] p-6 sm:p-8 rounded-sm space-y-6">
                <h2 className="font-display text-xl font-medium text-[#F4F1EA]">
                  Step 3 — Mandatory & Conditional Vehicle Documents
                </h2>

                <div className="border border-amber-500/30 bg-amber-950/15 p-4 rounded-sm text-xs text-amber-200 leading-relaxed">
                  Ordinary private-car insurance policies do not automatically permit paid
                  self-drive / peer-to-peer rental use. Uploading documents puts them into{' '}
                  <strong>PENDING</strong> moderation review — it never auto-approves the vehicle.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {VEHICLE_DOC_META.map((docMeta) => {
                    const current = docs[docMeta.type];
                    return (
                      <div key={docMeta.type} className="space-y-3 border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm">
                        <PrivateFileUploadField
                          label={docMeta.label}
                          hint={docMeta.hint}
                          required={docMeta.mandatory}
                          bucket="owner-vehicle-documents"
                          ownerId={user.id}
                          folder={`vehicles/${vehicleId}/${docMeta.type}`}
                          allowedMimes={ACCEPTED_DOC_MIME_TYPES}
                          maxBytes={MAX_VEHICLE_DOC_BYTES}
                          acceptAttr=".jpg,.jpeg,.png,.webp,.pdf"
                          currentFile={current?.asset ?? null}
                          onUploaded={(asset) =>
                            handleUploadVehicleDoc(docMeta.type, docMeta.mandatory, asset)
                          }
                        />

                        {current && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                            <input
                              type="text"
                              value={current.document_number}
                              onChange={(e) =>
                                updateDocMetadataField(docMeta.type, {
                                  document_number: e.target.value,
                                })
                              }
                              placeholder="Doc number"
                              className="h-9 bg-[#111114] border border-[#2A2A30] px-2.5 rounded-sm text-[#F4F1EA]"
                            />
                            <input
                              type="date"
                              value={current.issue_date}
                              onChange={(e) =>
                                updateDocMetadataField(docMeta.type, { issue_date: e.target.value })
                              }
                              title="Issue Date"
                              className="h-9 bg-[#111114] border border-[#2A2A30] px-2 rounded-sm text-[#F4F1EA]"
                            />
                            <input
                              type="date"
                              value={current.expiry_date}
                              onChange={(e) =>
                                updateDocMetadataField(docMeta.type, {
                                  expiry_date: e.target.value,
                                })
                              }
                              title="Expiry Date"
                              className="h-9 bg-[#111114] border border-[#2A2A30] px-2 rounded-sm text-[#F4F1EA]"
                            />
                          </div>
                        )}

                        {docMeta.type === 'insurance' && current && (
                          <label className="flex items-start gap-2.5 text-[11px] text-[#E8E4DC] cursor-pointer pt-1">
                            <input
                              type="checkbox"
                              checked={current.commercial_rental_coverage_flag}
                              onChange={(e) =>
                                updateDocMetadataField('insurance', {
                                  commercial_rental_coverage_flag: e.target.checked,
                                })
                              }
                              className="mt-0.5 accent-[#C8A97E]"
                            />
                            <span>
                              Policy includes paid rental / commercial self-drive endorsement
                              (subject to manual verification).
                            </span>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap justify-between gap-3 border-t border-[#2A2A30] pt-4">
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back
                    </Button>
                    <Button type="button" variant="outline" disabled={saving} onClick={handleSaveDraft}>
                      <Save className="h-3.5 w-3.5" />
                      Save Draft
                    </Button>
                  </div>
                  <Button type="button" variant="champagne" onClick={() => handleStepNext()}>
                    <span>Continue to Vehicle Photos</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && user && vehicleId && (
              <div className="border border-[#2A2A30] bg-[#111114] p-6 sm:p-8 rounded-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-medium text-[#F4F1EA]">
                      Step 4 — Vehicle Photographs (Private Until Approved)
                    </h2>
                    <p className="text-xs text-[#8E8E98] mt-1">
                      All 9 required slots must depict the actual vehicle. Images are compressed
                      client-side and kept in private storage until Admin approval.
                    </p>
                  </div>
                  <span className="text-xs text-[#C8A97E]">
                    {
                      new Set(
                        photos
                          .map((p) => p.slot_type)
                          .filter((s) => s !== 'additional')
                      ).size
                    }{' '}
                    / 9 Mandatory Uploaded
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {MANDATORY_PHOTO_SLOTS.map((slot) => {
                    const row = photos.find((p) => p.slot_type === slot.slot);
                    return (
                      <PrivateFileUploadField
                        key={slot.slot}
                        label={slot.label}
                        hint={slot.hint}
                        required
                        bucket="owner-vehicle-photos"
                        ownerId={user.id}
                        folder={`vehicles/${vehicleId}/${slot.slot}`}
                        allowedMimes={ACCEPTED_PHOTO_MIME_TYPES}
                        maxBytes={MAX_VEHICLE_PHOTO_BYTES}
                        acceptAttr=".jpg,.jpeg,.png,.webp"
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
                        onUploaded={(asset) => handleUploadPhotoSlot(slot.slot, asset)}
                        onRemove={row ? () => handleRemovePhoto(row) : undefined}
                      />
                    );
                  })}
                </div>

                {/* Additional Photos */}
                <div className="border border-[#2A2A30] bg-[#0A0A0B] p-5 rounded-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#F4F1EA]">
                        Additional Photographs (Optional Multi-Upload)
                      </p>
                      <p className="text-xs text-[#8E8E98]">
                        Boot space, sunroof, tyres, infotainment, or existing scratch closeups.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 border border-[#2A2A30] hover:border-[#C8A97E] px-3.5 py-2 rounded-sm text-xs uppercase tracking-[0.14em] text-[#E8E4DC] cursor-pointer">
                      {uploadingExtra ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C8A97E]" />
                      ) : (
                        <Plus className="h-3.5 w-3.5 text-[#C8A97E]" />
                      )}
                      <span>Add More Photos</span>
                      <input
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(e) => handleUploadAdditionalPhotos(e.target.files)}
                      />
                    </label>
                  </div>

                  {photos.filter((p) => p.slot_type === 'additional').length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {photos
                        .filter((p) => p.slot_type === 'additional')
                        .map((p) => (
                          <div key={p.id} className="space-y-2">
                            <PrivateFilePreview
                              bucket={p.storage_bucket}
                              storagePath={p.storage_path}
                              fileName={p.file_name}
                              mimeType={p.mime_type}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(p)}
                              className="inline-flex items-center gap-1 text-[11px] text-red-300 hover:underline cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                              Remove
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <label className="flex items-start gap-3 border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm text-xs text-[#E8E4DC] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={photosConfirmed}
                    onChange={(e) => setPhotosConfirmed(e.target.checked)}
                    className="mt-0.5 accent-[#C8A97E]"
                  />
                  <span>
                    I confirm these photographs authentically represent the actual vehicle being
                    submitted for verification and have not been altered or sourced from stock
                    catalogs.
                  </span>
                </label>

                <div className="flex flex-wrap justify-between gap-3 border-t border-[#2A2A30] pt-4">
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(3)}>
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back
                    </Button>
                    <Button type="button" variant="outline" disabled={saving} onClick={handleSaveDraft}>
                      <Save className="h-3.5 w-3.5" />
                      Save Draft
                    </Button>
                  </div>
                  <Button type="button" variant="champagne" onClick={() => handleStepNext()}>
                    <span>Continue to Vehicle Condition</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 5 */}
            {step === 5 && (
              <div className="border border-[#2A2A30] bg-[#111114] p-6 sm:p-8 rounded-sm space-y-6">
                <h2 className="font-display text-xl font-medium text-[#F4F1EA]">
                  Step 5 — Vehicle Condition & Mandatory Damage Disclosure
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Overall Condition *
                    </label>
                    <select
                      value={overallCondition}
                      onChange={(e) => setOverallCondition(e.target.value)}
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    >
                      {['Excellent', 'Very Good', 'Good', 'Fair'].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Tyre Condition *
                    </label>
                    <input
                      type="text"
                      required
                      value={tyreCondition}
                      onChange={(e) => setTyreCondition(e.target.value)}
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Interior Condition *
                    </label>
                    <input
                      type="text"
                      required
                      value={interiorCondition}
                      onChange={(e) => setInteriorCondition(e.target.value)}
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 flex items-end pb-2">
                    <label className="flex items-center gap-2.5 text-sm text-[#E8E4DC] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={serviceHistoryAvail}
                        onChange={(e) => setServiceHistoryAvail(e.target.checked)}
                        className="accent-[#C8A97E]"
                      />
                      <span>Authorised service history records available</span>
                    </label>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Existing Scratches or Dents *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={existingScratches}
                      onChange={(e) => setExistingScratches(e.target.value)}
                      className="w-full bg-[#0A0A0B] border border-[#2A2A30] p-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Known Mechanical Issues *
                    </label>
                    <input
                      type="text"
                      required
                      value={knownMechanicalIssues}
                      onChange={(e) => setKnownMechanicalIssues(e.target.value)}
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Existing Modifications
                    </label>
                    <input
                      type="text"
                      value={existingModifications}
                      onChange={(e) => setExistingModifications(e.target.value)}
                      className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      Additional Remarks
                    </label>
                    <textarea
                      rows={2}
                      value={additionalRemarks}
                      onChange={(e) => setAdditionalRemarks(e.target.value)}
                      className="w-full bg-[#0A0A0B] border border-[#2A2A30] p-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm text-xs text-[#E8E4DC] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={damageConfirmed}
                    onChange={(e) => setDamageConfirmed(e.target.checked)}
                    className="mt-0.5 accent-[#C8A97E]"
                  />
                  <span>
                    I disclose all existing cosmetic scratches, dents, and mechanical notes
                    accurately so pre-trip inspections protect both myself and the driver fairly.
                  </span>
                </label>

                <div className="flex flex-wrap justify-between gap-3 border-t border-[#2A2A30] pt-4">
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(4)}>
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back
                    </Button>
                    <Button type="button" variant="outline" disabled={saving} onClick={handleSaveDraft}>
                      <Save className="h-3.5 w-3.5" />
                      Save Draft
                    </Button>
                  </div>
                  <Button type="button" variant="champagne" onClick={() => handleStepNext()}>
                    <span>Continue to Rental Pricing</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 6 */}
            {step === 6 && (
              <div className="border border-[#2A2A30] bg-[#111114] p-6 sm:p-8 rounded-sm space-y-6">
                <h2 className="font-display text-xl font-medium text-[#F4F1EA]">
                  Step 6 — Rental Pricing, Availability & Verification Submission
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-7 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                          Daily Rental Price (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          min={500}
                          max={100000}
                          value={dailyPriceINR}
                          onChange={(e) => setDailyPriceINR(Number(e.target.value))}
                          className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                        />
                        <p className="text-[11px] text-[#C8A97E]">
                          Auto Hourly Rate: {formatINR(calculateHourlyPriceInr(dailyPriceINR))} / hr
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                          Refundable Security Deposit (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={200000}
                          value={securityDepositINR}
                          onChange={(e) => setSecurityDepositINR(Number(e.target.value))}
                          className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                          Minimum Rental Duration (Days)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={minRentalDays}
                          onChange={(e) => setMinRentalDays(Number(e.target.value))}
                          className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                          Maximum Rental Duration (Days)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={90}
                          value={maxRentalDays}
                          onChange={(e) => setMaxRentalDays(Number(e.target.value))}
                          className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                        Available Days
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => {
                          const active = availableDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() =>
                                setAvailableDays((prev) =>
                                  prev.includes(day)
                                    ? prev.filter((d) => d !== day)
                                    : [...prev, day]
                                )
                              }
                              className={`px-3 py-1.5 rounded-sm text-xs transition-colors cursor-pointer ${
                                active
                                  ? 'bg-[#C8A97E] text-[#0A0A0B] font-medium'
                                  : 'border border-[#2A2A30] bg-[#0A0A0B] text-[#8E8E98]'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                        Pickup & Return Preferences
                      </label>
                      <input
                        type="text"
                        value={pickupPreferences}
                        onChange={(e) => setPickupPreferences(e.target.value)}
                        className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] px-3.5 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <CommissionCalculatorCard
                      dailyRateINR={dailyPriceINR}
                      config={commissionConfig}
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm text-xs text-[#E8E4DC] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={commissionAccepted}
                    onChange={(e) => setCommissionAccepted(e.target.checked)}
                    className="mt-0.5 accent-[#C8A97E]"
                  />
                  <span className="leading-relaxed">
                    I have reviewed the SHAREWHEELS commission, tax deductions, and estimated owner
                    payout shown above. I understand my listing will enter{' '}
                    <strong>PENDING_REVIEW</strong> and will not be published until verified by
                    SHAREWHEELS.
                  </span>
                </label>

                <div className="flex flex-wrap justify-between gap-3 border-t border-[#2A2A30] pt-4">
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(5)}>
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back
                    </Button>
                    <Button type="button" variant="outline" disabled={saving} onClick={handleSaveDraft}>
                      <Save className="h-3.5 w-3.5" />
                      Save Draft
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="champagne"
                    size="lg"
                    disabled={submitting}
                    onClick={handleSubmitForVerification}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span>SUBMIT VEHICLE FOR VERIFICATION</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </OwnerLayout>
    </OwnerAuthGate>
  );
}
