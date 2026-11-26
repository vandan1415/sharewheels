import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck2,
  Loader2,
  MapPin,
  Route,
  ShieldCheck,
} from 'lucide-react';
import { useVehicleBySlug } from '@/hooks/useVehicles';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/lib/utils';
import {
  calculateBookingQuote,
  calculateHourlyPriceInr,
  formatBookingDateTime,
  formatBookingDuration,
  type RentalMode,
} from '@/lib/pricing';
import {
  callRazorpayCheckoutApi,
  loadRazorpayCheckoutScript,
  type CreateRazorpayOrderResponse,
  type RazorpaySuccessResponse,
  type VerifyRazorpayPaymentResponse,
} from '@/lib/razorpay';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VehicleImage } from '@/components/ui/VehicleImage';

function toLocalDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function VehicleDetailsPage() {
  const { id } = useParams();
  const { data: vehicle, isLoading } = useVehicleBySlug(id);
  const { user } = useAuth();

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [rentalMode, setRentalMode] = useState<RentalMode>('DAILY');
  const [pickupDate, setPickupDate] = useState(() =>
    toLocalDateStr(new Date(Date.now() + 86400_000 * 2))
  );
  const [pickupTime, setPickupTime] = useState('10:00');
  const [returnDate, setReturnDate] = useState(() =>
    toLocalDateStr(new Date(Date.now() + 86400_000 * 5))
  );
  const [returnTime, setReturnTime] = useState('10:00');
  const [agreed, setAgreed] = useState(false);
  const [bookingStep, setBookingStep] = useState<'form' | 'payment' | 'confirmed'>('form');
  const [verifiedBooking, setVerifiedBooking] = useState<VerifyRazorpayPaymentResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startIso = useMemo(() => {
    const dt = new Date(`${pickupDate}T${pickupTime || '10:00'}:00`);
    return Number.isNaN(dt.getTime()) ? '' : dt.toISOString();
  }, [pickupDate, pickupTime]);

  const endIso = useMemo(() => {
    const dt = new Date(`${returnDate}T${returnTime || '10:00'}:00`);
    return Number.isNaN(dt.getTime()) ? '' : dt.toISOString();
  }, [returnDate, returnTime]);

  const quote = useMemo(
    () =>
      calculateBookingQuote({
        mode: rentalMode,
        dailyPriceInr: vehicle?.pricePerDay ?? 0,
        securityDepositInr: vehicle?.securityDeposit ?? 0,
        startIso,
        endIso,
      }),
    [rentalMode, vehicle?.pricePerDay, vehicle?.securityDeposit, startIso, endIso]
  );

  const handleModeSwitch = (nextMode: RentalMode) => {
    if (nextMode === rentalMode) return;
    setErrorMsg(null);
    setRentalMode(nextMode);
    const startMs = new Date(`${pickupDate}T${pickupTime || '10:00'}:00`).getTime();
    if (!Number.isFinite(startMs)) return;

    if (nextMode === 'HOURLY') {
      // Default to a 6-hour same-day window when switching into Per Hour
      const endDt = new Date(startMs + 6 * 3_600_000);
      setReturnDate(toLocalDateStr(endDt));
      setReturnTime(
        `${String(endDt.getHours()).padStart(2, '0')}:${String(endDt.getMinutes()).padStart(2, '0')}`
      );
    } else {
      // Default to at least 1 full 24h day when switching back to Per Day
      const curEndMs = new Date(`${returnDate}T${returnTime || '10:00'}:00`).getTime();
      if (!Number.isFinite(curEndMs) || curEndMs - startMs < 86400_000) {
        const nextDay = new Date(startMs + 86400_000 * 3);
        setReturnDate(toLocalDateStr(nextDay));
        setReturnTime(pickupTime || '10:00');
      }
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0A0A0B] pt-28 px-6 text-xs uppercase tracking-[0.16em] text-[#8E8E98]">
        Loading vehicle specifications...
      </main>
    );
  }

  if (!vehicle) {
    return (
      <main className="min-h-screen bg-[#0A0A0B] pt-28 px-6 text-center space-y-4">
        <p className="font-display text-2xl text-[#F4F1EA]">Vehicle listing not found</p>
        <Link to="/explore"><Button variant="outline">Back to Explore</Button></Link>
      </main>
    );
  }

  const hourlyRateInr = calculateHourlyPriceInr(vehicle.pricePerDay);
  const rentalTotal = quote.rentalTotalInr;
  const advanceAmount = quote.advanceAmountInr;
  const balanceAtPickup = quote.balanceAtPickupInr;

  const handleRazorpayBooking = async () => {
    setErrorMsg(null);
    if (!quote.valid || !startIso || !endIso) {
      setErrorMsg(quote.error || 'Please choose a valid booking duration.');
      return;
    }
    if (!agreed) {
      setErrorMsg('Please review and accept the rental agreement terms.');
      return;
    }
    if (!user || !vehicle.dbId) {
      setErrorMsg('Please sign in with your Customer account before paying.');
      return;
    }

    setSubmitting(true);
    try {
      const scriptLoaded = await loadRazorpayCheckoutScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Unable to load Razorpay Checkout script. Please check your connection.');
      }

      const order = await callRazorpayCheckoutApi<CreateRazorpayOrderResponse>('create_order', {
        vehicleId: vehicle.dbId,
        rentalMode,
        startAt: startIso,
        endAt: endIso,
        agreementAccepted: true,
      });

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amountPaise,
        currency: order.currency || 'INR',
        name: 'SHAREWHEELS',
        description: `50% Advance — ${order.vehicleName} (${formatBookingDuration(order.rentalMode, order.billableUnits)})`,
        order_id: order.orderId,
        prefill: {
          email: user.email || '',
        },
        notes: {
          booking_id: order.bookingId,
          split: '50_percent_advance',
        },
        theme: {
          color: '#C8A97E',
        },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            setSubmitting(true);
            const verified = await callRazorpayCheckoutApi<VerifyRazorpayPaymentResponse>(
              'verify_payment',
              {
                bookingId: order.bookingId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            );
            setVerifiedBooking(verified);
            setBookingStep('confirmed');
          } catch (verifyErr) {
            setErrorMsg(
              verifyErr instanceof Error
                ? verifyErr.message
                : 'Payment verification failed on server.'
            );
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            callRazorpayCheckoutApi('cancel_unpaid', { bookingId: order.bookingId }).catch(() => {});
            setSubmitting(false);
          },
        },
      });

      rzp.on?.('payment.failed', (resp) => {
        const desc = resp?.error?.description || 'Payment failed in Razorpay Checkout.';
        setErrorMsg(desc);
        callRazorpayCheckoutApi('cancel_unpaid', { bookingId: order.bookingId }).catch(() => {});
        setSubmitting(false);
      });

      rzp.open();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to start Razorpay checkout.');
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0B] pt-24 pb-24">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 space-y-10">
        <div className="flex items-center justify-between">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#8E8E98] hover:text-[#C8A97E]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Fleet
          </Link>
          <Link
            to={`/compare?slugs=${vehicle.id}`}
            className="text-xs uppercase tracking-[0.16em] text-[#C8A97E] hover:underline"
          >
            Compare Vehicle →
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-3">
              <div className="border border-[#2A2A30] bg-[#111114] rounded-sm overflow-hidden aspect-[16/10]">
                <VehicleImage
                  src={vehicle.galleryPhotos[activePhotoIdx]?.url || vehicle.image}
                  alt={vehicle.name}
                  label={`${vehicle.brand} ${vehicle.model} (${vehicle.variant})`}
                  className="h-full w-full"
                />
              </div>

              {vehicle.galleryPhotos.length > 1 && (
                <div className="grid grid-cols-3 gap-3">
                  {vehicle.galleryPhotos.map((photo, idx) => (
                    <button
                      key={`${photo.url}-${idx}`}
                      type="button"
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`relative aspect-[16/10] overflow-hidden border rounded-sm cursor-pointer transition-colors ${
                        activePhotoIdx === idx
                          ? 'border-[#C8A97E]'
                          : 'border-[#2A2A30] opacity-75 hover:opacity-100'
                      }`}
                    >
                      <VehicleImage
                        src={photo.url}
                        alt={`${vehicle.name} ${photo.angle}`}
                        className="h-full w-full"
                      />
                      <span className="absolute bottom-1.5 left-1.5 bg-[#0A0A0B]/85 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[#F4F1EA]">
                        {photo.angle}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {vehicle.galleryPhotos[activePhotoIdx]?.license && (
                <p className="text-[10px] text-[#8E8E98]">
                  Photo: {vehicle.galleryPhotos[activePhotoIdx].photographer || 'Contributor'} ·{' '}
                  {vehicle.galleryPhotos[activePhotoIdx].sourceSite} (
                  {vehicle.galleryPhotos[activePhotoIdx].license})
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="prototype">Sample Listing · {vehicle.placeholderKey}</Badge>
                <Badge variant="champagne">
                  <ShieldCheck className="h-3 w-3" />
                  {vehicle.verificationStatus}
                </Badge>
              </div>
              <h1 className="font-display text-3xl sm:text-5xl font-semibold text-[#F4F1EA]">
                {vehicle.name}
              </h1>
              <p className="flex items-center gap-2 text-sm text-[#8E8E98]">
                <MapPin className="h-4 w-4 text-[#C8A97E]" />
                {vehicle.location} · Reg: {vehicle.registrationCity || 'Local'}
              </p>
              {vehicle.description && (
                <p className="text-sm leading-relaxed text-[#E8E4DC]/85">{vehicle.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-y border-[#2A2A30] py-6 text-xs">
              <div>
                <p className="text-[#8E8E98] uppercase text-[10px]">Make & Variant</p>
                <p className="mt-1 text-[#F4F1EA] font-medium">
                  {vehicle.brand} · {vehicle.variant}
                </p>
              </div>
              <div>
                <p className="text-[#8E8E98] uppercase text-[10px]">Year</p>
                <p className="mt-1 text-[#F4F1EA] font-medium">{vehicle.year}</p>
              </div>
              <div>
                <p className="text-[#8E8E98] uppercase text-[10px]">Transmission</p>
                <p className="mt-1 text-[#F4F1EA] font-medium">{vehicle.transmission}</p>
              </div>
              <div>
                <p className="text-[#8E8E98] uppercase text-[10px]">Fuel & Drivetrain</p>
                <p className="mt-1 text-[#F4F1EA] font-medium">
                  {vehicle.fuelType} · {vehicle.drivetrain}
                </p>
              </div>
              <div>
                <p className="text-[#8E8E98] uppercase text-[10px]">Seats</p>
                <p className="mt-1 text-[#F4F1EA] font-medium">{vehicle.seats}</p>
              </div>
              <div>
                <p className="text-[#8E8E98] uppercase text-[10px]">Mileage / Range</p>
                <p className="mt-1 text-[#F4F1EA] font-medium">
                  {vehicle.mileageOrRange || 'Specified at handover'}
                </p>
              </div>
            </div>

            {vehicle.offRoadSpecs && (
              <div className="border border-[#2A2A30] bg-[#111114] p-6 rounded-sm space-y-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#C8A97E]">
                  Adventure & Ground Clearance Specifications
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <p className="text-[#8E8E98]">Drivetrain</p>
                    <p className="text-[#F4F1EA] font-medium">{vehicle.offRoadSpecs.drivetrain}</p>
                  </div>
                  <div>
                    <p className="text-[#8E8E98]">Ground Clearance</p>
                    <p className="text-[#F4F1EA] font-medium">
                      {vehicle.offRoadSpecs.groundClearanceMm} mm
                    </p>
                  </div>
                  <div>
                    <p className="text-[#8E8E98]">Approach / Departure</p>
                    <p className="text-[#F4F1EA] font-medium">
                      {vehicle.offRoadSpecs.approachAngleDeg
                        ? `${vehicle.offRoadSpecs.approachAngleDeg}° / ${vehicle.offRoadSpecs.departureAngleDeg}°`
                        : 'Factory SUV Geometry'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#8E8E98]">Tyre Spec</p>
                    <p className="text-[#F4F1EA] font-medium">{vehicle.offRoadSpecs.tyreType}</p>
                  </div>
                </div>
                {vehicle.offRoadSpecs.modifications.length > 0 && (
                  <div className="text-xs text-[#8E8E98]">
                    <strong className="text-[#F4F1EA]">Equipment:</strong>{' '}
                    {vehicle.offRoadSpecs.modifications.join(' · ')}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <h2 className="font-display text-xl font-medium text-[#F4F1EA]">Rental Guidelines</h2>
              <ul className="space-y-2 text-xs text-[#8E8E98]">
                {vehicle.rules.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to={`/route-planner?vehicle=${vehicle.id}`}>
                <Button variant="champagne">
                  <Route className="h-4 w-4" />
                  CALCULATE MY TRIP
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link to={`/trip-budget?vehicle=${vehicle.id}&compare=1`}>
                <Button variant="outline">
                  COMPARE WITH OTHER VEHICLES
                </Button>
              </Link>
              <Link to={`/passport/${vehicle.id}`}>
                <Button variant="outline">
                  <FileCheck2 className="h-4 w-4" />
                  View Vehicle Passport
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24 border border-[#2A2A30] bg-[#111114] p-6 rounded-sm space-y-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#2A2A30] pb-4">
                <div>
                  <p className="font-display text-2xl font-semibold text-[#F4F1EA]">
                    {formatINR(vehicle.pricePerDay)}
                    <span className="text-xs font-normal text-[#8E8E98]"> / day</span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#C8A97E]">
                    {formatINR(hourlyRateInr)}
                    <span className="text-[#8E8E98]"> / hour</span>
                  </p>
                </div>
                <span className="text-xs text-[#8E8E98]">
                  Deposit: {formatINR(vehicle.securityDeposit)}
                </span>
              </div>

              {bookingStep === 'form' && (
                <>
                  {/* Rental Duration Mode Switcher */}
                  <div
                    role="tablist"
                    aria-label="Rental pricing mode"
                    className="grid grid-cols-2 gap-1.5 border border-[#2A2A30] bg-[#0A0A0B] p-1 rounded-sm"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={rentalMode === 'DAILY'}
                      onClick={() => handleModeSwitch('DAILY')}
                      className={`h-9 text-[11px] uppercase tracking-[0.16em] rounded-sm transition-colors cursor-pointer ${
                        rentalMode === 'DAILY'
                          ? 'bg-[#C8A97E] text-[#0A0A0B] font-semibold'
                          : 'text-[#8E8E98] hover:text-[#F4F1EA]'
                      }`}
                    >
                      PER DAY
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={rentalMode === 'HOURLY'}
                      onClick={() => handleModeSwitch('HOURLY')}
                      className={`h-9 text-[11px] uppercase tracking-[0.16em] rounded-sm transition-colors cursor-pointer ${
                        rentalMode === 'HOURLY'
                          ? 'bg-[#C8A97E] text-[#0A0A0B] font-semibold'
                          : 'text-[#8E8E98] hover:text-[#F4F1EA]'
                      }`}
                    >
                      PER HOUR
                    </button>
                  </div>

                  {/* Precise Pickup & Return Date/Time Selectors */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.14em] text-[#8E8E98] mb-1.5">
                        Pickup Date
                      </label>
                      <input
                        type="date"
                        value={pickupDate}
                        onChange={(e) => {
                          setPickupDate(e.target.value);
                          if (rentalMode === 'HOURLY' && e.target.value > returnDate) {
                            setReturnDate(e.target.value);
                          }
                        }}
                        className="w-full h-10 rounded-sm border border-[#2A2A30] bg-[#0A0A0B] px-3 text-xs text-[#F4F1EA] focus:border-[#C8A97E] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.14em] text-[#8E8E98] mb-1.5">
                        Pickup Time
                      </label>
                      <input
                        type="time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-full h-10 rounded-sm border border-[#2A2A30] bg-[#0A0A0B] px-3 text-xs text-[#F4F1EA] focus:border-[#C8A97E] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.14em] text-[#8E8E98] mb-1.5">
                        Return Date
                      </label>
                      <input
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="w-full h-10 rounded-sm border border-[#2A2A30] bg-[#0A0A0B] px-3 text-xs text-[#F4F1EA] focus:border-[#C8A97E] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.14em] text-[#8E8E98] mb-1.5">
                        Return Time
                      </label>
                      <input
                        type="time"
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                        className="w-full h-10 rounded-sm border border-[#2A2A30] bg-[#0A0A0B] px-3 text-xs text-[#F4F1EA] focus:border-[#C8A97E] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Schedule Summary & Validation */}
                  {startIso && endIso && quote.valid ? (
                    <div className="border border-[#2A2A30] bg-[#0A0A0B] px-3.5 py-2.5 rounded-sm text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-[#E8E4DC]">
                        <span className="inline-flex items-center gap-1.5 text-[#C8A97E]">
                          <Clock className="h-3.5 w-3.5" />
                          Duration
                        </span>
                        <strong className="font-medium">
                          {formatBookingDuration(rentalMode, quote.billableUnits)}
                        </strong>
                      </div>
                      <p className="text-[#8E8E98]">
                        {formatBookingDateTime(startIso)} → {formatBookingDateTime(endIso)}
                      </p>
                      {(quote.hasPartialRounding || rentalMode === 'HOURLY') && (
                        <p className="text-[10px] text-[#8E8E98]">
                          {quote.roundingNote}
                        </p>
                      )}
                    </div>
                  ) : (
                    quote.error && (
                      <p className="border border-red-500/40 bg-red-950/20 px-3 py-2 rounded-sm text-xs text-red-300">
                        {quote.error}
                      </p>
                    )
                  )}

                  {/* Pricing Breakdown */}
                  <div className="space-y-2 border-t border-[#2A2A30] pt-4 text-xs">
                    <div className="flex justify-between text-[#8E8E98]">
                      <span>
                        {formatINR(quote.appliedRateInr)} / {rentalMode === 'HOURLY' ? 'hr' : 'day'} ×{' '}
                        {quote.valid
                          ? formatBookingDuration(rentalMode, quote.billableUnits)
                          : `0 ${rentalMode === 'HOURLY' ? 'hours' : 'days'}`}
                      </span>
                      <span className="text-[#F4F1EA] font-medium">{formatINR(rentalTotal)}</span>
                    </div>
                    <div className="flex justify-between text-[#C8A97E] font-medium">
                      <span>50% Advance Due Now (Razorpay)</span>
                      <span>{formatINR(advanceAmount)}</span>
                    </div>
                    <div className="flex justify-between text-[#8E8E98]">
                      <span>Remaining 50% Balance at Pickup</span>
                      <span className="text-[#F4F1EA]">{formatINR(balanceAtPickup)}</span>
                    </div>
                    <div className="flex justify-between text-[#8E8E98]">
                      <span>Refundable Security Deposit (Separate)</span>
                      <span className="text-[#F4F1EA]">{formatINR(vehicle.securityDeposit)}</span>
                    </div>
                  </div>

                  <Button
                    variant="champagne"
                    size="lg"
                    className="w-full"
                    disabled={!quote.valid || advanceAmount < 1}
                    onClick={() => {
                      if (!quote.valid) {
                        setErrorMsg(quote.error);
                        return;
                      }
                      setErrorMsg(null);
                      setBookingStep('payment');
                    }}
                  >
                    Continue · Pay 50% Advance ({formatINR(advanceAmount)})
                  </Button>
                </>
              )}

              {bookingStep === 'payment' && (
                <div className="space-y-4">
                  <div className="border border-[#C8A97E]/30 bg-[#0A0A0B] p-4 text-xs text-[#8E8E98] space-y-2 rounded-sm">
                    <p className="inline-flex items-center gap-1.5 text-[#C8A97E] uppercase text-[10px] tracking-[0.14em]">
                      <CreditCard className="h-3.5 w-3.5" />
                      Razorpay Test Mode · 50% Advance Booking
                    </p>
                    <div className="flex justify-between text-[#F4F1EA]">
                      <span>50% Advance Paid Now</span>
                      <strong className="text-[#C8A97E]">{formatINR(advanceAmount)}</strong>
                    </div>
                    <div className="flex justify-between text-[#8E8E98]">
                      <span>50% Balance at Pickup</span>
                      <span>{formatINR(balanceAtPickup)}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed pt-1 border-t border-[#2A2A30]">
                      Once Razorpay payment verifies, the booking confirms automatically and the
                      owner receives instant confirmation with your Razorpay Payment ID.
                    </p>
                  </div>

                  <label className="flex items-start gap-2.5 text-xs text-[#E8E4DC] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 accent-[#C8A97E]"
                    />
                    <span>
                      I accept the SHAREWHEELS rental terms, pre-trip photo inspection rules,
                      and coverage exclusions.
                    </span>
                  </label>

                  {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}

                  {!user ? (
                    <div className="space-y-2">
                      <Link to="/login" className="block">
                        <Button variant="champagne" className="w-full">
                          Sign In as Customer to Pay {formatINR(advanceAmount)}
                        </Button>
                      </Link>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setBookingStep('form')}
                      >
                        Back
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" disabled={submitting} onClick={() => setBookingStep('form')}>
                        Back
                      </Button>
                      <Button
                        variant="champagne"
                        className="flex-1"
                        disabled={submitting}
                        onClick={handleRazorpayBooking}
                      >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        <span>
                          {submitting
                            ? 'Processing Razorpay...'
                            : `Pay 50% Advance (${formatINR(advanceAmount)})`}
                        </span>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {bookingStep === 'confirmed' && verifiedBooking && (
                <div className="space-y-4 border border-[#C8A97E]/40 bg-[#0A0A0B] p-5 rounded-sm">
                  <div className="flex items-center gap-2 text-[#C8A97E] text-xs uppercase tracking-[0.14em]">
                    <CheckCircle2 className="h-4 w-4" />
                    Booking Confirmed · 50% Advance Paid
                  </div>
                  <div className="space-y-1.5 text-xs text-[#8E8E98]">
                    <p>
                      Razorpay Payment ID:{' '}
                      <strong className="text-[#F4F1EA]">{verifiedBooking.razorpayPaymentId}</strong>
                    </p>
                    <p>
                      Advance Paid:{' '}
                      <strong className="text-[#C8A97E]">
                        {formatINR(Math.round(verifiedBooking.advancePaidPaise / 100))}
                      </strong>{' '}
                      · Balance at Pickup:{' '}
                      <strong className="text-[#F4F1EA]">
                        {formatINR(Math.round(verifiedBooking.balanceDuePaise / 100))}
                      </strong>
                    </p>
                    <p className="text-emerald-300">
                      {verifiedBooking.ownerNotified
                        ? 'Razorpay payment confirmation sent to the vehicle owner.'
                        : 'Booking recorded and confirmed in SHAREWHEELS.'}
                    </p>
                  </div>
                  <Link to="/bookings" className="block">
                    <Button variant="primary" className="w-full">
                      View My Bookings
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
