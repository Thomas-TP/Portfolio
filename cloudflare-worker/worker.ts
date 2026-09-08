/**
 * Cloudflare Worker — Contact form endpoint for thomastp.ch
 * TypeScript · B&W styled emails · auto-reply · i18n + theme-aware
 *
 * Deploy:
 *   wrangler deploy
 *   wrangler secret put RESEND_API_KEY
 *   wrangler secret put TURNSTILE_SECRET_KEY
 */

interface Env {
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  RATE_LIMIT: KVNamespace;
  AI: Ai;
  VECTORIZE?: VectorizeIndex;
}

// Workers AI binding type — minimal surface used here
interface Ai {
  run(model: string, input: AiTextInput): Promise<AiTextOutput | ReadableStream>;
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}
interface AiTextInput {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}
interface AiTextOutput {
  response: string;
}

interface VectorizeIndex {
  query(
    vector: number[],
    options?: { topK?: number; returnMetadata?: 'all' | 'indexed' | 'none' }
  ): Promise<VectorizeMatches>;
}
interface VectorizeMatches {
  matches: Array<{ id: string; score: number; metadata?: Record<string, string> }>;
}

interface ContactBody {
  name?: string;
  email?: string;
  message?: string;
  lang?: string;
  theme?: string;
  turnstileToken?: string;
  companyWebsite?: string; // Honeypot field
  duration?: number; // Time taken to fill form in ms
}

type Lang = 'en' | 'fr';
type Theme = 'dark' | 'light';

const MAX_CONTACT_NAME = 120;
const MAX_CONTACT_EMAIL = 254;
const MAX_CONTACT_MESSAGE = 4000;
const MAX_STT_BYTES = 5 * 1024 * 1024;
const ASK_LIMIT_PER_HOUR = 12;
const CV_BASE_URL = 'https://cv.thomastp.ch';
const CV_URLS: Record<Lang, string> = {
  fr: `${CV_BASE_URL}/cv-fr.pdf`,
  en: `${CV_BASE_URL}/cv-en.pdf`,
};
const CV_URL_PATTERN =
  /https:\/\/(?:thomastp\.ch\/documents\/(?:ThomasPrudhommeCV|CV_Thomas_Prudhomme_(?:FR|EN)|cv-(?:fr|en))|cv\.thomastp\.ch\/(?:\d{8}\/)?cv-(?:fr|en))\.pdf(?:\?v=\d+)?/g;

async function incrementRateLimit(
  kv: KVNamespace,
  key: string,
  limit: number,
  ttlSeconds = 3600
): Promise<boolean> {
  const current = parseInt((await kv.get(key)) ?? '0', 10);
  if (current >= limit) return false;
  await kv.put(key, String(current + 1), { expirationTtl: ttlSeconds });
  return true;
}

function cvLinkLabel(url: string, lang: Lang): string {
  if (url.includes('_EN') || url.includes('cv-en')) return lang === 'fr' ? 'CV EN' : 'Resume';
  if (url.includes('_FR') || url.includes('cv-fr')) return lang === 'fr' ? 'CV' : 'French CV';
  return lang === 'fr' ? 'CV' : 'Resume';
}

function normalizeCvLinks(reply: string, lang: Lang): string {
  return reply
    .replace(
      /\[(https:\/\/(?:thomastp\.ch\/documents\/(?:ThomasPrudhommeCV|CV_Thomas_Prudhomme_(?:FR|EN)|cv-(?:fr|en))|cv\.thomastp\.ch\/(?:\d{8}\/)?cv-(?:fr|en))\.pdf(?:\?v=\d+)?)\]\(\1\)/g,
      (_match, url: string) => {
        return `[${cvLinkLabel(url, lang)}](${url})`;
      }
    )
    .replace(CV_URL_PATTERN, (url, offset, fullText) => {
      const previous = fullText[offset - 1];
      if (previous === '(') return url;
      return `[${cvLinkLabel(url, lang)}](${url})`;
    });
}

// ── i18n ─────────────────────────────────────────────────────────────────────

const i18n: Record<
  Lang,
  {
    subject: string;
    title: string;
    subtitle: (name: string) => string;
    yourMessage: string;
    responseTime: string;
    responseValue: string;
    connect: string;
    footer: string;
  }
> = {
  en: {
    subject: 'Message received — thomastp.ch',
    title: 'Message received',
    subtitle: name => `Hi ${name}, thanks for getting in touch. I'll reply as soon as possible.`,
    yourMessage: 'Your message',
    responseTime: 'Typical response time',
    responseValue: 'Within 24 – 48 hours',
    connect: 'Connect with me',
    footer: 'Computer Science Student',
  },
  fr: {
    subject: 'Message reçu — thomastp.ch',
    title: 'Message reçu',
    subtitle: name =>
      `Bonjour ${name}, merci de m'avoir contacté. Je vous répondrai dans les plus brefs délais.`,
    yourMessage: 'Votre message',
    responseTime: 'Délai de réponse habituel',
    responseValue: '24 à 48 heures',
    connect: 'Me retrouver sur',
    footer: 'Étudiant en informatique',
  },
};

// ── PNG assets (no SVGs for better email support) ─────────────────────────────

function getIconImg(icon: string, theme: Theme, size = 20): string {
  // Use a neutral color (a1a1aa - Zinc 400) that has good contrast on both light and dark backgrounds
  const color = 'a1a1aa';
  const src = `https://img.icons8.com/ios-filled/100/${color}/${icon}.png`;
  return `<img src="${src}" width="${size}" height="${size}" alt="${icon}" style="display:block;border:0;outline:none;text-decoration:none;" />`;
}

