import {
  useState,
  useEffect,
  useRef,
  lazy,
  Suspense,
  type CSSProperties,
  type PointerEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { GlitchText } from '@/components/ui/glitch-text';
import { loadGsap } from '@/lib/gsap-init';
import { useMagnetic } from '@/hooks/useGsap';

/* Inline SVG to avoid pulling lucide-react (59 kB) into the sync bundle */
function FileTextIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

function SparklesIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      <path d="M20 2v4" />
      <path d="M22 4h-4" />
      <path d="M4 18v2" />
      <path d="M5 19H3" />
    </svg>
  );
}

const ASK_THOMAS_EVENT = 'ask-thomas:open';

function openAskThomas() {
  try {
    window.sessionStorage.setItem(ASK_THOMAS_EVENT, '1');
  } catch {
    // Storage may be disabled; the live event still opens the mounted chat.
  }
  window.dispatchEvent(new Event(ASK_THOMAS_EVENT));
}

const CVModal = lazy(() =>
  import('@/components/modals/CVModal').then(mod => ({ default: mod.CVModal }))
);

const HeroShader = lazy(() =>
  import('@/components/ui/hero-shader').then(mod => ({ default: mod.HeroShader }))
);

function useTypingAnimation(roles: string[]) {
  const [text, setText] = useState(() => roles[0] ?? '');
  const stateRef = useRef({ roleIndex: 0, charIndex: 0, deleting: false });

  useEffect(() => {
    if (!roles.length) return;

    setText(roles[0]);
    stateRef.current = { roleIndex: 0, charIndex: roles[0].length, deleting: true };

    let timeout: ReturnType<typeof setTimeout>;
    let started = false;

    const tick = () => {
      const s = stateRef.current;
      const current = roles[s.roleIndex];

      if (!s.deleting) {
        if (s.charIndex < current.length) {
          s.charIndex++;
          setText(current.slice(0, s.charIndex));
          timeout = setTimeout(tick, 65);
        } else {
          timeout = setTimeout(() => {
            s.deleting = true;
            tick();
          }, 1800);
        }
      } else {
        if (s.charIndex > 0) {
          s.charIndex--;
          setText(current.slice(0, s.charIndex));
          timeout = setTimeout(tick, 35);
        } else {
          s.deleting = false;
          s.roleIndex = (s.roleIndex + 1) % roles.length;
          timeout = setTimeout(tick, 300);
        }
      }
    };

    const start = () => {
      if (started) return;
      started = true;
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
      window.removeEventListener('scroll', start);
      timeout = setTimeout(tick, 300);
    };

    window.addEventListener('pointerdown', start, { once: true, passive: true });
    window.addEventListener('keydown', start, { once: true });
    window.addEventListener('scroll', start, { once: true, passive: true });
    timeout = setTimeout(start, 12000);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
      window.removeEventListener('scroll', start);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles[0]]);

  return text;
}

