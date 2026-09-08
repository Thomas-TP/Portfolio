import type gsapCore from 'gsap';
import type { ScrollTrigger as STType } from 'gsap/ScrollTrigger';

type Gsap = typeof gsapCore;
type ST = typeof STType;

let _gsap: Gsap | null = null;
let _ST: ST | null = null;
let _promise: Promise<{ gsap: Gsap; ScrollTrigger: ST }> | null = null;

/**
 * Lazily load & initialise GSAP + ScrollTrigger.
 * The first call triggers the dynamic import; subsequent calls return the
 * cached promise so the module is only fetched once.
 */
export function loadGsap(): Promise<{ gsap: Gsap; ScrollTrigger: ST }> {
  if (_promise) return _promise;

  _promise = Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
    ([gsapMod, stMod]) => {
      _gsap = gsapMod.default;
      _ST = stMod.ScrollTrigger;
      _gsap.registerPlugin(_ST);
      _gsap.defaults({ ease: 'power3.out', duration: 0.8 });

      if (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        _gsap.globalTimeline.timeScale(20);
        _ST.config({ limitCallbacks: true });
      }

      return { gsap: _gsap, ScrollTrigger: _ST };
    }
  );

  return _promise;
}

/**
 * Get the already-loaded gsap instance (null if not yet loaded).
 * Safe to call in callbacks / event handlers after loadGsap() has resolved.
 */
export function getGsap(): Gsap | null {
  return _gsap;
}

export function getScrollTrigger(): ST | null {
  return _ST;
}