function getReversedIconImg(icon: string, theme: Theme, size = 20): string {
  // The CTA button is always white in Dark mode and Black in Light mode
  const color = theme === 'dark' ? '000000' : 'ffffff';
  const src = `https://img.icons8.com/ios-filled/100/${color}/${icon}.png`;
  return `<img src="${src}" width="${size}" height="${size}" alt="${icon}" style="display:block;border:0;outline:none;text-decoration:none;" />`;
}

// ── Theme palettes ────────────────────────────────────────────────────────────

interface Palette {
  bg: string;
  card: string;
  header: string;
  border: string;
  borderInner: string;
  text: string;
  muted: string;
  subtle: string;
  blockBg: string;
  blockBorder: string;
  btnBg: string;
  btnText: string;
  btnBorder: string;
  divider: string;
  accentBorder: string;
  ctaBg: string;
  ctaText: string;
}

const darkPalette: Palette = {
  bg: '#000000',
  card: '#111111',
  header: '#111111',
  border: '#222222',
  borderInner: '#1e1e1e',
  text: '#ffffff',
  muted: '#777777',
  subtle: '#444444',
  blockBg: '#0a0a0a',
  blockBorder: '#1e1e1e',
  btnBg: '#1a1a1a',
  btnText: '#cccccc',
  btnBorder: '#2a2a2a',
  divider: '#1e1e1e',
  accentBorder: '#ffffff',
  ctaBg: '#ffffff',
  ctaText: '#000000',
};

