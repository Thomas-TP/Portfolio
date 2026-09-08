import { type ReactNode, useState, useRef, useEffect, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { loadGsap } from '@/lib/gsap-init';
import { cn } from '@/lib/utils';
import {
  Brain,
  Code2,
  Database,
  Coffee,
  GraduationCap,
  Zap,
  Tv,
  Lightbulb,
  Wifi,
  Briefcase,
  Search,
  Loader,
  ExternalLink,
} from 'lucide-react';

function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefers(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefers(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return prefers;
}

// Bento Grid Utilities
const BentoGrid = forwardRef<HTMLDivElement, { className?: string; children?: ReactNode }>(
  ({ className, children }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'grid auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto ',
          className
        )}
      >
        {children}
      </div>
    );
  }
);

const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | ReactNode;
  description?: string | ReactNode;
  header?: ReactNode;
  icon?: ReactNode;
}) => {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;
    let cleanup: (() => void) | undefined;
    loadGsap().then(({ gsap }) => {
      if (!el.isConnected) return;
      const enter = () => gsap.to(el, { y: -6, scale: 1.01, duration: 0.12, ease: 'power2.out' });
      const leave = () => gsap.to(el, { y: 0, scale: 1, duration: 0.15, ease: 'power3.out' });
      el.addEventListener('mouseenter', enter);
      el.addEventListener('mouseleave', leave);
      cleanup = () => {
        el.removeEventListener('mouseenter', enter);
        el.removeEventListener('mouseleave', leave);
      };
    });
    return () => cleanup?.();
  }, []);

  return (
    <div
      ref={itemRef}
      className={cn(
        'row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 dark:bg-black/40 dark:border-white/10 bg-white border border-border justify-between flex flex-col space-y-4',
        className
      )}
    >
      {header}
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        {icon}
        <div className="font-bold text-foreground mb-2 mt-2">{title}</div>
        <div className="font-normal text-muted-foreground text-xs">{description}</div>
      </div>
    </div>
  );
};

