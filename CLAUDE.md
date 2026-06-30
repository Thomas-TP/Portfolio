# CLAUDE.md — AI Instructions for thomastp.ch

## Project Overview

Personal portfolio for Thomas Prudhomme, a Computer Science student at Geneva Institute of Technology (Swiss CFC track). The site is a single-page application hosted on Cloudflare Pages with a Cloudflare Worker backend for the contact form and AI chatbot.

**Live site:** https://thomastp.ch
**Domain alias:** https://thomas-tp.github.io

---

## Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| Runtime | Bun | Package manager and script runner (`bun install`, `bun dev`) |
| Bundler | Rsbuild 2.0-rc + Rspack | Rust-based, webpack-compatible. Config: `rsbuild.config.ts` |
| CSS | UnoCSS (presetWind, PostCSS mode) | Tailwind-compatible utilities. Config: `uno.config.ts` |
| Framework | React 19 | Concurrent mode, extensive use of `lazy()` + `Suspense` |
| Language | TypeScript 6 | Strict mode, `bundler` module resolution, path alias `@/*` → `./src/*` |
| Animation | GSAP 3 + ScrollTrigger | Lazy-loaded via `src/lib/gsap-init.ts`. Custom hooks in `src/hooks/useGsap.ts` |
| 3D | Three.js + react-three-fiber | Hero background particles, loaded async |
| Smooth scroll | Lenis | Side-effect init in `ClientLayout.tsx`, no wrapper component |
| i18n | i18next + react-i18next | FR + EN. Strings in `src/locales/{fr,en}.json` |
| Icons | lucide-react, react-icons, simple-icons | lucide for UI, simple-icons for tech logos |
| PDF | react-pdf + pdfjs-dist | CV modal, async chunk `vendor-pdf` |
| Backend | Cloudflare Worker | Contact form + "Ask Thomas" AI chatbot. Code in `cloudflare-worker/` |
| Email | Resend API | Notification to owner + auto-reply to sender |
| CAPTCHA | Cloudflare Turnstile | Server-side verification in Worker |
| Rate limiting | Cloudflare KV | Per-IP sliding window |
| AI chatbot | Cloudflare Workers AI | Llama 3.3 70B at `/ask` endpoint |
| CI | GitHub Actions | Build check on push/PR to main (`.github/workflows/deploy.yml`) |
| Hosting | Cloudflare Pages | Auto-deploy from Git, custom domain via `public/CNAME` |

---

## Commands

```bash
bun install              # Install dependencies (uses bun.lock)
bun dev                  # Dev server at http://localhost:3000
bun run build            # Production build → ./dist/
bun run preview          # Preview prod build locally
bun run lint             # ESLint (flat config v10)
bun run format           # Prettier
```

**Cloudflare Worker (from `cloudflare-worker/` directory):**
```bash
wrangler deploy                        # Deploy worker
wrangler secret put RESEND_API_KEY     # Set secrets
wrangler secret put TURNSTILE_SECRET_KEY
```

---

## Architecture & Key Patterns

### SPA Routing
This is a **single-page app with no router**. All content lives on the root page. Navigation uses hash anchors (`#home`, `#about`, `#projects`, `#contact`). Any path other than `/` or `/index.html` renders the `NotFound` component. Never create new routes.

### Lazy Loading Strategy
Everything below the fold is lazy-loaded to minimize the initial bundle:
- **Sync (critical path):** `Hero`, `ThemeProvider`, `GsapProvider`
- **Lazy (Suspense):** `BentoGrid`, `TechStack`, `Projects`, `Contact`, `Navbar`, `Footer`, `ScrollProgress`, `AskThomas`, `CVModal`, `HeroShader`, `NotFound`

### Bundle Splitting (Rspack)
Three async vendor chunks configured in `rsbuild.config.ts`:
- `vendor-three` — Three.js + react-three-fiber (Hero only)
- `vendor-gsap` — GSAP + ScrollTrigger
- `vendor-pdf` — pdfjs-dist + react-pdf (CV modal only)

### GSAP Initialization
GSAP is **never imported at the top level**. Always use `loadGsap()` from `src/lib/gsap-init.ts` which returns a cached promise. The animation hooks in `src/hooks/useGsap.ts` (useMagnetic, useScrollReveal, useSplitReveal, useHoverScale) all follow this pattern. Respect `prefers-reduced-motion`.

### Theming
- Dark/Light mode via class-based toggle (`.dark` on `<html>`)
- CSS custom properties defined as raw RGB channels in `src/globals.css` (e.g., `--background: 255 255 255`) for UnoCSS `<alpha-value>` support
- UnoCSS theme tokens in `uno.config.ts` reference these variables
- Type: `font-sans` maps to `--font-main` (Bruno Ace). Sub-12px tokens `text-3xs` (8px) / `text-2xs` (10px) extend presetWind's scale — prefer them over `text-[8px]`-style arbitrary values
- Radius: `--radius` drives the whole `rounded-{sm,md,lg,xl}` scale (shadcn-style `calc()` derivation in `uno.config.ts`)
- `text-gradient` is a UnoCSS shortcut; `glass` (glassmorphism) is a real CSS class in `globals.css` (carries explicit `-webkit-backdrop-filter` for Safari) — single source of truth, do not re-add it as a shortcut

### i18n
- Two languages: `en` and `fr` in `src/locales/`
- Detection order: localStorage → navigator
- All user-facing strings go through `useTranslation()` / `t()` — never hardcode text
- The Worker also has its own i18n for email templates

