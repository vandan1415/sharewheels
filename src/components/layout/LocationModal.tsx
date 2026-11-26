import { useMemo, useState } from 'react';
import { Check, MapPin, Search, X } from 'lucide-react';
import { useLocationContext } from '@/context/LocationContext';
import { useLanguage } from '@/context/LanguageContext';

export function LocationModal() {
  const {
    locations,
    selectedCity,
    isModalOpen,
    closeLocationModal,
    selectCity,
  } = useLocationContext();
  const { t, td } = useLanguage();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.state.toLowerCase().includes(q) ||
        td.city(l.name).toLowerCase().includes(q) ||
        td.state(l.state).toLowerCase().includes(q)
    );
  }, [locations, search, td]);

  if (!isModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-[#0A0A0B]/92 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t('locationModal.title')}
      onClick={() => {
        if (selectedCity) closeLocationModal();
      }}
    >
      <div
        className="w-full max-w-2xl border border-[#2A2A30] bg-[#111114] rounded-sm p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#2A2A30] pb-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#C8A97E]">
              <MapPin className="h-3.5 w-3.5" />
              <span>{t('locationModal.eyebrow')}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#F4F1EA]">
              {t('locationModal.title')}
            </h2>
            <p className="text-xs text-[#8E8E98]">
              {t('locationModal.subtitle')}
            </p>
          </div>
          {selectedCity && (
            <button
              type="button"
              onClick={closeLocationModal}
              aria-label={t('locationModal.closeAria')}
              className="text-[#8E8E98] hover:text-[#F4F1EA] cursor-pointer p-1"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 border border-[#2A2A30] bg-[#0A0A0B] px-3.5 h-11 rounded-sm">
          <Search className="h-4 w-4 text-[#C8A97E]" />
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('locationModal.searchPlaceholder')}
            className="w-full bg-transparent text-sm text-[#F4F1EA] placeholder:text-[#8E8E98] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
          {filtered.map((loc) => {
            const active = selectedCity?.slug === loc.slug;
            return (
              <button
                key={loc.slug}
                type="button"
                onClick={() => selectCity(loc.slug)}
                className={`flex items-center justify-between border p-4 text-left rounded-sm transition-colors cursor-pointer ${
                  active
                    ? 'border-[#C8A97E] bg-[#1A1A1F] text-[#F4F1EA]'
                    : 'border-[#2A2A30] bg-[#0A0A0B] text-[#E8E4DC] hover:border-[#C8A97E]/60'
                }`}
              >
                <div>
                  <p className="font-display text-base font-medium text-[#F4F1EA]">
                    {td.city(loc.name)}
                  </p>
                  <p className="text-[11px] text-[#8E8E98] mt-0.5">{td.state(loc.state)}</p>
                </div>
                {active && <Check className="h-4 w-4 text-[#C8A97E] shrink-0" />}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-2 py-6 text-center text-xs text-[#8E8E98]">
              {t('locationModal.noMatches')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
