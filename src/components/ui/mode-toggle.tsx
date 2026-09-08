import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/ui/theme-provider';
import { useCallback, useState, useEffect, useRef } from 'react';
import { loadGsap, getGsap } from '@/lib/gsap-init';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const sunRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    loadGsap(); // preload
  }, []);

  // Resolve the actual applied theme (system → infer from DOM class)
  const resolvedDark = mounted
    ? theme === 'dark' ||
      (theme === 'system' && document.documentElement.classList.contains('dark'))
    : false;

  // Animate icon swap
  useEffect(() => {
    if (!mounted) return;
    const gsap = getGsap();
    if (!gsap) {
      // gsap not loaded yet, try async
      loadGsap().then(({ gsap: g }) => {
        if (sunRef.current)
          g.to(sunRef.current, {
            scale: resolvedDark ? 0 : 1,
            rotate: resolvedDark ? 90 : 0,
            opacity: resolvedDark ? 0 : 1,
            duration: 0.35,
            ease: 'back.out(1.7)',
          });
        if (moonRef.current)
          g.to(moonRef.current, {
            scale: resolvedDark ? 1 : 0,
            rotate: resolvedDark ? 0 : -90,
            opacity: resolvedDark ? 1 : 0,
            duration: 0.35,
            ease: 'back.out(1.7)',
          });
      });
      return;
    }
    if (sunRef.current)
      gsap.to(sunRef.current, {
        scale: resolvedDark ? 0 : 1,
        rotate: resolvedDark ? 90 : 0,
        opacity: resolvedDark ? 0 : 1,
        duration: 0.35,
        ease: 'back.out(1.7)',
      });
    if (moonRef.current)
      gsap.to(moonRef.current, {
        scale: resolvedDark ? 1 : 0,
        rotate: resolvedDark ? 0 : -90,
        opacity: resolvedDark ? 1 : 0,
        duration: 0.35,
        ease: 'back.out(1.7)',
      });
  }, [resolvedDark, mounted]);

  const handleToggle = useCallback(() => {
    const newTheme = resolvedDark ? 'light' : 'dark';

    // Use native View Transitions API if supported
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (
        document as unknown as { startViewTransition: (cb: () => void) => void }
      ).startViewTransition(() => {
        setTheme(newTheme);
      });
    } else {
      setTheme(newTheme);
    }
  }, [resolvedDark, setTheme]);

  return (
    <button
      onClick={handleToggle}
      className="relative flex items-center justify-center p-2 md:p-3 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all duration-300 overflow-hidden cursor-pointer"
      aria-label="Toggle theme"
      suppressHydrationWarning
    >
      <div
        ref={sunRef}
        className="absolute"
        style={{
          scale: mounted && !resolvedDark ? 1 : 0,
          opacity: mounted && !resolvedDark ? 1 : 0,
        }}
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </div>

      <div
        ref={moonRef}
        className="absolute"
        style={{ scale: mounted && resolvedDark ? 1 : 0, opacity: mounted && resolvedDark ? 1 : 0 }}
      >
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      </div>

      {/* Invisible spacer to maintain size */}
      <div className="w-[1.2rem] h-[1.2rem] opacity-0" />

      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
