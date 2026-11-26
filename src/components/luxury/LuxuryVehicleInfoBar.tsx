import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateHourlyPriceInr } from '@/lib/pricing';
import { formatINR } from '@/lib/utils';
import type { LuxuryListingItem } from '@/hooks/useLuxuryCollection';
import type { OrbitDirection } from '@/components/luxury/LuxuryShowroomStage';

interface LuxuryVehicleInfoBarProps {
  vehicle: LuxuryListingItem;
  activeIndex: number;
  totalCount: number;
  isLocked: boolean;
  onStep: (dir: OrbitDirection) => void;
  onSelectIndex: (idx: number) => void;
}

export function LuxuryVehicleInfoBar({
  vehicle,
  activeIndex,
  totalCount,
  isLocked,
  onStep,
  onSelectIndex,
}: LuxuryVehicleInfoBarProps) {
  const detailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    gsap.killTweensOf(el);
    gsap.fromTo(
      el,
      { opacity: 0.35, y: 10 },
      { opacity: 1, y: 0, duration: 0.42, ease: 'power2.out' }
    );
  }, [vehicle.id, activeIndex]);

  const specsLine = [
    vehicle.category || null,
    vehicle.transmission || null,
    vehicle.fuelType || null,
    vehicle.seats > 0 ? `${vehicle.seats} Seats` : null,
    vehicle.drivetrain || null,
  ]
    .filter(Boolean)
    .join('  |  ');

  const padIndex = String(activeIndex + 1).padStart(2, '0');
  const padTotal = String(totalCount).padStart(2, '0');
  const hasRealListing = Boolean(vehicle.id && vehicle.dbId);
  const canBook = hasRealListing && vehicle.available;

  return (
    <section
      aria-label="Selected luxury vehicle details"
      className="relative z-30 border-t border-white/[0.08] bg-[#08080A] px-4 sm:px-8 py-4 sm:py-5"
    >
      <div
        ref={detailsRef}
        className="mx-auto max-w-[1480px] flex flex-col lg:flex-row lg:items-end justify-between gap-5"
      >
        {/* Left: Editorial Model Title, Tagline, City & Real Specs */}
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 text-[10px] uppercase tracking-[0.2em]">
            <span className="text-[#9E9CA4]">{vehicle.brand}</span>
            <span className="text-white/25">·</span>
            <span className="text-[#E8E4DC]">{vehicle.cityName}</span>
            {vehicle.location && (
              <>
                <span className="hidden sm:inline text-white/25">·</span>
                <span className="hidden sm:inline text-[#8E8E98] truncate max-w-[260px]">
                  {vehicle.location}
                </span>
              </>
            )}
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-sm ${
                canBook
                  ? 'border-emerald-500/35 bg-emerald-950/25 text-emerald-300'
                  : 'border-amber-500/35 bg-amber-950/25 text-amber-300'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  canBook ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              {canBook ? 'Available' : 'Currently Unavailable'}
            </span>
          </div>

          <div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-[38px] font-medium tracking-[0.04em] uppercase leading-[1.06] text-[#F4F1EA]">
              {vehicle.spec.displayBrand}{' '}
              <span className="text-[#C8A97E]">{vehicle.spec.displayModel}</span>
            </h2>
            <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-[#A2A0A9]">
              {vehicle.spec.tagline}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#C6C4CC] pt-0.5">
            {specsLine && <span>{specsLine}</span>}
            {hasRealListing && (
              <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#787882]">
                REF · {vehicle.id}
              </span>
            )}
          </div>
        </div>

        {/* Center/Right: Rate, Orbit Controls & Booking CTAs */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between lg:justify-end gap-4 sm:gap-7 shrink-0">
          {/* Price per day & auto-calculated hourly rate */}
          <div>
            <p className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#F4F1EA]">
              {vehicle.pricePerDay > 0 ? (
                <>
                  {formatINR(vehicle.pricePerDay)}{' '}
                  <span className="text-[11px] font-sans font-normal uppercase tracking-[0.18em] text-[#8E8E98]">
                    / DAY
                  </span>
                  <span className="ml-2 text-xs font-sans font-normal uppercase tracking-[0.14em] text-[#C8A97E]">
                    · {formatINR(calculateHourlyPriceInr(vehicle.pricePerDay))} / HR
                  </span>
                </>
              ) : (
                <span className="text-base text-[#8E8E98]">Pricing Pending</span>
              )}
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#7E7E88]">
              {vehicle.verificationStatus}
              {vehicle.securityDeposit > 0
                ? ` · Refundable Deposit ${formatINR(vehicle.securityDeposit)}`
                : ''}
            </p>
          </div>

          {/* Orbit Counter & Prev/Next Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous luxury vehicle"
                disabled={isLocked || totalCount < 2}
                onClick={() => onStep('prev')}
                className="h-9 w-9 inline-flex items-center justify-center border border-white/15 bg-[#111115] text-[#E8E4DC] hover:border-[#C8A97E] hover:text-[#C8A97E] disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <span className="px-2.5 font-mono text-xs tracking-[0.18em] text-[#E8E4DC] min-w-[66px] text-center">
                <span className="text-[#C8A97E]">{padIndex}</span> / {padTotal}
              </span>
              <button
                type="button"
                aria-label="Next luxury vehicle"
                disabled={isLocked || totalCount < 2}
                onClick={() => onStep('next')}
                className="h-9 w-9 inline-flex items-center justify-center border border-white/15 bg-[#111115] text-[#E8E4DC] hover:border-[#C8A97E] hover:text-[#C8A97E] disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="hidden xl:flex items-center gap-1.5">
              {Array.from({ length: totalCount }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Select vehicle ${idx + 1}`}
                  disabled={isLocked}
                  onClick={() => onSelectIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === activeIndex
                      ? 'w-5 bg-[#C8A97E]'
                      : 'w-1.5 bg-white/25 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Primary Actions preserving exact existing vehicle/booking routes */}
          <div className="flex items-center gap-2.5">
            {hasRealListing ? (
              <>
                <Link
                  to={`/vehicles/${vehicle.id}`}
                  className="inline-flex h-10 items-center justify-center border border-white/20 bg-transparent hover:border-[#C8A97E] px-4 text-[11px] uppercase tracking-[0.16em] text-[#F4F1EA] hover:text-[#C8A97E] transition-colors whitespace-nowrap"
                >
                  EXPLORE VEHICLE
                </Link>
                <Link
                  to={`/vehicles/${vehicle.id}`}
                  className="inline-flex h-10 items-center justify-center gap-2 bg-[#C8A97E] hover:bg-[#D5B991] px-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0A0A0B] transition-colors whitespace-nowrap"
                >
                  <span>BOOK NOW</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <span className="inline-flex h-10 items-center border border-white/15 px-4 text-[10px] uppercase tracking-[0.16em] text-[#8E8E98]">
                Listing Unavailable
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
