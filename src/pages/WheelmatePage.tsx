import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  ArrowRightLeft,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  RefreshCw,
  Route,
  Send,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useLocationContext } from '@/context/LocationContext';
import { formatDurationMinutes } from '@/lib/routecraft';
import { Button } from '@/components/ui/button';
import { VehicleImage } from '@/components/ui/VehicleImage';

interface WheelmateRoutePlan {
  origin: string;
  destination: string;
  tripDays: number;
  passengers: number;
  maxTotalBudgetInr: number | null;
  distanceKm: number;
  durationMinutes: number;
  distanceSource: string;
  tollInr: number | null;
  plannerUrl: string;
}

interface ChatSource {
  title: string;
  url: string;
}

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  isWelcomeMessage?: boolean;
  sources?: ChatSource[];
  usedWebSearch?: boolean;
}

interface MatchedDbVehicle {
  id: string;
  slug: string;
  name: string;
  variant?: string;
  location: string;
  price_per_day_paise: number;
  seats: number;
  transmission: string;
  fuel_type: string;
  drivetrain?: string;
  image_url: string;
  vehicle_categories?: { name: string };
}

function renderFormattedText(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-[#F4F1EA]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export function WheelmatePage() {
  const { session } = useAuth();
  const { language, languageMeta, t, td, formatPrice, formatNumber } = useLanguage();
  const { selectedCity, openLocationModal, selectCity } = useLocationContext();

  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatTurn[]>([
    { role: 'assistant', content: '', isWelcomeMessage: true },
  ]);
  const [vehicles, setVehicles] = useState<MatchedDbVehicle[]>([]);
  const [routePlan, setRoutePlan] = useState<WheelmateRoutePlan | null>(null);
  const [suggestedSwitch, setSuggestedSwitch] = useState<{ slug: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<{ code: string; serverMessage?: string } | null>(null);
  const [lastUserPrompt, setLastUserPrompt] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const suggestedPrompts = [
    t('wheelmate.prompt1'),
    t('wheelmate.prompt2'),
    t('wheelmate.prompt3'),
    t('wheelmate.prompt4'),
    t('wheelmate.prompt5'),
    t('wheelmate.prompt6'),
  ];

  const followUpPrompts = [
    t('wheelmate.followup1'),
    t('wheelmate.followup2'),
    t('wheelmate.followup3'),
    t('wheelmate.followup4'),
  ];

  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [history, loading]);

  const resolveErrorMessage = (err: { code: string; serverMessage?: string }): string => {
    switch (err.code) {
      case 'CONFIGURATION_REQUIRED':
        return t('wheelmate.error.CONFIGURATION_REQUIRED');
      case 'GEMINI_API_KEY_NOT_CONFIGURED':
        return t('wheelmate.error.GEMINI_API_KEY_NOT_CONFIGURED');
      case 'CONNECTION_ERROR':
        return t('wheelmate.error.CONNECTION_ERROR');
      case 'RATE_LIMITED':
      case 'GEMINI_RATE_LIMITED':
      case 'HTTP_429':
        return t('wheelmate.error.RATE_LIMITED');
      case 'GEMINI_BUSY':
      case 'HTTP_503':
      case 'HTTP_504':
        return t('wheelmate.error.GEMINI_BUSY');
      default:
        return language === 'en' && err.serverMessage
          ? err.serverMessage
          : t('wheelmate.error.DEFAULT');
    }
  };

  const localizeDistanceSource = (source: string): string => {
    if (source.startsWith('Google Routes API')) {
      return t('wheelmate.distanceSource.googleRoutes');
    }
    if (source.startsWith('Coordinate corridor estimate')) {
      return t('wheelmate.distanceSource.corridorEstimate');
    }
    if (source.startsWith('Default corridor estimate')) {
      return t('wheelmate.distanceSource.defaultEstimate');
    }
    return source;
  };

  const sendMessage = async (text: string, baseHistory?: ChatTurn[]) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const currentHistory = baseHistory ?? history;
    const userTurn: ChatTurn = { role: 'user', content: trimmed };
    const nextHistory = [...currentHistory, userTurn];
    const cleanTurns = nextHistory
      .filter((turn) => !turn.isWelcomeMessage)
      .map(({ role, content }) => ({ role, content }));

    const apiMessages = cleanTurns.map((msg, idx) => {
      if (idx === cleanTurns.length - 1 && msg.role === 'user' && language !== 'en') {
        return {
          role: msg.role,
          content: `${msg.content}\n\n[User interface language: ${languageMeta.label} (${languageMeta.nativeLabel}). Respond naturally in ${languageMeta.label} unless the user explicitly asks you to reply in a different language. Keep vehicle brand/model names, city slugs for internal filters, and ₹ INR prices accurate.]`,
        };
      }
      return msg;
    });

    setHistory(nextHistory);
    setInput('');
    setErrorState(null);
    setSuggestedSwitch(null);
    setLoading(true);
    setLastUserPrompt(trimmed);

    try {
      if (!supabase) {
        setErrorState({ code: 'CONFIGURATION_REQUIRED' });
        return;
      }

      const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const pubKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      const authToken = session?.access_token ?? pubKey;

      const res = await fetch(`${baseUrl}/functions/v1/ai-mobility-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: pubKey,
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          selectedCitySlug: selectedCity?.slug ?? null,
          selectedLanguage: language,
          selectedLanguageLabel: languageMeta.label,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorState({
          code: body.error || `HTTP_${res.status}`,
          serverMessage: typeof body.message === 'string' ? body.message : undefined,
        });
        return;
      }

      setHistory([
        ...nextHistory,
        {
          role: 'assistant',
          content: body.reply,
          usedWebSearch: Boolean(body.usedWebSearch),
          sources: Array.isArray(body.sources) ? body.sources : undefined,
        },
      ]);
      setVehicles(body.vehicles ?? []);
      setRoutePlan(body.routePlan ?? null);
      setSuggestedSwitch(body.suggestedCitySwitch ?? null);
    } catch {
      setErrorState({ code: 'CONNECTION_ERROR' });
    } finally {
      setLoading(false);
    }
  };

  const retryLast = () => {
    if (!lastUserPrompt || loading) return;
    const trimmedHistory =
      history[history.length - 1]?.role === 'user' ? history.slice(0, -1) : history;
    sendMessage(lastUserPrompt, trimmedHistory);
  };

  const resetChat = () => {
    setHistory([{ role: 'assistant', content: '', isWelcomeMessage: true }]);
    setVehicles([]);
    setRoutePlan(null);
    setSuggestedSwitch(null);
    setErrorState(null);
    setLastUserPrompt(null);
  };

  const hasUserTurns = history.some((turn) => turn.role === 'user');
  const translatedSwitchCity = suggestedSwitch ? td.city(suggestedSwitch.name) : '';

  return (
    <main className="min-h-screen bg-[#0A0A0B] pt-24 pb-24">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#2A2A30] pb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#C8A97E]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('wheelmate.eyebrow')}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-[-0.025em] text-[#F4F1EA]">
              {t('wheelmate.subtitle')}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={openLocationModal}
              className="inline-flex items-center gap-2 border border-[#2A2A30] bg-[#111114] px-3 py-2 rounded-sm text-xs text-[#E8E4DC] hover:border-[#C8A97E] cursor-pointer"
            >
              <MapPin className="h-3.5 w-3.5 text-[#C8A97E]" />
              <span>{selectedCity ? td.city(selectedCity.name) : t('wheelmate.selectLocation')}</span>
            </button>
            {hasUserTurns && (
              <button
                type="button"
                onClick={resetChat}
                className="text-xs uppercase tracking-[0.16em] text-[#8E8E98] hover:text-[#F4F1EA] cursor-pointer"
              >
                {t('wheelmate.newChat')}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <aside className="lg:col-span-4 space-y-6">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8E8E98]">
                {t('wheelmate.tryAsking')}
              </p>
              <div className="divide-y divide-[#2A2A30] border-y border-[#2A2A30]">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={loading}
                    onClick={() => sendMessage(prompt)}
                    className="w-full flex items-center justify-between gap-3 py-3.5 text-left text-xs sm:text-sm text-[#E8E4DC] hover:text-[#C8A97E] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <span>{prompt}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#8E8E98]" />
                  </button>
                ))}
              </div>
            </div>

            {vehicles.length > 0 && (
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8E8E98]">
                  {t('wheelmate.refineResults')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {followUpPrompts.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={loading}
                      onClick={() => sendMessage(chip)}
                      className="border border-[#2A2A30] bg-[#111114] px-3 py-1.5 text-[11px] text-[#E8E4DC] hover:border-[#C8A97E] hover:text-[#C8A97E] transition-colors cursor-pointer rounded-sm"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <div className="lg:col-span-8 space-y-8">
            <div className="border border-[#2A2A30] bg-[#111114] rounded-sm flex flex-col">
              <div
                ref={chatScrollRef}
                className="p-6 space-y-5 min-h-[280px] max-h-[460px] overflow-y-auto"
              >
                {history.map((turn, idx) => {
                  const contentToRender = turn.isWelcomeMessage
                    ? t('wheelmate.welcome')
                    : turn.content;
                  return (
                    <div
                      key={idx}
                      className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-3.5 text-sm leading-relaxed rounded-sm ${
                          turn.role === 'user'
                            ? 'bg-[#1A1A1F] border border-[#2A2A30] text-[#F4F1EA]'
                            : 'bg-[#0A0A0B] border border-[#2A2A30] text-[#E8E4DC]'
                        }`}
                      >
                        <span className="block text-[10px] uppercase tracking-[0.16em] text-[#C8A97E] mb-1.5">
                          {turn.role === 'user' ? t('wheelmate.you') : t('wheelmate.eyebrow')}
                        </span>
                        <div className="whitespace-pre-line">
                          {renderFormattedText(contentToRender)}
                        </div>
                        {turn.sources && turn.sources.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-[#2A2A30]/70 space-y-1.5">
                            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                              <Globe className="h-3 w-3 text-[#C8A97E]" />
                              {t('wheelmate.webSources')}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {turn.sources.map((src, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 border border-[#2A2A30] bg-[#111114] px-2 py-1 rounded-sm text-[11px] text-[#E8E4DC] hover:border-[#C8A97E] hover:text-[#C8A97E] transition-colors max-w-[240px]"
                                >
                                  <span className="truncate">{src.title}</span>
                                  <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex items-center gap-2.5 text-xs text-[#C8A97E] px-1">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('wheelmate.thinking')}</span>
                  </div>
                )}

                {suggestedSwitch && (
                  <div className="border border-[#C8A97E]/40 bg-[#C8A97E]/5 p-4 rounded-sm flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-[#E8E4DC]">
                      {renderFormattedText(
                        t('wheelmate.citySwitchNotice', { city: translatedSwitchCity })
                      )}
                    </p>
                    <Button
                      variant="champagne"
                      size="sm"
                      onClick={() => {
                        selectCity(suggestedSwitch.slug);
                        setSuggestedSwitch(null);
                      }}
                    >
                      {t('wheelmate.switchToCity', { city: translatedSwitchCity })}
                    </Button>
                  </div>
                )}

                {errorState && (
                  <div className="border border-red-500/40 bg-red-950/20 p-4 rounded-sm space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-red-300">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errorState.code}</span>
                    </div>
                    <p className="text-xs text-[#E8E4DC]/90 leading-relaxed">
                      {resolveErrorMessage(errorState)}
                    </p>
                    <Button variant="outline" size="sm" onClick={retryLast}>
                      <RefreshCw className="h-3 w-3" />
                      {t('wheelmate.retry')}
                    </Button>
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="border-t border-[#2A2A30] bg-[#0A0A0B] p-3 flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('wheelmate.inputPlaceholder')}
                  className="flex-1 h-11 bg-transparent px-3 text-sm text-[#F4F1EA] placeholder:text-[#8E8E98] focus:outline-none"
                />
                <Button type="submit" variant="champagne" disabled={loading || !input.trim()}>
                  <Send className="h-3.5 w-3.5" />
                  {t('wheelmate.send')}
                </Button>
              </form>
            </div>

            {routePlan && (
              <div className="border border-[#C8A97E]/50 bg-[#111114] p-5 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[#C8A97E]">
                    <Route className="h-3.5 w-3.5" />
                    {t('wheelmate.routecraftMatch')}
                  </p>
                  <p className="font-display text-lg font-medium text-[#F4F1EA]">
                    {td.city(routePlan.origin)} → {td.city(routePlan.destination)} ·{' '}
                    {formatNumber(routePlan.distanceKm)} {t('wheelmate.km')} (
                    {formatDurationMinutes(routePlan.durationMinutes)})
                  </p>
                  <p className="text-xs text-[#8E8E98]">
                    {t('wheelmate.tripMeta', {
                      days: formatNumber(routePlan.tripDays),
                      passengers: formatNumber(routePlan.passengers),
                    })}{' '}
                    · {localizeDistanceSource(routePlan.distanceSource)}
                  </p>
                </div>
                <Link to={routePlan.plannerUrl} className="shrink-0">
                  <Button variant="champagne">
                    {t('wheelmate.openInRoutecraft')}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            )}

            {vehicles.length > 0 && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2A30] pb-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#E8E4DC]">
                    {t('wheelmate.recommendedVehicles', { count: formatNumber(vehicles.length) })}
                  </p>
                  {vehicles.length >= 2 && (
                    <Link
                      to={`/compare?slugs=${vehicles.slice(0, 3).map((v) => v.slug).join(',')}`}
                      className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[#C8A97E] hover:underline"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      {t('wheelmate.compareMatched')}
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {vehicles.map((v) => (
                    <Link
                      key={v.id}
                      to={`/vehicles/${v.slug}`}
                      className="group border border-[#2A2A30] bg-[#111114] rounded-sm overflow-hidden hover:border-[#C8A97E]/70 transition-colors flex flex-col"
                    >
                      <div className="aspect-[16/10] bg-[#1A1A1F] overflow-hidden">
                        <VehicleImage
                          src={v.image_url}
                          alt={v.name}
                          label={v.variant ? `${v.name} (${v.variant})` : v.name}
                          className="h-full w-full"
                        />
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1.5">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-[#C8A97E]">
                            {v.vehicle_categories?.name
                              ? td.category(v.vehicle_categories.name)
                              : t('wheelmate.available')}
                            {v.drivetrain ? ` · ${v.drivetrain}` : ''}
                          </p>
                          <h2 className="font-display text-lg font-medium text-[#F4F1EA] group-hover:text-[#C8A97E] transition-colors">
                            {v.name}
                          </h2>
                          <p className="flex items-center gap-1.5 text-xs text-[#8E8E98]">
                            <MapPin className="h-3 w-3 text-[#C8A97E]/70" />
                            {td.city(v.location)} · {formatNumber(v.seats)} {t('wheelmate.seats')} ·{' '}
                            {td.transmission(v.transmission)} · {td.fuel(v.fuel_type)}
                          </p>
                        </div>
                        <div className="border-t border-[#2A2A30] pt-3 flex items-center justify-between">
                          <span className="font-display text-base font-semibold text-[#F4F1EA]">
                            {formatPrice(Math.round(v.price_per_day_paise / 100))}
                            <span className="text-xs font-normal text-[#8E8E98]">
                              {' '}
                              {t('wheelmate.perDay')}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-[#C8A97E]">
                            {t('wheelmate.viewVehicle')}
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
