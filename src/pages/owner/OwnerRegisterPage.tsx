import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useOwnerAccount } from '@/hooks/useOwner';
import {
  ACCEPTED_DOC_MIME_TYPES,
  ACCEPTED_PHOTO_MIME_TYPES,
  ensureOwnerProfileExists,
  hashSensitiveValue,
  isValidAge,
  isValidIndianMobile,
  isValidPan,
  isValidPinCode,
  maskPan,
  MAX_KYC_FILE_BYTES,
  normalizeIndianMobile,
  normalizePan,
  type KycDocType,
} from '@/lib/owner';
import {
  PrivateFileUploadField,
  type UploadedPrivateAsset,
} from '@/components/owner/PrivateFileUpload';
import { Button } from '@/components/ui/button';

const GOV_ID_TYPES = [
  'Driving Licence',
  'Indian Passport',
  'Voter ID (EPIC)',
] as const;

export function OwnerRegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: ownerData, invalidate } = useOwnerAccount();

  const [sessionOwnerId, setSessionOwnerId] = useState<string | null>(null);
  const activeOwnerId = user?.id ?? sessionOwnerId;
  const hydratedUserIdRef = useRef<string | null>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [confirmationEmailSent, setConfirmationEmailSent] = useState(false);

  // Step 1: Account + Personal + Address
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullLegalName, setFullLegalName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pinCode, setPinCode] = useState('');

  // Step 2: Private KYC Docs
  const [govIdSubtype, setGovIdSubtype] = useState<string>(GOV_ID_TYPES[0]);
  const [docsByType, setDocsByType] = useState<Partial<Record<KycDocType, UploadedPrivateAsset>>>({});

  // Step 3: Consent
  const [consentAccepted, setConsentAccepted] = useState(false);

  // Sync email immediately from signed-in user before ownerData resolves
  useEffect(() => {
    if (user?.email) {
      setEmail((prev) => prev || user.email || '');
    }
  }, [user?.email]);

  useEffect(() => {
    if (!ownerData) return;
    const { profile, address, documents } = ownerData;
    const uid = activeOwnerId ?? profile?.id ?? null;

    if (documents.length > 0) {
      const nextMap: Partial<Record<KycDocType, UploadedPrivateAsset>> = {};
      for (const d of documents) {
        nextMap[d.document_type] = {
          storage_bucket: d.storage_bucket,
          storage_path: d.storage_path,
          file_name: d.file_name,
          mime_type: d.mime_type,
          file_size_bytes: d.file_size_bytes,
        };
        if (d.document_type === 'gov_photo_id' && d.gov_id_subtype) {
          setGovIdSubtype(d.gov_id_subtype);
        }
      }
      setDocsByType(nextMap);
    }

    // Hydrate form fields and draft_step at most once per signed-in user so invalidate() never resets step or edits
    if (uid && hydratedUserIdRef.current !== uid && (profile || address)) {
      hydratedUserIdRef.current = uid;
      if (profile) {
        if (profile.email) setEmail(profile.email);
        if (profile.full_legal_name) setFullLegalName(profile.full_legal_name);
        if (profile.mobile_number) setMobileNumber(profile.mobile_number);
        if (profile.date_of_birth) setDateOfBirth(profile.date_of_birth);
        if (profile.consent_accepted) setConsentAccepted(profile.consent_accepted);
        if (
          profile.draft_step >= 1 &&
          profile.draft_step <= 3 &&
          profile.verification_status === 'INCOMPLETE'
        ) {
          setStep(profile.draft_step as 1 | 2 | 3);
        }
      }
      if (address) {
        if (address.address_line_1) setAddressLine1(address.address_line_1);
        if (address.address_line_2) setAddressLine2(address.address_line_2);
        if (address.city) setCity(address.city);
        if (address.state) setStateName(address.state);
        if (address.pin_code) setPinCode(address.pin_code);
      }
    }
  }, [ownerData, activeOwnerId]);

  const validateStep1 = (): string | null => {
    if (fullLegalName.trim().length < 3) return 'Please enter your full legal name.';
    if (!email.trim().includes('@')) return 'Please enter a valid email address.';
    if (!activeOwnerId && password.length < 6) {
      return 'Please choose a password with at least 6 characters.';
    }
    if (!isValidIndianMobile(mobileNumber)) {
      return 'Enter a valid 10-digit Indian mobile number.';
    }
    if (!isValidAge(dateOfBirth, 18)) {
      return 'Owner must be at least 18 years old with a valid date of birth.';
    }
    const existingMaskedPan = ownerData?.profile?.pan_number_masked;
    if (!existingMaskedPan && !isValidPan(panNumber)) {
      return 'Enter a valid 10-character PAN number (e.g. ABCDE1234F).';
    }
    if (panNumber.trim() && !isValidPan(panNumber)) {
      return 'Entered PAN number format must be 5 letters, 4 digits, 1 letter.';
    }
    if (addressLine1.trim().length < 5) return 'Please enter your residential street address.';
    if (city.trim().length < 2) return 'Please enter your city.';
    if (stateName.trim().length < 2) return 'Please enter your state.';
    if (!isValidPinCode(pinCode)) return 'Enter a valid 6-digit Indian PIN code.';
    return null;
  };

  const ensureOwnerSessionAndSavePersonal = async (targetStep: 1 | 2 | 3): Promise<string | null> => {
    if (!supabase) throw new Error('Supabase client is not configured.');

    let activeUserId = user?.id ?? sessionOwnerId ?? null;

    if (!activeUserId) {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullLegalName.trim() },
        },
      });
      if (signUpErr) throw new Error(signUpErr.message);

      if (!signUpData.session || !signUpData.user) {
        setConfirmationEmailSent(true);
        return null;
      }
      activeUserId = signUpData.user.id;
      setSessionOwnerId(activeUserId);
    }

    await ensureOwnerProfileExists({
      id: activeUserId,
      email: user?.email ?? email.trim(),
      fullLegalName: fullLegalName.trim(),
    });

    const existingMasked = ownerData?.profile?.pan_number_masked ?? null;
    const existingHash = ownerData?.profile?.pan_number_hash ?? null;
    const panInputClean = normalizePan(panNumber);
    const hasNewPan = isValidPan(panInputClean);

    const { error: profileErr } = await supabase.from('owner_profiles').upsert(
      {
        id: activeUserId,
        full_legal_name: fullLegalName.trim(),
        email: (user?.email ?? email).trim(),
        mobile_number: normalizeIndianMobile(mobileNumber),
        date_of_birth: dateOfBirth || null,
        pan_number_masked: hasNewPan ? maskPan(panInputClean) : existingMasked,
        pan_number_hash: hasNewPan ? await hashSensitiveValue(panInputClean) : existingHash,
        draft_step: targetStep,
      },
      { onConflict: 'id' }
    );
    if (profileErr) throw new Error(profileErr.message);

    const { error: addrErr } = await supabase.from('owner_addresses').upsert(
      {
        owner_id: activeUserId,
        address_line_1: addressLine1.trim(),
        address_line_2: addressLine2.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pin_code: pinCode.trim(),
      },
      { onConflict: 'owner_id' }
    );
    if (addrErr) throw new Error(addrErr.message);

    hydratedUserIdRef.current = activeUserId;
    await invalidate();
    return activeUserId;
  };

  const handleSaveDraft = async (currentStep: 1 | 2 | 3) => {
    setError(null);
    setStatusMessage(null);
    if (currentStep === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
    }
    setSaving(true);
    try {
      const uid = await ensureOwnerSessionAndSavePersonal(currentStep);
      if (uid) {
        setStatusMessage('Progress saved to your private Owner Draft.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleStep1Next = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }

    setSaving(true);
    try {
      const uid = await ensureOwnerSessionAndSavePersonal(2);
      if (uid) {
        setSessionOwnerId(uid);
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to proceed.');
    } finally {
      setSaving(false);
    }
  };

  const upsertKycDocRecord = async (
    docType: KycDocType,
    asset: UploadedPrivateAsset,
    extraSubtype?: string
  ) => {
    if (!supabase || !activeOwnerId) {
      throw new Error('Owner session not active. Please sign in or save Step 1 first.');
    }

    await ensureOwnerProfileExists({
      id: activeOwnerId,
      email: user?.email ?? email,
      fullLegalName:
        fullLegalName.trim() || (user?.user_metadata?.full_name as string) || '',
    });

    const { error: docErr } = await supabase.from('owner_identity_documents').upsert(
      {
        owner_id: activeOwnerId,
        document_type: docType,
        gov_id_subtype: docType === 'gov_photo_id' ? extraSubtype ?? govIdSubtype : null,
        storage_bucket: asset.storage_bucket,
        storage_path: asset.storage_path,
        file_name: asset.file_name,
        mime_type: asset.mime_type,
        file_size_bytes: asset.file_size_bytes,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'owner_id,document_type' }
    );
    if (docErr) throw new Error(docErr.message);
    setDocsByType((prev) => ({ ...prev, [docType]: asset }));
    await invalidate();
  };

  const removeKycDocRecord = async (docType: KycDocType) => {
    if (!supabase || !activeOwnerId) return;
    const current = docsByType[docType];
    if (current) {
      await supabase.storage.from(current.storage_bucket).remove([current.storage_path]);
    }
    await supabase
      .from('owner_identity_documents')
      .delete()
      .eq('owner_id', activeOwnerId)
      .eq('document_type', docType);
    setDocsByType((prev) => {
      const copy = { ...prev };
      delete copy[docType];
      return copy;
    });
    await invalidate();
  };

  const handleStep2Next = async () => {
    setError(null);
    if (!docsByType.pan_card) {
      setError('PAN card photograph or PDF is mandatory.');
      return;
    }
    if (!docsByType.gov_photo_id) {
      setError('A government-issued photo ID is mandatory.');
      return;
    }
    if (!docsByType.live_selfie) {
      setError('A live selfie or portrait photograph is mandatory for identity matching.');
      return;
    }
    if (supabase && activeOwnerId) {
      await supabase
        .from('owner_profiles')
        .update({ draft_step: 3 })
        .eq('id', activeOwnerId);
    }
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async () => {
    setError(null);
    if (!consentAccepted) {
      setError('Please confirm your KYC consent before submitting.');
      return;
    }
    if (!docsByType.pan_card || !docsByType.gov_photo_id || !docsByType.live_selfie) {
      setError('All mandatory identity documents must be uploaded before submission.');
      return;
    }
    if (!supabase || !activeOwnerId) return;

    setSubmitting(true);
    try {
      await ensureOwnerProfileExists({
        id: activeOwnerId,
        email: user?.email ?? email,
        fullLegalName:
          fullLegalName.trim() || (user?.user_metadata?.full_name as string) || '',
      });

      const nowIso = new Date().toISOString();
      const currentStatus = ownerData?.profile?.verification_status ?? 'INCOMPLETE';

      // Step cleanly through allowed statuses into PENDING_VERIFICATION
      if (currentStatus === 'INCOMPLETE') {
        await supabase
          .from('owner_profiles')
          .update({
            consent_accepted: true,
            consent_accepted_at: nowIso,
            verification_status: 'DOCUMENTS_SUBMITTED',
          })
          .eq('id', activeOwnerId);
      }

      const { error: subErr } = await supabase
        .from('owner_profiles')
        .update({
          consent_accepted: true,
          consent_accepted_at: nowIso,
          verification_status: 'PENDING_VERIFICATION',
        })
        .eq('id', activeOwnerId);

      if (subErr) throw new Error(subErr.message);

      await supabase.from('notifications').insert({
        user_id: activeOwnerId,
        title: 'Owner Verification Submitted',
        body: 'Your KYC documents have been submitted privately and entered PENDING_VERIFICATION review.',
      });

      await invalidate();
      navigate('/owner/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit verification.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmationEmailSent) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-[#F4F1EA] flex items-center justify-center px-6">
        <div className="max-w-md w-full border border-[#C8A97E]/40 bg-[#111114] p-8 rounded-sm space-y-5 text-center">
          <CheckCircle2 className="h-8 w-8 text-[#C8A97E] mx-auto" />
          <h1 className="font-display text-2xl font-semibold">Confirm Your Email Address</h1>
          <p className="text-sm text-[#8E8E98] leading-relaxed">
            We sent a verification link to <strong className="text-[#F4F1EA]">{email}</strong>.
            Once confirmed, sign in via Owner Login to upload your private KYC documents and finish
            registration.
          </p>
          <Link to="/owner/login">
            <Button variant="champagne" className="w-full">
              Go to Owner Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F4F1EA]">
      <header className="border-b border-[#2A2A30]">
        <div className="mx-auto max-w-[1100px] h-16 px-6 flex items-center justify-between">
          <Link to="/owner" className="flex items-center gap-2.5">
            <span className="font-display text-sm sm:text-base font-semibold tracking-[0.22em]">
              SHAREWHEELS
            </span>
            <span className="border border-[#C8A97E]/40 bg-[#C8A97E]/10 px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.18em] text-[#C8A97E]">
              Owner Onboarding
            </span>
          </Link>
          <Link
            to="/owner/login"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-[#8E8E98] hover:text-[#F4F1EA]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Already Registered? Log In
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[920px] px-6 py-12 space-y-8">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#C8A97E]">
            Create Owner Account · Step {step} of 3
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.02em]">
            Owner Identity & Address Registration
          </h1>
          <p className="text-sm text-[#8E8E98]">
            Your residential address and KYC files are encrypted in private storage and never shown
            on public vehicle listings.
          </p>
        </div>

        {/* Stepper */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { n: 1, label: '01 · Personal & Address' },
            { n: 2, label: '02 · KYC Documents' },
            { n: 3, label: '03 · Review & Consent' },
          ].map((item) => (
            <div
              key={item.n}
              className={`border px-3.5 py-2.5 rounded-sm text-xs uppercase tracking-[0.12em] ${
                step === item.n
                  ? 'border-[#C8A97E] bg-[#C8A97E]/10 text-[#C8A97E]'
                  : step > item.n
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                    : 'border-[#2A2A30] bg-[#111114] text-[#8E8E98]'
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>

        {error && (
          <div className="border border-red-500/40 bg-red-950/20 px-4 py-3 rounded-sm text-xs text-red-200">
            {error}
          </div>
        )}
        {statusMessage && (
          <div className="border border-emerald-500/40 bg-emerald-950/20 px-4 py-3 rounded-sm text-xs text-emerald-200">
            {statusMessage}
          </div>
        )}

        {step === 1 && (
          <form
            onSubmit={handleStep1Next}
            noValidate
            className="space-y-6 border border-[#2A2A30] bg-[#111114] p-6 sm:p-8 rounded-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.16em] text-[#8E8E98]">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullLegalName}
                  onChange={(e) => setFullLegalName(e.target.value)}
                  placeholder="As printed on PAN card"
                  className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] focus:border-[#C8A97E] px-3.5 text-sm rounded-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.16em] text-[#8E8E98]">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  disabled={Boolean(activeOwnerId)}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] focus:border-[#C8A97E] px-3.5 text-sm rounded-sm focus:outline-none disabled:opacity-60"
                />
              </div>

              {!activeOwnerId && (
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.16em] text-[#8E8E98]">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] focus:border-[#C8A97E] px-3.5 text-sm rounded-sm focus:outline-none"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.16em] text-[#8E8E98]">
                  Mobile Number (India) *
                </label>
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="9876543210"
                  className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] focus:border-[#C8A97E] px-3.5 text-sm rounded-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.16em] text-[#8E8E98]">
                  Date of Birth (18+ Eligibility) *
                </label>
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] focus:border-[#C8A97E] px-3.5 text-sm rounded-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.16em] text-[#8E8E98]">
                  PAN Card Number *
                </label>
                <input
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder={
                    ownerData?.profile?.pan_number_masked
                      ? `Saved: ${ownerData.profile.pan_number_masked} (re-enter to change)`
                      : 'ABCDE1234F'
                  }
                  maxLength={10}
                  className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] focus:border-[#C8A97E] px-3.5 text-sm uppercase tracking-wider rounded-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-[#2A2A30] pt-6 space-y-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#C8A97E]">
                Residential Address (Kept Private)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] uppercase tracking-[0.16em] text-[#8E8E98]">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="House / Flat / Street"
                    className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] focus:border-[#C8A97E] px-3.5 text-sm rounded-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] uppercase tracking-[0.16em] text-[#8E8E98]">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Locality / Landmark"
                    className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] focus:border-[#C8A97E] px-3.5 text-sm rounded-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.16em] text-[#8E8E98]">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] focus:border-[#C8A97E] px-3.5 text-sm rounded-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.16em] text-[#8E8E98]">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] focus:border-[#C8A97E] px-3.5 text-sm rounded-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.16em] text-[#8E8E98]">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="400001"
                    className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] focus:border-[#C8A97E] px-3.5 text-sm rounded-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="border border-red-500/40 bg-red-950/20 px-4 py-3 rounded-sm text-xs text-red-200">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#2A2A30]">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => handleSaveDraft(1)}
              >
                <Save className="h-3.5 w-3.5" />
                Save Draft
              </Button>
              <Button type="submit" variant="champagne" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>Continue to KYC Uploads</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {step === 2 && activeOwnerId && (
          <div className="space-y-6 border border-[#2A2A30] bg-[#111114] p-6 sm:p-8 rounded-sm">
            <div className="flex items-start gap-3 border border-[#C8A97E]/30 bg-[#C8A97E]/5 p-4 rounded-sm text-xs text-[#E8E4DC]">
              <Lock className="h-4 w-4 text-[#C8A97E] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Documents upload strictly to private Supabase bucket{' '}
                <code className="text-[#C8A97E]">owner-kyc-documents</code> (max 5 MB, JPG / PNG /
                WebP / PDF). Aadhaar is not collected by default — upload Driving Licence, Indian
                Passport, or Voter ID for government photo identification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <PrivateFileUploadField
                label="PAN Card Photograph / PDF"
                hint="Clear image or PDF showing full PAN number, name, and DOB."
                required
                bucket="owner-kyc-documents"
                ownerId={activeOwnerId}
                folder="kyc/pan"
                allowedMimes={ACCEPTED_DOC_MIME_TYPES}
                maxBytes={MAX_KYC_FILE_BYTES}
                acceptAttr=".jpg,.jpeg,.png,.webp,.pdf"
                currentFile={docsByType.pan_card ?? null}
                onUploaded={(asset) => upsertKycDocRecord('pan_card', asset)}
                onRemove={() => removeKycDocRecord('pan_card')}
              />

              <div className="space-y-3">
                <div className="border border-[#2A2A30] bg-[#0A0A0B] p-3.5 rounded-sm space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                    Government Photo ID Type (Non-Aadhaar)
                  </label>
                  <select
                    value={govIdSubtype}
                    onChange={(e) => setGovIdSubtype(e.target.value)}
                    className="w-full h-9 bg-[#111114] border border-[#2A2A30] px-3 text-xs text-[#F4F1EA] rounded-sm focus:outline-none"
                  >
                    {GOV_ID_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <PrivateFileUploadField
                  label={`Government Photo ID (${govIdSubtype})`}
                  hint="Accepted non-Aadhaar photo ID matching your legal name."
                  required
                  bucket="owner-kyc-documents"
                  ownerId={activeOwnerId}
                  folder="kyc/gov-id"
                  allowedMimes={ACCEPTED_DOC_MIME_TYPES}
                  maxBytes={MAX_KYC_FILE_BYTES}
                  acceptAttr=".jpg,.jpeg,.png,.webp,.pdf"
                  currentFile={docsByType.gov_photo_id ?? null}
                  onUploaded={(asset) => upsertKycDocRecord('gov_photo_id', asset, govIdSubtype)}
                  onRemove={() => removeKycDocRecord('gov_photo_id')}
                />
              </div>

              <PrivateFileUploadField
                label="Live Selfie / Owner Portrait"
                hint="Clear front-facing photograph for identity matching against photo ID (JPG / PNG / WebP)."
                required
                bucket="owner-kyc-documents"
                ownerId={activeOwnerId}
                folder="kyc/selfie"
                allowedMimes={ACCEPTED_PHOTO_MIME_TYPES}
                maxBytes={MAX_KYC_FILE_BYTES}
                acceptAttr=".jpg,.jpeg,.png,.webp"
                currentFile={docsByType.live_selfie ?? null}
                onUploaded={(asset) => upsertKycDocRecord('live_selfie', asset)}
                onRemove={() => removeKycDocRecord('live_selfie')}
              />

              <PrivateFileUploadField
                label="Address Proof Document"
                hint="Utility bill, bank statement, or passport address page where current address differs from ID."
                bucket="owner-kyc-documents"
                ownerId={activeOwnerId}
                folder="kyc/address"
                allowedMimes={ACCEPTED_DOC_MIME_TYPES}
                maxBytes={MAX_KYC_FILE_BYTES}
                acceptAttr=".jpg,.jpeg,.png,.webp,.pdf"
                currentFile={docsByType.address_proof ?? null}
                onUploaded={(asset) => upsertKycDocRecord('address_proof', asset)}
                onRemove={() => removeKycDocRecord('address_proof')}
              />
            </div>

            {error && (
              <div className="border border-red-500/40 bg-red-950/20 px-4 py-3 rounded-sm text-xs text-red-200">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#2A2A30]">
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => handleSaveDraft(2)}
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Draft
                </Button>
              </div>
              <Button type="button" variant="champagne" onClick={handleStep2Next}>
                Review Application
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && activeOwnerId && (
          <div className="space-y-6 border border-[#2A2A30] bg-[#111114] p-6 sm:p-8 rounded-sm">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#C8A97E]">
              <ShieldCheck className="h-4 w-4" />
              <span>Final Review & Verification Consent</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm space-y-1">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  Legal Identity
                </p>
                <p className="font-medium text-[#F4F1EA]">{fullLegalName}</p>
                <p className="text-xs text-[#8E8E98]">
                  PAN:{' '}
                  {isValidPan(panNumber)
                    ? maskPan(panNumber)
                    : ownerData?.profile?.pan_number_masked || 'Verified format'}
                  {' · '}DOB: {dateOfBirth}
                </p>
                <p className="text-xs text-[#8E8E98]">
                  {email} · {normalizeIndianMobile(mobileNumber)}
                </p>
              </div>

              <div className="border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm space-y-1">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  Residential Address (Private)
                </p>
                <p className="text-xs text-[#E8E4DC]">
                  {addressLine1}
                  {addressLine2 ? `, ${addressLine2}` : ''}
                </p>
                <p className="text-xs text-[#8E8E98]">
                  {city}, {stateName} — {pinCode}
                </p>
              </div>
            </div>

            <div className="border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm space-y-2 text-xs text-[#E8E4DC]">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#C8A97E]">
                Uploaded Private KYC Documents ({Object.keys(docsByType).length})
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(['pan_card', 'gov_photo_id', 'live_selfie', 'address_proof'] as KycDocType[]).map(
                  (t) =>
                    docsByType[t] ? (
                      <li key={t} className="flex items-center gap-2 text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {t.replace(/_/g, ' ').toUpperCase()}: {docsByType[t]?.file_name}
                        </span>
                      </li>
                    ) : null
                )}
              </ul>
            </div>

            <label className="flex items-start gap-3 border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm text-xs text-[#E8E4DC] cursor-pointer">
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                className="mt-0.5 accent-[#C8A97E]"
              />
              <span className="leading-relaxed">
                I confirm all submitted identity details and documents are genuine, and I consent to
                SHAREWHEELS privately storing and verifying my KYC records (with audit timestamp)
                prior to enabling vehicle submissions.
              </span>
            </label>

            {error && (
              <div className="border border-red-500/40 bg-red-950/20 px-4 py-3 rounded-sm text-xs text-red-200">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#2A2A30]">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Documents
              </Button>
              <Button
                type="button"
                variant="champagne"
                disabled={submitting}
                onClick={handleFinalSubmit}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>Submit for Owner Verification</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
