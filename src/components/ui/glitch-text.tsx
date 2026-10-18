import { useRef, useCallback } from 'react';
import { loadGsap, getGsap } from '@/lib/gsap-init';

interface GlitchTextProps {
  text: string;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export function GlitchText({ text, className = '' }: GlitchTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  const handleHover = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const animate = (gsap: NonNullable<ReturnType<typeof getGsap>>) => {
      gsap.fromTo(
        el,
        { x: 0, y: 0, filter: 'blur(0px)' },
        {
          keyframes: [
            { x: -2, y: 1, filter: 'blur(1px)', duration: 0.04 },
            { x: 2, y: -1, filter: 'blur(0.5px)', duration: 0.04 },
            { x: -1, y: 0, filter: 'blur(0px)', duration: 0.04 },
            { x: 1, y: 0, duration: 0.04 },
            { x: 0, y: 0, duration: 0.04 },
          ],
          ease: 'power2.inOut',
        }
      );
    };

    const loaded = getGsap();
    if (loaded) animate(loaded);
    else void loadGsap().then(({ gsap }) => animate(gsap));
  }, []);

  return (
    <span
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleHover}
    >
      <span className="relative z-10">{text}</span>
      <span
        className="absolute top-0 left-0 -z-10 w-full h-full text-red-500 opacity-0 mix-blend-multiply pointer-events-none"
        aria-hidden
      >
        {text}
      </span>
      <span
        className="absolute top-0 left-0 -z-10 w-full h-full text-cyan-500 opacity-0 mix-blend-multiply pointer-events-none"
        aria-hidden
      >
        {text}
      </span>
    </span>
  );
}
