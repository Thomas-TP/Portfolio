import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { loadGsap } from '@/lib/gsap-init';
import { ExternalLink, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';

interface Project {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  link?: string;
  github?: string;
  year: string;
  visual: ReactNode;
}

const PROJECT_SLUGS = ['x-clone', 'powershell-empire', 'tank-io', 'tomboard'] as const;

function getInitialProject(): number {
  if (typeof window === 'undefined') return 0;
  const slug = new URLSearchParams(window.location.search).get('p');
  if (!slug) return 0;
  const idx = PROJECT_SLUGS.indexOf(slug as (typeof PROJECT_SLUGS)[number]);
  return idx >= 0 ? idx : 0;
}

const EmpireTerminal = () => {
  const [lines, setLines] = useState<Array<{ type: 'input' | 'output'; content: React.ReactNode }>>(
    []
  );
  const [currentCommand, setCurrentCommand] = useState('');
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  // Animate new lines as they appear
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    loadGsap().then(({ gsap }) => {
      const items = el.querySelectorAll('.empire-line');
      if (!items.length) return;
      const last = items[items.length - 1];
      gsap.to(last, { opacity: 1, duration: 0.15, ease: 'power2.out' });
    });
  }, [lines]);

  // Cursor blink
  useEffect(() => {
    if (!cursorRef.current) return;
    let tween: { kill: () => void } | undefined;
    loadGsap().then(({ gsap }) => {
      if (!cursorRef.current) return;
      tween = gsap.to(cursorRef.current, {
        opacity: 0,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: 'steps(1)',
      });
    });
    return () => {
      tween?.kill();
    };
  }, []);

  // Pause animation when terminal is out of viewport — avoids running
  // 60+ setState calls/sec for a component the user can't even see
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0.1,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return; // Don't animate when off-screen
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const processStep = async () => {
      // Helper to simulate typing
      const typeCommand = async (cmd: string) => {
        for (let i = 0; i <= cmd.length; i++) {
          setCurrentCommand(cmd.slice(0, i));
          await new Promise(r => setTimeout(r, 50 + Math.random() * 30)); // Realistic typing speed
        }
        await new Promise(r => setTimeout(r, 300)); // Pause before enter
      };

      const addLine = (type: 'input' | 'output', content: React.ReactNode) => {
        setLines(prev => [...prev, { type, content }]);
      };

      switch (step) {
        case 0: // Initial delay
          timeout = setTimeout(() => setStep(1), 1000);
          break;
        case 1: // Type "./empire"
          await typeCommand('./empire');
          addLine(
            'input',
            <span>
              <span className="text-white font-bold">root@kali</span>
              <span className="text-white/40">:</span>
              <span className="text-white/60">~</span>
              <span className="text-white/40">$</span> ./empire
            </span>
          );
          setCurrentCommand('');
          setStep(2);
          break;
        case 2: // Empire loading output - Step by step
          await new Promise(r => setTimeout(r, 400));
          addLine(
            'output',
            <div className="text-white/60">
              <span className="text-white/50 font-bold">[*]</span> Empire post-exploitation
              framework
            </div>
          );

          await new Promise(r => setTimeout(r, 300));
          addLine(
            'output',
            <div className="text-white/60">
              <span className="text-white font-bold">[+]</span> Agents loaded: 0
            </div>
          );

          await new Promise(r => setTimeout(r, 300));
          addLine(
            'output',
            <div className="text-white/60 mb-2">
              <span className="text-white font-bold">[+]</span> Modules loaded: 396
            </div>
          );

          setStep(3);
          break;
        case 3: // Type "uselistener http"
          await new Promise(r => setTimeout(r, 1000));
          await typeCommand('uselistener http');
          addLine(
            'input',
            <span>
              <span className="underline decoration-white/30 text-white">(Empire)</span> &gt;
              uselistener http
            </span>
          );
          setCurrentCommand('');
          setStep(4);
          break;
        case 4: // Type "set Port 80"
          await new Promise(r => setTimeout(r, 500));
          await typeCommand('set Port 80');
          addLine(
            'input',
            <span>
              <span className="underline decoration-white/30 text-white">
                (Empire: <span className="text-white">listeners/http</span>)
              </span>{' '}
              &gt; set Port 80
            </span>
          );
          setCurrentCommand('');
          setStep(5);
          break;
        case 5: // Type "execute"
          await new Promise(r => setTimeout(r, 500));
          await typeCommand('execute');
          addLine(
            'input',
            <span>
              <span className="underline decoration-white/30 text-white">
                (Empire: <span className="text-white">listeners/http</span>)
              </span>{' '}
              &gt; execute
            </span>
          );
          setCurrentCommand('');
          setStep(6);
          break;
        case 6: // Execute output - Step by step
          await new Promise(r => setTimeout(r, 600));
          addLine(
            'output',
            <div className="text-white/80">
              <span className="text-white font-bold">[*]</span> Starting listener &apos;http&apos;
            </div>
          );

          await new Promise(r => setTimeout(r, 800));
          addLine(
            'output',
            <div className="text-white/80">
              <span className="text-white font-bold">[+]</span> Listener successfully started!
            </div>
          );

          setStep(7);
          break;
        case 7: // Wait then clear
          timeout = setTimeout(() => {
            setLines([]);
            setStep(0);
          }, 3000);
          break;
      }
    };

    processStep();

    return () => clearTimeout(timeout);
  }, [step, isVisible]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black flex flex-col p-4 text-[10px] sm:text-xs overflow-hidden leading-relaxed text-left"
    >
      {/* Terminal Header */}
      <div className="flex gap-1.5 mb-2 opacity-50 shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-white/25" />
        <div className="w-2.5 h-2.5 rounded-full bg-white/25" />
        <div className="w-2.5 h-2.5 rounded-full bg-white/25" />
      </div>

      <div className="flex-1 flex flex-col relative z-10 space-y-1">
        {lines.map((line, i) => (
          <div key={`line-${i}`} className="empire-line" style={{ opacity: 0 }}>
            {line.content}
          </div>
        ))}

        {/* Active Prompt Line */}
        {step < 7 && (
          <div className="flex items-center gap-1">
            {step <= 2 ? (
              <>
                <span className="text-white font-bold shrink-0">root@kali</span>
                <span className="text-white/40 shrink-0">:</span>
                <span className="text-white/60 shrink-0">~</span>
                <span className="text-white/40 shrink-0">$</span>
              </>
            ) : step === 3 ? (
              <>
                <span className="underline decoration-white/30 text-white shrink-0">(Empire)</span>
                <span className="text-white shrink-0">&gt;</span>
              </>
            ) : (
              <>
                <span className="underline decoration-white/30 text-white shrink-0">
                  (Empire: <span className="text-white">listeners/http</span>)
                </span>
                <span className="text-white shrink-0">&gt;</span>
              </>
            )}
            <span className="text-white">{currentCommand}</span>
            <div ref={cursorRef} className="w-1.5 h-3 bg-white ml-0.5" />
          </div>
        )}
      </div>
      {/* Matrix/Code Rain Overlay (Subtle) */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:100%_4px]" />
    </div>
  );
};

