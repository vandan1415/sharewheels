import { useState } from 'react';
import { ExternalLink, Eye, FileText, Loader2, Lock } from 'lucide-react';
import { callAdminApi } from '@/lib/admin';
import { Button } from '@/components/ui/button';

export function AdminSignedDocViewer({
  bucket,
  storagePath,
  fileName,
  mimeType,
  entityType,
  entityId,
}: {
  bucket: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  entityType: string;
  entityId: string;
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSignedUrl = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await callAdminApi<{ signedUrl: string }>('get_signed_document_url', {
        bucket,
        storagePath,
        entityType,
        entityId,
        ttlSeconds: 120,
      });
      setSignedUrl(res.signedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign private document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-[#2A2A30] bg-[#0A0A0B] p-3.5 rounded-sm space-y-2.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 text-[#E8E4DC] truncate">
          <FileText className="h-3.5 w-3.5 text-[#C8A97E] shrink-0" />
          <span className="truncate">{fileName}</span>
        </span>
        {!signedUrl && (
          <Button variant="outline" size="sm" onClick={loadSignedUrl} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
            <span>Inspect (Logged)</span>
          </Button>
        )}
      </div>

      {error && <p className="text-[11px] text-red-300">{error}</p>}

      {signedUrl && (
        <div className="space-y-2">
          {mimeType.startsWith('image/') ? (
            <img
              src={signedUrl}
              alt={fileName}
              className="w-full max-h-56 object-contain bg-[#141417] border border-[#2A2A30] rounded-sm"
            />
          ) : (
            <p className="text-xs text-[#C8A97E]">PDF ready for inspection via 120s signed URL.</p>
          )}
          <div className="flex items-center justify-between text-[11px] text-[#8E8E98]">
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3 w-3 text-[#C8A97E]" />
              Access logged to audit trail · 120s TTL
            </span>
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#C8A97E] hover:underline"
            >
              Open Full File
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
