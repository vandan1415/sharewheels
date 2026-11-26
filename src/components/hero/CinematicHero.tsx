import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

gsap.registerPlugin(ScrollTrigger);

export function CinematicHero() {
  const { t } = useLanguage();
  const pinWrapperRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wordmarkWrapRef = useRef<HTMLDivElement>(null);
  const wordmarkTextRef = useRef<HTMLSpanElement>(null);
  const targetTimeRef = useRef(0);
  const durationRef = useRef(0);

  const [wordmarkFontSize, setWordmarkFontSize] = useState<number>(84);
  const [videoError, setVideoError] = useState(false);
  const [isMobileOrReduced, setIsMobileOrReduced] = useState(false);

  const fitWordmark = useCallback(() => {
    const wrap = wordmarkWrapRef.current;
    if (!wrap) return;

    const availableWidth = wrap.clientWidth * 0.92;
    if (availableWidth <= 0) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.font = '700 100px "Space Grotesk", "Sora", sans-serif';
    const baseWidth = ctx.measureText('SHAREWHEELS').width + 10 * 2;
    if (baseWidth > 0) {
      const fitted = Math.floor((availableWidth / baseWidth) * 100);
      setWordmarkFontSize(Math.max(24, Math.min(fitted, 220)));
    }
  }, []);

  useEffect(() => {
    const checkViewport = () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const mobile = window.innerWidth < 768;
      setIsMobileOrReduced(reduced || mobile);
      fitWordmark();
    };
    checkViewport();

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => fitWordmark());
    });
    if (wordmarkWrapRef.current) ro.observe(wordmarkWrapRef.current);

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => fitWordmark());
    }

    window.addEventListener('resize', checkViewport);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', checkViewport);
    };
  }, [fitWordmark]);

  useEffect(() => {
    const pinWrapper = pinWrapperRef.current;
    const video = videoRef.current;
    const section = sectionRef.current;
    const wordmark = wordmarkTextRef.current;

    if (!pinWrapper || !video || !section || !wordmark) return;

    let rafId = 0;
    let isMounted = true;

    const handleLoadedMetadata = () => {
      if (!isMounted) return;
      if (Number.isFinite(video.duration) && video.duration > 0) {
        durationRef.current = video.duration;
      }
      if (!isMobileOrReduced) {
        video.pause();
        video.currentTime = 0;
      }
      ScrollTrigger.refresh();
    };

    const handleError = () => {
      if (isMounted) setVideoError(true);
    };

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
    }
    video.addEventListener('error', handleError);

    if (isMobileOrReduced) {
      return () => {
        isMounted = false;
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('error', handleError);
      };
    }

    const tick = () => {
      if (!isMounted) return;
      const dur = durationRef.current || video.duration || 0;
      const safeMax = Math.max(0, dur - 0.12);
      if (safeMax > 0 && !video.seeking) {
        const clampedTarget = Math.min(Math.max(targetTimeRef.current, 0), safeMax);
        if (Math.abs(video.currentTime - clampedTarget) > 0.015) {
          video.currentTime = clampedTarget;
        }
        section.setAttribute('data-video-time', video.currentTime.toFixed(3));
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinWrapper,
          start: 'top top',
          end: '+=2800',
          pin: true,
          pinSpacing: true,
          scrub: 0.35,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const dur = durationRef.current || video.duration || 0;
            const safeMax = Math.max(0, dur - 0.12);
            const videoProgress = Math.min(self.progress / 0.85, 1);
            targetTimeRef.current = videoProgress * safeMax;
            section.setAttribute('data-scroll-progress', self.progress.toFixed(4));
          },
        },
      });

      tl.fromTo(
        wordmark,
        { yPercent: 6 },
        { yPercent: -2, duration: 0.85, ease: 'none' },
        0
      );
      tl.to(wordmark, { yPercent: -2, duration: 0.15, ease: 'none' }, 0.85);
    }, pinWrapper);

    return () => {
      isMounted = false;
      cancelAnimationFrame(rafId);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      ctx.revert();
    };
  }, [isMobileOrReduced]);

  return (
    <div ref={pinWrapperRef} className="relative w-full bg-[#0A0A0B]">
      <section
        ref={sectionRef}
        data-scroll-progress="0"
        data-video-time="0"
        className="relative h-screen w-full overflow-hidden bg-[#0A0A0B]"
      >
        {/* Layer 1 & 2 (Background concrete environment + Middle-layer emerging luxury sedan) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {!videoError ? (
            <video
              ref={videoRef}
              src="/videos/sharewheels-hero.mp4"
              muted
              playsInline
              preload="auto"
              autoPlay={isMobileOrReduced}
              loop={isMobileOrReduced}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#111114] text-xs uppercase tracking-[0.2em] text-[#8E8E98]">
              Hero media unavailable
            </div>
          )}
        </div>

        {/* Subtle top/bottom vignette keeping car bright and HUD readable */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-[#0A0A0B]/55 via-transparent to-[#0A0A0B]/88" />

        {/* Layer 3 (Foreground IN FRONT OF THE CAR): Solid, opaque concrete-grey SHAREWHEELS */}
        <div
          ref={wordmarkWrapRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[44%] -translate-y-1/2 z-20 flex items-center justify-center px-4 select-none"
        >
          <span
            ref={wordmarkTextRef}
            style={{ fontSize: `${wordmarkFontSize}px` }}
            className="font-display font-bold uppercase leading-[0.88] tracking-[0.02em] text-[#7D7D84] whitespace-nowrap"
          >
            SHAREWHEELS
          </span>
        </div>

        {/* Layer 4 (Minimal Editorial HUD) */}
        <div className="relative z-30 mx-auto flex h-full max-w-[1400px] flex-col justify-end px-6 pb-12 pt-24 lg:px-10 lg:pb-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3 max-w-2xl">
              <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-semibold uppercase tracking-[-0.03em] text-[#F4F1EA] leading-[0.95]">
                {t('hero.headline')}
              </h1>
              <p className="text-sm sm:text-base text-[#E8E4DC]/85 tracking-wide">
                {t('hero.tagline')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/explore">
                <Button variant="primary" size="lg">
                  {t('hero.exploreCta')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link to="/owner">
                <Button variant="champagne" size="lg">
                  {t('hero.listVehicleCta')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