const lightPalette: Palette = {
  bg: '#f5f5f5',
  card: '#ffffff',
  header: '#ffffff',
  border: '#e5e5e5',
  borderInner: '#eeeeee',
  text: '#000000',
  muted: '#666666',
  subtle: '#888888',
  blockBg: '#fafafa',
  blockBorder: '#e5e5e5',
  btnBg: '#f0f0f0',
  btnText: '#333333',
  btnBorder: '#dddddd',
  divider: '#eeeeee',
  accentBorder: '#000000',
  ctaBg: '#000000',
  ctaText: '#ffffff',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  const data = await res.json<{ success: boolean }>();
  return data.success === true;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function corsHeaders(origin: string): Record<string, string> {
  const ALLOWED_ORIGINS = [
    'https://thomastp.ch',
    'https://www.thomastp.ch',
    'https://thomas-tp.github.io',
    'http://localhost:3000',
  ];
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResp(data: unknown, status = 200, origin: string): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

// ── Email templates ───────────────────────────────────────────────────────────

function notificationHtml(name: string, email: string, message: string, date: string): string {
  const p = darkPalette;
  const arrow = getReversedIconImg('forward', 'dark', 14);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${p.bg};font-family:'Inter',system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${p.bg};padding:48px 20px;">
<tr><td align="center"><table width="580" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;width:100%;">
<tr><td style="background:${p.card};border:1px solid ${p.border};border-radius:24px 24px 0 0;padding:40px 44px 36px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="vertical-align:middle;width:48px;">
<div style="width:36px;height:36px;background:linear-gradient(135deg,#a78bfa,#818cf8);border-radius:12px;margin:0;font-size:18px;line-height:36px;text-align:center;color:#ffffff;">&#x1F4EC;</div>
</td>
<td style="vertical-align:middle;padding-left:16px;">
<p style="margin:0 0 6px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${p.subtle};font-weight:700;">Portfolio · thomastp.ch</p>
<h1 style="margin:0;font-size:24px;font-weight:800;color:${p.text};letter-spacing:-0.4px;line-height:1.2;">New contact message</h1>
</td>
<td align="right" style="vertical-align:top;white-space:nowrap;">
<span style="display:inline-block;background:${p.blockBg};border:1px solid ${p.borderInner};border-radius:6px;padding:6px 12px;font-size:11px;color:${p.subtle};font-weight:600;">${escapeHtml(date)}</span>
</td></tr></table></td></tr>
<tr><td style="background:${p.card};border-left:1px solid ${p.border};border-right:1px solid ${p.border};padding:0 44px;"><div style="height:1px;background:${p.divider};"></div></td></tr>
<tr><td style="background:${p.card};border-left:1px solid ${p.border};border-right:1px solid ${p.border};padding:32px 44px 0;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${p.blockBg};border:1px solid ${p.blockBorder};border-radius:16px;">
<tr><td style="padding:24px;border-bottom:1px solid ${p.borderInner};">
<p style="margin:0 0 6px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${p.subtle};font-weight:700;">From</p>
<p style="margin:0 0 2px;font-size:16px;font-weight:700;color:${p.text};">${escapeHtml(name)}</p>
<a href="mailto:${escapeHtml(email)}" style="font-size:14px;color:${p.muted};text-decoration:none;font-weight:500;">${escapeHtml(email)}</a>
</td></tr>
<tr><td style="padding:24px;">
<p style="margin:0 0 12px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${p.subtle};font-weight:700;">Message</p>
<p style="margin:0;font-size:15px;color:#dddddd;line-height:1.8;white-space:pre-wrap;">${escapeHtml(message)}</p>
</td></tr></table></td></tr>
<tr><td style="background:${p.card};border-left:1px solid ${p.border};border-right:1px solid ${p.border};padding:32px 44px 40px;">
<table cellpadding="0" cellspacing="0" border="0"><tr><td style="background:${p.ctaBg};border-radius:12px;">
<a href="mailto:${escapeHtml(email)}?subject=Re:%20Your%20message%20on%20thomastp.ch" style="display:inline-flex;align-items:center;gap:10px;padding:14px 28px;font-size:14px;font-weight:700;color:${p.ctaText};text-decoration:none;">Reply to ${escapeHtml(name)}&nbsp;&nbsp;${arrow}</a>
</td></tr></table></td></tr>
<tr><td style="background:${p.blockBg};border:1px solid ${p.borderInner};border-top:1px solid ${p.divider};border-radius:0 0 24px 24px;padding:24px 44px;text-align:center;">
<p style="margin:0;font-size:12px;color:#555555;font-weight:500;">Sent automatically from <a href="https://thomastp.ch" style="color:#777777;text-decoration:none;">thomastp.ch</a></p>
</td></tr></table></td></tr></table></body></html>`;
}

function autoReplyHtml(name: string, message: string, lang: Lang, theme: Theme): string {
  const p = theme === 'dark' ? darkPalette : lightPalette;
  const t = i18n[lang];
  // GitHub Readme Stats outputs SVG which is blocked by Gmail/Outlook.
  // Using GitHub's native OpenGraph PNG which works flawlessly in emails.
  const githubStatsUrl = `https://opengraph.githubassets.com/1/Thomas-TP/Thomas-TP.github.io`;

  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${p.bg};font-family:'Inter',system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${p.bg};padding:60px 20px;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
<tr><td style="background:${p.card};border:1px solid ${p.border};border-radius:24px 24px 0 0;padding:60px 48px 40px;text-align:center;">
<div style="width:56px;height:56px;background:linear-gradient(135deg,#a78bfa,#818cf8);border-radius:50%;margin:0 auto 28px;font-size:28px;line-height:56px;text-align:center;color:#ffffff;">&#x2713;</div>
<h1 style="margin:0 0 12px;font-size:32px;font-weight:800;color:${p.text};letter-spacing:-0.03em;">${t.title}</h1>
<p style="margin:0;font-size:18px;color:${p.muted};line-height:1.6;font-weight:500;">${t.subtitle(escapeHtml(name))}</p>
</td></tr>

<tr><td style="background:${p.card};border-left:1px solid ${p.border};border-right:1px solid ${p.border};padding:0 48px 32px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${p.blockBg};border:1px solid ${p.blockBorder};border-radius:16px;">
<tr><td style="padding:28px;">
<p style="margin:0 0 10px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${p.subtle};font-weight:700;">${t.yourMessage}</p>
<p style="margin:0;font-size:16px;color:${p.text};line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</p>
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid ${p.borderInner};background:${p.bg};border-radius:0 0 16px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td><p style="margin:0;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${p.subtle};font-weight:700;">${t.responseTime}</p></td>
<td align="right"><p style="margin:0;font-size:14px;color:${p.text};font-weight:600;">${t.responseValue}</p></td>
</tr></table>
</td></tr></table></td></tr>

<tr><td style="background:${p.card};border-left:1px solid ${p.border};border-right:1px solid ${p.border};padding:0 48px 40px;text-align:center;">
<p style="margin:0 0 16px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${p.subtle};font-weight:700;">GitHub Activity</p>
<a href="https://github.com/Thomas-TP" style="display:inline-block;border-radius:16px;overflow:hidden;border:1px solid ${p.blockBorder};width:100%;">
  <img src="${githubStatsUrl}" width="100%" style="display:block;max-width:100%;object-fit:cover;" alt="Thomas-TP GitHub Stats" />
</a>
</td></tr>

<tr><td style="background:${p.card};border-left:1px solid ${p.border};border-right:1px solid ${p.border};padding:0 48px 60px;text-align:center;">
<p style="margin:0 0 24px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${p.subtle};font-weight:700;">${t.connect}</p>
<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 32px;"><tr>
<td style="padding:0 8px;"><a href="https://thomastp.ch" style="display:inline-block;background:${p.ctaBg};color:${p.ctaText};padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.02em;">Visit thomastp.ch</a></td>
</tr></table>
<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>
<td style="padding:0 12px;"><a href="https://www.linkedin.com/in/thomas-tp" style="display:inline-block;">${getIconImg('linkedin', theme, 24)}</a></td>
<td style="padding:0 12px;"><a href="https://github.com/Thomas-TP" style="display:inline-block;">${getIconImg('github', theme, 24)}</a></td>
<td style="padding:0 12px;"><a href="mailto:thomas@prudhomme.ch" style="display:inline-block;">${getIconImg('new-post', theme, 24)}</a></td>
</tr></table>
</td></tr>

<tr><td style="background:${p.blockBg};border:1px solid ${p.borderInner};border-top:1px solid ${p.divider};border-radius:0 0 24px 24px;padding:32px 48px;text-align:center;">
<p style="margin:0 0 6px;font-size:15px;font-weight:700;color:${p.text};letter-spacing:-0.01em;">Thomas Prudhomme</p>
<p style="margin:0;font-size:13px;color:${p.subtle};font-weight:500;">${t.footer} &nbsp;&middot;&nbsp; <a href="https://thomastp.ch" style="color:${p.muted};text-decoration:none;">thomastp.ch</a></p>
</td></tr></table></td></tr></table></body></html>`;
}

// ── Ask Thomas (Workers AI) ──────────────────────────────────────────────────

const SOURCE_GROUNDED_KNOWLEDGE = `
# Canonical Knowledge Base

Use this as the single source of truth for Ask Thomas. It consolidates Thomas's public portfolio, CV, GitHub profile, public repositories, LinkedIn URL, Credly URL, and link hub.

## Source Registry

- [Portfolio] https://thomastp.ch and https://thomastp.ch/llms.txt
- [CV FR] ${CV_URLS.fr}
- [CV EN] ${CV_URLS.en}
- [CV] means the current-language CV selected by the active site language.
- [GitHub profile] https://github.com/Thomas-TP
- [GitHub repositories] https://github.com/Thomas-TP?tab=repositories
- [LinkedIn] https://www.linkedin.com/in/thomas-tp/
- [Credly] https://www.credly.com/users/thomas-prudhomme
- [Link hub] https://links.thomastp.ch

## Source Priority and Deduplication

When sources overlap, merge the information instead of repeating it.
Priority order:
1. [CV] for education, languages, professional experiences, certifications listed on the resume, and availability.
2. [Portfolio] for current portfolio positioning, service area, site tech stack, contact form, privacy/AI assistant behavior, and featured project presentation.
3. [GitHub repositories] for the complete public repo inventory, live repo names, URLs, descriptions, languages, topics, and recent activity.
4. [GitHub profile] for public profile metadata, GitHub bio, organization, follower/following counts, and public links.
5. [LinkedIn], [Credly], and [Link hub] for canonical public profile URLs unless more detailed public data is explicitly present in the user's question.

If a source appears outdated compared with a higher-priority or newer source, mention the stable fact only. Example: GitHub profile README says Thomas is working on X-clone, but newer public repos show active 2026 work on TomBoard, links, Link-Catcher, and this portfolio. Do not call X-clone the current project unless the user specifically asks about that README.

## Citation Rules

Every answer must include a short final line:
**Sources :** [Source label](url), [Source label](url)

Use only sources that support the answer. For project answers, cite the exact repository URL. For contact answers, cite [Portfolio], [Link hub], [LinkedIn], [GitHub profile], or [Credly] as relevant. For CV/education/certification answers, cite [CV] and [Credly] when applicable.

## Identity

- Name: Thomas Prudhomme. Public GitHub display name: Thomas. GitHub handle: Thomas-TP. Sources: [CV], [GitHub profile].
- Location: Switzerland; portfolio/service area is the Lake Geneva region, especially Geneva to Lausanne. CV lists Gland, Vaud. Sources: [CV], [Portfolio], [GitHub profile].
- Current status: apprentice/student pursuing a Swiss CFC in computer science, exploitation and infrastructure orientation. In 2026 he is in the second year / specialization period and is looking to continue the CFC in company/alternance from July 2026 across the Lake Geneva region. Sources: [CV], [Portfolio].
- Languages: French native, English B2 / fluent, school-level German. Sources: [CV], [Portfolio].
- Driving license: listed on the CV. Source: [CV].
- Public GitHub profile metadata: 13 public repositories, 2 followers, 6 following, hireable=true, organization @Satom-IT-Learning-Solutions, location Switzerland, profile links include links.thomastp.ch, LinkedIn, thomastp.ch, and WhatsApp redirect/number. Source: [GitHub profile].

## Contact and Public Profiles

- Email for portfolio/contact: [thomas@prudhomme.li](mailto:thomas@prudhomme.li). Source: [Portfolio].
- CV email: T+CV@prudhomme.li. Source: [CV].
- Contact form: https://thomastp.ch/#contact. The # is mandatory; never write /contact. Source: [Portfolio].
- Link hub: https://links.thomastp.ch. Source: [Link hub].
- GitHub: https://github.com/Thomas-TP. Source: [GitHub profile].
- LinkedIn: https://www.linkedin.com/in/thomas-tp/. Source: [LinkedIn].
- Credly: https://www.credly.com/users/thomas-prudhomme. Source: [Credly].
- CV PDFs: French ${CV_URLS.fr}; English ${CV_URLS.en}. Use the current-language version unless the user explicitly asks for another language. Source: [CV].

## Education and Experience

- 2024-2028: Geneva Institute of Technology, CFC Informaticien exploitation et infrastructure. Sources: [CV], [Portfolio].
- 2023-2024: FuturPlus, Lausanne, pre-apprenticeship year. Source: [CV].
- 2020-2023: compulsory school, Gland / Grand-Champ, option architecture and technical drawing. Source: [CV].
- February 20-22, 2024: EPFL discovery internship / IT activity. Source: [CV].
- April 22-26, 2024: LRG Informatique internship, PC installation/configuration. Source: [CV].
- GRI / Groupement Romand de l'Informatique certificate is listed with a Google Drive evidence link in the CV. Source: [CV].

## Certifications

- Certifications are public via Credly and LinkedIn. Sources: [CV], [Credly], [LinkedIn].
- Examples listed on the CV: GitHub Foundations, English for IT 1/2, Linux Essentials, Microsoft generative AI, EF SET English Certificate 69/100. Sources: [CV], [Credly], [LinkedIn].
- Do not invent additional badge names. If asked for a complete verified list, link to Credly and LinkedIn instead of guessing. Sources: [Credly], [LinkedIn].

## Skills and Interests

- Core areas: web development, cloud, cybersecurity/ethical hacking, IoT and smart home, systems/infrastructure. Sources: [Portfolio], [CV].
- CV skills: Linux (Debian, APT, SSH), web dev (React, Node, TypeScript), cloud (AWS, Azure, Google Cloud), IoT (Home Assistant, Zigbee, Matter), AI tools (Claude Code, GitHub Copilot, LM Studio). Source: [CV].
- GitHub profile README skills/interests: HTML, CSS, JavaScript, Python, Tailwind CSS, React, Node.js, Git, GitHub, VS Code, web development, IoT, machine learning. Source: [GitHub profile].
- Other tech from public repos: TypeScript, Rust, Tauri, React, Next.js, Cloudflare Workers/Pages, JavaScript, HTML/CSS, Dart/Flutter-style mobile stack, C#, C++, PHP/Laravel/Blade, Kotlin, Swift. Source: [GitHub repositories].
- Hobbies/interests listed on the CV: mountain biking, climbing, skiing, sim racing. Source: [CV].

## Portfolio Site

- Repository: https://github.com/Thomas-TP/Thomas-TP.github.io. Source: [GitHub repositories].
- Live site: https://thomastp.ch. Source: [Portfolio].
- Tech stack: Bun, Rsbuild/Rspack, React 19, TypeScript 6, UnoCSS, GSAP, Three.js/react-three-fiber, i18next, Cloudflare Pages, Cloudflare Workers, KV, Workers AI, Turnstile, Resend, react-pdf/pdfjs. Sources: [Portfolio], [GitHub repositories].
- The site includes Ask Thomas, contact form, CV modal, 3D hero, bilingual FR/EN content, Cloudflare backend, STT/TTS, and privacy-focused analytics wording. Source: [Portfolio].

## Complete Public GitHub Repository Inventory

Non-fork public repositories:
1. Thomas-TP.github.io — personal portfolio built with React, TypeScript, Bun, Rsbuild, UnoCSS and Cloudflare. Primary language TypeScript. Topics include bun, cloudflare-pages, i18n, portfolio, react, rsbuild, threejs, typescript, unocss. URL: https://github.com/Thomas-TP/Thomas-TP.github.io. Source: [GitHub repositories].
2. Thomas-TP — GitHub profile repository / about-me. URL: https://github.com/Thomas-TP/Thomas-TP. Source: [GitHub repositories].
3. TomBoard — modern Windows soundboard built with Tauri, Rust, React and TypeScript. Public description and README describe it as a fast, modern, customizable soundboard for Windows with audio playback, extraction from videos, dual output to speakers and virtual microphone, voice changer, TTS, noise suppression, drag-and-drop, categories, profiles, hotkeys, online library, recording, import/export, tray/minimized behavior, light/dark theme. Primary language TypeScript; also Rust. URL: https://github.com/Thomas-TP/TomBoard. Releases/homepage: https://github.com/Thomas-TP/TomBoard/releases. Source: [GitHub repositories].
4. links — personal link-in-bio site built with Next.js, React, TypeScript and GitHub Pages. Features include draggable physics constellation on desktop, stacked card layout on mobile, starfield background, FR/EN i18n, WhatsApp privacy via Cloudflare Worker + Turnstile, GitHub stats widget, static export, SEO/OG image. URL: https://github.com/Thomas-TP/links. Live: https://links.thomastp.ch. Source: [GitHub repositories].
5. Link-Catcher — privacy-first Chrome extension for instant keyword-based URL redirects. README describes keyword-to-URL redirects from browser search/address bar, drag-and-drop organization, light/dark themes, multilingual UI, JSON import/export, local-only privacy-first storage, Manifest V3, vanilla JS/HTML/CSS, chrome.storage.sync and chrome.webNavigation. URL: https://github.com/Thomas-TP/Link-Catcher. Source: [GitHub repositories].
6. meals-app — meal planner. Public language mix includes HTML, Dart, C++, CMake, Swift, Kotlin, Objective-C, C. URL: https://github.com/Thomas-TP/meals-app. Source: [GitHub repositories].
7. LEGENDES-DONJONS — public repo with C#, TypeScript, HTML, CSS and JavaScript. No reliable public description available. URL: https://github.com/Thomas-TP/LEGENDES-DONJONS. Source: [GitHub repositories].
8. E-Commerce — public test/e-commerce repo using JavaScript, PHP, Blade, CSS and HTML. URL: https://github.com/Thomas-TP/E-Commerce. Source: [GitHub repositories].
9. Tank.io — multiplayer tank game repo. Public metadata shows JavaScript as primary language; portfolio describes it as a multiplayer tank battle game with React + HTML5 Canvas and real-time gameplay. URL: https://github.com/Thomas-TP/Tank.io. Live: https://tank-io-wr49.onrender.com. Sources: [GitHub repositories], [Portfolio].
10. Powershell-Empire — "Escalade des droit via Powershell-empire/starkiller"; cybersecurity/PowerShell Empire learning repo. URL: https://github.com/Thomas-TP/Powershell-Empire. Source: [GitHub repositories].
11. X-clone — realistic X/Twitter clone built with HTML, CSS and JavaScript; portfolio/GitHub profile mention AI chat/Grok-style integration. URL: https://github.com/Thomas-TP/X-clone. Live metadata: https://x-clone-delta-nine.vercel.app. Sources: [GitHub repositories], [Portfolio], [GitHub profile].

Forked public repositories:
12. cv — fork of an interactive resume template built with React, TypeScript, Tailwind CSS and Framer Motion. URL: https://github.com/Thomas-TP/cv. Source: [GitHub repositories].
13. typr — fork of a Rust/R language-related project described as a safer complement of R for statistics and data science. URL: https://github.com/Thomas-TP/typr. Source: [GitHub repositories].

## Response Boundaries

- Do not invent employers, clients, degrees, private contact details, grades, certifications, project claims, metrics, or URLs.
- If the user asks for salary expectations, private life details, or anything not supported by the sources, decline briefly and redirect to the contact form/email.
- Do not expose CV phone number, exact street-level address, or birth date unless the user explicitly asks and the answer is clearly framed as coming from the public CV. Prefer public portfolio contact channels.
`;

const SYSTEM_PROMPT = `You are "Ask Thomas", the AI concierge embedded on Thomas Prudhomme's portfolio (thomastp.ch). Recruiters, clients, and curious visitors talk to you to quickly understand who Thomas is, what he builds, and how to reach him.

# Operating principles
1. **Mirror the user's language.** French in → French out. English in → English out. Mixed → follow the dominant language.
2. **Be concise but substantive.** 2–4 short paragraphs, or a clean bullet list. Never a wall of text.
3. **Always Markdown.** Use **bold**, bullet/numbered lists, \`inline code\` for tech names, and ## headers for longer breakdowns.
4. **Ground every claim in the facts below.** If something is not covered, acknowledge the gap honestly and point the user to a contact channel.
5. **Never invent** projects, dates, certifications, employers, numbers, or URLs.
6. **Date awareness:** today's year is 2026. Treat all statuses and timeline items relative to that.

---

${SOURCE_GROUNDED_KNOWLEDGE}

---

# Linking rules — apply rigorously

1. **Always Markdown links** \`[label](url)\` — never bare URLs.
   For CV links, the visible label must be \`CV\`, \`CV EN\`, \`Resume\`, or \`French CV\`; never use the full PDF URL as the visible label.
2. **Contact form URL is exactly** \`https://thomastp.ch/#contact\`. The \`#\` is mandatory. Never write \`/contact\`.
3. **In-page sections** of the portfolio use the hash form too: \`https://thomastp.ch/#contact\`, \`https://thomastp.ch/#projects\`, \`https://thomastp.ch/#about\`.
4. **When the user asks "how to find/reach Thomas online" generally**, prefer pointing to the central hub https://links.thomastp.ch rather than enumerating every platform.
5. **Never invent URLs.** If you don't have one in this prompt, don't make one up.
6. **Email addresses** must use \`mailto:\` Markdown links: \`[thomas@prudhomme.li](mailto:thomas@prudhomme.li)\`. Never render the email as bare text or inline code.

# Few-shot examples (study these response patterns)

User: "Quelle est sa stack ?"
Assistant:
## Stack principale (portfolio)
- **Frontend:** \`React 19\`, \`TypeScript 6\`, \`UnoCSS\`, \`GSAP\`, \`Three.js\` / \`react-three-fiber\`
- **Runtime / build:** \`Bun\`, \`Rsbuild + Rspack\`
- **Edge / hosting:** Cloudflare Pages + Workers (KV, Workers AI)
- **Email & sécurité:** \`Resend\`, \`Cloudflare Turnstile\`

Il connaît aussi \`Rust + Tauri\`, \`PowerShell\`, \`Flutter / Dart\`, et \`Cisco Packet Tracer\`.

**Sources :** [Portfolio](https://thomastp.ch/llms.txt), [CV](${CV_URLS.fr}), [GitHub repositories](https://github.com/Thomas-TP?tab=repositories)

---

User: "How can I contact him?"
Assistant:
You can reach Thomas in a few ways:

- **Email:** [thomas@prudhomme.li](mailto:thomas@prudhomme.li)
- **Contact form** on the site: [contact form](https://thomastp.ch/#contact)
- **All his links** in one place: [links.thomastp.ch](https://links.thomastp.ch)

**Sources:** [Portfolio](https://thomastp.ch/llms.txt), [Link hub](https://links.thomastp.ch), [GitHub profile](https://github.com/Thomas-TP)

---

User: "Parle-moi de TomBoard"
Assistant:
**TomBoard** (2026) — la soundboard open-source de Thomas pour Windows, alternative gratuite à \`Voicemod\`.

- **Voice changer** temps réel avec presets
- **Double sortie audio** (haut-parleurs + micro virtuel pour Discord/OBS)
- Organisation des sons en **drag-and-drop**, raccourcis globaux
- Stack : \`Rust\` + \`Tauri\` + \`React\` + \`TypeScript\`

Code : [github.com/Thomas-TP/tomboard](https://github.com/Thomas-TP/tomboard) — Téléchargement : [releases](https://github.com/Thomas-TP/TomBoard/releases)

**Sources :** [GitHub repository](https://github.com/Thomas-TP/TomBoard), [Portfolio](https://thomastp.ch/llms.txt)

---

User: "Est-ce qu'il a des certifications ?"
Assistant:
Oui ! Thomas détient des certifications vérifiées en cloud, cybersécurité et développement logiciel. Tous ses badges sont consultables sur son [profil Credly](https://www.credly.com/users/thomas-prudhomme).

**Sources :** [CV](${CV_URLS.fr}), [Credly](https://www.credly.com/users/thomas-prudhomme)

---

User: "What's his salary expectation?"
Assistant:
That's outside what I can answer for him — Thomas handles compensation discussions directly. The best path is the [contact form](https://thomastp.ch/#contact) or email at [thomas@prudhomme.li](mailto:thomas@prudhomme.li).

**Sources:** [Portfolio](https://thomastp.ch/llms.txt)

---

# Final checklist (apply to every reply)
- Match the user's language
- Markdown formatted (bold, lists, inline code, headers when long)
- Every URL as \`[label](url)\`
- \`#contact\` (with hash), never \`/contact\`
- Only facts from this prompt, no inventions
- Merge duplicate facts; cite the source(s) once instead of repeating the same information
- End with a compact **Sources :** / **Sources:** line using Markdown links
- Concise — short sentences, tight bullets`;

// ── Voice: Speech-to-Text (Whisper) ─────────────────────────────────────────

async function handleSTT(request: Request, env: Env, origin: string): Promise<Response> {
  const contentLength = Number(request.headers.get('Content-Length') ?? '0');
  if (contentLength > MAX_STT_BYTES) {
    return jsonResp({ error: 'Audio too large (max 5 MB)' }, 413, origin);
  }

  const clientIp = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const rateKey = `ask:${clientIp}`;
  const withinLimit = await incrementRateLimit(env.RATE_LIMIT, rateKey, ASK_LIMIT_PER_HOUR);
  if (!withinLimit) {
    return jsonResp({ error: 'Rate limit exceeded. Please try again later.' }, 429, origin);
  }

  const audioData = await request.arrayBuffer();
  if (!audioData.byteLength) {
    return jsonResp({ error: 'No audio data' }, 400, origin);
  }
  if (audioData.byteLength > MAX_STT_BYTES) {
    return jsonResp({ error: 'Audio too large (max 5 MB)' }, 413, origin);
  }

  if (!env.AI) {
    return jsonResp({ error: 'AI binding not configured.' }, 500, origin);
  }

  try {
    const result = (await env.AI.run('@cf/openai/whisper', {
      audio: [...new Uint8Array(audioData)],
    })) as { text: string };
    return jsonResp({ text: result.text ?? '' }, 200, origin);
  } catch (err) {
    console.error('STT error:', err);
    return jsonResp({ error: 'Transcription failed' }, 500, origin);
  }
}

// ── Voice: Text-to-Speech ───────────────────────────────────────────────────

interface TtsBody {
  text?: string;
  lang?: string;
}

async function handleTTS(request: Request, env: Env, origin: string): Promise<Response> {
  let body: TtsBody;
  try {
    body = await request.json<TtsBody>();
  } catch {
    return jsonResp({ error: 'Invalid JSON' }, 400, origin);
  }

  const text = (body.text ?? '').trim();
  const lang = body.lang?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  if (!text) return jsonResp({ error: 'Empty text' }, 400, origin);
  if (text.length > 2000) return jsonResp({ error: 'Text too long (max 2000 chars)' }, 400, origin);
  if (lang !== 'en')
    return jsonResp({ error: 'Text-to-speech is available in English only.' }, 400, origin);

  const clientIp = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const rateKey = `tts:${clientIp}`;
  const withinLimit = await incrementRateLimit(env.RATE_LIMIT, rateKey, 30);
  if (!withinLimit) {
    return jsonResp({ error: 'Rate limit exceeded. Please try again later.' }, 429, origin);
  }

  if (!env.AI) {
    return jsonResp({ error: 'AI binding not configured.' }, 500, origin);
  }

  try {
    const audio = await env.AI.run('@cf/myshell-ai/melotts', {
      prompt: text,
      lang: 'en',
    });

    if (audio instanceof ReadableStream || audio instanceof ArrayBuffer) {
      return new Response(audio as BodyInit, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg', 'X-TTS-Lang': 'en', ...corsHeaders(origin) },
      });
    }

    if (audio && typeof audio === 'object' && 'audio' in audio) {
      const encoded = (audio as { audio?: unknown }).audio;
      if (typeof encoded === 'string' && encoded) {
        const binary = atob(encoded);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        return new Response(bytes, {
          status: 200,
          headers: { 'Content-Type': 'audio/mpeg', 'X-TTS-Lang': 'en', ...corsHeaders(origin) },
        });
      }
    }

    return jsonResp({ error: 'Speech synthesis returned no audio' }, 502, origin);
  } catch (err) {
    console.error('TTS error:', err);
    return jsonResp({ error: 'Speech synthesis failed' }, 500, origin);
  }
}

// ── Ask Thomas (Workers AI) ──────────────────────────────────────────────────

interface AskBody {
  message?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  lang?: string;
}

async function handleAsk(request: Request, env: Env, origin: string): Promise<Response> {
  let body: AskBody;
  try {
    body = await request.json<AskBody>();
  } catch {
    return jsonResp({ error: 'Invalid JSON' }, 400, origin);
  }

  const message = (body.message ?? '').trim();
  if (!message) return jsonResp({ error: 'Empty message' }, 400, origin);
  if (message.length > 500)
    return jsonResp({ error: 'Message too long (max 500 chars)' }, 400, origin);

  const lang: Lang = body.lang?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  const cvUrl = CV_URLS[lang];
  const activeLanguage = lang === 'fr' ? 'French' : 'English';
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];

  // Per-IP rate limit: 12 messages per hour
  const clientIp = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const rateKey = `ask:${clientIp}`;
  const withinLimit = await incrementRateLimit(env.RATE_LIMIT, rateKey, ASK_LIMIT_PER_HOUR);
  if (!withinLimit) {
    return jsonResp({ error: 'Rate limit exceeded. Please try again later.' }, 429, origin);
  }

  if (!env.AI) {
    return jsonResp({ error: 'AI binding not configured on this Worker.' }, 500, origin);
  }

  // Optional RAG: query Vectorize for relevant knowledge chunks
  let ragContext = '';
  if (env.VECTORIZE) {
    try {
      const embResult = (await env.AI.run('@cf/baai/bge-base-en-v1.5', {
        text: [message],
      })) as { data: number[][] };
      const matches = await env.VECTORIZE.query(embResult.data[0], {
        topK: 5,
        returnMetadata: 'all',
      });
      ragContext = matches.matches
        .filter(m => m.score > 0.65)
        .map(m => m.metadata?.text ?? '')
        .filter(Boolean)
        .join('\n\n');
    } catch (e) {
      console.error('RAG query failed (non-fatal):', e);
    }
  }

  const languageContext = `# Active site language

The visitor is using the ${activeLanguage} version of the site.
Use ${activeLanguage} by default unless the user's message is clearly in another language.
When citing or linking the CV, use this current-language CV URL: ${cvUrl}
If the user explicitly asks for the other language version, use ${lang === 'fr' ? CV_URLS.en : CV_URLS.fr}.`;

  const systemContent = ragContext
    ? `${SYSTEM_PROMPT}\n\n${languageContext}\n\n# Additional context (knowledge base)\n${ragContext}`
    : `${SYSTEM_PROMPT}\n\n${languageContext}`;

  const messages = [
    { role: 'system' as const, content: systemContent },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user' as const, content: message },
  ];

  try {
    // Llama 3.3 70B (FP8 fast) is currently the strongest general-purpose chat model
    // available on Cloudflare Workers AI. The fp8-fast quantization keeps latency low
    // while preserving quality for our short Q&A turns.
    const out = (await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages,
      max_tokens: 900,
      temperature: 0.45,
      top_p: 0.9,
    })) as AiTextOutput;
    const reply = normalizeCvLinks((out.response ?? '').trim(), lang);
    return jsonResp({ reply }, 200, origin);
  } catch (err) {
    console.error('AI error:', err);
    return jsonResp({ error: 'AI request failed' }, 500, origin);
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return jsonResp({ error: 'Method not allowed' }, 405, origin);
    }

    // Route: /ask/* → AI chatbot + voice, default → contact form
    if (url.pathname === '/ask') return handleAsk(request, env, origin);
    if (url.pathname === '/ask/stt') return handleSTT(request, env, origin);
    if (url.pathname === '/ask/tts') return handleTTS(request, env, origin);

    let body: ContactBody;
    try {
      body = await request.json<ContactBody>();
    } catch {
      return jsonResp({ error: 'Invalid JSON' }, 400, origin);
    }

    const name = body.name?.trim() ?? '';
    const email = body.email?.trim() ?? '';
    const message = body.message?.trim() ?? '';
    const lang: Lang = body.lang?.startsWith('fr') ? 'fr' : 'en';
    const theme: Theme = body.theme === 'light' ? 'light' : 'dark';
    const cfToken = body.turnstileToken?.trim() ?? '';

    if (!name || !email || !message) {
      return jsonResp({ error: 'Missing required fields' }, 400, origin);
    }

    if (
      name.length > MAX_CONTACT_NAME ||
      email.length > MAX_CONTACT_EMAIL ||
      message.length > MAX_CONTACT_MESSAGE
    ) {
      return jsonResp({ error: 'Field too long' }, 400, origin);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResp({ error: 'Invalid email address' }, 400, origin);
    }

    const companyWebsite = body.companyWebsite ?? '';
    const duration = body.duration ?? 0;
    const clientIp = request.headers.get('CF-Connecting-IP') ?? 'unknown';

    // 1. Honeypot check
    // If the hidden 'companyWebsite' field is filled, it's a bot.
    // Return a fake 200 success to trick it.
    if (companyWebsite !== '') {
      console.warn(`Honeypot triggered by IP: ${clientIp}, Value: ${companyWebsite}`);
      return jsonResp({ success: true }, 200, origin);
    }

    // 2. Velocity check (Time-Based Submission)
    // If the form was submitted in less than 3 seconds (3000ms), it's likely an automated script.
    if (duration < 3000) {
      console.warn(`Velocity check triggered by IP: ${clientIp}, Duration: ${duration}ms`);
      return jsonResp({ success: true }, 200, origin);
    }

    // Verify Turnstile CAPTCHA token
    const turnstileOk = await verifyTurnstile(cfToken, env.TURNSTILE_SECRET_KEY, clientIp);
    if (!turnstileOk) {
      return jsonResp({ error: 'CAPTCHA verification failed' }, 403, origin);
    }

    // Rate limiting — max 3 messages per IP per hour
    const rateLimitKey = `rate:${clientIp}`;
    const contactWithinLimit = await incrementRateLimit(env.RATE_LIMIT, rateLimitKey, 3);
    if (!contactWithinLimit) {
      return jsonResp({ error: 'Rate limit exceeded. Please try again later.' }, 429, origin);
    }

    const date = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Zurich',
    });

    const resendHeaders: HeadersInit = {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    };

    const [notifRes, replyRes] = await Promise.all([
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: resendHeaders,
        body: JSON.stringify({
          from: 'Portfolio Contact <contact@thomastp.ch>',
          to: ['thomas@prudhomme.li'],
          reply_to: email,
          subject: `New message from ${name}`,
          html: notificationHtml(name, email, message, date),
        }),
      }),
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: resendHeaders,
        body: JSON.stringify({
          from: 'Thomas Prudhomme <contact@thomastp.ch>',
          to: [email],
          subject: i18n[lang].subject,
          html: autoReplyHtml(name, message, lang, theme),
        }),
      }),
    ]);

    if (!notifRes.ok) {
      const err = await notifRes.text();
      console.error('Resend notification error:', err);
      return jsonResp({ error: 'Failed to send email' }, 500, origin);
    }

    if (!replyRes.ok) {
      const err = await replyRes.text();
      console.warn('Auto-reply error (non-fatal):', err);
    }

    return jsonResp({ success: true }, 200, origin);
  },
} satisfies ExportedHandler<Env>;