const tomboardPads = ['Airhorn', 'Tada', 'Boom', 'Wow', 'Ding', 'Laser'];

const TomBoardPCMockup = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const padsRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let ctx: { revert: () => void } | undefined;
    loadGsap().then(({ gsap }) => {
      if (!el.isConnected) return;
      ctx = gsap.context(() => {
        const padsEl = padsRef.current;
        const waveEl = waveRef.current;
        const glowEl = glowRef.current;
        if (!padsEl || !waveEl || !glowEl) return;

        const pads = Array.from(padsEl.querySelectorAll<HTMLElement>('.tb-pad'));
        const icons = Array.from(padsEl.querySelectorAll<HTMLElement>('.tb-icon'));
        const bars = Array.from(waveEl.querySelectorAll<HTMLElement>('.tb-bar'));

        gsap.set(bars, { transformOrigin: 'center bottom', scaleY: 0.2 });

        gsap.to(glowEl, {
          opacity: 0.55,
          scale: 1.1,
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        const tl = gsap.timeline({ repeat: -1 });
        pads.forEach((pad, i) => {
          const icon = icons[i];
          tl.to(bars, {
            scaleY: () => 0.15 + Math.random() * 0.15,
            duration: 0.35,
            stagger: { each: 0.012, from: 'random' },
            ease: 'sine.inOut',
          })
            .to(pad, {
              backgroundColor: 'rgba(255,255,255,0.18)',
              borderColor: 'rgba(255,255,255,0.45)',
              scale: 0.95,
              duration: 0.08,
              ease: 'power2.out',
            })
            .to(icon, { opacity: 1, scale: 1.15, duration: 0.1 }, '<')
            .to(
              bars,
              {
                scaleY: () => 0.6 + Math.random() * 0.4,
                duration: 0.1,
                stagger: { each: 0.008, from: 'random' },
                ease: 'power2.out',
              },
              '<'
            )
            .to(pad, { scale: 1, duration: 0.2 })
            .to(
              bars,
              {
                scaleY: () => 0.35 + Math.random() * 0.25,
                duration: 0.25,
                stagger: { each: 0.012, from: 'random' },
                ease: 'sine.inOut',
              },
              '<'
            )
            .to(
              pad,
              {
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.12)',
                duration: 0.45,
              },
              '+=0.15'
            )
            .to(icon, { opacity: 0.55, scale: 1, duration: 0.4 }, '<');
        });
      }, el);
    });
    return () => ctx?.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden">
      {/* Monitor bezel — fills almost the whole card, leaves room for stand */}
      <div className="absolute left-[3%] right-[3%] top-[4%] bottom-[14%] bg-neutral-950 rounded-md border border-white/15 p-[3px] shadow-[0_0_50px_rgba(255,255,255,0.05)] z-10">
        {/* Screen */}
        <div className="relative w-full h-full bg-black rounded-[3px] overflow-hidden flex flex-col border border-white/[0.06]">
          {/* Title bar */}
          <div className="flex items-center justify-between px-2 py-[3px] bg-white/[0.04] border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-1">
              <div className="w-[3px] h-[3px] rounded-full bg-white/30" />
              <div className="w-[3px] h-[3px] rounded-full bg-white/30" />
              <div className="w-[3px] h-[3px] rounded-full bg-white/30" />
              <span className="text-[7px] text-white/70 font-bold tracking-[0.15em] ml-1.5">
                TomBoard
              </span>
            </div>
            <span className="text-[6px] text-white/30 font-mono">v0.3.2</span>
          </div>

          {/* Pads grid */}
          <div ref={padsRef} className="grid grid-cols-3 gap-1 p-1.5 flex-1">
            {tomboardPads.map(label => (
              <div
                key={label}
                className="tb-pad relative rounded-[3px] bg-white/[0.04] border border-white/[0.12] flex flex-col items-center justify-center gap-1 overflow-hidden"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.12)',
                }}
              >
                <div className="tb-icon flex items-end gap-[1.5px] h-2.5" style={{ opacity: 0.55 }}>
                  <div className="w-[2px] h-[40%] bg-white rounded-full" />
                  <div className="w-[2px] h-[80%] bg-white rounded-full" />
                  <div className="w-[2px] h-[55%] bg-white rounded-full" />
                  <div className="w-[2px] h-[100%] bg-white rounded-full" />
                  <div className="w-[2px] h-[65%] bg-white rounded-full" />
                </div>
                <span className="text-[7px] text-white/55 font-medium tracking-wide">{label}</span>
              </div>
            ))}
          </div>

          {/* Waveform */}
          <div
            ref={waveRef}
            className="flex items-end justify-center gap-[1px] h-4 px-2 pb-1 border-t border-white/[0.06] shrink-0"
          >
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className="tb-bar w-[2px] bg-white/55 rounded-full"
                style={{ height: '100%' }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stand neck */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[7%] w-2 h-[5%] bg-white/15" />
      {/* Stand base */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[5%] w-[22%] h-[3px] bg-white/15 rounded-full" />

      {/* Ambient glow */}
      <div
        ref={glowRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-white/[0.04] rounded-full blur-[60px] pointer-events-none"
        style={{ opacity: 0.35 }}
      />
    </div>
  );
};

const XCloneVisual = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const topLogo = el.querySelector('.x-top-logo') as HTMLElement;
    const mirror = el.querySelector('.x-mirror') as HTMLElement;
    const bottomLogo = el.querySelector('.x-bottom-logo') as HTMLElement;
    const glow = el.querySelector('.x-glow') as HTMLElement;

    let ctx: { revert: () => void } | undefined;
    loadGsap().then(({ gsap }) => {
      if (!el.isConnected) return;
      ctx = gsap.context(() => {
        const tl = gsap.timeline({ repeat: -1, ease: 'sine.inOut' });
        tl.fromTo(topLogo, { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: 1.6 }, 0)
          .fromTo(mirror, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 1.6 }, 0)
          .fromTo(bottomLogo, { opacity: 0, y: 40 }, { opacity: 0.4, y: 0, duration: 1.6 }, 0)
          .to({}, { duration: 0.8 })
          .to(topLogo, { opacity: 0, y: -40, duration: 1.6 })
          .to(mirror, { scaleX: 0, opacity: 0, duration: 1.6 }, '<')
          .to(bottomLogo, { opacity: 0, y: 40, duration: 1.6 }, '<');

        gsap.to(glow, {
          opacity: 0.8,
          scale: 1.1,
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }, el);
    });

    return () => ctx?.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="relative z-10 flex flex-col items-center gap-4">
        <svg
          className="x-top-logo drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          width="50"
          height="50"
          viewBox="0 0 24 24"
          fill="white"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <div className="x-mirror w-40 h-[2px] bg-gradient-to-r from-transparent via-blue-200/50 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
        <div className="x-bottom-logo transform scale-y-[-1] opacity-40">
          <svg width="50" height="50" viewBox="0 0 24 24" fill="white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
      </div>
      <div
        className="x-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full blur-[50px] pointer-events-none"
        style={{ opacity: 0.5 }}
      />
    </div>
  );
};

