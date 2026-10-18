import { Home, User, Code, Mail, Link as LinkIcon, Sparkles } from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { useState, useEffect, useRef, type ComponentType } from 'react';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { scrollToSection } from '@/lib/scroll';

interface NavItem {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  href: string;
  external?: boolean;
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

function NavLink({
  item,
  isActive,
  forceShowLabel,
}: {
  item: NavItem;
  isActive?: boolean;
  forceShowLabel?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  // When forceShowLabel is explicitly false, only show on hover (social items in bottom bar)
  const showLabel = forceShowLabel === false ? isHovered : isHovered || isActive || forceShowLabel;
  const labelRef = useRef<HTMLSpanElement>(null);
  const hasMeasured = useRef(false);

  // Measure natural width for smooth CSS transition (width can't transition to 'auto')
  const [naturalWidth, setNaturalWidth] = useState(0);
  useEffect(() => {
    const el = labelRef.current;
    if (!el) return;
    // Measure off-flow so the expanded label is never visible during measurement
    el.style.position = 'absolute';
    el.style.visibility = 'hidden';
    el.style.width = 'auto';
    const w = el.scrollWidth;
    // Restore position/visibility — only reset width, never touch opacity
    // (React manages opacity via style prop; touching it here desynchronizes React's diff)
    el.style.position = '';
    el.style.visibility = '';
    el.style.width = '0px';
    setNaturalWidth(w);
    // Enable transitions only after the first measurement to prevent flash on mount
    requestAnimationFrame(() => {
      hasMeasured.current = true;
    });
  }, [item.label]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (item.external) return;

    e.preventDefault();

    void scrollToSection(item.href.replace('#', '') || 'home');
  };

  return (
    <a
      href={item.href}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noopener noreferrer' : undefined}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative flex items-center justify-center p-2 md:p-2.5 rounded-full transition-all duration-300 ${isActive ? 'bg-foreground/10 text-foreground shadow-[0_0_20px_rgba(255,255,255,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] shadow-black/5' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/10'}`}
      aria-label={item.label}
    >
      <span
        ref={labelRef}
        className="overflow-hidden whitespace-nowrap font-medium text-xs mr-2 hidden md:block"
        style={{
          width: showLabel ? `${naturalWidth}px` : '0px',
          opacity: showLabel ? 1 : 0,
          transition: hasMeasured.current
            ? 'width 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease'
            : 'none',
        }}
      >
        {item.label}
      </span>
      <item.icon size={20} className="md:w-5 md:h-5" strokeWidth={1.5} />
    </a>
  );
}

function AskThomasNavButton({ forceShowLabel }: { forceShowLabel?: boolean }) {
  const { t } = useTranslation();
  const label = t('ask.launcher');
  const [isHovered, setIsHovered] = useState(false);
  const showLabel = forceShowLabel === false ? isHovered : isHovered || forceShowLabel;
  const labelRef = useRef<HTMLSpanElement>(null);
  const hasMeasured = useRef(false);
  const [naturalWidth, setNaturalWidth] = useState(0);

  useEffect(() => {
    const el = labelRef.current;
    if (!el) return;
    el.style.position = 'absolute';
    el.style.visibility = 'hidden';
    el.style.width = 'auto';
    const w = el.scrollWidth;
    el.style.position = '';
    el.style.visibility = '';
    el.style.width = '0px';
    setNaturalWidth(w);
    requestAnimationFrame(() => {
      hasMeasured.current = true;
    });
  }, [label]);

  return (
    <button
      type="button"
      onClick={openAskThomas}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      className="relative flex items-center justify-center p-2 md:p-2.5 rounded-full transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-foreground/10"
      aria-label={label}
      title={label}
    >
      <span
        ref={labelRef}
        className="mr-2 hidden overflow-hidden whitespace-nowrap text-xs font-medium md:block"
        style={{
          width: showLabel ? `${naturalWidth}px` : '0px',
          opacity: showLabel ? 1 : 0,
          transition: hasMeasured.current
            ? 'width 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease'
            : 'none',
        }}
      >
        {label}
      </span>
      <Sparkles size={20} className="md:h-5 md:w-5" strokeWidth={1.5} />
    </button>
  );
}

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export function Navbar() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('home');
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const navItems: NavItem[] = [
    { id: 'home', label: t('navbar.home'), icon: Home, href: '#' },
    { id: 'about', label: t('navbar.about'), icon: User, href: '#about' },
    { id: 'projects', label: t('navbar.projects'), icon: Code, href: '#projects' },
    { id: 'contact', label: t('navbar.contact'), icon: Mail, href: '#contact' },
  ];

  const socialItems: NavItem[] = [
    {
      id: 'linkedin',
      label: t('navbar.linkedin'),
      icon: FaLinkedin,
      href: 'https://www.linkedin.com/in/thomas-tp',
      external: true,
    },
    {
      id: 'github',
      label: t('navbar.github'),
      icon: FaGithub,
      href: 'https://github.com/Thomas-TP',
      external: true,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: WhatsAppIcon,
      href: 'https://wa-redirect.thomastp.workers.dev',
      external: true,
    },
    {
      id: 'links',
      label: 'Links',
      icon: LinkIcon,
      href: 'https://links.thomastp.ch',
      external: true,
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let ticking = false;
    const getActiveSection = () => {
      const sections = Array.from(document.querySelectorAll('#home, #about, #projects, #contact'));
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;

      // Find the section whose top is closest to 30% from the top of the viewport
      const trigger = scrollY + viewportHeight * 0.3;

      let active = sections[0]?.id ?? 'home';
      for (const section of sections) {
        const el = section as HTMLElement;
        if (el.getBoundingClientRect().top + scrollY <= trigger) {
          active = el.id;
        }
      }
      setActiveSection(active);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(getActiveSection);
      }
    };

    getActiveSection();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const footerInfo = document.querySelector('footer');
    if (!footerInfo) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '100px' }
    );
    observer.observe(footerInfo);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* TOP NAVBAR - CSS Transition for Performance */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 glass border-b border-border/50 shadow-lg shadow-black/5 dark:shadow-black/20 transition-all duration-500 ease-in-out transform will-change-transform ${isScrolled ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100 pointer-events-auto'}`}
      >
        <div className="flex gap-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.id}
              item={item}
              isActive={activeSection === item.id}
              forceShowLabel={isDesktop}
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="hidden md:flex gap-0.5">
            {socialItems.map(item => (
              <NavLink key={item.id} item={item} forceShowLabel={isDesktop} />
            ))}
          </div>
          <AskThomasNavButton forceShowLabel={isDesktop} />
          <div className="hidden md:block w-px h-8 bg-border/50 mx-2" />
          <LanguageToggle />
          <ModeToggle />
        </div>
      </header>

      {/* BOTTOM NAVBAR - CSS Transition for Performance */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-8 px-4 pointer-events-none">
        <nav
          className={`glass rounded-full px-2 py-2 md:px-4 md:py-3 flex items-center gap-1 md:gap-2 shadow-2xl shadow-black/5 dark:shadow-black/20 border border-border/50 ring-1 ring-border/50 pointer-events-auto transition-all duration-500 ease-in-out transform will-change-transform ${!isScrolled || isFooterVisible ? 'translate-y-[200%] opacity-0' : 'translate-y-0 opacity-100'}`}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {navItems.map(item => (
                <NavLink key={item.id} item={item} isActive={activeSection === item.id} />
              ))}
            </div>
            <div className="hidden md:block w-px h-8 bg-border/50 mx-2" />
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex gap-1">
              {socialItems.map(item => (
                <NavLink key={item.id} item={item} forceShowLabel={false} />
              ))}
            </div>
            <AskThomasNavButton forceShowLabel={false} />
            <div className="hidden md:block w-px h-8 bg-border/50 mx-2" />
            <LanguageToggle />
            <ModeToggle />
          </div>
        </nav>
      </div>
    </>
  );
}
