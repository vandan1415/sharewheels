import { supabase } from '@/lib/supabase';

export type OwnerVerificationStatus =
  | 'INCOMPLETE'
  | 'DOCUMENTS_SUBMITTED'
  | 'PENDING_VERIFICATION'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'RESUBMISSION_REQUIRED'
  | 'SUSPENDED';

export type VehicleListingStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESUBMISSION_REQUIRED'
  | 'SUSPENDED';

export type DocumentReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export type KycDocType = 'pan_card' | 'gov_photo_id' | 'live_selfie' | 'address_proof';
export type VehicleDocType = 'rc' | 'insurance' | 'puc' | 'permit' | 'fitness' | 'additional';
export type VehiclePhotoSlot =
  | 'front'
  | 'rear'
  | 'left_side'
  | 'right_side'
  | 'dashboard'
  | 'front_seats'
  | 'rear_seats'
  | 'odometer'
  | 'registration_plate'
  | 'additional';

export interface CommissionConfig {
  id: string;
  config_key: string;
  commission_bps: number;
  gst_on_commission_bps: number;
  tds_bps: number;
  min_daily_rate_paise: number;
  max_daily_rate_paise: number;
  notes: string | null;
}

export interface OwnerProfile {
  id: string;
  full_legal_name: string;
  email: string;
  mobile_number: string;
  date_of_birth: string | null;
  pan_number_masked: string | null;
  pan_number_hash: string | null;
  verification_status: OwnerVerificationStatus;
  consent_accepted: boolean;
  consent_accepted_at: string | null;
  documents_submitted_at: string | null;
  rejection_reason: string | null;
  resubmission_notes: string | null;
  draft_step: number;
  created_at: string;
  updated_at: string;
}

export interface OwnerAddress {
  id: string;
  owner_id: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  pin_code: string;
}

export interface OwnerIdentityDoc {
  id: string;
  owner_id: string;
  document_type: KycDocType;
  gov_id_subtype: string | null;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  review_status: DocumentReviewStatus;
  rejection_reason: string | null;
  submitted_at: string;
}

export interface VehicleSubmission {
  id: string;
  vehicle_id: string;
  owner_id: string;
  registration_number: string;
  registration_state: string;
  pickup_city: string;
  pickup_state: string;
  pickup_pin_code: string;
  pickup_locality: string;
  exact_pickup_instructions: string;
  overall_condition: string;
  existing_scratches_dents: string;
  tyre_condition: string;
  interior_condition: string;
  service_history_available: boolean;
  known_mechanical_issues: string;
  existing_modifications: string;
  additional_remarks: string;
  damage_disclosure_confirmed: boolean;
  photos_authenticity_confirmed: boolean;
  commission_bps_snapshot: number | null;
  commission_disclosed_accepted: boolean;
  submission_status: VehicleListingStatus;
  draft_step: number;
  submitted_at: string | null;
  rejection_reason: string | null;
}

export interface VehicleDocRow {
  id: string;
  vehicle_id: string;
  owner_id: string;
  document_type: VehicleDocType;
  is_mandatory: boolean;
  document_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  commercial_rental_coverage_flag: boolean;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  review_status: DocumentReviewStatus;
  rejection_reason: string | null;
  submitted_at: string;
}

export interface VehiclePhotoRow {
  id: string;
  vehicle_id: string;
  owner_id: string;
  slot_type: VehiclePhotoSlot;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  sort_order: number;
}

