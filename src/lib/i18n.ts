import {
  getCurrentLanguage,
  getLanguageMeta,
  isSupportedLanguage,
  LANGUAGE_STORAGE_KEY,
  setCurrentLanguageInternal,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
  type LanguageMeta,
} from '@/i18n/types';
import { commonTranslations } from '@/i18n/locales/common';
import { marketplaceTranslations } from '@/i18n/locales/marketplace';
import { routecraftTranslations } from '@/i18n/locales/routecraft';
import { wheelmateTranslations } from '@/i18n/locales/wheelmate';
import { customerAuthInfoTranslations } from '@/i18n/locales/customerAuthInfo';
import { ownerTranslations } from '@/i18n/locales/owner';
import { adminTranslations } from '@/i18n/locales/admin';

export {
  getCurrentLanguage,
  getLanguageMeta,
  isSupportedLanguage,
  LANGUAGE_STORAGE_KEY,
  setCurrentLanguageInternal,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
  type LanguageMeta,
};

export {
  formatCurrencyINR,
  formatDurationUnits,
  formatLocaleDate,
  formatLocaleDateTime,
  formatLocaleNumber,
  formatMinutesLocalized,
  translateCategory,
  translateCity,
  translateFuel,
  translateRuleOrHighlight,
  translateState,
  translateStatus,
  translateTerrain,
  translateTransmission,
  translateVehicleDescription,
} from '@/i18n/dynamic';

function buildLangDict(lang: LanguageCode) {
  return {
    ...commonTranslations[lang],
    ...marketplaceTranslations[lang],
    ...routecraftTranslations[lang],
    ...wheelmateTranslations[lang],
    ...customerAuthInfoTranslations[lang],
    ...ownerTranslations[lang],
    ...adminTranslations[lang],
  };
}

export const TRANSLATIONS = {
  en: {
    ...commonTranslations.en,
    ...marketplaceTranslations.en,
    ...routecraftTranslations.en,
    ...wheelmateTranslations.en,
    ...customerAuthInfoTranslations.en,
    ...ownerTranslations.en,
    ...adminTranslations.en,
  },
  hi: buildLangDict('hi'),
  mr: buildLangDict('mr'),
  kn: buildLangDict('kn'),
  pa: buildLangDict('pa'),
  bn: buildLangDict('bn'),
  te: buildLangDict('te'),
  ta: buildLangDict('ta'),
} as const;

export type StrictTranslationKey = keyof typeof TRANSLATIONS.en;
export type TranslationKey = StrictTranslationKey | (string & {});

const warnedMissingKeys = new Set<string>();

export function translateKey(
  language: LanguageCode,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const langDict = TRANSLATIONS[language] as Record<string, string> | undefined;
  const enDict = TRANSLATIONS.en as Record<string, string>;
  let raw = langDict?.[key];

  if (raw === undefined) {
    if (import.meta.env.DEV) {
      const warnId = `${language}:${key}`;
      if (!warnedMissingKeys.has(warnId)) {
        warnedMissingKeys.add(warnId);
        // Development-time missing translation key warning
        console.warn(`[i18n] Missing translation key "${key}" for language "${language}"`);
      }
    }
    raw = enDict[key] ?? key;
  }

  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, token: string) =>
    params[token] !== undefined && params[token] !== null ? String(params[token]) : `{${token}}`
  );
}
