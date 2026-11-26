import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import {
  INDIA_CITY_CENTERS,
  resolveIndiaPlace,
  searchIndiaPlaces,
  type PlaceSuggestion,
  type RouteWaypoint,
} from '@/lib/googleMaps';
import { CURATED_JOURNEYS } from '@/data/curatedJourneys';
import { INDIA_DESTINATIONS } from '@/data/indiaDestinations';

interface IndiaCatalogPlace extends RouteWaypoint {
  state?: string;
}

interface PlaceAutocompleteInputProps {
  label: string;
  value: string;
  placeholder?: string;
  biasPoint?: { lat: number; lng: number } | null;
  onSelectPlace: (place: RouteWaypoint) => void;
  onTextChange?: (text: string) => void;
  onServerConfigDetected?: (configured: boolean) => void;
}

export function PlaceAutocompleteInput({
  label,
  value,
  placeholder = 'Search any city, hill station, town or address in India...',
  biasPoint,
  onSelectPlace,
  onTextChange,
  onServerConfigDetected,
}: PlaceAutocompleteInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiSuggestions, setApiSuggestions] = useState<PlaceSuggestion[]>([]);
  const [apiSource, setApiSource] = useState<'google_server' | 'google_browser' | 'offline'>('offline');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const fallbackPlaces = useMemo<IndiaCatalogPlace[]>(() => {
    const map = new Map<string, IndiaCatalogPlace>();
    for (const dest of INDIA_DESTINATIONS) {
      map.set(dest.label.toLowerCase(), {
        id: dest.id,
        label: dest.label,
        state: dest.state,
        lat: dest.lat,
        lng: dest.lng,
      });
    }
    for (const c of Object.values(INDIA_CITY_CENTERS)) {
      const key = c.label.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          id: `city-${c.label}`,
          label: c.label,
          lat: c.lat,
          lng: c.lng,
        });
      }
    }
    for (const j of CURATED_JOURNEYS) {
      if (!map.has(j.origin.label.toLowerCase())) {
        map.set(j.origin.label.toLowerCase(), j.origin);
      }
      if (!map.has(j.destination.label.toLowerCase())) {
        map.set(j.destination.label.toLowerCase(), j.destination);
      }
      for (const s of j.suggestedStops) {
        if (!map.has(s.label.toLowerCase())) {
          map.set(s.label.toLowerCase(), s);
        }
      }
    }
    return Array.from(map.values());
  }, []);

  const matchingFallback = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return fallbackPlaces.slice(0, 14);
    return fallbackPlaces
      .filter(
        (p) =>
          p.label.toLowerCase().includes(q) ||
          (p.state && p.state.toLowerCase().includes(q))
      )
      .slice(0, 12);
  }, [inputValue, fallbackPlaces]);

  useEffect(() => {
    const q = inputValue.trim();
    if (!open || q.length < 2) {
      setApiSuggestions([]);
      setApiSource('offline');
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchIndiaPlaces(q, biasPoint);
        if (cancelled) return;
        setApiSuggestions(res.suggestions);
        setApiSource(res.source);
        onServerConfigDetected?.(res.source === 'google_server');
      } catch {
        if (!cancelled) {
          setApiSuggestions([]);
          setApiSource('offline');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [inputValue, open, biasPoint?.lat, biasPoint?.lng, onServerConfigDetected]);

  const handleSelectSuggestion = async (item: PlaceSuggestion) => {
    setOpen(false);
    setInputValue(item.label);
    setLoading(true);
    try {
      const resolved = await resolveIndiaPlace({
        placeId: item.placeId,
        address: item.label,
      });
      if (resolved) {
        onSelectPlace({
          id: `wp-${crypto.randomUUID()}`,
          label: item.primaryText || resolved.label,
          lat: resolved.lat,
          lng: resolved.lng,
          placeId: resolved.placeId || item.placeId,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEnterSubmit = async () => {
    const q = inputValue.trim();
    if (!q) return;

    if (apiSuggestions.length > 0) {
      await handleSelectSuggestion(apiSuggestions[0]);
      return;
    }

    const exactFallback = matchingFallback.find(
      (f) => f.label.toLowerCase() === q.toLowerCase()
    ) ?? matchingFallback[0];

    setLoading(true);
    try {
      const resolved = await resolveIndiaPlace({ address: q });
      if (resolved) {
        setOpen(false);
        const cleanLabel = q.length > 2 ? q : resolved.label;
        setInputValue(cleanLabel);
        onSelectPlace({
          id: `wp-${crypto.randomUUID()}`,
          label: cleanLabel,
          lat: resolved.lat,
          lng: resolved.lng,
          placeId: resolved.placeId,
        });
        return;
      }
    } finally {
      setLoading(false);
    }

    if (exactFallback) {
      setOpen(false);
      setInputValue(exactFallback.label);
      onSelectPlace({
        id: `wp-${crypto.randomUUID()}`,
        label: exactFallback.label,
        lat: exactFallback.lat,
        lng: exactFallback.lng,
      });
    }
  };

  return (
    <div ref={wrapRef} className="relative space-y-1.5">
      <label className="block text-[10px] uppercase tracking-[0.16em] text-[#8E8E98]">
        {label}
      </label>
      <div className="relative">
        <Search className="h-3.5 w-3.5 text-[#C8A97E] absolute left-3 top-3.5 pointer-events-none" />
        <input
          type="text"
          value={inputValue}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
            onTextChange?.(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleEnterSubmit();
            }
          }}
          placeholder={placeholder}
          className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] focus:border-[#C8A97E] pl-9 pr-8 text-xs text-[#F4F1EA] placeholder:text-[#6B6B75] rounded-sm focus:outline-none"
        />
        {loading && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C8A97E] absolute right-3 top-3.5" />
        )}
      </div>

      {open && (apiSuggestions.length > 0 || matchingFallback.length > 0) && (
        <div className="absolute left-0 right-0 mt-1 z-40 border border-[#2A2A30] bg-[#111114] rounded-sm shadow-2xl max-h-64 overflow-y-auto divide-y divide-[#2A2A30]/60">
          {apiSuggestions.length > 0 ? (
            <>
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[#C8A97E] bg-[#0A0A0B]">
                Google Maps Places · All India ({apiSource === 'google_server' ? 'Live' : 'Browser SDK'})
              </div>
              {apiSuggestions.map((s) => (
                <button
                  key={s.placeId}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full text-left px-3 py-2.5 hover:bg-[#1A1A1F] transition-colors flex items-start gap-2 cursor-pointer"
                >
                  <MapPin className="h-3.5 w-3.5 text-[#C8A97E] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#F4F1EA] truncate">{s.primaryText}</p>
                    {s.secondaryText && (
                      <p className="text-[10px] text-[#8E8E98] truncate">{s.secondaryText}</p>
                    )}
                  </div>
                </button>
              ))}
            </>
          ) : (
            <>
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[#8E8E98] bg-[#0A0A0B]">
                India Destinations ({fallbackPlaces.length}+ cities · type any town or address)
              </div>
              {matchingFallback.map((fp) => (
                <button
                  key={`${fp.id}-${fp.label}`}
                  type="button"
                  onClick={() => {
                    setInputValue(fp.label);
                    setOpen(false);
                    onSelectPlace({
                      id: `wp-${crypto.randomUUID()}`,
                      label: fp.label,
                      lat: fp.lat,
                      lng: fp.lng,
                    });
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#1A1A1F] transition-colors flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <MapPin className="h-3.5 w-3.5 text-[#C8A97E] shrink-0" />
                    <span className="text-xs text-[#F4F1EA] truncate">{fp.label}</span>
                  </span>
                  {fp.state && (
                    <span className="text-[10px] text-[#8E8E98] shrink-0">{fp.state}</span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