export interface OwnerVehicleRow {
  id: string;
  slug: string;
  name: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  location: string;
  city_slug: string | null;
  location_id: string | null;
  category_id: string;
  price_per_day_paise: number;
  security_deposit_paise: number;
  transmission: string;
  fuel_type: string;
  seats: number;
  drivetrain: string;
  colour: string | null;
  kilometres_driven: number | null;
  engine_capacity: string | null;
  pickup_area: string | null;
  min_rental_days: number;
  max_rental_days: number;
  available_days: string[];
  pickup_preferences: string | null;
  available: boolean;
  is_paused: boolean;
  listing_status: VehicleListingStatus;
  submitted_at: string | null;
  rejection_reason: string | null;
  description: string;
  created_at: string;
  vehicle_categories?: { id?: string; name: string; slug: string } | null;
  vehicle_submissions?: VehicleSubmission[] | VehicleSubmission | null;
  vehicle_documents?: VehicleDocRow[];
  vehicle_submission_photos?: VehiclePhotoRow[];
}

export interface OwnerBookingRow {
  id: string;
  vehicle_id: string;
  customer_id: string;
  start_at: string;
  end_at: string;
  rental_mode?: 'DAILY' | 'HOURLY';
  billable_units?: number;
  applied_rate_paise?: number;
  status: 'pending' | 'accepted' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'expired';
  rental_total_paise: number;
  deposit_paise: number;
  advance_paid_paise?: number;
  balance_due_paise?: number;
  razorpay_payment_id?: string | null;
  razorpay_verified_at?: string | null;
  payment_status: string;
  created_at: string;
  vehicles?: { id: string; slug: string; name: string; location: string } | null;
}

export interface OwnerPayoutRow {
  id: string;
  owner_id: string;
  booking_id: string;
  vehicle_id: string;
  gross_rental_paise: number;
  commission_bps: number;
  commission_paise: number;
  tax_deduction_paise: number;
  net_payout_paise: number;
  payout_status: string;
  created_at: string;
  vehicles?: { name: string; slug: string } | null;
}

export const ACCEPTED_DOC_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export const ACCEPTED_PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_KYC_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_VEHICLE_DOC_BYTES = 10 * 1024 * 1024;
export const MAX_VEHICLE_PHOTO_BYTES = 8 * 1024 * 1024;

export function normalizePan(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

export function isValidPan(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(normalizePan(pan));
}

export function maskPan(pan: string): string {
  const clean = normalizePan(pan);
  if (clean.length !== 10) return '**********';
  return `${clean.slice(0, 5)}****${clean.slice(9)}`;
}

export async function ensureOwnerProfileExists(params: {
  id: string;
  email?: string | null;
  fullLegalName?: string | null;
}): Promise<void> {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const { error: roleErr } = await supabase
    .from('user_roles')
    .upsert(
      { user_id: params.id, role: 'owner' },
      { onConflict: 'user_id,role', ignoreDuplicates: true }
    );
  // Non-fatal if role row is already present or constrained differently
  if (roleErr && !roleErr.message.toLowerCase().includes('duplicate')) {
    console.warn('[ensureOwnerProfileExists] user_roles upsert note:', roleErr.message);
  }

  const { error: profileErr } = await supabase
    .from('owner_profiles')
    .upsert(
      {
        id: params.id,
        email: (params.email ?? '').trim(),
        full_legal_name: (params.fullLegalName ?? '').trim(),
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );

  if (profileErr) {
    throw new Error(profileErr.message);
  }
}

function deterministicHexFallback(input: string): string {
  // 4 independent 32-bit FNV-1a/Murmur-inspired accumulators -> 64 hex chars when crypto.subtle is unavailable (e.g. non-HTTPS LAN)
  const seeds = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35];
  const bytes = new TextEncoder().encode(input);
  for (let s = 0; s < seeds.length; s += 1) {
    let h = seeds[s];
    for (let i = 0; i < bytes.length; i += 1) {
      h ^= bytes[i] ^ (s * 31 + i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    seeds[s] = h >>> 0;
  }
  const expanded = seeds.concat(
    seeds.map((v, idx) => Math.imul(v ^ 0x27d4eb2d, 0x165667b1 + idx) >>> 0)
  );
  return expanded.map((n) => n.toString(16).padStart(8, '0')).join('');
}

export async function hashSensitiveValue(value: string): Promise<string> {
  const normalized = normalizePan(value);
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return deterministicHexFallback(normalized);
  }
  const data = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function isValidIndianMobile(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  const tenDigit = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return /^[6-9][0-9]{9}$/.test(tenDigit);
}

export function normalizeIndianMobile(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const tenDigit = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return `+91 ${tenDigit}`;
}

export function isValidPinCode(raw: string): boolean {
  return /^[1-9][0-9]{5}$/.test(raw.trim());
}

export function isValidAge(dobIso: string, minAge = 18): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dobIso)) return false;
  const dob = new Date(`${dobIso}T00:00:00Z`);
  if (Number.isNaN(dob.getTime())) return false;
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const mDiff = now.getUTCMonth() - dob.getUTCMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }
  return age >= minAge && age <= 100;
}

