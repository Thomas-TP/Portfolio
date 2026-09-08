import { useTranslation } from 'react-i18next';
import { useRef, useEffect, useCallback } from 'react';
import { loadGsap, getGsap } from '@/lib/gsap-init';

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');
  const labelRef = useRef<HTMLSpanElement>(null);
  const prevLang = useRef(isEn);

  useEffect(() => {
    loadGsap();
  }, []); // preload

  useEffect(() => {
    if (prevLang.current === isEn) return;
    prevLang.current = isEn;

    const el = labelRef.current;
    if (!el) return;

    const gsap = getGsap();
    if (!gsap) {
      loadGsap().then(({ gsap: g }) => {
        const tl = g.timeline();
        tl.to(el, { y: -20, opacity: 0, filter: 'blur(10px)', duration: 0.15, ease: 'power2.in' });
        tl.set(el, { y: 20 });
        tl.to(el, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.25, ease: 'back.out(1.7)' });
      });
      return;
    }

    const tl = gsap.timeline();
    tl.to(el, { y: -20, opacity: 0, filter: 'blur(10px)', duration: 0.15, ease: 'power2.in' });
    tl.set(el, { y: 20 });
    tl.to(el, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.25, ease: 'back.out(1.7)' });
  }, [isEn]);

  const toggleLanguage = useCallback(() => {
    const nextLang = isEn ? 'fr' : 'en';
    i18n.changeLanguage(nextLang);

    const url = new URL(window.location.href);
    if (nextLang === 'en') {
      url.searchParams.set('lng', 'en');
    } else {
      url.searchParams.delete('lng');
    }
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, [i18n, isEn]);

  return (
    <button
      onClick={toggleLanguage}
      className="relative flex items-center justify-center p-2 md:p-3 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all duration-300 cursor-pointer"
      aria-label="Toggle language"
    >
      <span ref={labelRef} className="absolute font-mono text-sm font-light select-none">
        {isEn ? 'EN' : 'FR'}
      </span>
      {/* Invisible spacer to maintain button size */}
      <span className="font-mono text-sm font-light opacity-0 select-none">EN</span>
    </button>
  );
}