function WebDevBlock() {
  interface SearchResult {
    id: number;
    title: string;
    desc: string;
  }
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setResults([]);

    // Simulate network delay
    setTimeout(() => {
      setIsSearching(false);
      setResults([
        { id: 1, title: `${query} - ${t('bento.web_dev.title')}`, desc: t('bento.web_dev.desc') },
        { id: 2, title: `How to use ${query}`, desc: t('bento.web_dev.desc') },
        { id: 3, title: `${query} vs Others`, desc: t('bento.web_dev.desc') },
      ]);
    }, 1500);
  };

  // Stagger-reveal search results once they render
  useEffect(() => {
    if (results.length === 0) return;
    const el = containerRef.current;
    if (!el) return;
    loadGsap().then(({ gsap }) => {
      const items = el.querySelectorAll('.bento-search-result');
      if (!items.length) return;
      gsap.fromTo(
        items,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.08, ease: 'power3.out' }
      );
    });
  }, [results]);

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden relative group/image"
    >
      <div className="absolute inset-0 bg-grid-white/[0.05]" />

      <div className="relative z-10 w-[90%] h-[85%] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Browser Toolbar */}
        <div className="h-10 w-full bg-muted/50 border-b border-border flex items-center px-3 gap-3 shrink-0 z-20 relative select-none">
          <div className="flex gap-1.5 opacity-50">
            <div className="w-2.5 h-2.5 rounded-full bg-foreground/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-foreground/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-foreground/20" />
          </div>
          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="flex-1 h-6 bg-muted rounded-md border border-border flex items-center px-2 relative focus-within:border-primary/20 transition-colors"
          >
            <Search size={10} className="text-muted-foreground mr-2" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}

              aria-label={t('bento.web_dev.searching')}
              placeholder={t('bento.web_dev.searching')}
              className="flex-1 bg-transparent border-none outline-none text-[10px] text-foreground placeholder:text-muted-foreground h-full"
            />
            {isSearching && <Loader size={10} className="text-white/50 animate-spin" />}
          </form>
        </div>

        {/* Browser Content */}
        <div className="flex-1 p-4 overflow-y-auto relative min-h-0 custom-scrollbar">
          {!hasSearched ? (
            // Initial State (Placeholder Mockup)
            <div className="flex h-full flex-col gap-4 opacity-30 select-none pb-4">
              {/* Hero Mockup */}
              <div className="w-full h-24 bg-gradient-to-br from-foreground/10 to-transparent rounded-lg border border-border flex flex-col justify-center p-4 gap-3 shrink-0">
                <div className="w-1/2 h-5 bg-foreground/20 rounded-md" />
                <div className="w-3/4 h-3 bg-foreground/5 rounded-md" />
              </div>
              {/* Grid Mockup */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="bg-foreground/5 rounded-md h-24" />
                <div className="bg-foreground/5 rounded-md h-24" />
                <div className="bg-foreground/5 rounded-md h-24" />
                <div className="bg-foreground/5 rounded-md h-24" />
                <div className="bg-foreground/5 rounded-md h-24" />
                <div className="bg-foreground/5 rounded-md h-24" />
              </div>
            </div>
          ) : (
            // Search Results State
            <div className="flex flex-col gap-3">
              <div className="text-[10px] text-muted-foreground mb-1">
                {isSearching
                  ? t('bento.web_dev.searching')
                  : `${results.length} results found for "${query}"`}
              </div>

              {isSearching
                ? // Loading Skeletons
                  ['skeleton-1', 'skeleton-2', 'skeleton-3'].map(id => (
                    <div key={id} className="space-y-2 animate-pulse">
                      <div className="w-1/3 h-3 bg-foreground/10 rounded" />
                      <div className="w-2/3 h-2 bg-foreground/5 rounded" />
                    </div>
                  ))
                : // Actual Results
                  results.map(result => (
                    <div
                      key={result.id}
                      className="p-3 rounded-lg border border-border bg-foreground/5 hover:bg-foreground/10 transition-colors cursor-pointer group bento-search-result"
                      style={{ opacity: 0 }}
                    >
                      <h4 className="text-[11px] font-bold text-foreground group-hover:underline mb-1">
                        {result.title}
                      </h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        {result.desc}
                      </p>
                    </div>
                  ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TerminalBlock() {
  const [history, setHistory] = useState<string[]>([
    'Welcome to system v1.0',
    "Type 'help' for available commands.",
  ]);
  const [input, setInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of terminal content only
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cmd = input.trim();
    if (!cmd) return;

    // Add command to history
    const newHistory = [...history, `$ ${cmd}`];

    // Process command
    if (cmd === 'clear') {
      setHistory([]);
      setInput('');
      return;
    }

    if (cmd === 'sudo apt update') {
      newHistory.push('Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease');
      newHistory.push('Get:2 http://security.ubuntu.com/ubuntu jammy-security InRelease [110 kB]');
      newHistory.push('Fetched 110 kB in 1s (123 kB/s)');
      newHistory.push('Reading package lists... Done');
      newHistory.push('Building dependency tree... Done');
      newHistory.push('All packages are up to date.');
    } else if (cmd === 'help') {
      newHistory.push('Available commands: sudo apt update, ls, whoami, clear');
    } else if (cmd === 'ls') {
      newHistory.push('monitor_sys.ps1  config.json  server.log  notes.txt');
    } else if (cmd === 'whoami') {
      newHistory.push('root');
    } else {
      newHistory.push(`bash: ${cmd}: command not found`);
    }

    setHistory(newHistory);
    setInput('');
  };

  return (
    <div
      className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-muted flex items-center justify-center relative overflow-hidden group/terminal"
      onClick={() => inputRef.current?.focus()}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.focus();
      }}
      role="button"
      tabIndex={0}
    >
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-white/[0.05]" />

      {/* Terminal Window */}
      <div className="relative z-10 w-3/4 h-3/4 bg-card border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden group-hover/terminal:border-primary/20 transition-colors">
        {/* Title Bar */}
        <div className="h-6 bg-muted/50 border-b border-border flex items-center px-2 gap-1.5 shrink-0">
          <div className="w-2 h-2 rounded-full bg-border" />
          <div className="w-2 h-2 rounded-full bg-border" />
          <div className="w-2 h-2 rounded-full bg-border" />
          <div className="ml-2 text-[8px] text-muted-foreground tracking-wide">bash — 80x24</div>
        </div>

        {/* Terminal Content */}
        <div
          ref={containerRef}
          className="flex-1 p-3 text-[10px] text-muted-foreground overflow-y-auto cursor-text"
          style={{ scrollbarWidth: 'none' }}
        >
          {history.map((line, i) => (
            <div key={`${line.slice(0, 20)}-${i}`} className="mb-1 break-words leading-tight">
              {line}
            </div>
          ))}

          <form onSubmit={handleCommand} className="flex gap-1.5 items-center">
            <span className="text-muted-foreground shrink-0 select-none">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="bg-transparent border-none outline-none text-foreground w-full opacity-90 focus:opacity-100 p-0 m-0 h-auto min-w-0"
              spellCheck={false}
              autoComplete="off"
              aria-label="Terminal Command Input"
            />
          </form>
        </div>
      </div>
    </div>
  );
}

function IoTBlock() {
  const { t } = useTranslation();
  const [lightOn, setLightOn] = useState(false);
  const [brightness, setBrightness] = useState(50);
  const [tvOn, setTvOn] = useState(false);
  const [ovenOn, setOvenOn] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (isHovering) return;
    const interval = setInterval(() => {
      setLightOn(prev => !prev);
    }, 3000); // Auto toggle every 3s
    return () => clearInterval(interval);
  }, [isHovering]);

  const toggleLight = () => {
    setLightOn(v => !v);
  };
  const toggleTv = () => {
    setTvOn(v => !v);
  };
  const toggleOven = () => {
    setOvenOn(v => !v);
  };

  return (
    <div
      className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative overflow-hidden group/iot"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="absolute inset-0 bg-grid-white/[0.05]" />

      {/* Phone Interface */}
      <div className="absolute left-4 bottom-3 top-3 md:bottom-1 md:top-1 w-32 bg-card border border-border rounded-2xl p-2 shadow-2xl flex flex-col z-20 transform scale-[1.1] md:scale-[0.9] origin-left">
        {/* Status Bar */}
        <div className="flex justify-between items-center px-1 mb-1 opacity-50">
          <span className="text-[8px] text-foreground">09:41</span>
          <div className="flex gap-1">
            <Wifi size={8} className="text-foreground" />
            <div className="w-3 h-1.5 border border-foreground rounded-[1px] relative">
              <div className="absolute left-0 top-0 bottom-0 bg-foreground w-[70%]" />
            </div>
          </div>
        </div>

        {/* App Content */}
        <div className="flex-1 flex flex-col gap-1 overflow-hidden justify-center md:justify-start">
          <div className="text-[9px] font-bold text-foreground mb-0.5 ml-1">Home</div>

          {/* Light Control */}
          <div
            className="bg-foreground/5 rounded-lg p-1 flex flex-col gap-1 transition-colors duration-300"
            style={{
              backgroundColor: lightOn ? 'rgba(251, 191, 36, 0.1)' : 'rgba(128,128,128,0.05)',
            }}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-full bg-foreground/5">
                  <Lightbulb
                    size={10}
                    className={lightOn ? 'text-yellow-500' : 'text-muted-foreground'}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground">{t('bento.iot.lamp')}</span>
              </div>
              <div
                className="w-6 h-3 rounded-full bg-foreground/10 relative cursor-pointer scale-125 md:scale-100 origin-right"
                onClick={toggleLight}
                role="button"
                tabIndex={0}
                aria-label={t('bento.iot.lamp')}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleLight()}
              >
                <div
                  className="absolute top-0.5 bottom-0.5 w-2 h-2 rounded-full bg-background shadow-sm transition-[left] duration-200"
                  style={{ left: lightOn ? '14px' : '2px' }}
                />
              </div>
            </div>
            {lightOn && (
              <input
                type="range"
                min="0"
                max="100"
                value={brightness}
                onChange={e => setBrightness(parseInt(e.target.value))}
                aria-label="Light Brightness"
                className="w-full h-2 md:h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:md:w-2 [&::-webkit-slider-thumb]:md:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            )}
          </div>

          {/* TV Control */}
          <div
            className="hidden md:flex bg-foreground/5 rounded-lg p-1 justify-between items-center transition-colors duration-300"
            style={{ backgroundColor: tvOn ? 'rgba(59, 130, 246, 0.1)' : 'rgba(128,128,128,0.05)' }}
          >
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-full bg-foreground/5">
                <Tv size={10} className={tvOn ? 'text-blue-500' : 'text-muted-foreground'} />
              </div>
              <span className="text-[9px] text-muted-foreground">{t('bento.iot.tv')}</span>
            </div>
            <div
              className="w-6 h-3 rounded-full bg-foreground/10 relative cursor-pointer flex-shrink-0"
              onClick={toggleTv}
              role="button"
              tabIndex={0}
              aria-label={t('bento.iot.tv')}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleTv()}
            >
              <div
                className="absolute top-0.5 bottom-0.5 w-2 h-2 rounded-full bg-background shadow-sm transition-[left] duration-200"
                style={{ left: tvOn ? '14px' : '2px' }}
              />
            </div>
          </div>

          {/* Oven Control */}
          <div
            className="hidden md:flex bg-foreground/5 rounded-lg p-1 justify-between items-center transition-colors duration-300"
            style={{
              backgroundColor: ovenOn ? 'rgba(239, 68, 68, 0.1)' : 'rgba(128,128,128,0.05)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-full bg-foreground/5">
                <Zap size={10} className={ovenOn ? 'text-red-500' : 'text-muted-foreground'} />
              </div>
              <span className="text-[9px] text-muted-foreground">{t('bento.iot.oven')}</span>
            </div>
            <div
              className="w-6 h-3 rounded-full bg-foreground/10 relative cursor-pointer flex-shrink-0"
              onClick={toggleOven}
              role="button"
              tabIndex={0}
              aria-label={t('bento.iot.oven')}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleOven()}
            >
              <div
                className="absolute top-0.5 bottom-0.5 w-2 h-2 rounded-full bg-background shadow-sm transition-[left] duration-200"
                style={{ left: ovenOn ? '14px' : '2px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Connected Lines */}
      <svg
        className="absolute inset-0 pointer-events-none z-10 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Line to Light */}
        {/* Line to Light */}
        <path
          className="hidden md:block"
          d="M 55 35 L 75 25"
          stroke={lightOn ? '#fbbf24' : 'rgba(255,255,255,0.1)'}
          strokeWidth="0.5"
          strokeDasharray="2 2"
          fill="none"
        />
        {/* Line to Light (Mobile) */}
        <path
          className="md:hidden"
          d="M 55 50 L 75 50"
          stroke={lightOn ? '#fbbf24' : 'rgba(255,255,255,0.1)'}
          strokeWidth="0.5"
          strokeDasharray="2 2"
          fill="none"
        />
        {/* Line to TV */}
        <path
          className="hidden md:block"
          d="M 55 50 L 75 50"
          stroke={tvOn ? '#60a5fa' : 'rgba(255,255,255,0.1)'}
          strokeWidth="0.5"
          strokeDasharray="2 2"
          fill="none"
        />
        {/* Line to Oven */}
        <path
          className="hidden md:block"
          d="M 55 65 L 75 75"
          stroke={ovenOn ? '#f87171' : 'rgba(255,255,255,0.1)'}
          strokeWidth="0.5"
          strokeDasharray="2 2"
          fill="none"
        />
      </svg>

      {/* Devices Column */}
      <div className="absolute right-6 top-0 bottom-0 flex flex-col justify-center gap-4 z-10 w-16 md:scale-100 scale-[1.3] origin-right">
        {/* Light Bulb - Detailed */}
        <div
          className="w-16 h-16 rounded-2xl bg-card border border-border flex flex-col items-center justify-center relative transition-all duration-500 overflow-hidden"
          style={{
            borderColor: lightOn ? 'rgba(251, 191, 36, 0.5)' : '',
            boxShadow: lightOn
              ? `0 0 ${brightness / 2}px rgba(251, 191, 36, ${brightness / 100})`
              : 'none',
          }}
        >
          {/* Glow Effect */}
          <div
            className="absolute inset-0 bg-yellow-500/5"
            style={{ opacity: lightOn ? brightness / 100 : 0 }}
          />

          {/* Bulb SVG */}
          <div className="relative z-10">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                color: lightOn ? '#fbbf24' : 'rgb(var(--muted-foreground))',
                filter: lightOn ? `drop-shadow(0 0 ${brightness / 10}px #fbbf24)` : 'none',
                transition: 'color 0.5s ease, filter 0.5s ease',
              }}
            >
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 16.5 8 4.5 4.5 0 0 0 12 3.5 4.5 4.5 0 0 0 7.5 8c0 1.42.7 2.61 1.91 3.5A2.51 2.51 0 0 1 10.9 14" />
            </svg>
          </div>
          <div className="mt-1 text-[8px] text-muted-foreground">
            {lightOn ? `${brightness}%` : 'OFF'}
          </div>
        </div>

        {/* Smart TV - Detailed */}
        <div
          className="hidden md:flex w-16 h-16 rounded-2xl bg-card border border-border flex-col items-center justify-center relative overflow-hidden transition-all duration-500"
          style={{
            borderColor: tvOn ? 'rgba(96, 165, 250, 0.5)' : '',
            boxShadow: tvOn ? '0 0 30px rgba(96, 165, 250, 0.15)' : 'none',
          }}
        >
          {/* Screen Content */}
          <div className="w-10 h-7 bg-muted rounded border border-border relative overflow-hidden flex items-center justify-center">
            {tvOn ? (
              <>
                <div className="absolute inset-0 bg-blue-500/20 animate-pulse" />
                <div className="w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
                {/* Abstract Movie Scene */}
                <div className="absolute inset-2 flex gap-0.5 items-end">
                  <div className="w-1 h-2 bg-blue-400/50 rounded-sm animate-[bounce_1s_infinite]" />
                  <div className="w-1 h-3 bg-purple-400/50 rounded-sm animate-[bounce_1.2s_infinite]" />
                  <div className="w-1 h-1.5 bg-indigo-400/50 rounded-sm animate-[bounce_0.8s_infinite]" />
                </div>
              </>
            ) : (
              <div className="text-[6px] text-muted-foreground/30">SONY</div>
            )}
          </div>
          <div className="mt-1.5 w-4 h-0.5 bg-border rounded-full" />
        </div>

        {/* Kitchen Oven - Detailed */}
        <div
          className="hidden md:flex w-16 h-16 rounded-2xl bg-card border border-border flex-col items-center justify-center relative overflow-hidden transition-all duration-500"
          style={{
            borderColor: ovenOn ? 'rgba(248, 113, 113, 0.5)' : '',
            boxShadow: ovenOn ? '0 0 30px rgba(248, 113, 113, 0.15)' : 'none',
          }}
        >
          <div className="w-10 h-8 rounded-md border border-border relative overflow-hidden bg-muted">
            {/* Oven Window */}
            <div className="absolute inset-1 rounded bg-background/50 border border-border overflow-hidden flex items-center justify-center">
              {ovenOn && (
                <>
                  <div className="absolute inset-0 bg-orange-500/10 animate-pulse" />
                  <div className="w-full h-[1px] bg-orange-500/50 blur-[1px] absolute top-1/2 shadow-[0_0_5px_#f97316]" />
                  <div className="w-full h-[1px] bg-red-500/50 blur-[1px] absolute top-2/3 shadow-[0_0_5px_#ef4444]" />
                </>
              )}
            </div>
            {/* Controls */}
            <div className="absolute top-0.5 right-1 flex gap-0.5">
              <div className="w-0.5 h-0.5 rounded-full bg-foreground/30" />
              <div className="w-0.5 h-0.5 rounded-full bg-foreground/30" />
            </div>
          </div>
          <div
            className="mt-1 text-[8px]"
            style={{ color: ovenOn ? '#f87171' : 'rgb(var(--muted-foreground))' }}
          >
            {ovenOn ? '200°C' : 'OFF'}
          </div>
        </div>
      </div>
    </div>
  );
}

function GenevaStudentBlock() {
  const { t } = useTranslation();
  const [year, setYear] = useState(2026);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let trigger: { kill: () => void } | undefined;
    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (!el.isConnected) return;
      trigger = ScrollTrigger.create({
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self: { progress: number }) => {
          if (!isHovering) {
            const mappedYear = Math.round(2024 + self.progress * 4);
            if (mappedYear >= 2024 && mappedYear <= 2028) {
              setYear(mappedYear);
            }
          }
        },
      });
    });
    return () => trigger?.kill();
  }, [isHovering]);

  const stages = {
    2024: {
      title: t('bento.student.school_entry'),
      subtitle: t('bento.student.start'),
      icon: (
        <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border">
          <span className="text-xs font-bold text-foreground">01</span>
        </div>
      ),
    },
    2025: {
      title: t('bento.student.development'),
      subtitle: t('bento.student.desc'),
      icon: <Code2 className="text-foreground" size={20} />,
    },
    2026: {
      title: t('bento.student.specialization'),
      subtitle: t('bento.student.desc'),
      icon: <Database className="text-foreground" size={20} />,
    },
    2027: {
      title: t('bento.student.internship'),
      subtitle: 'Professional Exp.',
      icon: <Briefcase className="text-foreground" size={20} />,
    },
    2028: {
      title: t('bento.student.graduation'),
      subtitle: t('bento.student.diploma'),
      icon: <GraduationCap className="text-foreground" size={20} />,
    },
  };

  // Calculate progress for the progress bar
  const progress = ((year - 2024) / 4) * 100;

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full h-full min-h-[6rem] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative overflow-hidden group/student"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="absolute inset-0 bg-grid-white/[0.05]" />

      <div className="w-[85%] flex flex-col gap-6 relative z-10">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center transition-all duration-300">
              {stages[year as keyof typeof stages].icon}
            </div>
            <div className="flex flex-col">
              <span key={year} className="text-sm font-bold text-foreground tracking-wide">
                {stages[year as keyof typeof stages].title}
              </span>
              <span key={`sub-${year}`} className="text-[10px] text-muted-foreground">
                {stages[year as keyof typeof stages].subtitle}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-foreground">{year}</span>
            <span className="text-[9px] text-muted-foreground tracking-widest">TIMELINE</span>
          </div>
        </div>

        {/* Interactive Slider Section */}
        <div className="flex flex-col gap-2">
          <div className="relative w-full h-6 flex items-center">
            {/* Track Background */}
            <div className="absolute left-0 right-0 h-1 bg-foreground/10 rounded-full overflow-hidden">
              {/* Progress Fill */}
              <div
                className="h-full bg-foreground transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Slider Input */}
            <input
              type="range"
              min="2024"
              max="2028"
              value={year}
              step="1"
              onChange={e => setYear(parseInt(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
              aria-label="Student Timeline Year"
            />

            {/* Custom Thumb (Visual only, follows visible state) */}
            <div
              className="absolute h-4 w-4 bg-background border-2 border-foreground rounded-full shadow-[0_0_10px_rgba(128,128,128,0.5)] z-10 pointer-events-none transition-[left] duration-300"
              style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
            >
              <div className="absolute inset-1 bg-foreground rounded-full" />
            </div>

            {/* Ticks */}
            <div className="absolute left-0 right-0 flex justify-between px-[2px] pointer-events-none">
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <div
                  key={y}
                  className={`w-1 h-1 rounded-full transition-colors duration-300 ${y <= year ? 'bg-foreground' : 'bg-foreground/20'}`}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>START</span>
            <span>DIPLOMA</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CertificationsBlock() {
  const { t } = useTranslation();
  const shouldReduceMotion = usePrefersReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const glowOrbRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  // Hexagon path helper (pointy-top)
  const hex = (cx: number, cy: number, r: number) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    });
    return pts.join(' ');
  };

  // Geometric constellation data
  const shapes = [
    { cx: 320, cy: 60, r: 28, delay: 0, label: 'Cloud' },
    { cx: 390, cy: 120, r: 22, delay: 0.15, label: 'Cyber' },
    { cx: 340, cy: 155, r: 18, delay: 0.3, label: 'Dev' },
    { cx: 280, cy: 130, r: 15, delay: 0.45, label: 'IoT' },
    { cx: 410, cy: 55, r: 12, delay: 0.6, label: '' },
    { cx: 260, cy: 70, r: 10, delay: 0.75, label: '' },
  ];

  // Connection lines between hexagons
  const connections = [
    [0, 1],
    [0, 3],
    [1, 2],
    [2, 3],
    [0, 4],
    [0, 5],
    [1, 4],
    [3, 5],
  ];

  // Floating particles
  const particles = [
    { cx: 295, cy: 40, r: 2.5, dur: 3 },
    { cx: 420, cy: 90, r: 2, dur: 2.5 },
    { cx: 250, cy: 110, r: 1.5, dur: 3.5 },
    { cx: 370, cy: 170, r: 2, dur: 2.8 },
    { cx: 430, cy: 160, r: 1.5, dur: 3.2 },
    { cx: 310, cy: 180, r: 1.8, dur: 2.6 },
  ];

  // Ambient GSAP animations
  useEffect(() => {
    if (shouldReduceMotion) return;
    let ctx: { revert: () => void } | undefined;
    loadGsap().then(({ gsap }) => {
      const svg = svgRef.current;
      if (!svg) return;
      ctx = gsap.context(() => {
        // Hexagons breathing
        svg.querySelectorAll<SVGPolygonElement>('.hex-shape').forEach((el, i) => {
          gsap.to(el, {
            scale: 1.06,
            opacity: 0.9,
            duration: 2.2 + i * 0.3,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: i * 0.2,
            transformOrigin: 'center center',
          });
        });

        // Particles floating
        svg.querySelectorAll<SVGCircleElement>('.float-particle').forEach((el, i) => {
          gsap.to(el, {
            y: -8 + (i % 2 === 0 ? 4 : 0),
            x: i % 2 === 0 ? 5 : -5,
            duration: 2 + i * 0.4,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: i * 0.3,
          });
        });

        // Connection lines subtle pulse
        svg.querySelectorAll<SVGLineElement>('.conn-line').forEach((el, i) => {
          gsap.to(el, {
            opacity: 0.15,
            duration: 1.8 + i * 0.2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: i * 0.15,
          });
        });

        // Glow orb gentle breathing
        if (glowOrbRef.current) {
          gsap.to(glowOrbRef.current, {
            scale: 1.15,
            opacity: 0.4,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        }
      }, svg);
    });
    return () => ctx?.revert();
  }, [shouldReduceMotion]);

  // Hover: card lift (identical to BentoGridItem) + reveal details
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    let cleanup: (() => void) | undefined;
    loadGsap().then(({ gsap }) => {
      if (!card.isConnected) return;
      const svg = svgRef.current;

      const enter = () => {
        gsap.to(card, { y: -6, scale: 1.01, duration: 0.12, ease: 'power2.out' });
        if (!shouldReduceMotion && svg) {
          gsap.to(svg.querySelectorAll('.hex-label'), {
            opacity: 1,
            y: 0,
            duration: 0.15,
            stagger: 0.02,
            ease: 'power2.out',
          });
          gsap.to(svg.querySelectorAll('.hex-shape'), {
            strokeWidth: 1.5,
            opacity: 0.85,
            duration: 0.12,
            ease: 'power2.out',
          });
          gsap.to(svg.querySelectorAll('.conn-line'), {
            opacity: 0.3,
            duration: 0.12,
            ease: 'power2.out',
          });
        }
      };
      const leave = () => {
        gsap.to(card, { y: 0, scale: 1, duration: 0.15, ease: 'power3.out' });
        if (!shouldReduceMotion && svg) {
          gsap.to(svg.querySelectorAll('.hex-label'), {
            opacity: 0,
            y: 4,
            duration: 0.12,
            ease: 'power2.in',
          });
          gsap.to(svg.querySelectorAll('.hex-shape'), {
            strokeWidth: 0.8,
            opacity: 0.6,
            duration: 0.12,
            ease: 'power2.in',
          });
          gsap.to(svg.querySelectorAll('.conn-line'), {
            opacity: 0.08,
            duration: 0.12,
            ease: 'power2.in',
          });
        }
      };
      card.addEventListener('mouseenter', enter);
      card.addEventListener('mouseleave', leave);
      cleanup = () => {
        card.removeEventListener('mouseenter', enter);
        card.removeEventListener('mouseleave', leave);
      };
    });
    return () => cleanup?.();
  }, [shouldReduceMotion]);

  return (
    <div
      ref={cardRef}
      className="flex-1 w-full h-full min-h-[6rem] rounded-xl flex items-stretch relative overflow-hidden group/cert cursor-default border border-border hover:shadow-xl transition duration-200 shadow-input dark:shadow-none dark:bg-black/40 dark:border-white/10 bg-white will-change-transform"
    >
      {/* ── Subtle dot-grid pattern ── */}
      <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.03]" />

      {/* ── Glass inner reflection ── */}
      <div className="absolute inset-[1px] rounded-xl border border-foreground/[0.04] pointer-events-none" />

      {/* ── LEFT: Content ── */}
      <div className="flex flex-col justify-between relative z-10 p-8 pb-10 md:p-10 md:pb-12 flex-1 min-w-0">
        {/* Title block */}
        <div>
          {/* Official Credly logo as title */}
          <div ref={titleRef} className="mb-2">
            <svg
              className="h-16 md:h-20 text-foreground"
              viewBox="45 40 230 126"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M259,110.9c-.3-.1-.6-.2-.9-.2-.7,0-1.2.1-1.8.4-.5.3-.8.7-1.2,1.2-.8,1.2-1.3,2.4-2,3.6-1,1.7-2.2,3.2-3.4,4.6-1.2,1.4-2.6,2.6-3.8,3.9-.2.2-.6.4-.9.3-.3-.2-.3-.5-.3-.8.4-3.4.6-6.8,1.1-10.2.2-1.6.4-3,.6-4.6.3-2.2.5-4.4.8-6.6l2.1-16.4c.2-1.2.3-3.4-1.2-4.7-.6-.6-1.4-1-2.1-1-.8,0-1.6.1-2.3.5-2,1.5-2.7,4.6-3.2,6.8-1.3,5.4-1.6,11.2-4.2,16.2-.5,1-1.1,2-1.8,2.8-.5.6-1,1.2-1.7,1.6-.7.4-1.5.6-2.2.5-1-.2-1.7-1-2.1-1.9s-.5-1.9-.5-2.9c-.2-4.8.7-9.7,2.2-14.3.4-1.2.8-2.3.9-3.4.3-1.4.3-3.4-1-4.7-1.2-1.2-3-1.6-4.5-1.2-1.8.5-2.8,2.2-3.4,3.6-1.8,4.2-2.3,8.5-2.8,13-.4,3-1.2,5.8-2.7,8.3-.8,1.4-1.8,2.8-3.4,4.5-.6.6-1.3,1.3-2.1,1.9-1.1.8-2,1.1-3,1s-1.9-.8-2.5-1.9c-.5-.9-.7-1.9-.8-2.8-.3-1.7-.4-3.5-.3-5.5,0-2,0-3.9.4-5.9.7-3.5,6.1-17.4,7.3-21,1.2-3.7,2.4-7.4,3.2-11.2.7-3.4,1.1-6.9,1-10.3-.1-2.4-.6-5.1-2.6-6.6-1.5-1.1-3.7-1.2-5.4-.5-1.8.7-3.1,2.2-4.1,3.8s-1.5,3.5-2,5.3c-1,3.8-1.8,7.7-2.4,11.6-.6,3.8-1.2,7.6-1.9,11.4-.5,3.2-1.8,14.5-2.4,16.9-.5,2.5-1.6,4.8-2.7,7.1-1.2,2.4-2.3,4.8-3.7,7.1-.4.8-.9,1.5-1.6,2-.7.5-1.6.8-2.4.4-.9-.4-1.3-1.6-1.5-2.6-.7-3.9,0-7.9.6-11.7.8-3.9,3.9-21.6,4.7-25.6.9-4.8,2.2-9.5,2.6-14.3.3-3.5.8-7.9-1.8-10.7-1-1.2-2.8-1.4-4-1.2-1.6.3-2.8,1.6-3.5,2.7-.9,1.2-1.7,2.5-2.3,4.2-1,2.6-1.7,5.5-2.3,8.2l-.3,1.2c-.8,3.4-1.3,6.9-1.7,10.4-.2,1.9-.4,3.8-.5,5.7,0,.9-.2,1.8-.2,2.8,0,.7,0,1.5-.3,2.2-.1.2-.3.4-.5.6-.7.6-1.8.5-2.8.5-5-.2-9.4,2.7-12.2,6.8-1.6,2.3-2.5,4.9-3.5,7.5-.1.5-.3.9-.5,1.4-.4,1.3-1.2,3-2,4.6-.7,1.3-1.6,2.6-2.8,4.1-1.2,1.6-2.3,2.7-3.5,3.7-1.6,1.3-3.1,2.1-4.6,2.3-1.6.3-3.5-.4-4.9-1.8-1.1-1.3-1.7-3.2-1.9-4.8,0-.5,0-1.1.3-1.5.4-.6,1.3-.6,2-.7,5.5-.4,10.4-4,12.4-9.1,1.2-3,1.6-6.3,1.1-9.4-.3-1.6-.8-3.1-1.7-4.3-.9-1.3-2.1-2.3-3.6-2.9-2.6-1.2-5.9-1.2-9.1,0-5.2,2.1-8.5,6.7-10.2,14l-.2.8c-1,4.4-2.1,9-5.2,12.1-1.2,1.1-2.3,1.5-3.3,1.3-.4,0-.7-.3-1-.7-.8-1.4,0-4.8,1.4-9,.4-1.4.8-2.8.9-3.3,0-1.7-.2-3.2-1-4.5-.7-1.2-1.9-2.3-3.4-2.9-1.3-.6-2.8-.5-4.2-.5h-.4c-.4,0-.9,0-1.4-.1-.6-.1-1.1-.6-1.3-1.2-.2-.8,0-1.5.1-2.1,0-.2.1-.4.2-.7.4-1.3-.3-2.9-1.5-3.7-1.2-.8-2.8-.9-4.2-.3-1.3.6-2.5,1.7-3.3,3.1-.8,1.4-1.1,3-.9,4.3.3,1.2.7,2.8.4,4.3-.5,2.5-2,4.6-3.5,6.7-.3.4-.7,1-1,1.4-2.1,3-4.1,5.4-6.3,7.4-3.4,3-7.2,5.2-11.1,6-6.7,1.5-13.6-.5-17.2-6.6-2-3.4-2.9-7.4-3.2-11.4-.6-7.7.8-15.5,3.8-22.6,2.9-6.8,7.3-13.7,15.4-14.5,3.2-.3,6.8.8,8.2,3.6,1,2.1.7,4.6,0,6.8-.7,2.2-1.6,4.4-1.6,6.7,0,2.3,1.1,4.9,3.3,5.5,2.2.7,4.5-.7,5.7-2.6,1.2-1.9,1.7-4.1,2.2-6.3,1.3-5.1,3.3-10.1,6-14.7,1.2-2.1,2.7-4.4,2.3-6.8-.3-1.7-1.6-3.2-3.3-3.8-1.7-.5-3.6,0-4.8,1.3-1.2,1.3-1.8,3.3-3.5,3.9-1.5.5-3.1-.5-4.6-1.2-5.3-2.9-12-2.8-17.6-.5-5.6,2.3-10.2,6.7-13.7,11.7-4.9,7.2-8.2,16-8.8,24.7-.2,3.1-.3,6.2,0,9.3.3,4.1.9,7.7,1.9,10.8,1.2,3.8,2.8,7.1,4.9,9.8,2.4,3.1,5.3,5.4,8.5,6.7,3.4,1.3,7,2,10.7,1.9,3.5-.1,7.1-1,10.6-2.6,3-1.4,6.1-3.4,9.2-6.1,2.8-2.3,5.4-5,7.6-8,1.5-2,2.8-4.1,3.9-6.3.6-1.1,1.1-2.3,1.6-3.4.4-1,.8-1.9,1.8-2.4.5-.4,1.4-.2,1.8.1.6.3,1,.7,1.2,1.2.4,1,.2,2.1,0,3h0c-.3,1-.5,1.9-.8,2.8-1.2,3.8-2.1,7.3-1.4,10.7.4,1.9,1.2,3.5,2.3,4.7,1.2,1.3,2.8,2.1,4.5,2.4,2.2.3,4.6-.2,6.5-1.2,1.3-.6,2.5-1.4,3.6-2.4.6-.5,1.1-1.1,1.5-1.6.4-.5.8-1.3,1.6-1.3.4,0,.7.3.9.6.2.3.4.7.5,1,2,4.7,7,7.6,12,7.6h.6c2.4,0,4.9-.8,7.1-1.9,2.4-1.3,4.3-3.1,6.3-4.9.2-.2.4-.3.6-.4.3,0,.7.1.9.4.2.3.3.6.5.9,1.2,3.1,4.1,5.4,7.4,5.9s6.7-.7,8.9-3.2c.5-.5.9-1.2,1.5-1.6.6-.4,1.4-.7,2-.4.9.4,1.2,1.5,1.6,2.4,1,2.1,3.2,3.4,5.5,3.4,2.6,0,5-1.3,6.9-3.1,1.8-1.6,3.2-3.6,4.7-5.5.3-.3.6-.7.9-.9.4-.2.9-.2,1.2,0,.3.2.4.5.5.8,1.5,3.6,5.3,5.9,9.1,5.8,3.7,0,7.2-2,9.9-4.6.8-.8,1.7-1.8,2.9-1.9,1.2-.1,1.9,1,2.3,2,.6,1.3,1,2.2,2.2,3,1.4,1,3.2,1.4,4.9.9,1.6-.4,3.1-1.4,4.3-2.8.6-.8,1-1.8,1.7-2.6.8-.8,1.1.2,1.2.9.1,1.1.1,2.1,0,3.2-.1,2.1-.5,4.2-.7,6.3,0,.6-.2,1.2-.6,1.7-.6.6-1.5.7-2.3.6-1-.1-1.9-.2-2.9-.3h-1.2c-1.8-.3-3.6-.5-5.5-.5h-1.7c-3.6,0-6.6.4-9.2,1.4-4.3,1.7-7.7,5.1-9,9.2-.6,1.9-.8,3.9-.4,5.8.3,1.8,1.2,3.6,2.5,5.2,2.4,2.8,6.1,4.6,10.3,4.9,3.7.2,7.7-.6,11.6-2.3,7.6-3.3,13.3-9.8,15.2-17.5,0-.2.1-.3.3-.4,2.6-.9,5.1-2.2,7.3-3.8,2.2-1.7,4.2-3.6,5.9-5.8.8-1.1,1.6-2.2,2.3-3.3.7-1.1,1.2-2.3,1.9-3.4.5-.9,1-1.8,1.2-2.8.2-1,.1-2.1-.5-3-.3-.5-.8-.8-1.3-1.1M135.8,96.2c.2-.7.4-1.3.5-1.9.5-1.6,1.3-3.2,2.3-4.5.4-.5.7-.9,1.2-1.2.5-.3,1.1-.5,1.7-.4,1,.2,1.6,1.1,1.8,2.1.3,1.6-.4,3.6-1,5-.6,1.4-1.6,2.8-2.8,3.7-.5.4-1,.8-1.6,1-.3,0-.6.3-1,.3h-.1c-.5,0-1-.3-1.2-.8-.2-1.1,0-2.2.2-3.3M174.6,94.5c0,.7-.2,1.4-.3,2,0,.9-.1,1.7-.1,2.6,0,1.5,0,2.9.1,4.4,0,1.3.4,2.7-.1,4-.6,1.7-1.6,3.3-2.9,4.3-.6.5-1.4,1-2.2,1.4-.6.3-1.4.5-2.2.5s-.3,0-.5,0c-1.1,0-1.9-.8-2.4-1.6-.5-.8-.7-1.7-.9-2.5-.7-3.3-.4-6.8.6-10.1.7-2,1.9-3.9,3.4-5.4,1.4-1.3,3.2-2.1,5.1-2.1.6,0,1.4.1,1.8.6.4.4.5.9.5,1.5s0,.2,0,.3M232.4,136.3c-.1.4-.5.9-.7,1.3-.4.7-.9,1.5-1.5,2.1-.8,1-1.8,1.9-2.8,2.7-2.1,1.6-4.5,2.8-7,3.5-1.6.4-3,.6-4.4.6h-.3c-1.9,0-3.6-.6-4.6-1.6-.5-.5-1.2-1.2-1.4-2.3-.1-.8,0-1.7.4-2.7.6-1.5,1.9-2.7,3.4-3.5,2.9-1.4,6.1-1.6,9.2-1.4,1.2,0,2.4.1,3.6.2,1,0,1.9.1,2.9.2.5,0,1,0,1.6.1.4,0,.8,0,1.2,0,.5.1.6.4.5.7" />
            </svg>
          </div>
          <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.2em] mb-4">
            {t('bento.certifications.title')}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
            {t('bento.certifications.desc')}
          </p>
        </div>

        {/* CTA */}
        <a
          ref={ctaRef}
          href="https://www.credly.com/users/thomas-prudhomme"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-medium text-foreground/90 bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.08] hover:border-foreground/[0.15] px-5 py-2.5 rounded-lg transition-all duration-300 cursor-pointer w-fit group/btn"
        >
          {t('bento.certifications.view_profile')}
          <ExternalLink
            size={13}
            className="group-hover/btn:translate-x-1 transition-transform duration-300 opacity-60"
          />
        </a>
      </div>

      {/* ── RIGHT: Geometric constellation ── */}
      <div className="hidden md:flex relative items-center justify-center w-[220px] shrink-0">
        {/* Background glow orb */}
        <div
          ref={glowOrbRef}
          className="absolute w-32 h-32 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgb(var(--foreground) / 0.06) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />

        <svg
          ref={svgRef}
          viewBox="220 20 240 180"
          className="w-full h-full relative z-10"
          aria-hidden="true"
          fill="none"
        >
          {/* Connection lines */}
          {connections.map(([a, b], i) => (
            <line
              key={`conn-${i}`}
              className="conn-line"
              x1={shapes[a].cx}
              y1={shapes[a].cy}
              x2={shapes[b].cx}
              y2={shapes[b].cy}
              stroke="rgb(var(--foreground))"
              strokeWidth="0.5"
              opacity="0.08"
            />
          ))}

          {/* Hexagons */}
          {shapes.map((s, i) => (
            <g key={`hex-${i}`}>
              <polygon
                className="hex-shape"
                points={hex(s.cx, s.cy, s.r)}
                fill="rgb(var(--foreground) / 0.03)"
                stroke="rgb(var(--foreground))"
                strokeWidth="0.8"
                opacity="0.6"
              />
              {/* Inner hexagon (smaller, dashed) */}
              <polygon
                points={hex(s.cx, s.cy, s.r * 0.55)}
                fill="none"
                stroke="rgb(var(--foreground))"
                strokeWidth="0.3"
                strokeDasharray="2 3"
                opacity="0.15"
              />
              {/* Center dot */}
              <circle cx={s.cx} cy={s.cy} r="1.5" fill="rgb(var(--foreground))" opacity="0.25" />
              {/* Label (hidden until hover reveal) */}
              {s.label && (
                <text
                  className="hex-label"
                  x={s.cx}
                  y={s.cy + s.r + 14}
                  textAnchor="middle"
                  fill="rgb(var(--foreground))"
                  fontSize="8"
                  fontWeight="600"
                  letterSpacing="0.1em"
                  opacity="0"
                  style={{ transform: 'translateY(4px)', textTransform: 'uppercase' }}
                >
                  {s.label}
                </text>
              )}
            </g>
          ))}

          {/* Floating particles */}
          {particles.map((p, i) => (
            <circle
              key={`particle-${i}`}
              className="float-particle"
              cx={p.cx}
              cy={p.cy}
              r={p.r}
              fill="rgb(var(--foreground))"
              opacity="0.12"
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

// Main Component
export function AboutBento() {
  const { t } = useTranslation();
  const items = [
    {
      title: t('bento.web_dev.title'),
      description: t('bento.web_dev.desc'),
      header: <WebDevBlock />,
      icon: <Code2 className="h-4 w-4 text-neutral-500" />,
      className: 'md:col-span-2',
    },
    {
      title: t('bento.backend.title'),
      description: t('bento.backend.desc'),
      header: <TerminalBlock />,
      icon: <Database className="h-4 w-4 text-neutral-500" />,
      className: 'md:col-span-1',
    },
    {
      title: t('bento.iot.title'),
      description: t('bento.iot.desc'),
      header: <IoTBlock />,
      icon: <Brain className="h-4 w-4 text-neutral-500" />,
      className: 'md:col-span-1',
    },
    {
      title: t('bento.student.title'),
      description: t('bento.student.desc'),
      header: <GenevaStudentBlock />,
      icon: <Coffee className="h-4 w-4 text-neutral-500" />,
      className: 'md:col-span-2',
    },
    {
      title: '',
      description: '',
      header: <CertificationsBlock />,
      padding: 'p-0', // Special prop to remove padding for this block if needed, but standard item has p-4. I'll let standard styling apply but this block is the header itself.
      className: 'md:col-span-3 border-transparent bg-transparent shadow-none hover:shadow-none', // Overriding styles to let the Link block handle everything
      noDefaultStyles: true, // Custom flag I might need, or just use CSS overrides
    },
  ];

  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    loadGsap().then(({ gsap, ScrollTrigger }) => {
      ctx = gsap.context(() => {
        // — Header reveal
        if (headerRef.current) {
          const title = headerRef.current.querySelector('.about-title') as HTMLElement | null;
          const desc = headerRef.current.querySelector('.about-desc') as HTMLElement | null;

          if (title) {
            // Split words for staggered reveal
            const words = (title.textContent || '').split(' ');
            title.innerHTML = words
              .map(
                w =>
                  `<span class="about-word inline-block"><span class="about-word-inner inline-block">${w}</span></span>`
              )
              .join(' ');
            const inners = title.querySelectorAll('.about-word-inner');
            gsap.fromTo(
              inners,
              { y: '110%', rotateX: -40, opacity: 0 },
              {
                y: '0%',
                rotateX: 0,
                opacity: 1,
                duration: 0.75,
                stagger: 0.07,
                ease: 'power3.out',
                delay: 0.1,
                scrollTrigger: { trigger: headerRef.current, start: 'top 88%', once: true },
              }
            );
          }
          if (desc) {
            gsap.fromTo(
              desc,
              { opacity: 0, y: 20 },
              {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out',
                delay: 0.4,
                scrollTrigger: { trigger: headerRef.current, start: 'top 88%', once: true },
              }
            );
          }
        }

        // — Bento grid: each card reveals with y + opacity (no clip-path to preserve border-radius)
        if (gridRef.current) {
          const cards = gridRef.current.querySelectorAll(':scope > *');
          cards.forEach((card, i) => {
            const col = i % 3;
            const delay = col * 0.06;
            gsap.fromTo(
              card,
              { opacity: 0, y: 40, scale: 0.97 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.65,
                delay,
                ease: 'power3.out',
                scrollTrigger: { trigger: card as HTMLElement, start: 'top 92%', once: true },
              }
            );
          });
        }

        // Suppress unused var warning
        void ScrollTrigger;
      });
    });
    return () => ctx?.revert();
  }, []);

  return (
    <section id="about" className="py-20 container mx-auto px-4 cv-auto">
      <div ref={headerRef} className="mb-12 max-w-4xl mx-auto">
        <h2
          className="about-title text-3xl md:text-5xl font-bold mb-6"
          style={{ perspective: '800px' }}
        >
          {t('bento.header_about')}
        </h2>
        <p className="about-desc text-muted-foreground max-w-2xl text-lg">
          {t('bento.header_desc')}
        </p>
      </div>
      <BentoGrid ref={gridRef} className="max-w-4xl mx-auto">
        {items.map((item, i) =>
          item.noDefaultStyles ? (
            <div key={item.title || `item-${i}`} className={item.className}>
              {item.header}
            </div>
          ) : (
            <BentoGridItem
              key={item.title || `item-${i}`}
              title={item.title}
              description={item.description}
              header={item.header}
              icon={item.icon}
              className={item.className}
            />
          )
        )}
      </BentoGrid>
    </section>
  );
}
