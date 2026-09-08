import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bot,
  Check,
  Copy,
  Loader2,
  MessageCircle,
  Mic,
  Minus,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';

type LinkKind = 'anchor' | 'same-origin' | 'external';

function classifyLink(href: string): { kind: LinkKind; anchor?: string; resolved: string } {
  if (typeof window === 'undefined') return { kind: 'external', resolved: href };
  if (href.startsWith('#')) return { kind: 'anchor', anchor: href, resolved: href };

  try {
    const url = new URL(href, window.location.href);
    const sameSite =
      url.hostname === window.location.hostname ||
      url.hostname === 'thomastp.ch' ||
      url.hostname === 'www.thomastp.ch';

    if (sameSite && url.hash) return { kind: 'anchor', anchor: url.hash, resolved: url.hash };
    if (sameSite) return { kind: 'same-origin', resolved: url.pathname + url.search + url.hash };
    return { kind: 'external', resolved: href };
  } catch {
    return { kind: 'external', resolved: href };
  }
}

function isPdfLink(href: string) {
  try {
    return new URL(href, window.location.href).pathname.toLowerCase().endsWith('.pdf');
  } catch {
    return href.toLowerCase().split(/[?#]/, 1)[0].endsWith('.pdf');
  }
}

function renderInline(text: string, onAnchorNavigate?: (anchor: string) => void): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));

    if (m[2]) {
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {m[2]}
        </strong>
      );
    } else if (m[3]) {
      parts.push(<em key={key++}>{m[3]}</em>);
    } else if (m[4]) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-foreground/10 px-1.5 py-0.5 font-mono text-[0.72rem]"
        >
          {m[4]}
        </code>
      );
    } else if (m[5]) {
      const linkText = m[5];
      const href = m[6];
      const info = classifyLink(href);
      const className =
        'font-medium underline underline-offset-3 decoration-foreground/30 transition-colors hover:decoration-foreground';

      if (isPdfLink(href)) {
        parts.push(
          <a
            key={key++}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
          >
            {linkText}
          </a>
        );
      } else if (info.kind === 'anchor' && info.anchor) {
        const anchor = info.anchor;
        parts.push(
          <a
            key={key++}
            href={anchor}
            onClick={e => {
              e.preventDefault();
              onAnchorNavigate?.(anchor);
            }}
            className={className}
          >
            {linkText}
          </a>
        );
      } else if (info.kind === 'same-origin') {
        parts.push(
          <a key={key++} href={info.resolved} className={className}>
            {linkText}
          </a>
        );
      } else {
        parts.push(
          <a
            key={key++}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
          >
            {linkText}
          </a>
        );
      }
    }

    last = m.index + m[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MdMessage({
  content,
  onAnchorNavigate,
}: {
  content: string;
  onAnchorNavigate?: (anchor: string) => void;
}) {
  const nodes: ReactNode[] = [];
  const lines = content.split('\n');
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre
          key={key++}
          className="my-2 overflow-x-auto rounded-lg border border-border bg-foreground/[0.04] px-3 py-2 font-mono text-[0.72rem] leading-relaxed"
        >
          {lang && (
            <span className="mb-1 block text-[0.64rem] uppercase tracking-wide text-muted-foreground">
              {lang}
            </span>
          )}
          {codeLines.join('\n')}
        </pre>
      );
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      nodes.push(
        <h3 key={key++} className="mb-1 mt-3 text-[0.84rem] font-semibold first:mt-0">
          {renderInline(line.slice(4), onAnchorNavigate)}
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith('## ') || line.startsWith('# ')) {
      const offset = line.startsWith('## ') ? 3 : 2;
      nodes.push(
        <h2 key={key++} className="mb-1.5 mt-3 text-[0.88rem] font-bold first:mt-0">
          {renderInline(line.slice(offset), onAnchorNavigate)}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith('> ')) {
      nodes.push(
        <blockquote
          key={key++}
          className="my-2 border-l-2 border-foreground/20 pl-3 text-foreground/70"
        >
          {renderInline(line.slice(2), onAnchorNavigate)}
        </blockquote>
      );
      i++;
      continue;
    }

    if (/^[-*] /.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(
          <li key={i} className="pl-0.5">
            {renderInline(lines[i].slice(2), onAnchorNavigate)}
          </li>
        );
        i++;
      }
      nodes.push(
        <ul key={key++} className="my-2 list-disc space-y-1 pl-4">
          {items}
        </ul>
      );
      continue;
    }

    if (/^\d+\. /.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(
          <li key={i} className="pl-0.5">
            {renderInline(lines[i].replace(/^\d+\. /, ''), onAnchorNavigate)}
          </li>
        );
        i++;
      }
      nodes.push(
        <ol key={key++} className="my-2 list-decimal space-y-1 pl-4">
          {items}
        </ol>
      );
      continue;
    }

    if (line.trim() === '') {
      nodes.push(<div key={key++} className="h-1" />);
      i++;
      continue;
    }

    nodes.push(
      <p key={key++} className="mb-2 last:mb-0">
        {renderInline(line, onAnchorNavigate)}
      </p>
    );
    i++;
  }

  return <div className="text-[0.82rem] leading-relaxed">{nodes}</div>;
}

