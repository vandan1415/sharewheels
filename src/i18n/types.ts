export type LanguageCode = 'en' | 'hi' | 'mr' | 'kn' | 'pa' | 'bn' | 'te' | 'ta';

export type LocaleDictionary = Record<string, string>;
export type LocaleBundle<K extends string = string> = Record<LanguageCode, Record<K, string>>;

export interface LanguageMeta {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  shortLabel: string;
  region: string;
  bcp47: string;
}

export const SUPPORTED_LANGUAGES: readonly LanguageMeta[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', shortLabel: 'EN', region: 'Pan-India', bcp47: 'en-IN' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', shortLabel: 'हिं', region: 'Pan-India', bcp47: 'hi-IN' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', shortLabel: 'मरा', region: 'Maharashtra', bcp47: 'mr-IN' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', shortLabel: 'ಕನ್ನ', region: 'Karnataka', bcp47: 'kn-IN' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ', shortLabel: 'ਪੰਜਾ', region: 'Punjab & Chandigarh', bcp47: 'pa-IN' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', shortLabel: 'বাং', region: 'West Bengal', bcp47: 'bn-IN' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', shortLabel: 'తెలు', region: 'Telangana & AP', bcp47: 'te-IN' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', shortLabel: 'தமி', region: 'Tamil Nadu', bcp47: 'ta-IN' },
] as const;

export const LANGUAGE_STORAGE_KEY = 'sharewheels_lang';

export function isSupportedLanguage(value: string | null | undefined): value is LanguageCode {
  return SUPPORTED_LANGUAGES.some((lang) => lang.code === value);
}

export function getLanguageMeta(code: LanguageCode): LanguageMeta {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code) ?? SUPPORTED_LANGUAGES[0];
}

let activeLanguage: LanguageCode = (() => {
  try {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (isSupportedLanguage(saved)) return saved;
    }
  } catch {
    // Ignore storage access restrictions
  }
  return 'en';
})();

export function getCurrentLanguage(): LanguageCode {
  return activeLanguage;
}

export function setCurrentLanguageInternal(code: LanguageCode): void {
  activeLanguage = code;
}
