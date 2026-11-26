import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Lock,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  getSignedOwnerFileUrl,
  uploadPrivateOwnerFile,
  validateUploadFile,
} from '@/lib/owner';

interface PrivateFilePreviewProps {
  bucket: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
}

export function PrivateFilePreview({
  bucket,
  storagePath,
  fileName,
  mimeType,
}: PrivateFilePreviewProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getSignedOwnerFileUrl(bucket, storagePath, 300).then((url) => {
      if (active) {
        setSignedUrl(url);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [bucket, storagePath]);

  const isImage = mimeType.startsWith('image/');

  if (loading) {
    return (
      <div className="h-24 rounded-sm border border-[#2A2A30] bg-[#0A0A0B] flex items-center justify-center text-xs text-[#8E8E98] gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C8A97E]" />
        <span>Loading secure preview...</span>
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className="p-3 rounded-sm border border-[#2A2A30] bg-[#0A0A0B] flex items-center gap-2 text-xs text-[#8E8E98]">
        <Lock className="h-3.5 w-3.5 text-[#C8A97E]" />
        <span className="truncate">{fileName} (Private bucket)</span>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-[#2A2A30] bg-[#0A0A0B] overflow-hidden">
      {isImage ? (
        <div className="aspect-[16/10] bg-[#141417] overflow-hidden">
          <img src={signedUrl} alt={fileName} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="p-4 flex items-center gap-3 text-xs text-[#E8E4DC]">
          <FileText className="h-5 w-5 text-[#C8A97E] shrink-0" />
          <span className="truncate">{fileName}</span>
        </div>
      )}
      <div className="px-3 py-2 border-t border-[#2A2A30] flex items-center justify-between gap-2 text-[11px] text-[#8E8E98]">
        <span className="inline-flex items-center gap-1 truncate">
          <Lock className="h-3 w-3 text-[#C8A97E]" />
          Signed URL (5 min)
        </span>
        <a
          href={signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#C8A97E] hover:underline shrink-0"
        >
          Open
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

export interface UploadedPrivateAsset {
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
}

interface PrivateFileUploadFieldProps {
  label: string;
  hint: string;
  required?: boolean;
  bucket: 'owner-kyc-documents' | 'owner-vehicle-documents' | 'owner-vehicle-photos';
  ownerId: string;
  folder: string;
  allowedMimes: readonly string[];
  maxBytes: number;
  acceptAttr: string;
  currentFile: UploadedPrivateAsset | null;
  disabled?: boolean;
  onUploaded: (asset: UploadedPrivateAsset) => void | Promise<void>;
  onRemove?: () => void | Promise<void>;
}

export function PrivateFileUploadField({
  label,
  hint,
  required,
  bucket,
  ownerId,
  folder,
  allowedMimes,
  maxBytes,
  acceptAttr,
  currentFile,
  disabled,
  onUploaded,
  onRemove,
}: PrivateFileUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file || disabled) return;
    setError(null);
    const valErr = validateUploadFile(file, allowedMimes, maxBytes);
    if (valErr) {
      setError(valErr);
      return;
    }

    setUploading(true);
    setProgress(25);
    try {
      const progressTimer = setInterval(() => {
        setProgress((p) => (p < 85 ? p + 15 : p));
      }, 180);

      const uploaded = await uploadPrivateOwnerFile({
        bucket,
        ownerId,
        folder,
        file,
        allowedMimes,
        maxBytes,
      });

      clearInterval(progressTimer);
      setProgress(100);
      await onUploaded(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 400);
    }
  };

  return (
    <div className="border border-[#2A2A30] bg-[#111114] p-4 rounded-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#F4F1EA]">
            {label}{' '}
            {required ? (
              <span className="text-[10px] uppercase tracking-[0.14em] text-[#C8A97E] ml-1">
                Mandatory
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98] ml-1">
                Optional / Conditional
              </span>
            )}
          </p>
          <p className="text-xs text-[#8E8E98] mt-0.5">{hint}</p>
        </div>
        {currentFile && (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Uploaded
          </span>
        )}
      </div>

      {currentFile && (
        <div className="space-y-2">
          <PrivateFilePreview
            bucket={currentFile.storage_bucket}
            storagePath={currentFile.storage_path}
            fileName={currentFile.file_name}
            mimeType={currentFile.mime_type}
          />
          {onRemove && !disabled && (
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-red-300 hover:underline cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          )}
        </div>
      )}

      {uploading && (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full bg-[#1A1A1F] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C8A97E] transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-[#C8A97E]">
            Validating, optimising & encrypting upload to private storage...
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-300 border border-red-500/40 bg-red-950/20 px-3 py-2 rounded-sm">
          {error}
        </p>
      )}

      {!disabled && (
        <label className="inline-flex items-center gap-2 border border-[#2A2A30] bg-[#0A0A0B] hover:border-[#C8A97E] px-3.5 py-2 rounded-sm text-xs uppercase tracking-[0.14em] text-[#E8E4DC] cursor-pointer transition-colors">
          <Upload className="h-3.5 w-3.5 text-[#C8A97E]" />
          <span>{currentFile ? 'Replace File' : 'Select File'}</span>
          <input
            type="file"
            accept={acceptAttr}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              handleFile(f);
            }}
          />
        </label>
      )}
    </div>
  );
}