const TankIoVisual = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const leftTank = el.querySelector('.tank-left') as HTMLElement;
    const leftBody = el.querySelector('.tank-left-body') as HTMLElement;
    const rightTank = el.querySelector('.tank-right') as HTMLElement;
    const rightBody = el.querySelector('.tank-right-body') as HTMLElement;
    const leftShot = el.querySelector('.shot-left') as HTMLElement;
    const rightShot = el.querySelector('.shot-right') as HTMLElement;
    const impactLeft = el.querySelector('.impact-left') as HTMLElement;
    const impactRight = el.querySelector('.impact-right') as HTMLElement;

    let ctx: { revert: () => void } | undefined;
    loadGsap().then(({ gsap }) => {
      if (!el.isConnected) return;
      ctx = gsap.context(() => {
        gsap.to(leftTank, { y: -15, duration: 2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        gsap.to(rightTank, { y: 20, duration: 2.5, repeat: -1, yoyo: true, ease: 'sine.inOut' });

        const leftTl = gsap.timeline({ repeat: -1, repeatDelay: 1.6 });
        leftTl
          .to(leftBody, { x: -4, duration: 0.1, ease: 'power2.out' })
          .to(leftBody, { x: 0, duration: 0.15 })
          .fromTo(
            leftShot,
            { opacity: 0, left: '80px', scale: 0.5 },
            { opacity: 1, left: '200px', scale: 1, duration: 0.3, ease: 'none' },
            0.05
          )
          .to(leftShot, { opacity: 0, scale: 0.8, duration: 0.1 })
          .fromTo(
            impactLeft,
            { scale: 0.95, opacity: 1 },
            { scale: 1.5, opacity: 0, duration: 0.4 },
            0.35
          );

        const rightTl = gsap.timeline({ repeat: -1, repeatDelay: 1.6, delay: 1 });
        rightTl
          .to(rightBody, { x: 4, duration: 0.1, ease: 'power2.out' })
          .to(rightBody, { x: 0, duration: 0.15 })
          .fromTo(
            rightShot,
            { opacity: 0, right: '80px', scale: 0.5 },
            { opacity: 1, right: '200px', scale: 1, duration: 0.3, ease: 'none' },
            0.05
          )
          .to(rightShot, { opacity: 0, scale: 0.8, duration: 0.1 })
          .fromTo(
            impactRight,
            { scale: 0.95, opacity: 1 },
            { scale: 1.5, opacity: 0, duration: 0.4 },
            0.35
          );
      }, el);
    });

    return () => ctx?.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black"
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
      <div className="tank-left absolute left-10 z-20">
        <div className="tank-left-body flex flex-col items-center">
          <div className="w-10 h-10 bg-black border border-white/20 rounded-lg flex items-center justify-center relative shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <div className="w-5 h-5 bg-white/10 rounded-sm" />
            <div className="absolute -right-5 top-1/2 -translate-y-1/2 w-5 h-2 bg-neutral-700 rounded-r-full border border-l-0 border-white/10" />
          </div>
          <div className="absolute -top-1 w-8 h-12 border-x-2 border-dashed border-white/10 -z-10 rounded-sm" />
        </div>
      </div>
      <div className="tank-right absolute right-10 z-20">
        <div className="tank-right-body flex flex-col items-center">
          <div className="w-10 h-10 bg-black border border-white/20 rounded-lg flex items-center justify-center relative shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <div className="w-5 h-5 bg-white/10 rounded-sm" />
            <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-5 h-2 bg-neutral-700 rounded-l-full border border-r-0 border-white/10" />
          </div>
          <div className="absolute -top-1 w-8 h-12 border-x-2 border-dashed border-white/10 -z-10 rounded-sm" />
        </div>
      </div>
      <div
        className="shot-left absolute w-3 h-1 bg-white rounded-full shadow-[0_0_8px_white]"
        style={{ opacity: 0, top: '50%' }}
      />
      <div
        className="shot-right absolute w-3 h-1 bg-white rounded-full shadow-[0_0_8px_white]"
        style={{ opacity: 0, top: '50%' }}
      />
      <div
        className="impact-left absolute w-8 h-8 rounded-full border border-white/30"
        style={{ left: '45%', opacity: 0 }}
      />
      <div
        className="impact-right absolute w-8 h-8 rounded-full border border-white/30"
        style={{ right: '45%', opacity: 0 }}
      />
    </div>
  );
};

