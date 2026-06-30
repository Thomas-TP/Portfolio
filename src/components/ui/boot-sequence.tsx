import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'boot-played';
const TOTAL_MS = 650;
const EXIT_MS = 220;

interface BootSequenceProps {
  onExitStart?: () => void;
  onComplete?: () => void;
}

/**
 * One-shot branded boot screen — runs once per session on first load.
 * Renders nothing on subsequent navigation/page reloads within the same tab.
 *
 * Self-contained: mounts overlay, animates, then unmounts.
 */
export function BootSequence({ onExitStart, onComplete }: BootSequenceProps) {
  const [shouldRender, setShouldRender] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(STORAGE_KEY) !== '1';
  });
  const [counter, setCounter] = useState(0);
  const [exiting, setExiting] = useState(false);
  const blipTimeRef = useRef(0);

  useEffect(() => {
    if (!shouldRender) return;

    // Lock body scroll for the duration
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / TOTAL_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const value = Math.round(eased * 100);
      setCounter(value);

      // Tiny blip every ~25 units of progress (4 blips total)
      if (value > blipTimeRef.current && value % 25 === 0 && value > 0 && value < 100) {
        blipTimeRef.current = value;
      }

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setExiting(true);
        onExitStart?.();
        setTimeout(() => {
          sessionStorage.setItem(STORAGE_KEY, '1');
          setShouldRender(false);
          document.body.style.overflow = prevOverflow;
          onComplete?.();
        }, EXIT_MS);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
    };
  }, [onComplete, onExitStart, shouldRender]);

  if (!shouldRender) return null;

  // Stroke-dasharray trick for path tracing.
  // T glyph path (35,35 → 65,35 horizontal, then 50,35 → 50,65 vertical)
  // Pre-computed lengths: horizontal = 30, vertical = 30, circle ≈ 251.3
  const traceLength = 320;
  const progress = counter / 100;
  const status = counter < 28 ? 'INIT' : counter < 62 ? 'SYNC' : counter < 92 ? 'RENDER' : 'READY';

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-background transition-all duration-[820ms] ease-out ${exiting ? 'opacity-0 pointer-events-none scale-[1.03] blur-md' : 'opacity-100 scale-100 blur-0'}`}
      aria-hidden="true"
      style={{ contain: 'strict' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgb(var(--foreground)/0.10)_0%,transparent_34%,rgb(var(--background))_72%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgb(var(--foreground)/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--foreground)/0.035)_1px,transparent_1px)] bg-[size:44px_44px] opacity-70 pointer-events-none" />
      <div
        className="absolute left-0 right-0 h-28 bg-gradient-to-b from-transparent via-foreground/10 to-transparent opacity-60 pointer-events-none"
        style={{
          top: `${-18 + progress * 104}%`,
          transition: 'top 80ms linear',
        }}
      />
      <div
        className="absolute w-[22rem] h-[22rem] rounded-full border border-foreground/10 blur-[0.2px] pointer-events-none"
        style={{
          transform: `scale(${0.82 + progress * 0.22}) rotate(${counter * 1.6}deg)`,
          opacity: 0.22 + progress * 0.28,
          transition: 'transform 80ms linear, opacity 80ms linear',
        }}
      />

      {/* Logo with traced strokes */}
      <div className="relative mb-8">
        <div
          className="absolute inset-[-2.4rem] rounded-full blur-2xl bg-foreground/10"
          style={{
            opacity: 0.18 + progress * 0.42,
            transform: `scale(${0.8 + progress * 0.35})`,
            transition: 'opacity 80ms linear, transform 80ms linear',
          }}
        />
        <div
          className="absolute inset-[-1.1rem] rounded-full"
          style={{
            background: `conic-gradient(rgb(var(--foreground)) ${counter * 3.6}deg, rgb(var(--foreground) / 0.10) 0deg)`,
            opacity: 0.24,
            filter: 'blur(10px)',
          }}
        />
        <svg
          width="148"
          height="148"
          viewBox="0 0 100 100"
          fill="none"
          className="relative drop-shadow-[0_0_36px_rgb(var(--foreground)/0.16)]"
        >
          {/* Encircling ring — fades in */}
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="rgb(var(--foreground))"
            strokeWidth="2"
            strokeOpacity="0.22"
            strokeDasharray={traceLength}
            strokeDashoffset={traceLength - (counter / 100) * traceLength}
            style={{ transition: 'stroke-dashoffset 80ms linear' }}
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="rgb(var(--foreground))"
            strokeWidth="4"
            strokeOpacity="0.9"
            strokeDasharray="34 320"
            strokeDashoffset={-progress * 320}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 80ms linear' }}
          />
          {/* Inner ring — accent */}
          <circle
            cx="50"
            cy="50"
            r="28"
            stroke="rgb(var(--foreground))"
            strokeWidth="1"
            strokeOpacity="0.3"
            strokeDasharray="3 4"
            style={{
              transformOrigin: 'center',
              transform: `rotate(${counter * 3.6}deg)`,
              transition: 'transform 80ms linear',
            }}
          />
          {/* T glyph — strokes draw in */}
          <path
            d="M35 35H65"
            stroke="rgb(var(--foreground))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="30"
            strokeDashoffset={Math.max(0, 30 - (counter / 50) * 30)}
            style={{ transition: 'stroke-dashoffset 80ms linear' }}
          />
          <path
            d="M50 35V65"
            stroke="rgb(var(--foreground))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="30"
            strokeDashoffset={Math.max(0, 30 - (Math.max(0, counter - 30) / 50) * 30)}
            style={{ transition: 'stroke-dashoffset 80ms linear' }}
          />
        </svg>
      </div>

      {/* Counter + label */}
      <div className="relative flex flex-col items-center gap-3">
        <div className="text-6xl md:text-7xl font-bold text-foreground tabular-nums leading-none">
          {String(counter).padStart(3, '0')}
          <span className="text-muted-foreground">%</span>
        </div>
        <div className="text-2xs uppercase tracking-[0.5em] text-muted-foreground">{status}</div>
      </div>

      {/* Loading bar */}
      <div className="relative mt-10 w-64 h-[2px] bg-foreground/10 overflow-hidden rounded-full">
        <div
          className="h-full bg-foreground rounded-full shadow-[0_0_18px_rgb(var(--foreground)/0.45)]"
          style={{ width: `${counter}%`, transition: 'width 80ms linear' }}
        />
      </div>
      <div className="mt-4 flex items-center gap-2 text-[9px] uppercase tracking-[0.32em] text-muted-foreground/70">
        <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
        thomastp.ch
      </div>

      {/* Brand mark bottom */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-3xs uppercase tracking-[0.45em] text-muted-foreground/50">
        Geneva / React / Cloudflare
      </div>
    </div>
  );
}
