import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  formatCurrencyINR,
  formatLocaleDate,
  formatLocaleDateTime,
  formatLocaleNumber,
  getLanguageMeta,
  isSupportedLanguage,
  LANGUAGE_STORAGE_KEY,
  setCurrentLanguageInternal,
  translateCategory,
  translateCity,
  translateFuel,
  translateKey,
  translateRuleOrHighlight,
  translateState,
  translateStatus,
  translateTerrain,
  translateTransmission,
  translateVehicleDescription,
  type LanguageCode,
  type LanguageMeta,
  type TranslationKey,
} from '@/lib/i18n';

export interface DynamicTranslators {
  city: (val: string | null | undefined) => string;
  state: (val: string | null | undefined) => string;
  category: (val: string | null | undefined) => string;
  fuel: (val: string | null | undefined) => string;
  transmission: (val: string | null | undefined) => string;
  status: (val: string | null | undefined) => string;
  terrain: (val: string | null | undefined) => string;
  rule: (item: string, isDemo?: boolean) => string;
  vehicleDescription: (
    description: string | null | undefined,
    isDemo: boolean | undefined,
    meta: {
      name: string;
      category?: string;
      seats?: number;
      transmission?: string;
      fuelType?: string;
      location?: string;
    }
  ) => string;
}

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  languageMeta: LanguageMeta;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  td: DynamicTranslators;
  formatPrice: (amount: number) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (dateInput: string | number | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (dateInput: string | number | Date | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function resolveInitialLanguage(): LanguageCode {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguage(saved)) {
      setCurrentLanguageInternal(saved);
      return saved;
    }
  } catch {
    // Ignore storage access restrictions
  }
  setCurrentLanguageInternal('en');
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(resolveInitialLanguage);

  // Sync module-level language immediately during render so child formatters see the new language synchronously
  setCurrentLanguageInternal(language);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Ignore storage write errors
    }
  }, [language]);

  const setLanguage = useCallback((code: LanguageCode) => {
    setCurrentLanguageInternal(code);
    setLanguageState(code);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      return translateKey(language, key, params);
    },
    [language]
  );

  const td = useMemo<DynamicTranslators>(
    () => ({
      city: (val) => translateCity(val, language),
      state: (val) => translateState(val, language),
      category: (val) => translateCategory(val, language),
      fuel: (val) => translateFuel(val, language),
      transmission: (val) => translateTransmission(val, language),
      status: (val) => translateStatus(val, language),
      terrain: (val) => translateTerrain(val, language),
      rule: (item, isDemo) => translateRuleOrHighlight(item, isDemo, language),
      vehicleDescription: (description, isDemo, meta) =>
        translateVehicleDescription(description, isDemo, meta, language),
    }),
    [language]
  );

  const formatPrice = useCallback((amount: number) => formatCurrencyINR(amount, language), [language]);
  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => formatLocaleNumber(value, language, options),
    [language]
  );
  const formatDate = useCallback(
    (dateInput: string | number | Date | null | undefined, options?: Intl.DateTimeFormatOptions) =>
      formatLocaleDate(dateInput, language, options),
    [language]
  );
  const formatDateTime = useCallback(
    (dateInput: string | number | Date | null | undefined) => formatLocaleDateTime(dateInput, language),
    [language]
  );

  const languageMeta = getLanguageMeta(language);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        languageMeta,
        t,
        td,
        formatPrice,
        formatNumber,
        formatDate,
        formatDateTime,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
