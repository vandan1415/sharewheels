import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface CityLocation {
  slug: string;
  name: string;
  state: string;
}

export const SUPPORTED_LOCATIONS: CityLocation[] = [
  { slug: 'delhi-ncr', name: 'Delhi NCR', state: 'Delhi / Haryana / UP' },
  { slug: 'mumbai', name: 'Mumbai', state: 'Maharashtra' },
  { slug: 'bengaluru', name: 'Bengaluru', state: 'Karnataka' },
  { slug: 'hyderabad', name: 'Hyderabad', state: 'Telangana' },
  { slug: 'chennai', name: 'Chennai', state: 'Tamil Nadu' },
  { slug: 'pune', name: 'Pune', state: 'Maharashtra' },
  { slug: 'chandigarh-tricity', name: 'Chandigarh Tricity', state: 'Chandigarh / Punjab / Haryana' },
  { slug: 'jaipur', name: 'Jaipur', state: 'Rajasthan' },
];

const STORAGE_KEY = 'sharewheels_selected_city';

interface LocationContextValue {
  locations: CityLocation[];
  selectedCity: CityLocation | null;
  isModalOpen: boolean;
  openLocationModal: () => void;
  closeLocationModal: () => void;
  selectCity: (slug: string) => void;
}

const LocationContext = createContext<LocationContextValue>({
  locations: SUPPORTED_LOCATIONS,
  selectedCity: null,
  isModalOpen: false,
  openLocationModal: () => {},
  closeLocationModal: () => {},
  selectCity: () => {},
});

export function LocationProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<CityLocation[]>(SUPPORTED_LOCATIONS);
  const [selectedCity, setSelectedCity] = useState<CityLocation | null>(() => {
    try {
      const savedSlug = localStorage.getItem(STORAGE_KEY);
      if (savedSlug) {
        return SUPPORTED_LOCATIONS.find((l) => l.slug === savedSlug) ?? null;
      }
    } catch {
      // Ignore storage access restrictions
    }
    return null;
  });

  // Ask the user to pick a city on first visit if none stored yet
  const [isModalOpen, setIsModalOpen] = useState<boolean>(() => {
    try {
      return !localStorage.getItem(STORAGE_KEY);
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('locations')
      .select('slug, name, state')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLocations(data);
          setSelectedCity((prev) =>
            prev ? data.find((d) => d.slug === prev.slug) ?? prev : null
          );
        }
      });
  }, []);

  const selectCity = useCallback(
    (slug: string) => {
      const found =
        locations.find((l) => l.slug === slug) ??
        SUPPORTED_LOCATIONS.find((l) => l.slug === slug) ??
        null;
      if (!found) return;
      setSelectedCity(found);
      try {
        localStorage.setItem(STORAGE_KEY, found.slug);
      } catch {
        // Ignore storage write errors
      }
      setIsModalOpen(false);
    },
    [locations]
  );

  const openLocationModal = useCallback(() => setIsModalOpen(true), []);
  const closeLocationModal = useCallback(() => {
    if (selectedCity) setIsModalOpen(false);
  }, [selectedCity]);

  return (
    <LocationContext.Provider
      value={{
        locations,
        selectedCity,
        isModalOpen,
        openLocationModal,
        closeLocationModal,
        selectCity,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  return useContext(LocationContext);
}
