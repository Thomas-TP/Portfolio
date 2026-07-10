import { Mail, Send, CheckCircle, AlertCircle, Copy, Check, Link as LinkIcon } from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/components/ui/theme-provider';
import { useState, useRef, useCallback, FormEvent, useEffect } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { loadGsap } from '@/lib/gsap-init';

// ← Replace with your Worker URL after deploying (wrangler deploy)
const WORKER_URL = 'https://portfolio-contact.thomastp.workers.dev';

// Cloudflare Turnstile site key
// Test key (always passes): '1x00000000000000000000AA'
// Real key: create at dash.cloudflare.com → Turnstile → Add site
const TURNSTILE_SITE_KEY = '0x4AAAAAAClx2gXi6bWmEyc7';

type Status = 'idle' | 'sending' | 'success' | 'error';

export function Contact() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [honey, setHoney] = useState(''); // Honeypot state
  const [status, setStatus] = useState<Status>('idle');
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    // Record the time when the form component mounts
    startTimeRef.current = Date.now();
  }, []);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
  }>({});
  const [copied, setCopied] = useState(false);

  const copyEmail = useCallback(() => {
    const email = 'thomas@prudhomme.li';
    const onSuccess = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(email)
        .then(onSuccess)
        .catch(() => {
          // Fallback for non-secure contexts
          const ta = document.createElement('textarea');
          ta.value = email;
          ta.style.position = 'fixed';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          onSuccess();
        });
    } else {
      const ta = document.createElement('textarea');
      ta.value = email;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      onSuccess();
    }
  }, []);

  const resolvedTheme = (): 'dark' | 'light' => {
    if (theme === 'system') {
      if (typeof window === 'undefined') return 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme === 'light' ? 'light' : 'dark';
  };

  const validate = (): boolean => {
    const errors: { name?: string; email?: string; message?: string } = {};
    if (!name.trim()) errors.name = t('contact.form.error_required');
    if (!email.trim()) errors.email = t('contact.form.error_required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = t('contact.form.error_email');
    if (!message.trim()) errors.message = t('contact.form.error_required');
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setStatus('sending');

    if (!turnstileToken) {
      setStatus('error');
      return;
    }
    const duration = Date.now() - startTimeRef.current;

    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message,
          companyWebsite: honey, // Send honeypot
          duration, // Send time taken
          lang: i18n.language?.startsWith('fr') ? 'fr' : 'en',
          theme: resolvedTheme(),
          turnstileToken,
        }),
      });

      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
      setHoney('');
      setTurnstileToken(null);
      turnstileRef.current?.reset();
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([80, 40, 80]);
    } catch {
      setStatus('error');
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    }
  };

  const inputClass =
    'w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors';

  const prefersReduced =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  /* ── Lac Léman – real OpenStreetMap geographic outline ── */

  const cities = [
    { name: 'Genève', cx: 2.7, cy: 120, htmlTransform: 'translate(4px, -150%)' },
    { name: 'Nyon', cx: 249, cy: 23, htmlTransform: 'translate(-50%, -150%)' },
    { name: 'Lausanne', cx: 618.7, cy: 0.5, htmlTransform: 'translate(-50%, 50%)' },
  ];

  // Card background fill: y=0 → north shore → y=0
  const cardFill =
    'M 0 0 L 0 120 C 4.6 114.5 8.6 96.8 29 85.7 C 49.4 74.6 106.1 56.4 127.2 50.6 C 148.3 44.8 152.1 51.6 161.1 49.4 C 170.1 47.2 168.5 41 183.2 36.6 C 197.9 32.2 230.2 24.2 252.9 22 C 275.6 19.8 303.8 23.7 324.8 22.9 C 345.8 22.1 362.4 20.7 383.9 17.2 C 405.4 13.7 437.2 3.1 459.2 1 C 481.2 -1.1 504.3 4.4 521.3 4.2 C 538.3 4 540.7 -0.2 565.4 0 C 590.1 0.2 648.7 3.4 675.5 5.4 C 702.3 7.4 712.4 10.5 733.2 12.4 C 754 14.3 782.8 16 805.2 17.1 C 827.6 18.2 856.2 17.7 872.9 19.4 C 889.6 21.1 894.5 25.7 909.5 27.5 C 924.5 29.3 954.1 29.5 966.9 30.8 C 979.7 32.1 984.2 34 989.5 35.7 C 994.8 37.4 998.2 40.7 999.9 41.6 L 1000 0 Z';

  // Northern shore stroke (Swiss side = card bottom border)
  const shoreNorth =
    'M 0 120 C 4.6 114.5 8.6 96.8 29 85.7 C 49.4 74.6 106.1 56.4 127.2 50.6 C 148.3 44.8 152.1 51.6 161.1 49.4 C 170.1 47.2 168.5 41 183.2 36.6 C 197.9 32.2 230.2 24.2 252.9 22 C 275.6 19.8 303.8 23.7 324.8 22.9 C 345.8 22.1 362.4 20.7 383.9 17.2 C 405.4 13.7 437.2 3.1 459.2 1 C 481.2 -1.1 504.3 4.4 521.3 4.2 C 538.3 4 540.7 -0.2 565.4 0 C 590.1 0.2 648.7 3.4 675.5 5.4 C 702.3 7.4 712.4 10.5 733.2 12.4 C 754 14.3 782.8 16 805.2 17.1 C 827.6 18.2 856.2 17.7 872.9 19.4 C 889.6 21.1 894.5 25.7 909.5 27.5 C 924.5 29.3 954.1 29.5 966.9 30.8 C 979.7 32.1 984.2 34 989.5 35.7 C 994.8 37.4 998.2 40.7 999.9 41.6';

  // Southern shore stroke (French side, faint)
  const shoreSouth =
    'M 0 120 C 5.1 119.7 21.7 121.4 32 117.9 C 42.3 114.4 51.5 102.7 64.3 98 C 77.1 93.3 95.8 93.6 111.8 88.3 C 127.8 83 146.5 70 164.5 64.9 C 182.5 59.8 209.2 57.6 224.3 56.5 C 239.4 55.4 251.5 56.8 258.9 58.2 C 266.3 59.6 264 63.4 270.4 65 C 276.8 66.6 292.6 67.9 298.8 68.5 C 305 69.1 302.6 69.8 308.9 68.6 C 315.2 67.4 320.4 63.1 338.3 61 C 356.2 58.9 406.2 57.2 420.7 55.2 C 435.2 53.2 421.6 50.1 429 48.3 C 436.4 46.5 454 43.8 466.7 43.7 C 479.4 43.6 483.3 47.7 508.4 47.6 C 533.5 47.5 599.2 43.9 623.5 43.3 C 647.8 42.7 642.3 43.9 660.3 43.8 C 678.3 43.7 710.2 41.8 735.8 42.5 C 761.4 43.2 793.4 46.9 820.3 48.3 C 847.2 49.7 884.6 51.7 904.2 51.3 C 923.8 50.9 930.3 46.3 943 45.7 C 955.7 45.1 974.4 48.5 983.5 47.8 C 992.6 47.1 997.3 42.6 999.9 41.6';

  // Lake body (closed shape between both shores)
  const lakeBody =
    'M 0 120 C 4.6 114.5 8.6 96.8 29 85.7 C 49.4 74.6 106.1 56.4 127.2 50.6 C 148.3 44.8 152.1 51.6 161.1 49.4 C 170.1 47.2 168.5 41 183.2 36.6 C 197.9 32.2 230.2 24.2 252.9 22 C 275.6 19.8 303.8 23.7 324.8 22.9 C 345.8 22.1 362.4 20.7 383.9 17.2 C 405.4 13.7 437.2 3.1 459.2 1 C 481.2 -1.1 504.3 4.4 521.3 4.2 C 538.3 4 540.7 -0.2 565.4 0 C 590.1 0.2 648.7 3.4 675.5 5.4 C 702.3 7.4 712.4 10.5 733.2 12.4 C 754 14.3 782.8 16 805.2 17.1 C 827.6 18.2 856.2 17.7 872.9 19.4 C 889.6 21.1 894.5 25.7 909.5 27.5 C 924.5 29.3 954.1 29.5 966.9 30.8 C 979.7 32.1 984.2 34 989.5 35.7 C 994.8 37.4 998.2 40.7 999.9 41.6 L 999.9 41.6 C 997.3 42.6 992.6 47.1 983.5 47.8 C 974.4 48.5 955.7 45.1 943 45.7 C 930.3 46.3 923.8 50.9 904.2 51.3 C 884.6 51.7 847.2 49.7 820.3 48.3 C 793.4 46.9 761.4 43.2 735.8 42.5 C 710.2 41.8 678.3 43.7 660.3 43.8 C 642.3 43.9 647.8 42.7 623.5 43.3 C 599.2 43.9 533.5 47.5 508.4 47.6 C 483.3 47.7 479.4 43.6 466.7 43.7 C 454 43.8 436.4 46.5 429 48.3 C 421.6 50.1 435.2 53.2 420.7 55.2 C 406.2 57.2 356.2 58.9 338.3 61 C 320.4 63.1 315.2 67.4 308.9 68.6 C 302.6 69.8 305 69.1 298.8 68.5 C 292.6 67.9 276.8 66.6 270.4 65 C 264 63.4 266.3 59.6 258.9 58.2 C 251.5 56.8 239.4 55.4 224.3 56.5 C 209.2 57.6 182.5 59.8 164.5 64.9 C 146.5 70 127.8 83 111.8 88.3 C 95.8 93.6 77.1 93.3 64.3 98 C 51.5 102.7 42.3 114.4 32 117.9 C 21.7 121.4 5.1 119.7 0 120 Z';

  const cardRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const labelContainerRef = useRef<HTMLDivElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  // Card reveal
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    let ctx: { revert: () => void } | undefined;
    let active = true;

    loadGsap().then(({ gsap }) => {
      if (!active || !el.isConnected) return;
      const start = window.innerWidth < 768 ? 'top 98%' : 'top 85%';
      ctx = gsap.context(() => {
        gsap.fromTo(
          el,
          { opacity: 0, scale: 0.95 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start,
              once: true,
              toggleActions: 'play none none none',
            },
          }
        );
      }, el);
    });

    return () => {
      active = false;
      ctx?.revert();
    };
  }, []);

  // SVG map animations — trigger early enough for mobile/short viewports.
  useEffect(() => {
    const svg = svgRef.current;
    const container = labelContainerRef.current;
    if (!svg || prefersReduced) return;
    const trigger = container ?? svg;
    const start = 'top 98%';

    let ctx: { revert: () => void } | undefined;
    let active = true;
    let observer: IntersectionObserver | undefined;
    let refreshGsap = () => {};

    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (!active || !svg.isConnected) return;
      const labels = container?.querySelectorAll('.city-label') ?? [];
      ctx = gsap.context(() => {
        const tl = gsap.timeline({ paused: true });
        const rippleTweens: Array<{ play: (from?: number) => void }> = [];
        let played = false;
        const playMap = () => {
          if (played) return;
          played = true;

          // Shore path draws — measured here, right before playback, rather
          // than at mount. The section is behind `cv-auto` (content-visibility:
          // auto), so while it's off-screen getTotalLength() can hand back a
          // stale/zero length; that made some paths skip the draw-in reveal
          // and pop in fully solid instead of animating in sequence.
          const shores = svg.querySelectorAll('.shore-path');
          shores.forEach((path, i) => {
            const pathEl = path as SVGPathElement;
            const length = pathEl.getTotalLength();
            tl.fromTo(
              pathEl,
              { strokeDasharray: length, strokeDashoffset: length },
              {
                strokeDashoffset: 0,
                duration: i === 0 ? 1.2 : 1.6,
                ease: 'power2.inOut',
              },
              0.1 + i * 0.2
            );
          });

          tl.play();
          rippleTweens.forEach(tween => tween.play(0));
        };

        tl.fromTo(svg, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0);

        // Lake body fade
        const lakeEl = svg.querySelector('.lake-body');
        if (lakeEl)
          tl.fromTo(
            lakeEl,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 0.8,
            },
            0.5
          );

        // Lake label text
        const lakeLabel = svg.querySelector('.lake-label-text');
        if (lakeLabel)
          tl.fromTo(
            lakeLabel,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 0.5,
            },
            1.2
          );

        // City dots
        const cityDots = svg.querySelectorAll('.city-dot');
        const cityInners = svg.querySelectorAll('.city-inner');
        const cityRipples = svg.querySelectorAll('.city-ripple');

        cityDots.forEach((dot, i) => {
          tl.fromTo(
            dot,
            { attr: { r: 0 } },
            {
              attr: { r: 6 },
              duration: 0.5,
              ease: 'back.out(3)',
            },
            0.6 + i * 0.25
          );
        });

        cityInners.forEach((dot, i) => {
          tl.fromTo(
            dot,
            { attr: { r: 0 } },
            {
              attr: { r: 2.5 },
              duration: 0.5,
              ease: 'back.out(3)',
            },
            0.7 + i * 0.25
          );
        });

        cityRipples.forEach((ripple, i) => {
          rippleTweens.push(
            gsap.fromTo(
              ripple,
              { attr: { r: 6 }, opacity: 0.4 },
              {
                attr: { r: 18 },
                opacity: 0,
                duration: 2.8,
                delay: i * 0.3,
                repeat: -1,
                repeatDelay: 2.2,
                ease: 'power2.out',
                paused: true,
              }
            )
          );
        });

        if (labels.length)
          tl.fromTo(
            labels,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 0.3,
              stagger: 0.25,
            },
            0.9
          );

        ScrollTrigger.create({
          trigger,
          start,
          once: true,
          onEnter: playMap,
          onEnterBack: playMap,
        });

        observer = new IntersectionObserver(
          entries => {
            if (entries.some(entry => entry.isIntersecting)) playMap();
          },
          { rootMargin: '0px 0px 35% 0px', threshold: 0 }
        );
        observer.observe(trigger);

        const rect = trigger.getBoundingClientRect();
        if (rect.top < window.innerHeight * 1.05 && rect.bottom > -80) playMap();
      }, trigger);
      refreshGsap = () => ScrollTrigger.refresh();
      refreshGsap();
    });

    const refresh = () => refreshGsap();
    const raf = requestAnimationFrame(refresh);
    const timeout = window.setTimeout(refresh, 250);
    void document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh, { once: true });

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
      window.removeEventListener('load', refresh);
      observer?.disconnect();
      ctx?.revert();
    };
  }, [prefersReduced]);

  // Submit button hover/tap
  useEffect(() => {
    const btn = submitBtnRef.current;
    if (!btn) return;

    let active = true;
    let cleanup: (() => void) | undefined;

    loadGsap().then(({ gsap }) => {
      if (!active || !btn.isConnected) return;
      const enter = () => gsap.to(btn, { scale: 1.02, duration: 0.2, ease: 'power2.out' });
      const leave = () => gsap.to(btn, { scale: 1, duration: 0.2, ease: 'power2.out' });
      const down = () => gsap.to(btn, { scale: 0.98, duration: 0.1 });
      const up = () => gsap.to(btn, { scale: 1.02, duration: 0.15 });
      btn.addEventListener('mouseenter', enter);
      btn.addEventListener('mouseleave', leave);
      btn.addEventListener('mousedown', down);
      btn.addEventListener('mouseup', up);
      cleanup = () => {
        btn.removeEventListener('mouseenter', enter);
        btn.removeEventListener('mouseleave', leave);
        btn.removeEventListener('mousedown', down);
        btn.removeEventListener('mouseup', up);
      };
    });

    return () => {
      active = false;
      cleanup?.();
    };
  }, []);

  return (
    <section id="contact" className="py-20 md:py-32 container mx-auto px-4 cv-auto">
      <div className="max-w-4xl mx-auto">
        <div
          ref={cardRef}
          className="bg-gradient-to-b from-border to-transparent pt-px px-px pb-0 rounded-t-3xl"
          style={{ opacity: 0 }}
        >
          <div className="bg-card/80 rounded-t-[calc(1.5rem-1px)] p-8 md:p-12 border border-border border-b-0">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-5xl font-bold mb-3 tracking-tighter">
                {t('contact.title')}
              </h2>
              <p className="text-base text-muted-foreground max-w-xl mx-auto">
                {t('contact.desc')}
              </p>
              <p className="mt-3 text-sm text-muted-foreground/80 max-w-2xl mx-auto">
                {t('service_area.summary')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left — form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Honeypot field (hidden from real users, attractive to bots) */}
                <div
                  style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
                  aria-hidden="true"
                >
                  <label htmlFor="companyWebsite">Company Website</label>
                  <input
                    type="text"
                    id="companyWebsite"
                    name="companyWebsite"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honey}
                    onChange={e => setHoney(e.target.value)}
                    placeholder="Leave this field empty"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                    {t('contact.form.name')}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => {
                      setName(e.target.value);
                      setFieldErrors(p => ({ ...p, name: undefined }));
                    }}
                    placeholder={t('contact.form.name_placeholder')}
                    className={`${inputClass}${fieldErrors.name ? ' border-destructive focus:ring-destructive/40' : ''}`}
                    disabled={status === 'sending' || status === 'success'}
                  />
                  {fieldErrors.name && (
                    <p role="alert" className="mt-1.5 text-xs text-destructive">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                    {t('contact.form.email')}
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      setFieldErrors(p => ({ ...p, email: undefined }));
                    }}
                    placeholder={t('contact.form.email_placeholder')}
                    className={`${inputClass}${fieldErrors.email ? ' border-destructive focus:ring-destructive/40' : ''}`}
                    disabled={status === 'sending' || status === 'success'}
                  />
                  {fieldErrors.email && (
                    <p role="alert" className="mt-1.5 text-xs text-destructive">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                    {t('contact.form.message')}
                  </label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={e => {
                      setMessage(e.target.value);
                      setFieldErrors(p => ({ ...p, message: undefined }));
                    }}
                    placeholder={t('contact.form.message_placeholder')}
                    className={`${inputClass} resize-none${fieldErrors.message ? ' border-destructive focus:ring-destructive/40' : ''}`}
                    disabled={status === 'sending' || status === 'success'}
                  />
                  {fieldErrors.message && (
                    <p role="alert" className="mt-1.5 text-xs text-destructive">
                      {fieldErrors.message}
                    </p>
                  )}
                </div>

                {/* Feedback */}
                {status === 'success' && (
                  <div className="flex items-center gap-2 text-sm text-emerald-500" role="status">
                    <CheckCircle size={16} />
                    {t('contact.form.success')}
                  </div>
                )}
                {status === 'error' && (
                  <div className="flex items-center gap-2 text-sm text-destructive" role="alert">
                    <AlertCircle size={16} />
                    {t('contact.form.error')}
                  </div>
                )}

                {/* Turnstile — seamless, only shows if bot suspected */}
                <div style={{ filter: 'grayscale(1)' }}>
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={TURNSTILE_SITE_KEY}
                    onSuccess={setTurnstileToken}
                    onError={() => setTurnstileToken(null)}
                    onExpire={() => setTurnstileToken(null)}
                    options={{ appearance: 'interaction-only', theme: resolvedTheme() }}
                  />
                </div>

                <button
                  ref={submitBtnRef}
                  type="submit"
                  disabled={status === 'sending' || status === 'success' || !turnstileToken}
                  className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send size={16} />
                  {status === 'sending' ? t('contact.form.sending') : t('contact.form.send')}
                </button>
              </form>

              {/* Right — contact info */}
              <div className="flex flex-col gap-6">
                {/* Email */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    {t('contact.say_hello')}
                  </p>
                  <div className="flex items-center gap-2">
                    <a
                      href="mailto:thomas@prudhomme.li"
                      className="flex-1 flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                    >
                      <div className="w-11 h-11 rounded-lg border border-border flex items-center justify-center shrink-0 group-hover:border-primary/40 transition-colors">
                        <Mail size={18} />
                      </div>
                      <span className="text-base text-muted-foreground group-hover:text-foreground transition-colors">
                        thomas@prudhomme.li
                      </span>
                    </a>
                    <button
                      onClick={copyEmail}
                      className="p-2.5 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/40 transition-colors cursor-pointer"
                      aria-label="Copy email"
                    >
                      {copied ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <Copy size={16} className="text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Socials */}
                <div className="flex flex-col gap-2">
                  <a
                    href="https://www.linkedin.com/in/thomas-tp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <div className="w-11 h-11 rounded-lg border border-border flex items-center justify-center shrink-0 group-hover:border-primary/40 transition-colors">
                      <FaLinkedin size={18} />
                    </div>
                    <span className="text-base text-muted-foreground group-hover:text-foreground transition-colors">
                      LinkedIn
                    </span>
                  </a>
                  <a
                    href="https://github.com/Thomas-TP"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <div className="w-11 h-11 rounded-lg border border-border flex items-center justify-center shrink-0 group-hover:border-primary/40 transition-colors">
                      <FaGithub size={18} />
                    </div>
                    <span className="text-base text-muted-foreground group-hover:text-foreground transition-colors">
                      GitHub
                    </span>
                  </a>
                  <a
                    href="https://wa-redirect.thomastp.workers.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <div className="w-11 h-11 rounded-lg border border-border flex items-center justify-center shrink-0 group-hover:border-primary/40 transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </div>
                    <span className="text-base text-muted-foreground group-hover:text-foreground transition-colors">
                      WhatsApp
                    </span>
                  </a>
                  <a
                    href="https://links.thomastp.ch"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <div className="w-11 h-11 rounded-lg border border-border flex items-center justify-center shrink-0 group-hover:border-primary/40 transition-colors">
                      <LinkIcon size={18} />
                    </div>
                    <span className="text-base text-muted-foreground group-hover:text-foreground transition-colors">
                      Links
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Lac Léman bottom edge ── */}
        <div className="px-px relative" ref={labelContainerRef}>
          <svg
            ref={svgRef}
            viewBox="0 0 1000 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full block -mt-px"
            style={{ overflow: 'visible', opacity: prefersReduced ? 1 : 0 }}
            role="img"
            aria-label={t('service_area.map_alt')}
          >
            {/* Card background continuation down to the northern shore */}
            <path d={cardFill} className="fill-card/80" />

            {/* Side borders extending from card down to lake extremities —
                same color as the card's own border. crispEdges avoids the
                anti-aliasing blur that made a nominal 1px SVG line read
                thinner than the card's crisp CSS border. */}
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={120}
              className="stroke-border"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              shapeRendering="crispEdges"
            />
            <line
              x1={1000}
              y1={0}
              x2={1000}
              y2={41.6}
              className="stroke-border"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              shapeRendering="crispEdges"
            />

            {/* Lake body fill — the recognisable crescent between both shores */}
            <path
              d={lakeBody}
              className="lake-body fill-muted/15 dark:fill-muted/8"
              style={prefersReduced ? {} : { opacity: 0 }}
            />

            {/* Southern shore outline (faint, French side) */}
            <path
              d={shoreSouth}
              className="shore-path stroke-border/30 dark:stroke-zinc-700/30"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              fill="none"
            />

            {/* Northern shore — full thin line, also text guide. Same
                border color as the card; slightly wider than the side lines
                since it's a curve (crispEdges distorts curved strokes, so we
                compensate for anti-aliasing softness with width instead). */}
            <path
              id="shoreNorthRef"
              d={shoreNorth}
              className="shore-path stroke-border"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              fill="none"
            />

            {/* Northern shore — brighter animated segment between Genève and Lausanne */}
            <defs>
              {/* Lausanne's dot is centered at cx≈618.7 with r=6, so the clip must
                  clear cx + r to fully cover the marker rather than cut through it. */}
              <clipPath id="gvLsn">
                <rect x={0} y={-20} width={634} height={155} />
              </clipPath>
              {/* north shore shifted -10 in y → text guide above the line */}
              <path
                id="shoreTextGuideAbove"
                d="M 0 110 C 4.6 104.5 8.6 86.8 29 75.7 C 49.4 64.6 106.1 46.4 127.2 40.6 C 148.3 34.8 152.1 41.6 161.1 39.4 C 170.1 37.2 168.5 31 183.2 26.6 C 197.9 22.2 230.2 14.2 252.9 12 C 275.6 9.8 303.8 13.7 324.8 12.9 C 345.8 12.1 362.4 10.7 383.9 7.2 C 405.4 3.7 437.2 -6.9 459.2 -9 C 481.2 -11.1 504.3 -5.6 521.3 -5.8 C 538.3 -6 540.7 -10.2 565.4 -10 C 590.1 -9.8 648.7 -6.6 675.5 -4.6 C 702.3 -2.6 712.4 0.5 733.2 2.4 C 754 4.3 782.8 6 805.2 7.1 C 827.6 8.2 856.2 7.7 872.9 9.4 C 889.6 11.1 894.5 15.7 909.5 17.5 C 924.5 19.3 954.1 19.5 966.9 20.8 C 979.7 22.1 984.2 24 989.5 25.7 C 994.8 27.4 998.2 30.7 999.9 31.6"
              />
            </defs>
            <path
              d={shoreNorth}
              className="shore-path stroke-foreground/55"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              fill="none"
              clipPath="url(#gvLsn)"
            />

            {/* "Zone d'activité" following the north shore curve, sitting just above the line */}
            <text
              className="lake-label-text fill-muted-foreground/60 font-medium uppercase"
              style={{
                fontSize: '13px',
                letterSpacing: '0.14em',
                ...(prefersReduced ? {} : { opacity: 0 }),
              }}
            >
              <textPath href="#shoreTextGuideAbove" startOffset="50%" textAnchor="middle">
                {t('service_area.label')}
              </textPath>
            </text>

            {/* City dot markers (SVG only — labels are HTML below) */}
            {cities.map(city => (
              <g key={city.name}>
                {!prefersReduced && (
                  <circle
                    cx={city.cx}
                    cy={city.cy}
                    r={6}
                    className="city-ripple fill-none stroke-foreground/15"
                    strokeWidth={1}
                    style={{ opacity: 0 }}
                  />
                )}
                <circle
                  cx={city.cx}
                  cy={city.cy}
                  r={prefersReduced ? 6 : 0}
                  className="city-dot fill-foreground"
                />
                <circle
                  cx={city.cx}
                  cy={city.cy}
                  r={prefersReduced ? 2.5 : 0}
                  className="city-inner fill-background"
                />
              </g>
            ))}
          </svg>

          {/* HTML labels for city names — CSS sizes for mobile readability */}
          {cities.map(city => (
            <span
              key={city.name}
              className="city-label absolute text-xs text-foreground pointer-events-none whitespace-nowrap"
              style={{
                left: `${city.cx / 10}%`,
                top: `${city.cy / 1.3}%`,
                transform: city.htmlTransform,
                opacity: prefersReduced ? 1 : 0,
              }}
            >
              {city.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
