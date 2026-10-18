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
import { scrollToSection } from '@/lib/scroll';
import './hero.css';

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

function ArrowIcon({ down = false }: { down?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={down ? { rotate: '90deg' } : undefined}
    >
      <path d="M4 12h15m-6-6 6 6-6 6" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="4" />
      <path d="m4 7 8 6 8-6" />
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
  const [activeAction, setActiveAction] = useState(0);
  const [portraitRevealed, setPortraitRevealed] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);

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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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

  const handleAvatarMove = (event: PointerEvent<HTMLButtonElement>) => {
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
      <section ref={sectionRef} id="home" className="hero-section">
        {mountBg && (
          <Suspense>
            <HeroShader />
          </Suspense>
        )}
        <div className="hero-ambient" aria-hidden="true" />
        <div ref={contentRef} className="hero-layout">
          <div className="hero-copy">
            <a
              className="hero-status"
              href="#contact"
              onClick={e => {
                e.preventDefault();
                void scrollToSection('contact');
              }}
            >
              <span className="hero-status-dot" aria-hidden="true" />
              {t('hero.opportunity')}
              <ArrowIcon />
            </a>
            <h1 className="hero-name">
              <GlitchText text="Thomas" /> <GlitchText text="Prudhomme" />
            </h1>
            <p className="hero-specialty">{t('hero.specialty')}</p>
            <p className="hero-education">
              {t('hero.role_prefix')} <span>{t('hero.school')}</span>.
            </p>
            <div
              className="hero-typing"
              role="group"
              aria-label={Array.isArray(roles) ? roles.join('. ') : ''}
            >
              <span className="hero-typing-marker" aria-hidden="true">
                ↳
              </span>
              <span className="hero-typing-stack" aria-hidden="true">
                <span className="hero-typing-reserve">
                  {Array.isArray(roles)
                    ? roles.reduce((a, b) => (a.length > b.length ? a : b), '')
                    : ''}
                </span>
                <span className="hero-typing-live">
                  {typedRole}
                  <span className="hero-caret" />
                </span>
              </span>
            </div>
            <div
              className="hero-actions"
              role="group"
              aria-label={t('hero.actions')}
              style={{ '--active-action': activeAction } as CSSProperties}
              onMouseLeave={() => setActiveAction(0)}
              onBlur={e => {
                if (!e.currentTarget.contains(e.relatedTarget)) setActiveAction(0);
              }}
            >
              <span className="hero-action-surface" aria-hidden="true" />
              <button
                type="button"
                className="hero-action"
                data-active={activeAction === 0}
                onMouseEnter={() => setActiveAction(0)}
                onFocus={() => setActiveAction(0)}
                onClick={() => setCvOpen(true)}
                aria-label={t('hero.view_cv')}
              >
                <FileTextIcon size={20} />
                <span>{t('hero.cv_short')}</span>
                <ArrowIcon />
              </button>
              <a
                href="#contact"
                className="hero-action"
                data-active={activeAction === 1}
                onMouseEnter={() => setActiveAction(1)}
                onFocus={() => setActiveAction(1)}
                onClick={e => {
                  e.preventDefault();
                  void scrollToSection('contact');
                }}
              >
                <MailIcon />
                <span>{t('hero.contact_me')}</span>
                <ArrowIcon />
              </a>
              <button
                type="button"
                className="hero-action"
                data-active={activeAction === 2}
                onMouseEnter={() => setActiveAction(2)}
                onFocus={() => setActiveAction(2)}
                onClick={openAskThomas}
              >
                <SparklesIcon size={20} />
                <span>{t('ask.launcher')}</span>
                <ArrowIcon />
              </button>
            </div>
            <div className="hero-location">
              <span>
                <i aria-hidden="true" />
                {t('hero.based')}
              </span>
              <span>{t('hero.region')}</span>
              <span>{t('hero.available')}</span>
            </div>
          </div>
          <div className="hero-portrait">
            <div className="hero-portrait-label" aria-hidden="true">
              <span>TP / 01</span>
              <span>{t('hero.portrait_label')}</span>
            </div>
            <button
              type="button"
              ref={avatarRef}
              className="hero-avatar-stage"
              style={avatarStyle}
              data-revealed={portraitRevealed}
              aria-pressed={portraitRevealed}
              aria-label={t(portraitRevealed ? 'hero.show_photo' : 'hero.show_memoji')}
              onClick={() => setPortraitRevealed(value => !value)}
              onPointerMove={handleAvatarMove}
              onPointerLeave={resetAvatar}
              onPointerCancel={resetAvatar}
            >
              <span className="hero-avatar-shadow" aria-hidden="true" />
              <span className="hero-avatar-orbit hero-avatar-orbit-a" aria-hidden="true" />
              <span className="hero-avatar-orbit hero-avatar-orbit-b" aria-hidden="true" />
              <span className="hero-avatar-card">
                <img
                  src="/images/photo-576.webp"
                  srcSet="/images/photo-384.webp 384w, /images/photo-576.webp 576w, /images/photo-864.webp 864w"
                  sizes="(min-width: 1024px) 320px, (min-width: 768px) 260px, 176px"
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
                  alt=""
                  aria-hidden="true"
                  width={256}
                  height={256}
                  className="hero-avatar-memoji"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
                <span className="hero-avatar-glare" aria-hidden="true" />
                <span className="hero-avatar-depth" aria-hidden="true" />
              </span>
            </button>
            <p className="hero-portrait-caption">
              <SparklesIcon size={14} />
              {t('hero.portrait_hint')}
            </p>
          </div>
        </div>
        <div ref={scrollIndicatorRef} className="hero-footer">
          <span className="hero-footer-note">{t('hero.footer_note')}</span>
          <a
            href="#about"
            className="hero-explore"
            onClick={e => {
              e.preventDefault();
              void scrollToSection('about');
            }}
          >
            <span className="hero-explore-orb">
              <ArrowIcon down />
            </span>
            <span>
              <strong>{t('hero.explore')}</strong>
              <small>{t('hero.explore_detail')}</small>
            </span>
          </a>
          <span className="hero-footer-index" aria-hidden="true">
            01 — 04
          </span>
        </div>
      </section>
    </>
  );
}
