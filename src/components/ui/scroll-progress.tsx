import { useEffect, useRef } from 'react';
import { loadGsap } from '@/lib/gsap-init';

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;

    let cleanup: (() => void) | undefined;

    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (!el.isConnected) return;

      const st = gsap.to(el, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3,
        },
      });

      cleanup = () => {
        ScrollTrigger.getAll().forEach(t => {
          if (t.vars.trigger === document.documentElement) t.kill();
        });
      };
    });

    return () => cleanup?.();
  }, []);

  return (
    <div
      ref={barRef}
      className="fixed top-0 left-0 right-0 h-[3px] bg-foreground/30 origin-left z-[50]"
      style={{ transform: 'scaleX(0)' }}
    />
  );
}
