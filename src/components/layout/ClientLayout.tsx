import { lazy, Suspense, useState, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type Lenis from 'lenis';

// Lazy-load non-LCP shell components to reduce sync JS on the main thread
const Navbar = lazy(() => import('@/components/layout/Navbar').then(m => ({ default: m.Navbar })));
const Footer = lazy(() => import('@/components/layout/Footer').then(m => ({ default: m.Footer })));
const ScrollProgress = lazy(() =>
  import('@/components/ui/scroll-progress').then(m => ({ default: m.ScrollProgress }))
);
const AskThomas = lazy(() =>
  import('@/components/ui/ask-thomas').then(m => ({ default: m.AskThomas }))
);

function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefers(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefers(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return prefers;
}

// Initialise Lenis imperatively — no wrapper component, no remount
function useDeferredLenis(disabled: boolean) {
  useEffect(() => {
    if (disabled) return;
    let lenis: Lenis | null = null;
    let raf: number;

    import('lenis').then(({ default: Lenis }) => {
      lenis = new Lenis();
      const loop = (time: number) => {
        lenis!.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });

    return () => {
      if (lenis) lenis.destroy();
      cancelAnimationFrame(raf);
    };
  }, [disabled]);
}

export function ClientLayout({ children }: { children: ReactNode }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const { t } = useTranslation();

  useDeferredLenis(shouldReduceMotion);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground focus:border focus:border-border focus:top-4 focus:left-4 rounded-md transition-transform"
        suppressHydrationWarning
      >
        {t('skip_content')}
      </a>
      <Suspense>
        <ScrollProgress />
      </Suspense>

      <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-indigo-500/30">
        <div className="fixed inset-0 z-[-1]">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none opacity-50" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[80px] pointer-events-none opacity-50" />
          <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20 brightness-100 pointer-events-none mix-blend-overlay" />
        </div>

        <Suspense>
          <Navbar />
        </Suspense>
        {children}
        <Suspense>
          <Footer />
        </Suspense>
        <Suspense>
          <AskThomas />
        </Suspense>
      </div>
    </>
  );
}
