import { supabase } from '@/lib/supabase';

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface CreateRazorpayOrderResponse {
  ok: boolean;
  bookingId: string;
  orderId: string;
  amountPaise: number;
  rentalTotalPaise: number;
  balanceDuePaise: number;
  rentalMode: 'DAILY' | 'HOURLY';
  billableUnits: number;
  appliedRatePaise: number;
  startAt: string;
  endAt: string;
  currency: string;
  keyId: string;
  vehicleName: string;
}

export interface VerifyRazorpayPaymentResponse {
  ok: boolean;
  bookingId: string;
  status: string;
  paymentStatus: string;
  razorpayPaymentId: string;
  advancePaidPaise: number;
  balanceDuePaise: number;
  ownerNotified: boolean;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on?: (event: string, handler: (resp: Record<string, any>) => void) => void;
    };
  }
}

let scriptPromise: Promise<boolean> | null = null;

export function loadRazorpayCheckoutScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => {
      scriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export async function callRazorpayCheckoutApi<T = Record<string, unknown>>(
  action: 'create_order' | 'verify_payment' | 'cancel_unpaid',
  payload: Record<string, unknown>
): Promise<T> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new Error('Please sign in with your Customer account before paying.');
  }

  const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const pubKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

  const res = await fetch(`${baseUrl}/functions/v1/razorpay-booking-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: pubKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `Payment service error (${res.status})`);
  }
  return data as T;
}