export function Hero() {
  const { t } = useTranslation();
  const [cvOpen, setCvOpen] = useState(false);
  const [mountBg, setMountBg] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const cvBtnRef = useMagnetic(0.3);
  const contactBtnRef = useMagnetic(0.3);
  const askBtnRef = useMagnetic(0.3);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let timeout: ReturnType<typeof setTimeout>;
    let idleId: number | undefined;
    let mounted = false;

    const mount = () => {
      if (mounted) return;
      mounted = true;
      window.removeEventListener('pointermove', mount);
      window.removeEventListener('scroll', mount);
      setMountBg(true);
    };

    window.addEventListener('pointermove', mount, { once: true, passive: true });
    window.addEventListener('scroll', mount, { once: true, passive: true });

    if ('requestIdleCallback' in window) {
      const id = (
        window as unknown as {
          requestIdleCallback: (cb: () => void, opts: { timeout: number }) => number;
        }
      ).requestIdleCallback(
        () => {
          timeout = setTimeout(mount, 9000);
        },
        { timeout: 6000 }
      );
      idleId = id;
    } else {
      timeout = setTimeout(mount, 12000);
    }

    return () => {
      window.removeEventListener('pointermove', mount);
      window.removeEventListener('scroll', mount);
      if (idleId !== undefined) {
        (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(
          idleId
        );
      }
      clearTimeout(timeout);
    };
  }, []);

  // Parallax: content fades + moves up as user scrolls past hero
  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const indicator = scrollIndicatorRef.current;
    if (!section || !content) return;

    let ctx: { revert: () => void } | undefined;
    let active = true;
    let initialized = false;

    const initParallax = () => {
      if (initialized) return;
      initialized = true;
      window.removeEventListener('scroll', initParallax);
      loadGsap().then(({ gsap }) => {
        if (!active || !section.isConnected) return;
        ctx = gsap.context(() => {
          gsap.to(content, {
            y: -80,
            opacity: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.5,
            },
          });
          if (indicator) {
            gsap.to(indicator, {
              opacity: 0,
              y: -20,
              ease: 'none',
              scrollTrigger: {
                trigger: section,
                start: '20% top',
                end: '40% top',
                scrub: true,
              },
            });
          }
        }, section);
      });
    };

    window.addEventListener('scroll', initParallax, { once: true, passive: true });

    return () => {
      active = false;
      window.removeEventListener('scroll', initParallax);
      ctx?.revert();
    };
  }, []);

  const roles = t('hero.roles', { returnObjects: true }) as string[];
  const typedRole = useTypingAnimation(Array.isArray(roles) ? roles : []);
  const avatarStyle = {
    '--avatar-x': '50%',
    '--avatar-y': '42%',
    '--avatar-rx': '0deg',
    '--avatar-ry': '0deg',
    '--avatar-tx': '0px',
    '--avatar-ty': '0px',
  } as CSSProperties;

  const handleAvatarMove = (event: PointerEvent<HTMLDivElement>) => {
    const el = avatarRef.current;
    if (!el || event.pointerType === 'touch') return;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const clampedX = Math.min(Math.max(x, 0), 1);
    const clampedY = Math.min(Math.max(y, 0), 1);

    el.style.setProperty('--avatar-x', `${Math.round(clampedX * 100)}%`);
    el.style.setProperty('--avatar-y', `${Math.round(clampedY * 100)}%`);
    el.style.setProperty('--avatar-rx', `${((0.5 - clampedY) * 13).toFixed(2)}deg`);
    el.style.setProperty('--avatar-ry', `${((clampedX - 0.5) * 15).toFixed(2)}deg`);
    el.style.setProperty('--avatar-tx', `${((clampedX - 0.5) * 10).toFixed(2)}px`);
    el.style.setProperty('--avatar-ty', `${((clampedY - 0.5) * 10).toFixed(2)}px`);
  };

  const resetAvatar = () => {
    const el = avatarRef.current;
    if (!el) return;
    el.style.setProperty('--avatar-x', '50%');
    el.style.setProperty('--avatar-y', '42%');
    el.style.setProperty('--avatar-rx', '0deg');
    el.style.setProperty('--avatar-ry', '0deg');
    el.style.setProperty('--avatar-tx', '0px');
    el.style.setProperty('--avatar-ty', '0px');
  };

  return (
    <>
      {cvOpen && (
        <Suspense>
          <CVModal isOpen={cvOpen} onClose={() => setCvOpen(false)} />
        </Suspense>
      )}
      <section
        ref={sectionRef}
        id="home"
        className="min-h-screen flex flex-col justify-center items-center relative pt-20"
      >
        {mountBg && (
          <Suspense>
            <HeroShader />
          </Suspense>
        )}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div ref={contentRef} className="container px-4 mx-auto z-10 flex-1 flex items-center">
          <div className="w-full flex flex-col-reverse md:flex-row items-center justify-center gap-10 md:gap-10 lg:gap-12">
            <div className="max-w-xl text-center md:text-left">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground pb-2">
                <GlitchText text={t('hero.name')} />
              </h1>

              <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed mb-4 font-light mx-auto md:mx-0">
                {t('hero.role_prefix')}{' '}
                <span className="text-foreground font-medium">{t('hero.school')}</span>.
                <br />
                <span className="text-foreground font-medium">
                  {typedRole}
                  <span className="inline-block w-[2px] h-[1.1em] bg-foreground align-middle ml-0.5 animate-pulse" />
                </span>
              </p>
              <p className="text-sm text-muted-foreground mb-6">{t('hero.availability')}</p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start items-center flex-wrap">
                <button
                  ref={cvBtnRef as React.Ref<HTMLButtonElement>}
                  onClick={() => setCvOpen(true)}
                  className="group bg-primary text-primary-foreground px-6 py-4 rounded-full font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer"
                >
                  <FileTextIcon size={18} />
                  {t('hero.view_cv', 'Voir le CV')}
                </button>

                <a
                  ref={contactBtnRef as React.Ref<HTMLAnchorElement>}
                  href="#contact"
                  className="px-8 py-4 rounded-full border border-border hover:bg-muted/50 transition-colors text-foreground"
                  onClick={e => {
                    e.preventDefault();
                    const contact = document.getElementById('contact');
                    if (contact) {
                      window.scrollTo({
                        top: contact.getBoundingClientRect().top + window.scrollY + 160,
                        behavior: 'smooth',
                      });
                    }
                    setTimeout(() => window.history.pushState(null, '', '#contact'), 10);
                  }}
                >
                  {t('hero.contact_me')}
                </a>

                <button
                  ref={askBtnRef as React.Ref<HTMLButtonElement>}
                  onClick={openAskThomas}
                  className="group px-4 py-3 rounded-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <SparklesIcon size={18} />
                  {t('ask.launcher')}
                </button>
              </div>
            </div>

            <div className="shrink-0">
              <div
                ref={avatarRef}
                className="hero-avatar-stage group relative w-48 h-52 md:w-60 md:h-[16.5rem] lg:w-72 lg:h-[19.5rem]"
                style={avatarStyle}
                onPointerMove={handleAvatarMove}
                onPointerLeave={resetAvatar}
                onPointerCancel={resetAvatar}
              >
                <div className="hero-avatar-shadow" />
                <div className="hero-avatar-orbit hero-avatar-orbit-a" />
                <div className="hero-avatar-orbit hero-avatar-orbit-b" />
                <div className="hero-avatar-card">
                  <img
                    src="/images/photo.webp?v=20260501"
                    alt="Thomas Prudhomme"
                    width={576}
                    height={624}
                    className="hero-avatar-photo"
                    loading="eager"
                    decoding="sync"
                    fetchPriority="high"
                  />
                  <img
                    src="/images/memoji-nobg.webp"
                    alt="Memoji de Thomas Prudhomme"
                    width={256}
                    height={256}
                    className="hero-avatar-memoji"
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                  />
                  <div className="hero-avatar-glare" />
                  <div className="hero-avatar-depth" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          ref={scrollIndicatorRef}
          className="pb-12 flex flex-col items-center gap-2 text-muted-foreground z-20"
        >
          <span className="text-xs uppercase tracking-widest">{t('hero.scroll')}</span>
          <div className="w-px h-12 bg-gradient-to-b from-border to-transparent" />
        </div>
      </section>
    </>
  );
}
