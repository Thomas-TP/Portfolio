import type Lenis from 'lenis';

let engine: Lenis | null = null;
let releaseLayout: (() => void) | undefined;

export function registerScrollEngine(instance: Lenis | null) {
  engine = instance;
}

/** Use the same scroll animation for the dock, navigation and section links. */
export async function scrollToSection(id: string) {
  const target = id === 'home' ? null : document.getElementById(id);
  if (id !== 'home' && !target) return;
  releaseLayout?.();

  // Resolve offscreen intrinsic placeholders before calculating a distant anchor.
  const sections = [...document.querySelectorAll<HTMLElement>('.cv-auto')];
  const previous = sections.map(section => section.style.contentVisibility);
  sections.forEach(section => {
    section.style.contentVisibility = 'visible';
  });
  const release = () => {
    sections.forEach((section, index) => {
      section.style.contentVisibility = previous[index];
    });
    if (releaseLayout === release) releaseLayout = undefined;
  };
  releaseLayout = release;

  // Let the browser and Lenis observe the expanded layout before starting.
  await new Promise<void>(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );
  if (releaseLayout !== release) return;
  engine?.resize();
  const top = target ? target.getBoundingClientRect().top + window.scrollY - 32 : 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hash = id === 'home' ? '#' : `#${id}`;
  if (window.location.hash !== hash) window.history.pushState(null, '', hash);

  if (engine && !reduced) {
    try {
      await engine.scrollTo(Math.max(0, top), {
        duration: Math.min(1.5, 0.8 + Math.abs(top - window.scrollY) / 6000),
        easing: t => 1 - Math.pow(1 - t, 4),
      });
    } finally {
      if (releaseLayout === release) release();
    }
  } else {
    window.scrollTo({ top: Math.max(0, top), behavior: reduced ? 'instant' : 'smooth' });
    if (reduced) release();
    else
      setTimeout(() => {
        if (releaseLayout === release) release();
      }, 1600);
  }
}
