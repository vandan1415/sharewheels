import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useOwnerAccount, useOwnerVehicles } from '@/hooks/useOwner';
import {
  ACCEPTED_DOC_MIME_TYPES,
  ACCEPTED_PHOTO_MIME_TYPES,
  ensureOwnerProfileExists,
  MAX_KYC_FILE_BYTES,
  OWNER_STATUS_META,
  type KycDocType,
} from '@/lib/owner';
import { OwnerAuthGate } from '@/components/owner/OwnerAuthGate';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { OnboardingProgressTracker } from '@/components/owner/OnboardingProgressTracker';
import {
  PrivateFileUploadField,
  type UploadedPrivateAsset,
} from '@/components/owner/PrivateFileUpload';
import { Button } from '@/components/ui/button';

const DOC_SLOTS: {
  type: KycDocType;
  label: string;
  hint: string;
  required: boolean;
  isPhotoOnly?: boolean;
}[] = [
  {
    type: 'pan_card',
    label: 'PAN Card Document',
    hint: 'Clear PAN image or PDF matching your legal name.',
    required: true,
  },
  {
    type: 'gov_photo_id',
    label: 'Government Photo ID',
    hint: 'Driving Licence, Indian Passport, or Voter ID (non-Aadhaar).',
    required: true,
  },
  {
    type: 'live_selfie',
    label: 'Live Owner Selfie',
    hint: 'Front-facing photograph for identity matching.',
    required: true,
    isPhotoOnly: true,
  },
  {
    type: 'address_proof',
    label: 'Address Proof',
    hint: 'Required where current residential address differs from photo ID.',
    required: false,
  },
];

