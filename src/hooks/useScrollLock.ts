import { useEffect } from 'react';

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.documentElement.style.overflow = 'hidden';

    // Lenis (root mode) adds a wheel listener on window with passive:false
    // and calls preventDefault() even when stopped — this kills native scroll
    // inside modal content. We intercept in the capture phase to block Lenis
    // from seeing wheel events that originate inside a modal (overflow-y container).
    const onWheelCapture = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-scroll-lock-ignore]')) {
        e.stopPropagation();
      }
    };

    window.addEventListener('wheel', onWheelCapture, { capture: true, passive: true });

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.documentElement.style.overflow = '';
      window.removeEventListener('wheel', onWheelCapture, {
        capture: true,
      } as EventListenerOptions);
    };
  }, [locked]);
}