const ASK_URL = 'https://portfolio-contact.thomastp.workers.dev/ask';
const STT_URL = 'https://portfolio-contact.thomastp.workers.dev/ask/stt';
const TTS_URL = 'https://portfolio-contact.thomastp.workers.dev/ask/tts';
const STORAGE_KEY = 'ask-thomas-history-v2';
const LEGACY_STORAGE_KEY = 'ask-thomas-history-v1';
const MAX_INPUT = 500;
const OPEN_EVENT = 'ask-thomas:open';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

function isMsg(value: unknown): value is Msg {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Msg>;
  return (
    (candidate.role === 'user' || candidate.role === 'assistant') &&
    typeof candidate.content === 'string'
  );
}

function loadHistory(): Msg[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? data.filter(isMsg).slice(-12) : [];
  } catch {
    return [];
  }
}

function saveHistory(msgs: Msg[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-12)));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // localStorage can be blocked in private browsing.
  }
}

function getTranslatedList(t: ReturnType<typeof useTranslation>['t'], key: string): string[] {
  const value = t(key, { returnObjects: true });
  return Array.isArray(value) ? value.map(String) : [];
}

function useTextAreaAutosize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [value]);

  return ref;
}

function cleanTextForSpeech(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_#>~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectSpeechLanguage(text: string) {
  const normalized = ` ${text
    .toLowerCase()
    .normalize('NFC')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^\p{L}\p{N}'’]+/gu, ' ')} `;

  if (/[àâçéèêëîïôùûüœ]/i.test(normalized)) return 'fr';

  const frenchWords = [
    ' a ',
    ' au ',
    ' aux ',
    ' avec ',
    ' ce ',
    ' ces ',
    ' cette ',
    ' de ',
    ' des ',
    ' du ',
    ' dans ',
    ' donc ',
    ' elle ',
    ' en ',
    ' est ',
    ' et ',
    ' il ',
    ' je ',
    ' la ',
    ' le ',
    ' les ',
    ' lui ',
    ' mais ',
    ' mon ',
    ' par ',
    ' pas ',
    ' pour ',
    ' que ',
    ' qui ',
    ' sa ',
    ' ses ',
    ' son ',
    ' sur ',
    ' un ',
    ' une ',
    ' vous ',
    ' oui ',
    ' bonjour ',
    ' salut ',
    ' thomas est ',
    ' projet ',
    ' projets ',
    ' parcours ',
    ' stage ',
    ' cfc ',
    ' informatique ',
    ' certification ',
    ' certifications ',
    ' disponible ',
    ' alternance ',
    ' apprentissage ',
    ' sources ',
  ];

  const englishWords = [
    ' the ',
    ' and ',
    ' with ',
    ' for ',
    ' from ',
    ' his ',
    ' her ',
    ' this ',
    ' that ',
    ' you ',
    ' can ',
    ' thomas is ',
    ' project ',
    ' projects ',
    ' internship ',
    ' available ',
    ' sources ',
  ];

  const frenchScore = frenchWords.reduce(
    (score, word) => score + (normalized.includes(word) ? 1 : 0),
    0
  );
  const englishScore = englishWords.reduce(
    (score, word) => score + (normalized.includes(word) ? 1 : 0),
    0
  );

  return frenchScore >= englishScore && frenchScore > 0 ? 'fr' : 'en';
}