const CARD_WIDTH_RATIO_DESKTOP = 0.55;
const CARD_WIDTH_RATIO_MOBILE = 0.88;
const CARD_GAP = 24;
const TRANSITION_DURATION = 0.85;
const TRANSITION_EASE = 'power3.inOut';

// Returns the canonical slot (signed offset from active) for card `i` given current `active`.
// Slots are integers in range [-Math.floor(N/2), Math.ceil(N/2) - 1].
// Active card is at slot 0; right peek at +1; left peek at -1; off-screen further out.
function canonicalSlot(i: number, active: number, n: number): number {
  const raw = (((i - active) % n) + n) % n; // 0..n-1
  return raw > Math.floor(n / 2) ? raw - n : raw;
}

export function Projects() {
  const { t } = useTranslation();

  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<Array<HTMLDivElement | null>>([]);
  // Cached GSAP instance — used sync inside high-frequency drag handlers so we don't
  // pay the cost (or risk a cache desync) of writing transforms outside of GSAP.
  const gsapRef = useRef<typeof import('gsap').gsap | null>(null);
  // When true, the next active-change effect run skips its own animation because the
  // drag-release handler already started the slide directly (avoids a double-trigger
  // that would feel like a small "stop" between drag and transition).
  const skipNextActiveAnimationRef = useRef(false);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const infoTitleRef = useRef<HTMLHeadingElement>(null);
  const infoMetaRef = useRef<HTMLDivElement>(null);
  const infoDescRef = useRef<HTMLParagraphElement>(null);
  const infoTagsRef = useRef<HTMLDivElement>(null);
  const infoCtaRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const swipeHintRef = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState(getInitialProject);
  const prevActiveRef = useRef(active);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [stageWidth, setStageWidth] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);

  const projects: Project[] = useMemo(
    () => [
      {
        slug: 'x-clone',
        title: 'X-clone',
        description: t('projects.items.x_clone.description'),
        tags: ['HTML/CSS', 'JavaScript', 'AI Integration', 'Responsive'],
        link: 'https://x-clone-teal-phi.vercel.app/',
        github: 'https://github.com/Thomas-TP/X-clone',
        year: '2024',
        visual: <XCloneVisual />,
      },
      {
        slug: 'powershell-empire',
        title: 'PowerShell Empire',
        description: t('projects.items.empire.description'),
        tags: ['PowerShell', 'Cybersecurity', 'Automation', 'Scripting'],
        link: 'https://vimeo.com/1085791100/a588dbfdf3?fl=pl&fe=sh',
        github: 'https://github.com/Thomas-TP/Powershell-Empire-test',
        year: '2024',
        visual: <EmpireTerminal />,
      },
      {
        slug: 'tank-io',
        title: 'Tank.io',
        description: t('projects.items.tank_io.description'),
        tags: ['React', 'Canvas API', 'Multiplayer', 'Game Dev'],
        link: 'https://tank-io-wr49.onrender.com/',
        github: 'https://github.com/Thomas-TP/Tank.io',
        year: '2025',
        visual: <TankIoVisual />,
      },
      {
        slug: 'tomboard',
        title: 'TomBoard',
        description: t('projects.items.tomboard.description'),
        tags: ['Rust', 'Tauri', 'React', 'Audio DSP'],
        link: 'https://github.com/Thomas-TP/TomBoard/releases',
        github: 'https://github.com/Thomas-TP/tomboard',
        year: '2026',
        visual: <TomBoardPCMockup />,
      },
    ],
    [t]
  );

  // Infinite wrap: navigation always cycles through projects
  const goTo = useCallback(
    (idx: number) => {
      const n = projects.length;
      setActive(((idx % n) + n) % n);
      setHasInteracted(true);
    },
    [projects.length]
  );

  const next = useCallback(() => {
    setActive(a => (a + 1) % projects.length);
    setHasInteracted(true);
  }, [projects.length]);
  const prev = useCallback(() => {
    setActive(a => (a - 1 + projects.length) % projects.length);
    setHasInteracted(true);
  }, [projects.length]);

  // Cache GSAP instance for sync use in drag handlers
  useEffect(() => {
    let cancelled = false;
    loadGsap().then(({ gsap }) => {
      if (!cancelled) gsapRef.current = gsap;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Measure stage and compute card width. ResizeObserver also catches mobile/content-visibility
  // reveals where the first layout pass can report 0px.
  useLayoutEffect(() => {
    const update = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const w =
        stage.getBoundingClientRect().width ||
        stage.parentElement?.getBoundingClientRect().width ||
        Math.max(0, window.innerWidth - 32);
      if (w <= 0) return;
      const ratio = window.innerWidth < 768 ? CARD_WIDTH_RATIO_MOBILE : CARD_WIDTH_RATIO_DESKTOP;
      setStageWidth(w);
      setCardWidth(w * ratio);
    };

    update();
    const raf = requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    if (stageRef.current) observer.observe(stageRef.current);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  // Header reveal — word-by-word staggered lift
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    let ctx: { revert: () => void } | undefined;
    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (!el.isConnected) return;
      const start = window.innerWidth < 768 ? 'top 98%' : 'top 88%';
      ctx = gsap.context(() => {
        const title = el.querySelector('.projects-title') as HTMLElement | null;
        const subtitle = el.querySelector('.projects-subtitle') as HTMLElement | null;
        const link = el.querySelector('.projects-github-link') as HTMLElement | null;

        if (title) {
          const words = (title.textContent || '').split(' ');
          title.innerHTML = words
            .map(
              w =>
                `<span class="proj-word inline-block"><span class="proj-word-inner inline-block">${w}</span></span>`
            )
            .join(' ');
          const inners = title.querySelectorAll('.proj-word-inner');
          gsap.fromTo(
            inners,
            { y: '110%', rotateX: -40, opacity: 0 },
            {
              y: '0%',
              rotateX: 0,
              opacity: 1,
              duration: 0.8,
              stagger: 0.06,
              ease: 'power3.out',
              delay: 0.1,
              scrollTrigger: { trigger: el, start, once: true },
            }
          );
        }
        if (subtitle) {
          gsap.fromTo(
            subtitle,
            { opacity: 0, y: 18 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: 'power3.out',
              delay: 0.35,
              scrollTrigger: { trigger: el, start, once: true },
            }
          );
        }
        if (link) {
          gsap.fromTo(
            link,
            { opacity: 0, x: 20 },
            {
              opacity: 1,
              x: 0,
              duration: 0.6,
              ease: 'power3.out',
              delay: 0.45,
              scrollTrigger: { trigger: el, start, once: true },
            }
          );
        }

        void ScrollTrigger;
      }, el);
    });
    return () => ctx?.revert();
  }, []);

  // Initial reveal of carousel + info on scroll-in
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let ctx: { revert: () => void } | undefined;
    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (!stage.isConnected) return;
      const start = window.innerWidth < 768 ? 'top 98%' : 'top 92%';
      ctx = gsap.context(() => {
        gsap.fromTo(
          stage,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            immediateRender: false,
            scrollTrigger: { trigger: stage, start, once: true },
          }
        );
        void ScrollTrigger;
      });
    });
    return () => ctx?.revert();
  }, []);

  // Animate each card to its canonical slot for a given active index. Used by the active-change
  // effect (smooth power3.inOut for clicks/keyboard) and by drag-release (power3.out for natural
  // momentum-style deceleration). Includes the wrap-before-animate logic so off-screen cards
  // teleport to the closer side and never visibly jump.
  const animateCardsToActive = useCallback(
    (
      targetActive: number,
      ease: string = TRANSITION_EASE,
      duration: number = TRANSITION_DURATION
    ) => {
      const gsap = gsapRef.current;
      if (!gsap || cardWidth === 0) return;
      const N = projects.length;
      const pitch = cardWidth + CARD_GAP;

      cardsRef.current.forEach((card, i) => {
        if (!card) return;

        const canon = canonicalSlot(i, targetActive, N);
        const targetX = canon * pitch;
        const currentX = (gsap.getProperty(card, 'x') as number) || 0;
        const currentSlotApprox = currentX / pitch;
        const delta = canon - currentSlotApprox;

        // Wrap-before-animate: cards crossing more than N/2 slots are teleported off-screen
        // on the closer side first (invisible) so the visible part of the move is < N/2 slots.
        if (Math.abs(delta) > N / 2) {
          const wrapOffset = delta > 0 ? N : -N;
          gsap.set(card, { x: currentX + wrapOffset * pitch });
        }

        const isActive = i === targetActive;
        gsap.to(card, {
          x: targetX,
          scale: isActive ? 1 : 0.92,
          opacity: isActive ? 1 : 0.3,
          duration,
          ease,
          overwrite: true,
        });
      });
    },
    [cardWidth, projects.length]
  );

  // Per-card slot animation triggered when `active` changes via clicks/keyboard.
  // Drag-release pre-runs the animation directly in onUp and sets skipNextActiveAnimationRef
  // so this effect doesn't double-fire (which would feel like a small "stop" then re-start).
  useEffect(() => {
    if (cardWidth === 0) return;
    if (skipNextActiveAnimationRef.current) {
      skipNextActiveAnimationRef.current = false;
      return;
    }
    animateCardsToActive(active);
  }, [active, cardWidth, animateCardsToActive]);

  // Initial card placement once cardWidth is known (sync, no animation)
  useLayoutEffect(() => {
    if (cardWidth === 0) return;
    const cards = cardsRef.current;
    if (!cards.length) return;

    const N = projects.length;
    const pitch = cardWidth + CARD_GAP;

    let cancelled = false;
    loadGsap().then(({ gsap }) => {
      if (cancelled) return;
      cards.forEach((card, i) => {
        if (!card) return;
        // Only set if not already placed (i.e., x is 0 from initial render)
        const currentX = (gsap.getProperty(card, 'x') as number) || 0;
        if (currentX !== 0) return;
        const canon = canonicalSlot(i, active, N);
        const isActive = i === active;
        gsap.set(card, {
          x: canon * pitch,
          scale: isActive ? 1 : 0.92,
          opacity: isActive ? 1 : 0.3,
        });
      });
    });
    return () => {
      cancelled = true;
    };
    // Intentionally only run on cardWidth changes (initial placement + resize re-layout).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardWidth]);

  // Info zone re-stagger on active change (run synchronously to avoid flash)
  useLayoutEffect(() => {
    const refs = [
      infoMetaRef.current,
      infoTitleRef.current,
      infoDescRef.current,
      infoTagsRef.current,
      infoCtaRef.current,
    ].filter(Boolean) as HTMLElement[];
    if (!refs.length) return;

    // Pre-set initial state synchronously so we don't flash full-opacity content
    for (const el of refs) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
    }

    let cancelled = false;
    loadGsap().then(({ gsap }) => {
      if (cancelled) return;
      gsap.to(refs, {
        opacity: 1,
        y: 0,
        duration: 0.65,
        stagger: 0.07,
        ease: 'power3.out',
        clearProps: 'transform',
      });

      if (watermarkRef.current) {
        gsap.fromTo(
          watermarkRef.current,
          { opacity: 0, scale: 1.15, y: 30 },
          { opacity: 1, scale: 1, y: 0, duration: 0.95, ease: 'power3.out' }
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [active]);

  // Mobile swipe hint — pulse the chevrons outward to invite swiping; fade out on first interaction
  useEffect(() => {
    const el = swipeHintRef.current;
    if (!el || hasInteracted) return;
    let ctx: { revert: () => void } | undefined;
    loadGsap().then(({ gsap }) => {
      if (!el.isConnected || hasInteracted) return;
      ctx = gsap.context(() => {
        const left = el.querySelector('.swipe-hint-left');
        const right = el.querySelector('.swipe-hint-right');
        gsap.to(left, { x: -6, duration: 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        gsap.to(right, { x: 6, duration: 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        gsap.fromTo(
          el,
          { opacity: 0 },
          { opacity: 1, duration: 0.6, delay: 0.4, ease: 'power2.out' }
        );
      }, el);
    });
    return () => ctx?.revert();
  }, [hasInteracted]);

  // Fade out the hint on interaction
  useEffect(() => {
    const el = swipeHintRef.current;
    if (!el || !hasInteracted) return;
    let ctx: { revert: () => void } | undefined;
    loadGsap().then(({ gsap }) => {
      if (!el.isConnected) return;
      ctx = gsap.context(() => {
        gsap.to(el, { opacity: 0, duration: 0.4, ease: 'power2.out', pointerEvents: 'none' });
      }, el);
    });
    return () => ctx?.revert();
  }, [hasInteracted]);

  // Progress bar — GSAP owns the width entirely (no React inline style).
  // Linear easing; on wrap-around the bar fills/empties to the edge first
  // so it feels like a continuous loop instead of jumping backward.
  useEffect(() => {
    const bar = progressRef.current;
    if (!bar) return;

    const prev = prevActiveRef.current;
    prevActiveRef.current = active;

    const N = projects.length;
    const pct = ((active + 1) / N) * 100;
    const isInitial = prev === active;
    const isForwardWrap = prev === N - 1 && active === 0;
    const isBackwardWrap = prev === 0 && active === N - 1;

    let cancelled = false;
    loadGsap().then(({ gsap }) => {
      if (!bar.isConnected || cancelled) return;
      gsap.killTweensOf(bar);

      if (isInitial) {
        gsap.set(bar, { width: `${pct}%` });
      } else if (isForwardWrap) {
        gsap.to(bar, {
          width: '100%',
          duration: 0.25,
          ease: 'none',
          onComplete: () => {
            if (cancelled) return;
            gsap.set(bar, { width: '0%' });
            gsap.to(bar, { width: `${pct}%`, duration: 0.25, ease: 'none' });
          },
        });
      } else if (isBackwardWrap) {
        gsap.to(bar, {
          width: '0%',
          duration: 0.25,
          ease: 'none',
          onComplete: () => {
            if (cancelled) return;
            gsap.set(bar, { width: '100%' });
            gsap.to(bar, { width: `${pct}%`, duration: 0.25, ease: 'none' });
          },
        });
      } else {
        gsap.to(bar, { width: `${pct}%`, duration: 0.5, ease: 'none' });
      }
    });
    return () => {
      cancelled = true;
      const g = gsapRef.current;
      if (g) g.killTweensOf(bar);
    };
  }, [active, projects.length]);

  // Auto-scroll to projects section when loaded via ?p=slug
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const slug = new URLSearchParams(window.location.search).get('p');
    if (!slug) return;
    const timer = setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard navigation when section is in viewport
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      )
        return;
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.7 && rect.bottom > window.innerHeight * 0.3;
      if (!inView) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  // Drag / swipe — translates each card individually since carousel is infinite (no track)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || cardWidth === 0) return;

    const N = projects.length;
    const pitch = cardWidth + CARD_GAP;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let dx = 0;
    let dy = 0;
    let pointerId = -1;
    let suppressClick = false;
    let startTarget: EventTarget | null = null;
    let baseSlots: number[] = [];

    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('a, button')) return;
      const gsap = gsapRef.current;
      if (!gsap) return; // GSAP not yet loaded — abort to avoid manual transform desync
      dragging = true;
      startTarget = e.target;
      startX = e.clientX;
      startY = e.clientY;
      dx = 0;
      dy = 0;
      pointerId = e.pointerId;
      suppressClick = false;
      stage.style.cursor = 'grabbing';
      setHasInteracted(true);
      // Capture the pointer so all subsequent move/up events route to the stage even if
      // the cursor leaves the original target. Without this, a desktop click-drag that
      // started on the active card could be interrupted (native text-selection / focus
      // behaviors steal the gesture before our drag threshold engages).
      try {
        stage.setPointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      // Kill any in-flight tweens so the drag doesn't fight an active transition,
      // then snapshot each card's current x as the drag baseline.
      baseSlots = cardsRef.current.map(card => {
        if (!card) return 0;
        gsap.killTweensOf(card);
        return (gsap.getProperty(card, 'x') as number) || 0;
      });
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const gsap = gsapRef.current;
      if (!gsap) return;
      dx = e.clientX - startX;
      dy = e.clientY - startY;

      // If gesture is mostly vertical, abandon drag (let page scroll naturally)
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 18) {
        dragging = false;
        stage.style.cursor = 'grab';
        return;
      }

      if (Math.abs(dx) > 8) {
        e.preventDefault();
        suppressClick = true;
        // Use gsap.set so GSAP's internal transform cache stays in sync with the actual
        // position. Without this, the next gsap.to() may animate from a stale cached x,
        // causing a brief visual jump back before the slide.
        cardsRef.current.forEach((card, i) => {
          if (!card) return;
          gsap.set(card, { x: baseSlots[i] + dx });
        });
      }
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      stage.style.cursor = 'grab';
      try {
        stage.releasePointerCapture(pointerId);
      } catch {
        /* noop */
      }

      const threshold = cardWidth * 0.18;
      if (dx < -threshold) {
        // Trigger the slide BEFORE setActive so there's no perceptible gap between the
        // finger lifting and the animation starting. power3.out for natural momentum feel.
        const newActive = (active + 1) % N;
        skipNextActiveAnimationRef.current = true;
        animateCardsToActive(newActive, 'power3.out');
        setActive(newActive);
      } else if (dx > threshold) {
        const newActive = (active - 1 + N) % N;
        skipNextActiveAnimationRef.current = true;
        animateCardsToActive(newActive, 'power3.out');
        setActive(newActive);
      } else if (suppressClick) {
        // Snap back without changing active — also ease-out for momentum continuity
        animateCardsToActive(active, 'power3.out', 0.45);
      } else if (startTarget) {
        const targetEl = startTarget as HTMLElement;
        const idx = cardsRef.current.findIndex(card => card?.contains(targetEl));
        if (idx !== -1 && idx !== active) {
          goTo(idx);
          suppressClick = true;
        }
      }
      startTarget = null;
    };

    const onClickCapture = (e: MouseEvent) => {
      if (suppressClick) {
        e.stopPropagation();
        e.preventDefault();
        suppressClick = false;
      }
    };

    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    stage.addEventListener('click', onClickCapture, true);

    return () => {
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      stage.removeEventListener('click', onClickCapture, true);
    };
  }, [active, cardWidth, projects.length, animateCardsToActive, goTo]);

  const stageHeight = cardWidth > 0 ? Math.round((cardWidth * 9) / 16) : 0;
  const activeProject = projects[active];
  void stageWidth; // measured for resize re-render trigger; cards center via left:50% + marginLeft

  return (
    <section
      ref={sectionRef}
      id="projects"
      className="py-10 md:py-16 container mx-auto px-4 cv-auto"
    >
      <div
        ref={headerRef}
        className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6"
      >
        <div>
          <h2
            className="projects-title text-3xl md:text-5xl font-bold mb-3"
            style={{ perspective: '800px' }}
          >
            {t('projects.title')}
          </h2>
          <p className="projects-subtitle text-muted-foreground text-base max-w-md">
            {t('projects.subtitle')}
          </p>
        </div>
        <a
          href="https://github.com/Thomas-TP"
          target="_blank"
          rel="noopener noreferrer"
          className="projects-github-link group flex items-center gap-2 text-foreground border-b border-border pb-1 hover:border-foreground transition-colors"
        >
          {t('projects.view_all')}{' '}
          <ArrowUpRight
            className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform"
            size={18}
          />
        </a>
      </div>

      {/* Carousel stage — full width, cards absolute-positioned and animate to slot positions */}
      <div
        ref={stageRef}
        className="relative w-full overflow-hidden select-none"
        style={{ height: stageHeight || undefined, touchAction: 'pan-y' }}
      >
        {projects.map((project, i) => {
          const isActive = i === active;
          return (
            <div
              key={project.title}
              ref={el => {
                cardsRef.current[i] = el;
              }}
              className={`absolute top-0 left-1/2 will-change-transform bg-card border border-border rounded-3xl overflow-hidden shadow-2xl transition-[border-color] duration-300 ${
                isActive
                  ? 'cursor-grab active:cursor-grabbing'
                  : 'cursor-pointer hover:border-foreground/40'
              }`}
              style={{
                width: cardWidth,
                height: stageHeight,
                marginLeft: -cardWidth / 2,
                opacity: isActive ? 1 : 0.3,
              }}
              onClick={() => {
                if (!isActive) goTo(i);
              }}
              role="button"
              tabIndex={isActive ? -1 : 0}
              aria-label={isActive ? `${project.title} — current project` : `Show ${project.title}`}
              onKeyDown={e => {
                if (!isActive && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  goTo(i);
                }
              }}
            >
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none z-10" />
                {project.visual}
              </div>

              {/* Card label — bottom-left. Slight backdrop boost on inactive so the title stays legible through the lowered opacity. */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 z-20 pointer-events-none">
                <span className="font-mono text-[10px] text-white/80 backdrop-blur-md bg-black/60 px-1.5 py-0.5 rounded-md border border-white/15">
                  {String(i + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
                </span>
                <span className="font-bold text-white text-xs tracking-wide drop-shadow-[0_0_8px_rgba(0,0,0,0.7)]">
                  {project.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile-only swipe hint — pulses to invite the gesture, fades out after first interaction */}
      <div
        ref={swipeHintRef}
        aria-hidden="true"
        className="md:hidden flex items-center justify-center gap-2 mt-3 text-muted-foreground text-[11px] tracking-[0.18em] uppercase pointer-events-none"
        style={{ opacity: 0 }}
      >
        <ChevronLeft size={14} className="swipe-hint-left" />
        <span>{t('projects.swipe_hint')}</span>
        <ChevronRight size={14} className="swipe-hint-right" />
      </div>

      {/* Info zone + controls — below carousel, internal 2-col on desktop */}
      <div className="relative mt-6">
        {/* Year watermark behind info */}
        <div
          aria-hidden="true"
          className="absolute -top-10 -left-2 md:-left-6 pointer-events-none select-none z-0 overflow-hidden leading-none"
        >
          <div
            ref={watermarkRef}
            className="font-black tracking-tighter text-foreground/[0.04]"
            style={{ fontSize: 'clamp(4.5rem, 11vw, 9rem)', lineHeight: 0.85 }}
          >
            {activeProject.year}
          </div>
        </div>

        <div className="relative z-10 grid md:grid-cols-12 gap-6 md:gap-8">
          {/* Left: project info */}
          <div className="md:col-span-7 space-y-3">
            <div ref={infoMetaRef} className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground">
                {String(active + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
              </span>
              <div className="h-px bg-border w-10" />
              <span className="font-mono text-xs text-muted-foreground">{activeProject.year}</span>
            </div>

            <h3 ref={infoTitleRef} className="text-2xl md:text-3xl font-bold tracking-tight">
              {activeProject.title}
            </h3>

            <p ref={infoDescRef} className="text-muted-foreground text-sm leading-relaxed max-w-xl">
              {activeProject.description}
            </p>

            <div ref={infoTagsRef} className="flex flex-wrap gap-1.5">
              {activeProject.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full bg-secondary text-[11px] font-medium text-muted-foreground border border-border"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div ref={infoCtaRef} className="flex flex-wrap gap-2 pt-1">
              {activeProject.github && (
                <a
                  href={activeProject.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-secondary rounded-full hover:bg-foreground hover:text-background transition-all"
                  aria-label="View on GitHub"
                >
                  <FaGithub size={16} />
                </a>
              )}
              {activeProject.link && (
                <a
                  href={activeProject.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full hover:bg-foreground hover:text-background transition-all font-medium text-sm"
                >
                  {t('projects.view_project')} <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>

          {/* Right: navigation controls */}
          <div className="md:col-span-5 flex flex-col gap-3 md:pt-1">
            {/* Arrows + progress line */}
            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                aria-label="Previous project"
                className="w-10 h-10 shrink-0 rounded-full border border-border flex items-center justify-center transition-all hover:bg-foreground hover:text-background hover:border-foreground"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={next}
                aria-label="Next project"
                className="w-10 h-10 shrink-0 rounded-full border border-border flex items-center justify-center transition-all hover:bg-foreground hover:text-background hover:border-foreground"
              >
                <ChevronRight size={16} />
              </button>
              <div className="flex-1 h-px bg-border relative ml-2 overflow-hidden">
                <div ref={progressRef} className="absolute inset-y-0 left-0 bg-foreground" />
              </div>
            </div>

            {/* Project list — click to jump */}
            <ol className="border-t border-border">
              {projects.map((p, i) => {
                const isActive = i === active;
                return (
                  <li key={p.title} className="border-b border-border">
                    <button
                      onClick={() => goTo(i)}
                      className={`group flex items-center gap-3 w-full text-left py-1.5 transition-colors ${
                        isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <span className="font-mono text-[11px] w-6 shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`flex-1 text-xs font-medium tracking-wide transition-transform duration-500 ${
                          isActive ? 'translate-x-2' : 'group-hover:translate-x-1'
                        }`}
                      >
                        {p.title}
                      </span>
                      <span
                        className={`h-px bg-foreground transition-all duration-500 ${
                          isActive ? 'w-6 opacity-100' : 'w-0 opacity-0'
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