export function OwnerVerificationPage() {
  const { user } = useAuth();
  const { data: ownerData, invalidate } = useOwnerAccount();
  const { data: vehicles = [] } = useOwnerVehicles();

  const [resubmitting, setResubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const profile = ownerData?.profile ?? null;
  const documents = ownerData?.documents ?? [];
  const status = profile?.verification_status ?? 'INCOMPLETE';
  const meta = OWNER_STATUS_META[status];

  const docMap = new Map(documents.map((d) => [d.document_type, d]));
  const canReplaceDocs =
    status === 'INCOMPLETE' ||
    status === 'DOCUMENTS_SUBMITTED' ||
    status === 'REJECTED' ||
    status === 'RESUBMISSION_REQUIRED';

  const handleUploadUpdate = async (docType: KycDocType, asset: UploadedPrivateAsset) => {
    if (!supabase || !user?.id) {
      throw new Error('Owner session is not active. Please sign in again.');
    }
    setError(null);
    setMessage(null);
    try {
      await ensureOwnerProfileExists({
        id: user.id,
        email: user.email,
        fullLegalName:
          profile?.full_legal_name || (user.user_metadata?.full_name as string) || '',
      });

      const { error: upErr } = await supabase.from('owner_identity_documents').upsert(
        {
          owner_id: user.id,
          document_type: docType,
          storage_bucket: asset.storage_bucket,
          storage_path: asset.storage_path,
          file_name: asset.file_name,
          mime_type: asset.mime_type,
          file_size_bytes: asset.file_size_bytes,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: 'owner_id,document_type' }
      );
      if (upErr) {
        throw new Error(upErr.message);
      }
      setMessage(`${docType.replace(/_/g, ' ').toUpperCase()} uploaded to private storage.`);
      await invalidate();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to save document record.';
      setError(msg);
      throw err instanceof Error ? err : new Error(msg);
    }
  };

  const handleResubmitVerification = async () => {
    if (!supabase || !user?.id) return;
    setError(null);
    setMessage(null);
    if (!docMap.get('pan_card') || !docMap.get('gov_photo_id') || !docMap.get('live_selfie')) {
      setError('Mandatory documents (PAN, Government Photo ID, and Live Selfie) must be uploaded.');
      return;
    }
    setResubmitting(true);
    try {
      await ensureOwnerProfileExists({
        id: user.id,
        email: user.email,
        fullLegalName:
          profile?.full_legal_name || (user.user_metadata?.full_name as string) || '',
      });

      const { error: updErr } = await supabase
        .from('owner_profiles')
        .update({
          consent_accepted: true,
          consent_accepted_at: profile?.consent_accepted_at ?? new Date().toISOString(),
          verification_status: 'PENDING_VERIFICATION',
        })
        .eq('id', user.id);

      if (updErr) throw new Error(updErr.message);
      setMessage('Updated KYC application submitted cleanly into PENDING_VERIFICATION.');
      await invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resubmission failed.');
    } finally {
      setResubmitting(false);
    }
  };

  return (
    <OwnerAuthGate>
      <OwnerLayout
        title="Owner Identity Verification"
        subtitle="Track KYC review progress and manage encrypted identity documents."
        action={
          status === 'VERIFIED' ? (
            <Link to="/owner/vehicles/add">
              <Button variant="champagne">
                Add a Vehicle
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : null
        }
      >
        <div className="border border-[#2A2A30] bg-[#111114] p-6 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 border px-2.5 py-1 rounded-sm text-xs uppercase tracking-[0.14em] ${meta.badgeClass}`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {meta.label}
              </span>
              {profile?.pan_number_masked && (
                <span className="text-xs text-[#8E8E98]">
                  PAN: <strong className="text-[#E8E4DC]">{profile.pan_number_masked}</strong>
                </span>
              )}
            </div>
            <p className="text-sm text-[#E8E4DC]">{meta.summary}</p>
            {profile?.rejection_reason && (
              <p className="flex items-center gap-2 text-xs text-red-300 pt-1">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Review note: {profile.rejection_reason}
              </p>
            )}
          </div>

          {canReplaceDocs && (
            <Button
              variant="champagne"
              disabled={resubmitting}
              onClick={handleResubmitVerification}
            >
              {resubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>
                {status === 'REJECTED' || status === 'RESUBMISSION_REQUIRED'
                  ? 'Resubmit for Verification'
                  : 'Submit for Verification'}
              </span>
            </Button>
          )}
        </div>

        <OnboardingProgressTracker
          profile={profile}
          documents={documents}
          vehicles={vehicles}
        />

        {error && (
          <div className="border border-red-500/40 bg-red-950/20 px-4 py-3 rounded-sm text-xs text-red-200">
            {error}
          </div>
        )}
        {message && (
          <div className="border border-emerald-500/40 bg-emerald-950/20 px-4 py-3 rounded-sm text-xs text-emerald-200">
            {message}
          </div>
        )}

        {user && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-medium text-[#F4F1EA]">
                Submitted Identity Documents
              </h2>
              <span className="text-xs text-[#8E8E98]">
                Served strictly over short-lived signed URLs
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {DOC_SLOTS.map((slot) => {
                const row = docMap.get(slot.type);
                return (
                  <div key={slot.type} className="space-y-2">
                    <PrivateFileUploadField
                      label={slot.label}
                      hint={slot.hint}
                      required={slot.required}
                      bucket="owner-kyc-documents"
                      ownerId={user.id}
                      folder={`kyc/${slot.type}`}
                      allowedMimes={
                        slot.isPhotoOnly ? ACCEPTED_PHOTO_MIME_TYPES : ACCEPTED_DOC_MIME_TYPES
                      }
                      maxBytes={MAX_KYC_FILE_BYTES}
                      acceptAttr={
                        slot.isPhotoOnly
                          ? '.jpg,.jpeg,.png,.webp'
                          : '.jpg,.jpeg,.png,.webp,.pdf'
                      }
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
                      disabled={!canReplaceDocs}
                      onUploaded={(asset) => handleUploadUpdate(slot.type, asset)}
                    />
                    {row && (
                      <div className="flex items-center justify-between px-1 text-[11px] text-[#8E8E98]">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-[#C8A97E]" />
                          Review status:{' '}
                          <strong className="text-[#E8E4DC]">{row.review_status}</strong>
                        </span>
                        {row.rejection_reason && (
                          <span className="text-red-300">{row.rejection_reason}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </OwnerLayout>
    </OwnerAuthGate>
  );
}
