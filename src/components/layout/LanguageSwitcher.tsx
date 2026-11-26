import { useEffect, useRef, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';

export function LanguageSwitcher({
  align = 'right',
  className,
}: {
  align?: 'left' | 'right';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const { language, setLanguage, languageMeta, t } = useLanguage();

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('nav.selectLanguage')}
        aria-expanded={open}
        className="inline-flex items-center gap-1 border border-[#2A2A30] bg-[#111114]/90 hover:border-[#C8A97E] px-2 sm:px-2.5 py-1.5 rounded-sm text-[10px] sm:text-[11px] tracking-[0.06em] text-[#F4F1EA] transition-colors cursor-pointer whitespace-nowrap"
      >
        <Globe className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#C8A97E] shrink-0" />
        <span>{languageMeta.shortLabel}</span>
      </button>

      {open && (
        <div
          className={cn(
            'absolute mt-3 w-64 rounded-sm border border-[#2A2A30] bg-[#111114] p-2 shadow-2xl z-50',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <div className="border-b border-[#2A2A30] px-2 pb-2 mb-1.5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#C8A97E]">
              {t('nav.selectLanguage')}
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto flex flex-col gap-0.5">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const active = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex items-center justify-between px-2.5 py-2 rounded-sm text-left transition-colors cursor-pointer',
                    active
                      ? 'bg-[#C8A97E]/15 text-[#F4F1EA]'
                      : 'hover:bg-[#1A1A1F] text-[#E8E4DC]'
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium leading-tight">{lang.nativeLabel}</p>
                    <p className="text-[10px] text-[#8E8E98] truncate">
                      {lang.label} · {lang.region}
                    </p>
                  </div>
                  {active && <Check className="h-3.5 w-3.5 text-[#C8A97E] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
