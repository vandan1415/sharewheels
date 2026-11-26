import { formatDurationUnits, formatLocaleDateTime } from '@/i18n/dynamic';

export type RentalMode = 'DAILY' | 'HOURLY';

export const PARTIAL_HOUR_ROUNDING_POLICY =
  'Partial hours are rounded up to the next full billable hour (minimum 1 hour).';

export const PARTIAL_DAY_ROUNDING_POLICY =
  'Daily rentals bill in 24-hour blocks from pickup (minimum 1 day; partial extra days round up to the next full day).';

export const HOURLY_FORMULA_LABEL = 'Hourly Price = (Daily Price / 12) × 1.5';

export function calculateHourlyPriceInr(dailyPriceInr: number): number {
  const safeDaily = Math.max(0, Math.round(dailyPriceInr));
  if (safeDaily <= 0) return 0;
  return Math.round((safeDaily / 12) * 1.5);
}

export function calculateHourlyPricePaise(dailyPricePaise: number): number {
  const dailyInr = Math.max(0, Math.round(dailyPricePaise / 100));
  return calculateHourlyPriceInr(dailyInr) * 100;
}

export interface BookingQuoteInput {
  mode: RentalMode;
  dailyPriceInr: number;
  securityDepositInr: number;
  startIso: string;
  endIso: string;
  minRentalDays?: number;
  maxRentalDays?: number;
  nowMs?: number;
}

export interface BookingQuoteResult {
  valid: boolean;
  error: string | null;
  mode: RentalMode;
  dailyRateInr: number;
  hourlyRateInr: number;
  appliedRateInr: number;
  billableUnits: number;
  exactHours: number;
  hasPartialRounding: boolean;
  rentalTotalInr: number;
  advanceAmountInr: number;
  balanceAtPickupInr: number;
  securityDepositInr: number;
  roundingNote: string;
}

export function calculateBookingQuote(input: BookingQuoteInput): BookingQuoteResult {
  const dailyRateInr = Math.max(0, Math.round(input.dailyPriceInr));
  const hourlyRateInr = calculateHourlyPriceInr(dailyRateInr);
  const securityDepositInr = Math.max(0, Math.round(input.securityDepositInr));
  const appliedRateInr = input.mode === 'HOURLY' ? hourlyRateInr : dailyRateInr;

  const startMs = new Date(input.startIso).getTime();
  const endMs = new Date(input.endIso).getTime();
  const nowMs = input.nowMs ?? Date.now();

  const fail = (error: string): BookingQuoteResult => ({
    valid: false,
    error,
    mode: input.mode,
    dailyRateInr,
    hourlyRateInr,
    appliedRateInr,
    billableUnits: 0,
    exactHours: 0,
    hasPartialRounding: false,
    rentalTotalInr: 0,
    advanceAmountInr: 0,
    balanceAtPickupInr: 0,
    securityDepositInr,
    roundingNote:
      input.mode === 'HOURLY' ? PARTIAL_HOUR_ROUNDING_POLICY : PARTIAL_DAY_ROUNDING_POLICY,
  });

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return fail('Select valid pickup and return dates and times.');
  }
  // Allow 60 seconds clock skew while blocking genuinely past pickup times
  if (startMs < nowMs - 60_000) {
    return fail('Pickup date and time cannot be in the past.');
  }
  if (endMs <= startMs) {
    return fail('Return date and time must be later than pickup date and time.');
  }

  const diffMs = endMs - startMs;
  const exactHours = Number((diffMs / 3_600_000).toFixed(2));

  if (input.mode === 'HOURLY') {
    const rawHours = diffMs / 3_600_000;
    const billableUnits = Math.max(1, Math.ceil(rawHours - 1e-6));
    if (billableUnits > 720) {
      return fail('Hourly bookings are supported up to 720 hours (30 days).');
    }
    const hasPartialRounding = Math.abs(rawHours - Math.round(rawHours)) > 0.01;
    const rentalTotalInr = hourlyRateInr * billableUnits;
    const advanceAmountInr = Math.round(rentalTotalInr * 0.5);
    return {
      valid: true,
      error: null,
      mode: 'HOURLY',
      dailyRateInr,
      hourlyRateInr,
      appliedRateInr: hourlyRateInr,
      billableUnits,
      exactHours,
      hasPartialRounding,
      rentalTotalInr,
      advanceAmountInr,
      balanceAtPickupInr: rentalTotalInr - advanceAmountInr,
      securityDepositInr,
      roundingNote: PARTIAL_HOUR_ROUNDING_POLICY,
    };
  }

  const rawDays = diffMs / 86_400_000;
  const billableUnits = Math.max(1, Math.ceil(rawDays - 1e-6));
  const minDays = Math.max(1, input.minRentalDays ?? 1);
  const maxDays = Math.min(30, Math.max(minDays, input.maxRentalDays ?? 30));

  if (billableUnits < minDays) {
    return fail(`Minimum rental duration for this vehicle is ${minDays} day${minDays > 1 ? 's' : ''}.`);
  }
  if (billableUnits > maxDays) {
    return fail(`Maximum rental duration for this vehicle is ${maxDays} days.`);
  }

  const hasPartialRounding = Math.abs(rawDays - Math.round(rawDays)) > 0.01;
  const rentalTotalInr = dailyRateInr * billableUnits;
  const advanceAmountInr = Math.round(rentalTotalInr * 0.5);

  return {
    valid: true,
    error: null,
    mode: 'DAILY',
    dailyRateInr,
    hourlyRateInr,
    appliedRateInr: dailyRateInr,
    billableUnits,
    exactHours,
    hasPartialRounding,
    rentalTotalInr,
    advanceAmountInr,
    balanceAtPickupInr: rentalTotalInr - advanceAmountInr,
    securityDepositInr,
    roundingNote: PARTIAL_DAY_ROUNDING_POLICY,
  };
}

export function formatBookingDateTime(iso: string): string {
  return formatLocaleDateTime(iso);
}

export function formatBookingDuration(mode: RentalMode, units: number): string {
  const safe = Math.max(1, Math.round(units));
  return formatDurationUnits(mode, safe);
}