export function normalizeRegNumber(raw: string): string {
  return raw.replace(/[\s-]+/g, '').toUpperCase();
}

export function isValidIndianRegNumber(raw: string): boolean {
  const clean = normalizeRegNumber(raw);
  return /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{3,4}$/.test(clean);
}

export interface CommissionBreakdown {
  dailyRateINR: number;
  commissionPercent: number;
  commissionINR: number;
  gstOnCommissionPercent: number;
  gstOnCommissionINR: number;
  tdsPercent: number;
  tdsINR: number;
  totalDeductionsINR: number;
  estimatedOwnerPayoutINR: number;
}

export function calculateCommissionBreakdown(
  dailyRateINR: number,
  config: CommissionConfig
): CommissionBreakdown {
  const safeRate = Math.max(0, Math.round(dailyRateINR));
  const commissionPercent = config.commission_bps / 100;
  const gstOnCommissionPercent = config.gst_on_commission_bps / 100;
  const tdsPercent = config.tds_bps / 100;

  const commissionINR = Math.round((safeRate * config.commission_bps) / 10000);
  const gstOnCommissionINR = Math.round(
    (commissionINR * config.gst_on_commission_bps) / 10000
  );
  const tdsINR = Math.round((safeRate * config.tds_bps) / 10000);
  const totalDeductionsINR = commissionINR + gstOnCommissionINR + tdsINR;
  const estimatedOwnerPayoutINR = Math.max(0, safeRate - totalDeductionsINR);

  return {
    dailyRateINR: safeRate,
    commissionPercent,
    commissionINR,
    gstOnCommissionPercent,
    gstOnCommissionINR,
    tdsPercent,
    tdsINR,
    totalDeductionsINR,
    estimatedOwnerPayoutINR,
  };
}

export function validateUploadFile(
  file: File,
  allowedMimes: readonly string[],
  maxBytes: number
): string | null {
  if (!file || file.size <= 0) {
    return 'Selected file is empty.';
  }
  const mime = (file.type || '').toLowerCase();
  if (!allowedMimes.includes(mime)) {
    return `Unsupported file format (${mime || 'unknown'}). Allowed: ${allowedMimes
      .map((m) => m.split('/')[1].toUpperCase())
      .join(', ')}.`;
  }
  if (file.size > maxBytes) {
    return `File exceeds ${(maxBytes / (1024 * 1024)).toFixed(0)} MB limit.`;
  }
  return null;
}

export async function compressImageIfNeeded(
  file: File,
  maxWidth = 1600,
  quality = 0.82
): Promise<File> {
  const mime = file.type.toLowerCase();
  if (mime === 'application/pdf' || !mime.startsWith('image/')) {
    return file;
  }
  if (file.size <= 250 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const targetW = Math.max(1, Math.round(img.width * scale));
      const targetH = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, targetW, targetH);
      const outMime = mime === 'image/png' ? 'image/webp' : mime;
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const ext = outMime === 'image/webp' ? 'webp' : 'jpg';
          const baseName = file.name.replace(/\.[^.]+$/, '');
          resolve(new File([blob], `${baseName}.${ext}`, { type: outMime }));
        },
        outMime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

