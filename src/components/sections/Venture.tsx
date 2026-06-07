import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { loadGsap } from '@/lib/gsap-init';
import { ArrowUpRight, Gauge, Palette, Rocket, Lock } from 'lucide-react';

// Force any logo to crisp monochrome white so it sits cleanly on the black mock.
const MONO_WHITE = { filter: 'brightness(0) invert(1)' } as const;

const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Lighthouse-style score rings — monochrome to stay on-theme. Each ring fills and
// counts up to 100 when the visual scrolls into view. This is the "impress" signal:
// the same performance bar this very portfolio is held to, applied to client work.
const SCORES = [
    { key: 'performance', value: 100 },
    { key: 'accessibility', value: 100 },
    { key: 'best_practices', value: 100 },
    { key: 'seo', value: 100 },
] as const;

const RING_RADIUS = 30;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ScoreRing({ labelKey, value }: { labelKey: string; value: number }) {
    const { t } = useTranslation();
    const circleRef = useRef<SVGCircleElement>(null);
    const numberRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const circle = circleRef.current;
        const number = numberRef.current;
        if (!circle || !number) return;

        const setFinal = () => {
            circle.style.strokeDashoffset = '0';
            number.textContent = String(value);
        };

        if (prefersReducedMotion()) {
            setFinal();
            return;
        }

        circle.style.strokeDasharray = String(RING_CIRCUMFERENCE);
        circle.style.strokeDashoffset = String(RING_CIRCUMFERENCE);
        number.textContent = '0';

        let ctx: { revert: () => void } | undefined;
        loadGsap().then(({ gsap, ScrollTrigger }) => {
            if (!circle.isConnected) return;
            ctx = gsap.context(() => {
                const counter = { val: 0 };
                gsap.to(circle, {
                    strokeDashoffset: RING_CIRCUMFERENCE * (1 - value / 100),
                    duration: 1.6,
                    ease: 'power2.out',
                    scrollTrigger: { trigger: circle, start: 'top 90%', once: true },
                });
                gsap.to(counter, {
                    val: value,
                    duration: 1.6,
                    ease: 'power2.out',
                    onUpdate: () => {
                        number.textContent = String(Math.round(counter.val));
                    },
                    scrollTrigger: { trigger: circle, start: 'top 90%', once: true },
                });
                void ScrollTrigger;
            });
        });
        return () => ctx?.revert();
    }, [value]);

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-full aspect-square max-w-[60px] mx-auto">
                <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
                    <circle
                        cx="36"
                        cy="36"
                        r={RING_RADIUS}
                        fill="none"
                        strokeWidth="4"
                        className="stroke-white/10"
                    />
                    <circle
                        ref={circleRef}
                        cx="36"
                        cy="36"
                        r={RING_RADIUS}
                        fill="none"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="stroke-white"
                        style={{
                            strokeDasharray: RING_CIRCUMFERENCE,
                            strokeDashoffset: RING_CIRCUMFERENCE,
                        }}
                    />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold text-white">
                    <span ref={numberRef}>0</span>
                </span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-white/50 text-center leading-tight">
                {t(`venture.scores.${labelKey}`)}
            </span>
        </div>
    );
}

