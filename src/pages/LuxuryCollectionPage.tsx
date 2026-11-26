import { useCallback, useEffect, useState } from 'react';
import { useLocationContext } from '@/context/LocationContext';
import { useLuxuryCollection } from '@/hooks/useLuxuryCollection';
import { LuxuryTopBar } from '@/components/luxury/LuxuryTopBar';
import {
  LuxuryShowroomStage,
  type OrbitDirection,
} from '@/components/luxury/LuxuryShowroomStage';
import { LuxuryVehicleInfoBar } from '@/components/luxury/LuxuryVehicleInfoBar';

export function LuxuryCollectionPage() {
  const { selectedCity } = useLocationContext();
  const { panIndiaSixItems, cityItems, isLoading } = useLuxuryCollection(
    selectedCity?.slug
  );

  // Default to the canonical 6-vehicle showroom sequence (binding to selected city's listing when present),
  // with an unobtrusive toggle placed inline in the editorial header to isolate the active city's 3 vehicles.
  const [scopeMode, setScopeMode] = useState<'all' | 'city'>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<OrbitDirection>('next');
  const [isLocked, setIsLocked] = useState(false);

  const items =
    scopeMode === 'city' && cityItems.length > 0 ? cityItems : panIndiaSixItems;

  useEffect(() => {
    if (activeIndex >= items.length) {
      setActiveIndex(0);
    }
  }, [items.length, activeIndex]);

  const handleStep = useCallback(
    (dir: OrbitDirection) => {
      if (items.length < 2 || isLocked) return;
      setDirection(dir);
      setActiveIndex((prev) =>
        dir === 'next'
          ? (prev + 1) % items.length
          : (prev - 1 + items.length) % items.length
      );
    },
    [items.length, isLocked]
  );

  const handleSelectIndex = useCallback(
    (target: number) => {
      if (target === activeIndex || isLocked || target < 0 || target >= items.length) return;
      setDirection(target > activeIndex ? 'next' : 'prev');
      setActiveIndex(target);
    },
    [activeIndex, isLocked, items.length]
  );

  const activeVehicle = items[activeIndex] ?? items[0];

  const scopeToggle =
    selectedCity && cityItems.length > 0 ? (
      <div className="inline-flex items-center gap-1 border border-white/10 bg-[#0A0A0B]/75 backdrop-blur-sm p-1 rounded-sm">
        <button
          type="button"
          onClick={() => {
            setScopeMode('all');
            setActiveIndex(0);
          }}
          className={`px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] transition-colors cursor-pointer whitespace-nowrap ${
            scopeMode === 'all'
              ? 'bg-[#C8A97E] text-[#0A0A0B] font-semibold'
              : 'text-[#A8A6AE] hover:text-[#F4F1EA]'
          }`}
        >
          All India ({String(panIndiaSixItems.length).padStart(2, '0')})
        </button>
        <button
          type="button"
          onClick={() => {
            setScopeMode('city');
            setActiveIndex(0);
          }}
          className={`px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] transition-colors cursor-pointer whitespace-nowrap ${
            scopeMode === 'city'
              ? 'bg-[#C8A97E] text-[#0A0A0B] font-semibold'
              : 'text-[#A8A6AE] hover:text-[#F4F1EA]'
          }`}
        >
          {selectedCity.name} ({String(cityItems.length).padStart(2, '0')})
        </button>
      </div>
    ) : null;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#070709] text-[#F4F1EA] flex flex-col">
      <LuxuryTopBar />

      {items.length > 0 && (
        <LuxuryShowroomStage
          items={items}
          activeIndex={activeIndex}
          direction={direction}
          onStep={handleStep}
          onAnimationLockChange={setIsLocked}
          headerAction={scopeToggle}
        />
      )}

      {isLoading && items.length === 0 ? (
        <div className="relative z-30 border-t border-white/[0.08] bg-[#08080A] px-8 py-6 text-xs uppercase tracking-[0.2em] text-[#8E8E98]">
          Loading Private Luxury Showroom...
        </div>
      ) : (
        activeVehicle && (
          <LuxuryVehicleInfoBar
            vehicle={activeVehicle}
            activeIndex={activeIndex}
            totalCount={items.length}
            isLocked={isLocked}
            onStep={handleStep}
            onSelectIndex={handleSelectIndex}
          />
        )
      )}
    </div>
  );
}