export async function uploadPrivateOwnerFile(params: {
  bucket: 'owner-kyc-documents' | 'owner-vehicle-documents' | 'owner-vehicle-photos';
  ownerId: string;
  folder: string;
  file: File;
  allowedMimes: readonly string[];
  maxBytes: number;
  compressImages?: boolean;
}) {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const validationError = validateUploadFile(
    params.file,
    params.allowedMimes,
    params.maxBytes
  );
  if (validationError) throw new Error(validationError);

  const preparedFile =
    params.compressImages !== false ? await compressImageIfNeeded(params.file) : params.file;

  const postCompressError = validateUploadFile(
    preparedFile,
    params.allowedMimes,
    params.maxBytes
  );
  if (postCompressError) throw new Error(postCompressError);

  const ext = preparedFile.name.split('.').pop()?.toLowerCase() || 'bin';
  const safeFolder = params.folder.replace(/[^a-z0-9/_-]/gi, '');
  const storagePath = `${params.ownerId}/${safeFolder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(params.bucket)
    .upload(storagePath, preparedFile, {
      contentType: preparedFile.type,
      upsert: false,
    });

  if (error) throw new Error(error.message);

  return {
    storage_bucket: params.bucket,
    storage_path: storagePath,
    file_name: preparedFile.name,
    mime_type: preparedFile.type,
    file_size_bytes: preparedFile.size,
  };
}

export async function getSignedOwnerFileUrl(
  bucket: string,
  storagePath: string,
  ttlSeconds = 300
): Promise<string | null> {
  if (!supabase || !storagePath) return null;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, ttlSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export const OWNER_STATUS_META: Record<
  OwnerVerificationStatus,
  { label: string; badgeClass: string; summary: string }
> = {
  INCOMPLETE: {
    label: 'Incomplete',
    badgeClass: 'border-[#2A2A30] bg-[#1A1A1F] text-[#8E8E98]',
    summary: 'Complete your personal details and identity documents to request verification.',
  },
  DOCUMENTS_SUBMITTED: {
    label: 'Documents Submitted',
    badgeClass: 'border-[#C8A97E]/40 bg-[#C8A97E]/10 text-[#C8A97E]',
    summary: 'Identity documents received. Submit your verification application for review.',
  },
  PENDING_VERIFICATION: {
    label: 'Pending Verification',
    badgeClass: 'border-[#C8A97E]/50 bg-[#C8A97E]/10 text-[#C8A97E]',
    summary: 'Your owner profile is being reviewed.',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    badgeClass: 'border-[#C8A97E]/60 bg-[#C8A97E]/15 text-[#C8A97E]',
    summary: 'Your owner profile is being reviewed.',
  },
  VERIFIED: {
    label: 'Verified Owner',
    badgeClass: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300',
    summary: 'Your identity is verified. You can submit and manage vehicles on SHAREWHEELS.',
  },
  REJECTED: {
    label: 'Rejected',
    badgeClass: 'border-red-500/40 bg-red-950/30 text-red-300',
    summary: 'Verification did not pass. Review the reason below and submit corrected documents.',
  },
  RESUBMISSION_REQUIRED: {
    label: 'Resubmission Required',
    badgeClass: 'border-amber-500/40 bg-amber-950/30 text-amber-300',
    summary: 'Updated or clearer identity documents are required before verification can complete.',
  },
  SUSPENDED: {
    label: 'Suspended',
    badgeClass: 'border-red-500/40 bg-red-950/40 text-red-300',
    summary: 'This owner account is currently suspended. Contact SHAREWHEELS support.',
  },
};

export const VEHICLE_STATUS_META: Record<
  VehicleListingStatus,
  { label: string; badgeClass: string }
> = {
  DRAFT: {
    label: 'Draft',
    badgeClass: 'border-[#2A2A30] bg-[#1A1A1F] text-[#8E8E98]',
  },
  PENDING_REVIEW: {
    label: 'Pending Review',
    badgeClass: 'border-[#C8A97E]/50 bg-[#C8A97E]/10 text-[#C8A97E]',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    badgeClass: 'border-[#C8A97E]/60 bg-[#C8A97E]/15 text-[#C8A97E]',
  },
  APPROVED: {
    label: 'Approved',
    badgeClass: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300',
  },
  REJECTED: {
    label: 'Rejected',
    badgeClass: 'border-red-500/40 bg-red-950/30 text-red-300',
  },
  RESUBMISSION_REQUIRED: {
    label: 'Resubmission Required',
    badgeClass: 'border-amber-500/40 bg-amber-950/30 text-amber-300',
  },
  SUSPENDED: {
    label: 'Suspended',
    badgeClass: 'border-red-500/40 bg-red-950/40 text-red-300',
  },
};

export interface OnboardingMilestone {
  step: number;
  label: string;
  status: 'completed' | 'current' | 'upcoming' | 'action_needed';
}

export function computeOnboardingMilestones(
  profile: OwnerProfile | null,
  kycDocs: OwnerIdentityDoc[],
  vehicles: OwnerVehicleRow[]
): OnboardingMilestone[] {
  const hasAccount = Boolean(profile);
  const hasMandatoryDocs =
    kycDocs.some((d) => d.document_type === 'pan_card') &&
    kycDocs.some((d) => d.document_type === 'gov_photo_id') &&
    kycDocs.some((d) => d.document_type === 'live_selfie');
  const ownerStatus = profile?.verification_status ?? 'INCOMPLETE';
  const isOwnerVerified = ownerStatus === 'VERIFIED';
  const ownerNeedsAction =
    ownerStatus === 'REJECTED' || ownerStatus === 'RESUBMISSION_REQUIRED';

  const submittedVehicles = vehicles.filter((v) => v.listing_status !== 'DRAFT');
  const hasVehicleSubmitted = submittedVehicles.length > 0;
  const hasApprovedVehicle = vehicles.some((v) => v.listing_status === 'APPROVED');
  const hasLiveListing = vehicles.some(
    (v) => v.listing_status === 'APPROVED' && v.available && !v.is_paused
  );
  const vehicleNeedsAction = submittedVehicles.some(
    (v) => v.listing_status === 'REJECTED' || v.listing_status === 'RESUBMISSION_REQUIRED'
  );

  return [
    {
      step: 1,
      label: 'Account created',
      status: hasAccount ? 'completed' : 'current',
    },
    {
      step: 2,
      label: 'Identity documents submitted',
      status:
        hasMandatoryDocs && ownerStatus !== 'INCOMPLETE'
          ? 'completed'
          : hasAccount
            ? 'current'
            : 'upcoming',
    },
    {
      step: 3,
      label: 'Owner verification',
      status: isOwnerVerified
        ? 'completed'
        : ownerNeedsAction
          ? 'action_needed'
          : ownerStatus === 'PENDING_VERIFICATION' || ownerStatus === 'UNDER_REVIEW'
            ? 'current'
            : 'upcoming',
    },
    {
      step: 4,
      label: 'Vehicle submission',
      status: hasVehicleSubmitted
        ? 'completed'
        : isOwnerVerified
          ? 'current'
          : 'upcoming',
    },
    {
      step: 5,
      label: 'Vehicle verification',
      status: hasApprovedVehicle
        ? 'completed'
        : vehicleNeedsAction
          ? 'action_needed'
          : hasVehicleSubmitted
            ? 'current'
            : 'upcoming',
    },
    {
      step: 6,
      label: 'Listing published',
      status: hasLiveListing ? 'completed' : hasApprovedVehicle ? 'current' : 'upcoming',
    },
  ];
}