function BrowserVisual() {
    const { t } = useTranslation();
    return (
        <div className="relative w-full rounded-2xl border border-white/10 bg-black overflow-hidden shadow-2xl">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                </div>
                <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/[0.06] border border-white/10 font-mono text-[11px] text-white/60">
                        <Lock size={9} strokeWidth={2.5} />
                        {t('venture.browser_url')}
                    </div>
                </div>
            </div>

            {/* Rendered page mock */}
            <div className="relative">
                {/* Site nav — favicon mark + menu */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
                    <img
                        src="/images/tomweb-icon.png"
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                        className="h-5 w-5 object-contain"
                        style={MONO_WHITE}
                    />
                    <div className="flex gap-3.5">
                        <div className="h-1.5 w-8 rounded-full bg-white/15" />
                        <div className="h-1.5 w-8 rounded-full bg-white/15" />
                        <div className="h-1.5 w-8 rounded-full bg-white/15" />
                    </div>
                </div>

                {/* Hero — wordmark + skeleton copy + CTA */}
                <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center gap-4">
                    <img
                        src="/images/tomweb-logo.png"
                        alt="TomWeb"
                        loading="lazy"
                        decoding="async"
                        className="h-7 md:h-8 object-contain"
                        style={MONO_WHITE}
                    />
                    <div className="w-full flex flex-col items-center gap-1.5">
                        <div className="h-2 w-3/5 rounded-full bg-white/15" />
                        <div className="h-2 w-2/5 rounded-full bg-white/10" />
                    </div>
                    <div className="mt-1 h-6 w-28 rounded-full bg-white/90" />
                </div>

                {/* Lighthouse score card */}
                <div className="mx-4 mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                            {t('venture.report_label')}
                        </span>
                        <span className="font-mono text-[10px] text-white/40">Lighthouse</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 md:gap-3">
                        {SCORES.map(s => (
                            <ScoreRing key={s.key} labelKey={s.key} value={s.value} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-24 bg-white/[0.06] blur-[60px] pointer-events-none" />
        </div>
    );
}

const PILLARS = [
    { key: 'performance', icon: Gauge },
    { key: 'design', icon: Palette },
    { key: 'ship', icon: Rocket },
] as const;

export function Venture() {
    const { t } = useTranslation();
    const sectionRef = useRef<HTMLElement>(null);

    // Scroll reveal — staggered lift, consistent with the rest of the site.
    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;

        const revealTargets = Array.from(
            el.querySelectorAll<HTMLElement>('[data-reveal]')
        );

        if (prefersReducedMotion()) {
            revealTargets.forEach(t => {
                t.style.opacity = '1';
                t.style.transform = 'none';
            });
            return;
        }

        let ctx: { revert: () => void } | undefined;
        loadGsap().then(({ gsap, ScrollTrigger }) => {
            if (!el.isConnected) return;
            const start = window.innerWidth < 768 ? 'top 92%' : 'top 82%';
            ctx = gsap.context(() => {
                gsap.fromTo(
                    revealTargets,
                    { opacity: 0, y: 28 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        stagger: 0.08,
                        ease: 'power3.out',
                        scrollTrigger: { trigger: el, start, once: true },
                    }
                );
                void ScrollTrigger;
            }, el);
        });
        return () => ctx?.revert();
    }, []);

    return (
        <section ref={sectionRef} id="venture" className="py-10 md:py-16 container mx-auto px-4 cv-auto">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card/40 dark:bg-black/40 backdrop-blur-sm p-6 md:p-12">
                <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
                    {/* Left — narrative */}
                    <div className="space-y-6">
                        <span
                            data-reveal
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                            style={{ opacity: 0 }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
                            {t('venture.eyebrow')}
                        </span>

                        <h2
                            data-reveal
                            className="text-3xl md:text-5xl font-bold tracking-tight"
                            style={{ opacity: 0 }}
                        >
                            {t('venture.title')}
                        </h2>

                        <p
                            data-reveal
                            className="text-muted-foreground text-base leading-relaxed max-w-xl"
                            style={{ opacity: 0 }}
                        >
                            {t('venture.lead')}
                        </p>

                        <div className="space-y-4 pt-2">
                            {PILLARS.map(({ key, icon: Icon }) => (
                                <div
                                    key={key}
                                    data-reveal
                                    className="flex items-start gap-3"
                                    style={{ opacity: 0 }}
                                >
                                    <div className="shrink-0 mt-0.5 w-9 h-9 rounded-lg border border-border bg-secondary flex items-center justify-center">
                                        <Icon size={16} className="text-foreground" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-foreground">
                                            {t(`venture.pillars.${key}.title`)}
                                        </h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            {t(`venture.pillars.${key}.desc`)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div data-reveal style={{ opacity: 0 }}>
                            <a
                                href="https://tom-web.ch"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background font-medium text-sm hover:opacity-90 transition-opacity"
                            >
                                {t('venture.cta')}
                                <ArrowUpRight
                                    size={16}
                                    className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform"
                                />
                            </a>
                        </div>
                    </div>

                    {/* Right — Lighthouse visual */}
                    <div data-reveal style={{ opacity: 0 }}>
                        <BrowserVisual />
                    </div>
                </div>
            </div>
        </section>
    );
}
