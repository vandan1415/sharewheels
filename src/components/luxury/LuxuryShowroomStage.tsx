import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { LUXURY_GARAGE_BACKGROUND } from '@/data/luxuryShowroom';
import type { LuxuryListingItem } from '@/hooks/useLuxuryCollection';

export type OrbitDirection = 'next' | 'prev';

interface LuxuryShowroomStageProps {
  items: LuxuryListingItem[];
  activeIndex: number;
  direction: OrbitDirection;
  onStep: (dir: OrbitDirection) => void;
  onAnimationLockChange?: (locked: boolean) => void;
  headerAction?: ReactNode;
}

export function LuxuryShowroomStage({
  items,
  activeIndex,
  direction,
  onStep,
  onAnimationLockChange,
  headerAction,
}: LuxuryShowroomStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const slot0Ref = useRef<HTMLDivElement>(null);
  const slot1Ref = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);

  const [slotIndexes, setSlotIndexes] = useState<[number, number]>([0, 0]);
  const [frontSlot, setFrontSlot] = useState<0 | 1>(0);
  const renderedIdxRef = useRef<number>(0);
  const frontSlotRef = useRef<0 | 1>(0);
  const isAnimatingRef = useRef(false);
  const activeTweensRef = useRef<gsap.core.Tween[]>([]);
  const wheelCooldownRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const pointerStartYRef = useRef<number | null>(null);
  const pointerStartXRef = useRef<number | null>(null);

  const getSafeItem = (idx: number) => items[((idx % items.length) + items.length) % items.length];

  // Reset stage slots cleanly if items array length or city mode changes
  useEffect(() => {
    if (items.length === 0) return;
    const bounded = ((activeIndex % items.length) + items.length) % items.length;
    renderedIdxRef.current = bounded;
    frontSlotRef.current = 0;
    setFrontSlot(0);
    setSlotIndexes([bounded, bounded]);

    const s0 = slot0Ref.current;
    const s1 = slot1Ref.current;
    if (s0 && s1) {
      gsap.killTweensOf([s0, s1]);
      gsap.set(s0, { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, zIndex: 20 });
      gsap.set(s1, { x: 0, y: 0, scale: 0.85, rotation: 0, opacity: 0, zIndex: 10 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Preload next & previous vehicle WebP assets silently so zero blank frames occur
  useEffect(() => {
    if (items.length < 2) return;
    const nextIdx = (activeIndex + 1) % items.length;
    const prevIdx = (activeIndex - 1 + items.length) % items.length;
    [items[nextIdx]?.imageUrl, items[prevIdx]?.imageUrl].forEach((src) => {
      if (!src) return;
      const img = new Image();
      img.src = src;
    });
  }, [activeIndex, items]);

  // Core GSAP Vertical Circular Orbit Transition
  useEffect(() => {
    if (items.length === 0) return;
    const targetIdx = ((activeIndex % items.length) + items.length) % items.length;
    const currentIdx = renderedIdxRef.current;
    if (targetIdx === currentIdx) return;

    const outSlotIdx = frontSlotRef.current;
    const inSlotIdx: 0 | 1 = outSlotIdx === 0 ? 1 : 0;

    setSlotIndexes((prev) =>
      inSlotIdx === 0 ? [targetIdx, prev[1]] : [prev[0], targetIdx]
    );
    frontSlotRef.current = inSlotIdx;
    renderedIdxRef.current = targetIdx;
    setFrontSlot(inSlotIdx);

    const outEl = outSlotIdx === 0 ? slot0Ref.current : slot1Ref.current;
    const inEl = inSlotIdx === 0 ? slot0Ref.current : slot1Ref.current;
    const shadowEl = shadowRef.current;
    if (!outEl || !inEl) return;

    gsap.killTweensOf([outEl, inEl, shadowEl]);
    activeTweensRef.current.forEach((tw) => tw.kill());
    activeTweensRef.current = [];

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      gsap.set(inEl, { x: 0, y: 0, scale: 1, rotation: 0, zIndex: 25, opacity: 0 });
      gsap.set(outEl, { zIndex: 15 });
      activeTweensRef.current.push(
        gsap.to(outEl, { opacity: 0, duration: 0.22, ease: 'power1.out' }),
        gsap.to(inEl, {
          opacity: 1,
          duration: 0.24,
          ease: 'power1.out',
          onComplete: () => {
            isAnimatingRef.current = false;
            onAnimationLockChange?.(false);
          },
        })
      );
      return;
    }

    isAnimatingRef.current = true;
    onAnimationLockChange?.(true);

    const stageH = stageRef.current?.clientHeight ?? 620;
    const orbitRadiusY = Math.min(275, Math.max(175, stageH * 0.44));
    const orbitBowX = Math.min(130, orbitRadiusY * 0.46);
    const maxAngleRad = (74 * Math.PI) / 180;

    // Swipe UP ('next'): outgoing curves DOWN along circular arc (0 -> +74deg); incoming enters from ABOVE (-74deg -> 0)
    // Swipe DOWN ('prev'): exact reverse! Outgoing curves UP (0 -> -74deg); incoming enters from BELOW (+74deg -> 0)
    const dirSign = direction === 'next' ? 1 : -1;

    gsap.set(outEl, { zIndex: 18 });
    gsap.set(inEl, { zIndex: 24, opacity: 0 });

    const outProgress = { theta: 0 };
    const inProgress = { theta: -dirSign * maxAngleRad };

    if (shadowEl) {
      activeTweensRef.current.push(
        gsap.fromTo(
          shadowEl,
          { opacity: 0.35, scaleX: 0.78 },
          { opacity: 0.85, scaleX: 1, duration: 0.78, ease: 'power3.out' }
        )
      );
    }

    activeTweensRef.current.push(
      gsap.to(outProgress, {
        theta: dirSign * maxAngleRad,
        duration: 0.72,
        ease: 'power3.inOut',
        onUpdate: () => {
          const t = outProgress.theta;
          const norm = Math.min(1, Math.abs(t) / maxAngleRad);
          const y = Math.sin(t) * orbitRadiusY;
          const x = (1 - Math.cos(t)) * orbitBowX;
          const scale = 1 - norm * 0.24;
          const rot = (t / maxAngleRad) * 6.5;
          const opacity = Math.max(0, 1 - Math.pow(norm, 1.35));
          gsap.set(outEl, { x, y, scale, rotation: rot, opacity });
        },
      }),
      gsap.to(inProgress, {
        theta: 0,
        duration: 0.78,
        ease: 'power3.out',
        onUpdate: () => {
          const t = inProgress.theta;
          const norm = Math.min(1, Math.abs(t) / maxAngleRad);
          const y = Math.sin(t) * orbitRadiusY;
          const x = (1 - Math.cos(t)) * orbitBowX;
          const scale = 0.76 + (1 - norm) * 0.24;
          const rot = (t / maxAngleRad) * 6.5;
          const opacity = Math.min(1, 1 - Math.pow(norm, 1.7));
          gsap.set(inEl, { x, y, scale, rotation: rot, opacity });
        },
        onComplete: () => {
          gsap.set(inEl, { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 });
          gsap.set(outEl, { opacity: 0 });
          isAnimatingRef.current = false;
          onAnimationLockChange?.(false);
        },
      })
    );
  }, [activeIndex, direction, items.length, onAnimationLockChange]);

  // Ensure GSAP tweens terminate cleanly when unmounting
  useEffect(() => {
    return () => {
      activeTweensRef.current.forEach((tw) => tw.kill());
      activeTweensRef.current = [];
    };
  }, []);

  const requestStep = useCallback(
    (dir: OrbitDirection) => {
      const now = performance.now();
      if (isAnimatingRef.current || now < wheelCooldownRef.current || items.length < 2) return;
      wheelCooldownRef.current = now + 820;
      onStep(dir);
    },
    [items.length, onStep]
  );

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        requestStep('next');
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        requestStep('prev');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [requestStep]);

  // Trackpad / Mouse wheel handler on showroom stage
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const absY = Math.abs(e.deltaY);
    if (absY < 14) return;
    requestStep(e.deltaY > 0 ? 'next' : 'prev');
  };

  // Touch swipe UP / DOWN handler
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    touchStartYRef.current = e.touches[0].clientY;
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartYRef.current === null || touchStartXRef.current === null) return;
    const endY = e.changedTouches[0]?.clientY ?? touchStartYRef.current;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const dy = touchStartYRef.current - endY; // positive => finger swiped UP
    const dx = Math.abs(touchStartXRef.current - endX);
    touchStartYRef.current = null;
    touchStartXRef.current = null;
    if (Math.abs(dy) < 34 || Math.abs(dy) < dx) return;
    requestStep(dy > 0 ? 'next' : 'prev');
  };

  // Pointer drag UP / DOWN support for trackpad/mouse swipe simulation
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    if (e.target instanceof HTMLElement && e.target.closest('button, a')) return;
    pointerStartYRef.current = e.clientY;
    pointerStartXRef.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    if (pointerStartYRef.current === null || pointerStartXRef.current === null) return;
    const dy = pointerStartYRef.current - e.clientY;
    const dx = Math.abs(pointerStartXRef.current - e.clientX);
    pointerStartYRef.current = null;
    pointerStartXRef.current = null;
    if (Math.abs(dy) < 34 || Math.abs(dy) < dx) return;
    requestStep(dy > 0 ? 'next' : 'prev');
  };

  const item0 = getSafeItem(slotIndexes[0]);
  const item1 = getSafeItem(slotIndexes[1]);

  return (
    <div
      ref={stageRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="relative flex-1 w-full overflow-hidden select-none touch-pan-x cursor-grab active:cursor-grabbing"
    >
      {/* 1. STATIC ARCHITECTURAL GARAGE BACKGROUND (Never animates or translates) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${LUXURY_GARAGE_BACKGROUND}')` }}
      />

      {/* Overhead Gallery Spotlight & Edge Vignette Overlay (Static) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(ellipse 68% 54% at 50% 42%, rgba(200,169,126,0.06) 0%, rgba(10,10,12,0.22) 55%, rgba(6,6,8,0.88) 100%)',
        }}
      />

      {/* Editorial Corner Framing + Optional Non-Overlapping Scope Switch */}
      <div className="pointer-events-none relative z-20 mx-auto max-w-[1480px] px-4 sm:px-8 pt-4 sm:pt-7 flex flex-col sm:flex-row sm:items-end justify-between gap-2.5">
        <div>
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-[#C8A97E]">
            THE COLLECTION
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-4xl lg:text-5xl font-medium tracking-[0.06em] uppercase text-[#F4F1EA]/90">
            BEYOND ORDINARY.
          </h1>
        </div>
        {headerAction && <div className="pointer-events-auto self-start sm:self-end">{headerAction}</div>}
      </div>

      {/* Circular Orbit Guide Arc & Swipe Cue */}
      <div
        aria-hidden="true"
        className="pointer-events-none hidden lg:block absolute right-10 top-1/2 -translate-y-1/2 h-[340px] w-[80px] border-r border-white/[0.08] rounded-r-full z-10"
      />

      {/* Grounded Floor Turntable Contact Shadow */}
      <div
        ref={shadowRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 bottom-[8%] sm:bottom-[9%] -translate-x-1/2 z-[12] w-[72vw] max-w-[780px] h-10 sm:h-14 rounded-[100%]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.62) 48%, rgba(0,0,0,0) 78%)',
          filter: 'blur(8px)',
        }}
      />

      {/* Slot 0 */}
      <div
        ref={slot0Ref}
        aria-hidden={frontSlot !== 0}
        className="pointer-events-none absolute inset-x-0 bottom-[10%] sm:bottom-[11%] top-[20%] sm:top-[22%] z-20 flex items-end justify-center px-4 sm:px-12 will-change-transform"
      >
        {item0 && (
          <img
            src={item0.imageUrl}
            alt={`${item0.brand} ${item0.model}`}
            loading={frontSlot === 0 ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            style={{
              transformOrigin: `50% ${100 - item0.spec.floorOffsetPct}%`,
              transform: `translateY(${item0.spec.floorOffsetPct}%) scale(${item0.spec.visualScale})`,
            }}
            className="w-[86vw] sm:w-[74vw] max-w-[780px] max-h-full h-auto object-contain select-none drop-shadow-[0_22px_28px_rgba(0,0,0,0.88)]"
          />
        )}
      </div>

      {/* Slot 1 */}
      <div
        ref={slot1Ref}
        aria-hidden={frontSlot !== 1}
        className="pointer-events-none absolute inset-x-0 bottom-[10%] sm:bottom-[11%] top-[20%] sm:top-[22%] z-10 opacity-0 flex items-end justify-center px-4 sm:px-12 will-change-transform"
      >
        {item1 && (
          <img
            src={item1.imageUrl}
            alt={`${item1.brand} ${item1.model}`}
            loading={frontSlot === 1 ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            style={{
              transformOrigin: `50% ${100 - item1.spec.floorOffsetPct}%`,
              transform: `translateY(${item1.spec.floorOffsetPct}%) scale(${item1.spec.visualScale})`,
            }}
            className="w-[86vw] sm:w-[74vw] max-w-[780px] max-h-full h-auto object-contain select-none drop-shadow-[0_22px_28px_rgba(0,0,0,0.88)]"
          />
        )}
      </div>

      {/* Floor Fade Seam into Bottom Info Section */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 z-[28] bg-gradient-to-t from-[#08080A] via-[#08080A]/75 to-transparent"
      />
    </div>
  );
}