### CSS Utilities
- `cn()` in `src/lib/utils.ts` = `clsx` + `tailwind-merge`
- `globals.css` includes custom utility classes: `.glass`, `.cv-auto` (content-visibility), `.hero3d-fade`, `.animate-shimmer`, `.animate-spin-slow`, `.lake-label`
- Manual `.container` responsive breakpoints (UnoCSS PostCSS mode doesn't generate them)

---

## Code Conventions

### Style
- **Prettier config:** single quotes, semicolons, 2-space indent, trailing commas (ES5), 100 char width, LF line endings
- **Functional components only** — no class components
- **Named exports** for components (e.g., `export function Hero()`)
- **Lazy imports** use `.then(m => ({ default: m.ComponentName }))` pattern for named exports
- Inline SVGs preferred over importing lucide-react in sync bundles (see Hero.tsx `FileTextIcon`)
- Path alias: `@/` maps to `src/`

### ESLint
- Flat config (ESLint 10), `@typescript-eslint/parser`
- `react-hooks` plugin enabled, some rules relaxed:
  - `set-state-in-effect: off` — valid for listeners and mount guards
  - `refs: off` — valid for controlled transitions
  - `purity: off` — `Math.random()` in useMemo is intentional (particles)
- `no-unused-vars` and `no-undef` off (TypeScript handles these)
- `cloudflare-worker/` is excluded from ESLint

### TypeScript
- Strict mode, ES2022 target, bundler module resolution
- `src/global.d.ts` declares modules for `.css`, `.svg`, `.png`, `.webp`
- `cloudflare-worker/` is excluded from tsconfig (has its own types)

---

## Cloudflare Worker (`cloudflare-worker/worker.ts`)

Two endpoints:
1. **POST `/` (default)** — Contact form handler
   - Validates fields, honeypot, velocity check (min 3s fill time)
   - Turnstile CAPTCHA verification
   - KV rate limit: 3 messages/IP/hour
   - Sends notification email to owner + themed auto-reply to sender via Resend
   - i18n: auto-reply in FR or EN based on client lang
   - Theme-aware: email template matches user's dark/light preference

2. **POST `/ask`** — AI chatbot ("Ask Thomas")
   - Workers AI binding (Llama 3.3 70B FP8)
   - Last 6 messages of history for context
   - KV rate limit: 12 messages/IP/hour
   - System prompt contains all canonical facts about Thomas (bio, projects, tech, contact links)

**CORS:** Allowed origins: `thomastp.ch`, `www.thomastp.ch`, `thomas-tp.github.io`, `localhost:3000`

**Secrets (never in repo):** `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`
**KV binding:** `RATE_LIMIT`

---

## Performance Constraints

This site targets **Lighthouse 100** across all categories. When making changes:

- Never add synchronous imports for heavy libraries (Three.js, GSAP, pdfjs). Always lazy-load.
- Respect the existing chunk split strategy — don't merge async chunks into the main bundle.
- Keep the Hero section's LCP path clean: the memoji image is `loading="eager"` + `fetchPriority="high"`.
- `content-visibility: auto` (`.cv-auto` class) is used on below-fold sections for paint savings.
- `index.html` contains an inline pre-rendered skeleton (`#lcp-prerender`) removed on React mount.
- CSS is inlined (`output.inlineStyles: true` in Rsbuild config) to eliminate render-blocking stylesheets.

---

## Accessibility

- Skip-to-content link in `ClientLayout.tsx`
- WCAG 2.2 focus-visible ring on all interactive elements (defined in `globals.css`)
- `prefers-reduced-motion: reduce` disables all animations (CSS and GSAP)
- Lenis smooth scroll is disabled when reduced motion is preferred
- All images have alt text, all interactive elements are keyboard-accessible
- `<html lang>` updates on language change

---

## Security

- Cloudflare security headers in `public/_headers`: CSP, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Turnstile CAPTCHA on contact form (server-side verification)
- Honeypot field + velocity check for bot detection
- KV-backed rate limiting on all Worker endpoints
- No `.env` files — all secrets are Wrangler secrets
- HTML escaping in email templates (`escapeHtml()`)
- CORS whitelist on Worker

---

## File Organization

```
src/
├── components/
│   ├── layout/       # ClientLayout, Navbar, Footer (app shell)
│   ├── sections/     # Hero, BentoGrid, TechStack, Projects, Contact (page sections)
│   ├── modals/       # CVModal, PrivacyPolicyModal, TermsModal
│   └── ui/           # Reusable UI atoms (glitch-text, hero-shader, toggles, chatbot, etc.)
├── hooks/            # useGsap (animation hooks), useScrollLock
├── lib/              # utils (cn), gsap-init (lazy GSAP loader)
├── locales/          # en.json, fr.json
├── globals.css       # Design tokens, utility classes, UnoCSS entry
├── i18n.ts           # i18next config
├── global.d.ts       # Module declarations
└── index.tsx         # React root
cloudflare-worker/
├── worker.ts         # Edge API (contact + chatbot)
└── wrangler.toml     # Worker config + KV binding
```

---

## What NOT to Do

- **Don't install a router.** This is a single-page site with hash anchors.
- **Don't import GSAP/Three.js/pdfjs at the top level.** Always use dynamic imports or the `loadGsap()` helper.
- **Don't hardcode user-facing strings.** Use `t()` from `react-i18next` and add keys to both locale files.
- **Don't add new vendor dependencies without considering bundle impact.** Check if they can be lazy-loaded.
- **Don't modify the Worker's system prompt** without understanding it's the canonical source of truth for the chatbot's knowledge about Thomas.
- **Don't commit secrets** (API keys, Turnstile keys). They are Wrangler secrets only.
- **Don't break the LCP path.** The Hero section's critical assets (memoji, skeleton) must load eagerly.
- **Don't remove the `#lcp-prerender` teardown** in `App.tsx` — it eliminates CLS from the pre-rendered skeleton.
