import { supabase } from '@/lib/supabase';

export interface AdminSessionInfo {
  ok: boolean;
  userId: string;
  phone: string | null;
  role: 'super_admin' | 'admin';
  isSuperAdmin: boolean;
}

export async function callAdminApi<T = Record<string, unknown>>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
  const { data: sessData } = await supabase.auth.getSession();
  const accessToken = sessData.session?.access_token;
  if (!accessToken) {
    throw new Error('Not authenticated. Please sign in to the Admin Portal first.');
  }

  const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const pubKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

  const res = await fetch(`${baseUrl}/functions/v1/admin-portal-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: pubKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || body.error || `Admin API error (${res.status})`);
  }
  return body as T;
}

export function normalizePhoneForOtpInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  return `+${digits}`;
}

export function adminPhoneToAuthEmail(normalizedE164: string): string {
  const digits = normalizedE164.replace(/\D/g, '');
  const core = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
  return `admin.${core}@sharewheels.in`;
}

export function adminAuthPassword(normalizedE164: string, rawPassword: string): string {
  return `${normalizedE164}:${rawPassword}`;
}

export const INCIDENT_TYPE_LABELS: Record<string, string> = {
  theft_report: 'Theft Report',
  overdue_return: 'Overdue Return',
  damage_dispute: 'Damage Dispute',
  fraud_report: 'Fraud Report',
  unauthorised_driver: 'Unauthorised Driver',
  customer_complaint: 'Customer Complaint',
};

export const INCIDENT_STATUS_COLORS: Record<string, string> = {
  open: 'border-red-500/40 bg-red-950/30 text-red-300',
  investigating: 'border-[#C8A97E]/50 bg-[#C8A97E]/15 text-[#C8A97E]',
  awaiting_evidence: 'border-amber-500/40 bg-amber-950/30 text-amber-300',
  escalated: 'border-red-500/60 bg-red-950/50 text-red-200',
  resolved: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300',
  closed: 'border-[#2A2A30] bg-[#1A1A1F] text-[#8E8E98]',
};