function canUseTextToSpeech(text: string) {
  return detectSpeechLanguage(text) === 'en';
}

export function AskThomas() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Msg[]>(() => loadHistory());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState<'idle' | 'recording' | 'transcribing'>('idle');
  const [ttsPlaying, setTtsPlaying] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileKeyboardOpen, setMobileKeyboardOpen] = useState(false);
  const [mobileInputFocused, setMobileInputFocused] = useState(false);
  const [mobileViewportStyle, setMobileViewportStyle] = useState<CSSProperties>();
  const suggestions = useMemo(() => getTranslatedList(t, 'ask.suggestions'), [t]);
  const capabilities = useMemo(() => getTranslatedList(t, 'ask.capabilities'), [t]);
  const siteLang = i18n.resolvedLanguage ?? i18n.language;
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useTextAreaAutosize(input);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mobileBaselineHeightRef = useRef(0);

  const hasConversation = history.length > 0;
  const canSend = input.trim().length > 0 && !sending && recording !== 'transcribing';
  const mobileCompact = isMobile && (mobileKeyboardOpen || mobileInputFocused);

  useEffect(() => saveHistory(history), [history]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [history, sending, error]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(id);
  }, [inputRef, open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    const openChat = () => {
      try {
        window.sessionStorage.removeItem(OPEN_EVENT);
      } catch {
        // Storage may be disabled.
      }
      setOpen(current => !current);
    };
    window.addEventListener(OPEN_EVENT, openChat);

    try {
      if (window.sessionStorage.getItem(OPEN_EVENT) === '1') {
        window.sessionStorage.removeItem(OPEN_EVENT);
        setOpen(true);
      }
    } catch {
      // Storage may be disabled.
    }

    return () => window.removeEventListener(OPEN_EVENT, openChat);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const visualViewport = window.visualViewport;

    const updateKeyboardState = () => {
      const nextIsMobile = window.matchMedia('(max-width: 639px)').matches;
      const activeInput = document.activeElement === inputRef.current;
      const viewportHeight = visualViewport?.height ?? window.innerHeight;
      const currentHeight = Math.max(viewportHeight, window.innerHeight);

      setIsMobile(nextIsMobile);

      if (!open || !nextIsMobile) {
        mobileBaselineHeightRef.current = currentHeight;
        setMobileKeyboardOpen(false);
        setMobileViewportStyle(undefined);
        if (!nextIsMobile) setMobileInputFocused(false);
        return;
      } else if (!activeInput) {
        mobileBaselineHeightRef.current = Math.max(mobileBaselineHeightRef.current, currentHeight);
      }

      const baseline = mobileBaselineHeightRef.current || currentHeight;
      const keyboardOpen = open && nextIsMobile && activeInput && viewportHeight < baseline - 80;

      setMobileKeyboardOpen(keyboardOpen);
      setMobileViewportStyle(
        keyboardOpen && visualViewport
          ? {
              top: `${Math.max(0, visualViewport.offsetTop)}px`,
              height: `${Math.max(360, Math.round(visualViewport.height))}px`,
            }
          : undefined
      );
    };

    updateKeyboardState();
    visualViewport?.addEventListener('resize', updateKeyboardState);
    visualViewport?.addEventListener('scroll', updateKeyboardState);
    window.addEventListener('resize', updateKeyboardState);
    window.addEventListener('focusin', updateKeyboardState);
    window.addEventListener('focusout', updateKeyboardState);

    return () => {
      visualViewport?.removeEventListener('resize', updateKeyboardState);
      visualViewport?.removeEventListener('scroll', updateKeyboardState);
      window.removeEventListener('resize', updateKeyboardState);
      window.removeEventListener('focusin', updateKeyboardState);
      window.removeEventListener('focusout', updateKeyboardState);
    };
  }, [inputRef, open]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      audioRef.current?.pause();
    };
  }, []);

  const friendlyError = useCallback(
    (message: string) => {
      const lower = message.toLowerCase();
      if (lower.includes('rate limit')) return t('ask.errors.rate_limit');
      if (lower.includes('too long') || lower.includes('max')) return t('ask.errors.too_long');
      if (lower.includes('microphone') || lower.includes('micro'))
        return t('ask.errors.microphone');
      if (lower.includes('transcription')) return t('ask.errors.transcription');
      return t('ask.errors.generic');
    },
    [t]
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      if (trimmed.length > MAX_INPUT) {
        setError(t('ask.errors.too_long'));
        return;
      }

      setError(null);
      const nextHistory: Msg[] = [...history, { role: 'user', content: trimmed }];
      setHistory(nextHistory);
      setInput('');
      setSending(true);

      try {
        const res = await fetch(ASK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            history: nextHistory.slice(-7, -1),
            lang: siteLang,
          }),
        });
        const data = (await res.json()) as { reply?: string; error?: string };

        if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`);
        setHistory(current => [...current, { role: 'assistant', content: data.reply ?? '' }]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error';
        setError(friendlyError(message));
      } finally {
        setSending(false);
      }
    },
    [friendlyError, history, sending, siteLang, t]
  );

  const reset = useCallback(() => {
    setHistory([]);
    setError(null);
    setInput('');
    audioRef.current?.pause();
    setTtsPlaying(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }, []);

  const resendLast = useCallback(() => {
    const lastUser = [...history].reverse().find(m => m.role === 'user');
    if (lastUser) send(lastUser.content);
  }, [history, send]);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError(t('ask.errors.microphone'));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setRecording('transcribing');
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        stream.getTracks().forEach(track => track.stop());

        try {
          const res = await fetch(STT_URL, {
            method: 'POST',
            headers: { 'Content-Type': recorder.mimeType },
            body: audioBlob,
          });
          const data = (await res.json()) as { text?: string; error?: string };

          if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`);
          if (data.text) send(data.text);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Transcription failed';
          setError(friendlyError(message));
        } finally {
          setRecording('idle');
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setError(null);
      setRecording('recording');
    } catch {
      setError(t('ask.errors.microphone'));
      setRecording('idle');
    }
  }, [friendlyError, send, t]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const toggleRecording = useCallback(() => {
    if (recording === 'recording') stopRecording();
    else startRecording();
  }, [recording, startRecording, stopRecording]);

  const copyMessage = useCallback(
    async (text: string, index: number) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(index);
        window.setTimeout(() => setCopied(null), 1400);
      } catch {
        setError(t('ask.errors.copy'));
      }
    },
    [t]
  );

  const playTTS = useCallback(
    async (text: string, index: number) => {
      if (ttsPlaying === index) {
        audioRef.current?.pause();
        setTtsPlaying(null);
        return;
      }

      audioRef.current?.pause();
      setTtsPlaying(index);

      try {
        const res = await fetch(TTS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanTextForSpeech(text).slice(0, 2000),
            lang: detectSpeechLanguage(text),
          }),
        });

        const contentType = res.headers.get('Content-Type') ?? '';
        if (!res.ok || !contentType.startsWith('audio/')) throw new Error('TTS failed');
        const audioBlob = await res.blob();
        if (!audioBlob.size) throw new Error('TTS failed');
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        const cleanup = () => {
          setTtsPlaying(null);
          audioRef.current = null;
          URL.revokeObjectURL(audioUrl);
        };

        audio.onended = cleanup;
        audio.onerror = () => {
          audioRef.current = null;
          URL.revokeObjectURL(audioUrl);
          setTtsPlaying(null);
          setError(t('ask.errors.tts'));
        };
        await audio.play();
      } catch {
        setTtsPlaying(null);
        setError(t('ask.errors.tts'));
      }
    },
    [t, ttsPlaying]
  );

  const handleAnchorNavigate = useCallback((anchor: string) => {
    setOpen(false);
    const id = anchor.startsWith('#') ? anchor.slice(1) : anchor;
    if (!id) return;

    requestAnimationFrame(() => {
      const target = document.getElementById(id);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history?.replaceState?.(null, '', `#${id}`);
    });
  }, []);

  return (
    <>
      <div
        className={`fixed bottom-0 right-0 z-[60] flex h-[100dvh] w-full origin-bottom-right flex-col overflow-hidden border-border bg-card shadow-2xl shadow-black/25 transition-[transform,opacity] duration-300 ease-out sm:bottom-6 sm:right-6 sm:h-[680px] sm:max-h-[calc(100vh-3rem)] sm:w-[430px] sm:rounded-2xl sm:border ${
          open
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-5 scale-95 opacity-0'
        }`}
        style={mobileViewportStyle}
        role="dialog"
        aria-modal="false"
        aria-label={t('ask.dialog_label')}
      >
        <div className="border-b border-border bg-card/95 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-foreground text-background">
                <Bot size={18} />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-[0.92rem] font-bold leading-tight">
                    {t('ask.title')}
                  </h2>
                  <span className="hidden rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 sm:inline">
                    {t('ask.status')}
                  </span>
                </div>
                <p className="truncate text-[0.68rem] text-muted-foreground">{t('ask.subtitle')}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {hasConversation && (
                <button
                  type="button"
                  onClick={reset}
                  className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                  aria-label={t('ask.clear')}
                  title={t('ask.clear')}
                >
                  <Trash2 size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground sm:hidden"
                aria-label={t('ask.minimize')}
                title={t('ask.minimize')}
              >
                <Minus size={17} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="hidden h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground sm:grid"
                aria-label={t('ask.close')}
                title={t('ask.close')}
              >
                <X size={17} />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-foreground/[0.03] to-transparent px-4 py-4"
          onWheel={e => e.stopPropagation()}
        >
          {!hasConversation ? (
            <div
              className={`flex min-h-full flex-col justify-end transition-[gap,padding] duration-300 ease-out ${
                mobileCompact ? 'gap-3 pb-1 pt-3' : 'gap-5 pb-2 pt-6'
              }`}
            >
              <div className="mx-auto flex max-w-[22rem] flex-col items-center text-center">
                <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-border bg-card shadow-sm">
                  <Sparkles size={22} />
                </div>
                <h3 className="text-xl font-bold tracking-normal">{t('ask.empty_title')}</h3>
                <p className="mt-2 text-[0.84rem] leading-relaxed text-muted-foreground">
                  {t('ask.empty_body')}
                </p>
              </div>

              <div
                aria-hidden={mobileCompact}
                className={`grid gap-2 overflow-hidden transition-[max-height,opacity,transform,margin] duration-300 ease-out ${
                  mobileCompact
                    ? 'max-h-0 -translate-y-2 opacity-0 pointer-events-none'
                    : 'max-h-56 translate-y-0 opacity-100'
                }`}
              >
                {suggestions.map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    tabIndex={mobileCompact ? -1 : undefined}
                    onClick={() => send(suggestion)}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3.5 py-3 text-left text-[0.82rem] transition-colors hover:border-foreground/20 hover:bg-foreground/[0.04]"
                  >
                    <span>{suggestion}</span>
                    <MessageCircle
                      size={15}
                      className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                    />
                  </button>
                ))}
              </div>

              <div
                aria-hidden={mobileCompact}
                className={`grid grid-cols-2 gap-2 overflow-hidden transition-[max-height,opacity,transform,margin] duration-300 ease-out ${
                  mobileCompact
                    ? 'max-h-0 -translate-y-2 opacity-0 pointer-events-none'
                    : 'max-h-32 translate-y-0 opacity-100'
                }`}
              >
                {capabilities.map(item => (
                  <div
                    key={item}
                    className="rounded-lg border border-border bg-card/70 px-3 py-2 text-[0.66rem] leading-relaxed text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {history.map((message, index) => {
                const isUser = message.role === 'user';
                const showTTS = !isUser && canUseTextToSpeech(message.content);
                return (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border bg-card">
                        <Sparkles size={13} />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}
                    >
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 ${
                          isUser
                            ? 'rounded-br-md bg-foreground text-background'
                            : 'rounded-bl-md border border-border bg-card text-foreground shadow-sm'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap text-[0.82rem] leading-relaxed">
                            {message.content}
                          </p>
                        ) : (
                          <MdMessage
                            content={message.content}
                            onAnchorNavigate={handleAnchorNavigate}
                          />
                        )}
                      </div>

                      {!isUser && (
                        <div className="mt-1.5 flex items-center gap-1 text-muted-foreground">
                          <button
                            type="button"
                            onClick={() => copyMessage(message.content, index)}
                            className="flex h-7 items-center gap-1 rounded-md px-2 text-[0.68rem] transition-colors hover:bg-foreground/10 hover:text-foreground"
                            aria-label={t('ask.copy')}
                            title={t('ask.copy')}
                          >
                            {copied === index ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copied === index ? t('ask.copied') : t('ask.copy')}</span>
                          </button>
                          {showTTS && (
                            <button
                              type="button"
                              onClick={() => playTTS(message.content, index)}
                              className="flex h-7 items-center gap-1 rounded-md px-2 text-[0.68rem] transition-colors hover:bg-foreground/10 hover:text-foreground"
                              aria-label={t('ask.listen')}
                              title={t('ask.listen')}
                            >
                              {ttsPlaying === index ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Volume2 size={12} />
                              )}
                              <span>
                                {ttsPlaying === index ? t('ask.playing') : t('ask.listen')}
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {sending && (
                <div className="flex justify-start gap-3">
                  <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border bg-card">
                    <Sparkles size={13} />
                  </div>
                  <div className="rounded-2xl rounded-bl-md border border-border bg-card px-3.5 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-[0.8rem] text-muted-foreground">
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:120ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:240ms]" />
                      </span>
                      {t('ask.thinking')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="border-t border-border bg-destructive/10 px-4 py-2 text-[0.76rem] text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={e => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-border bg-card p-3"
        >
          <div className="rounded-2xl border border-border bg-foreground/[0.04] p-2 transition-colors focus-within:border-foreground/30 focus-within:bg-card">
            <textarea
              ref={inputRef}
              value={input}
              onFocus={() => setMobileInputFocused(window.matchMedia('(max-width: 639px)').matches)}
              onBlur={() => setMobileInputFocused(false)}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              maxLength={MAX_INPUT}
              placeholder={t('ask.placeholder')}
              disabled={sending || recording === 'transcribing'}
              aria-label={t('ask.message_label')}
              className="ask-thomas-input block max-h-33 min-h-10 w-full resize-none bg-transparent px-2 py-2 text-[0.88rem] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
              style={{ scrollbarWidth: 'none' }}
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 px-1 text-[0.66rem] text-muted-foreground">
                {recording === 'recording' ? (
                  <>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    {t('ask.recording')}
                  </>
                ) : recording === 'transcribing' ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    {t('ask.transcribing')}
                  </>
                ) : (
                  t('ask.disclaimer')
                )}
              </div>

              <div className="flex items-center gap-1">
                {hasConversation && (
                  <button
                    type="button"
                    onClick={resendLast}
                    disabled={sending}
                    className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:opacity-30"
                    aria-label={t('ask.regenerate')}
                    title={t('ask.regenerate')}
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={sending || recording === 'transcribing'}
                  className={`grid h-9 w-9 place-items-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                    recording === 'recording'
                      ? 'bg-red-500 text-white'
                      : 'text-muted-foreground hover:bg-foreground/10 hover:text-foreground'
                  }`}
                  aria-label={recording === 'recording' ? t('ask.stop_recording') : t('ask.voice')}
                  title={recording === 'recording' ? t('ask.stop_recording') : t('ask.voice')}
                >
                  {recording === 'transcribing' ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Mic size={15} />
                  )}
                </button>
                <button
                  type="submit"
                  disabled={!canSend}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-foreground text-background transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label={t('ask.send')}
                  title={t('ask.send')}
                >
                  {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between px-1 text-[0.64rem] text-muted-foreground">
            <span>{t('ask.footer_note')}</span>
            <span className="tabular-nums">
              {input.length}/{MAX_INPUT}
            </span>
          </div>
        </form>
      </div>
    </>
  );
}
