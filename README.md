<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://readme-typing-svg.demolab.com?font=Inter&weight=700&size=42&pause=1000&color=FFFFFF&center=true&vCenter=true&width=620&height=80&lines=Thomas+P.+%E2%80%94+Portfolio;Bun+%C2%B7+Rsbuild+%C2%B7+UnoCSS;React+19+%C2%B7+TypeScript+6">
  <source media="(prefers-color-scheme: light)" srcset="https://readme-typing-svg.demolab.com?font=Inter&weight=700&size=42&pause=1000&color=000000&center=true&vCenter=true&width=620&height=80&lines=Thomas+P.+%E2%80%94+Portfolio;Bun+%C2%B7+Rsbuild+%C2%B7+UnoCSS;React+19+%C2%B7+TypeScript+6">
  <img src="https://readme-typing-svg.demolab.com?font=Inter&weight=700&size=42&pause=1000&color=FFFFFF&center=true&vCenter=true&width=620&height=80&lines=Thomas+P.+%E2%80%94+Portfolio;Bun+%C2%B7+Rsbuild+%C2%B7+UnoCSS;React+19+%C2%B7+TypeScript+6" alt="Thomas P. Portfolio" />
</picture>

<br/>

[![Live](https://img.shields.io/badge/thomastp.ch-live-000?style=for-the-badge&logo=cloudflare&logoColor=white)](https://thomastp.ch)
[![Bun](https://img.shields.io/badge/Bun-1.x-000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![Rsbuild](https://img.shields.io/badge/Rsbuild%2FRspack-1.3-000?style=for-the-badge&logo=webpack&logoColor=white)](https://rsbuild.dev)
[![UnoCSS](https://img.shields.io/badge/UnoCSS-66.x-000?style=for-the-badge&logo=unocss&logoColor=white)](https://unocss.dev)
[![React](https://img.shields.io/badge/React-19-000?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-000?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-deployed-000?style=for-the-badge&logo=cloudflarepages&logoColor=white)](https://pages.cloudflare.com)

</div>

---

## Table of Contents

- [Stack Confirmation](#stack-confirmation)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Commands](#commands)
- [Technologies](#technologies)
- [Cloudflare Deployment](#cloudflare-deployment)
- [Environment Variables](#environment-variables)
- [Security](#security)

---

## Stack Confirmation

| Layer                         | Tool                                                          | Version | Role                                   |
| ----------------------------- | ------------------------------------------------------------- | ------- | -------------------------------------- |
| **Runtime & Package Manager** | [Bun](https://bun.sh)                                         | `1.x`   | JS runtime + `bun install`             |
| **Bundler / Compiler**        | [Rsbuild](https://rsbuild.dev) + [Rspack](https://rspack.dev) | `1.3.x` | Rust-based webpack-compatible bundler  |
| **CSS Engine**                | [UnoCSS](https://unocss.dev)                                  | `66.x`  | Atomic CSS, `presetWind`, PostCSS mode |
| **UI Framework**              | [React](https://react.dev)                                    | `19.x`  | Concurrent mode                        |
| **Language**                  | [TypeScript](https://typescriptlang.org)                      | `6.x`   | `strict` mode, `bundler` resolution    |
| **Hosting**                   | [Cloudflare Pages](https://pages.cloudflare.com)              | —       | Edge CDN, automatic deploys            |
| **Contact API**               | [Cloudflare Workers](https://workers.cloudflare.com)          | —       | Serverless edge function               |

> **Confirmed:** `bun install` · `rsbuild` / `rspack` compiler · `unocss` design system

---

## Features

```
✦  React 19 — Concurrent mode, lazy sections, Suspense streaming
✦  Rsbuild + Rspack — Rust-powered compilation, ~10× faster than webpack
✦  UnoCSS — On-demand atomic CSS, zero dead styles in production
✦  GSAP 3 — Scroll-driven animations, magnetic hover, parallax reveals
✦  Lenis smooth scroll — Native-feeling inertia scroll (side-effect init, no remount)
✦  Three.js particle network — Interactive 3D hero background
✦  i18n (EN / FR) — i18next + browser language detection
✦  Dark / Light mode — System-aware with localStorage persistence
✦  PDF viewer — pdfjs-dist: lazy-loaded, web worker offloaded
✦  Contact form — Cloudflare Worker + Resend API + Turnstile CAPTCHA
✦  Rate limiting — KV-backed per-IP rate limiting on the edge
✦  Security headers — CSP, X-Frame-Options, Referrer-Policy via _headers
✦  SEO — JSON-LD structured data, Open Graph, Twitter Card, sitemap.xml
✦  Lighthouse 100 — Performance · Accessibility · Best Practices · SEO
```

---

## Architecture

```
Browser Request
      │
      ▼
┌─────────────────────────────────────┐
│         Cloudflare Edge CDN          │
│  (Pages + _headers security rules)   │
└──────────────┬──────────────────────┘
               │
       ┌───────▼────────┐
       │   index.html   │  ← HTML skeleton (instant paint, removed after React mounts)
       │  + React bundle │  ← Rspack chunks (code-split)
       └───────┬────────┘
               │
       ┌───────▼────────────────────────────────────┐
       │                React 19 App                  │
       │                                              │
       │  ThemeProvider  ──── localStorage            │
       │  GsapProvider  ──────── gsap + ScrollTrigger │
       │  ClientLayout                                │
       │    ├── Navbar  (floating pill + top bar)     │
       │    ├── ScrollProgress                        │
       │    ├── Hero  ←── Three.js particles          │
       │    ├── BentoGrid  (lazy, below the fold)     │
       │    ├── TechStack  (lazy)                     │
       │    ├── Projects   (lazy)                     │
       │    ├── Contact    (lazy)                     │
       │    └── Footer                                │
       └────────────────────────────────────────────┘
               │
       Contact form POST
               │
       ┌───────▼──────────────────────┐
       │  Cloudflare Worker            │
       │  ├── Turnstile verification   │
       │  ├── KV rate limiting         │
       │  ├── Resend API (email)       │
       │  └── Auto-reply (EN / FR)     │
       └──────────────────────────────┘
```

### Bundle Split Strategy (Rspack)

| Chunk          | Contents                   | Load mode             |
| -------------- | -------------------------- | --------------------- |
| `vendor-three` | `three` + `@react-three/*` | async — Hero only     |
| `vendor-gsap`  | `gsap` + `ScrollTrigger`   | all pages             |
| `vendor-pdf`   | `pdfjs-dist` + `react-pdf` | async — CV modal only |
| `main`         | App + components           | eager                 |

---

## Project Structure

```
📦 thomastp.ch
├── 📄 index.html               # Shell + HTML skeleton + SEO meta
├── 📄 rsbuild.config.ts        # Rsbuild / Rspack config + chunk splits
├── 📄 uno.config.ts            # UnoCSS presetWind + theme tokens + shortcuts
├── 📄 postcss.config.mjs       # UnoCSS PostCSS plugin
├── 📄 tsconfig.json            # TypeScript strict + bundler resolution
├── 📄 .oxlintrc.json           # Oxlint config
├── 📄 .oxfmtrc.json            # Oxfmt config
│
├── 📁 public/
│   ├── _headers                # Cloudflare security headers
│   ├── _redirects              # Cloudflare redirect rules
│   ├── CNAME                   # Custom domain
│   ├── sitemap.xml             # SEO sitemap
│   ├── robots.txt
│   ├── documents/              # PDFs (CV, etc.)
│   ├── icons/                  # Favicons (SVG dark / light variants)
│   └── images/                 # Optimised WebP assets
│
├── 📁 src/
│   ├── index.tsx               # React root + double-rAF skeleton teardown
│   ├── App.tsx                 # Provider tree
│   ├── globals.css             # CSS design tokens + UnoCSS entry
│   ├── i18n.ts                 # i18next init (EN / FR)
│   │
│   ├── 📁 lib/
│   │   ├── utils.ts            # cn() — clsx + tailwind-merge
│   │   └── gsap-init.ts        # Async GSAP + ScrollTrigger loader
│   │
│   ├── 📁 hooks/
│   │   ├── useScrollLock.ts    # Body scroll lock for modals
│   │   └── useGsap.ts          # GSAP animation hooks (magnetic, reveal…)
│   │
│   ├── 📁 locales/
│   │   ├── en.json             # English strings
│   │   └── fr.json             # French strings
│   │
│   └── 📁 components/
│       ├── Home.tsx            # Section orchestrator (lazy + Suspense)
│       ├── NotFound.tsx        # 404 page
│       │
│       ├── 📁 layout/
│       │   ├── ClientLayout.tsx    # Lenis side-effect + bg gradients
│       │   ├── Navbar.tsx          # Floating pill nav + top bar + active section
│       │   └── Footer.tsx
│       │
│       ├── 📁 sections/
│       │   ├── Hero.tsx            # Landing — 3D + typing + magnetic buttons
│       │   ├── BentoGrid.tsx       # About — bento card layout
│       │   ├── TechStack.tsx       # Skills icon grid
│       │   ├── Projects.tsx        # Terminal-style project showcase
│       │   └── Contact.tsx         # Contact form (Cloudflare Worker)
│       │
│       ├── 📁 modals/
│       │   ├── CVModal.tsx         # Lazy PDF viewer modal
│       │   ├── PrivacyPolicyModal.tsx
│       │   └── TermsModal.tsx
│       │
│       └── 📁 ui/
│           ├── glitch-text.tsx     # Hover glitch effect on name
│           ├── hero-3d.tsx         # Three.js particle canvas
│           ├── language-toggle.tsx # EN / FR switcher
│           ├── mode-toggle.tsx     # Dark / light toggle
│           ├── motion-provider.tsx # GsapProvider wrapper
│           ├── scroll-progress.tsx # Fixed top progress bar
│           └── theme-provider.tsx  # Theme context + favicon swap
│
├── 📁 cloudflare-worker/
│   ├── worker.ts               # Contact API — Resend + Turnstile + KV
│   └── wrangler.toml           # Worker config + KV binding
│
└── 📁 scripts/
    └── copy-pdf-worker.mjs     # Prebuild: copies pdfjs worker to public/
```

---

## Commands

> All commands use **Bun**. Install Bun first:
>
> ```bash
> curl -fsSL https://bun.sh/install | bash
> ```

```bash
# ── Install dependencies ──────────────────────────────────────────────────
bun install

# ── Development server (Rsbuild HMR + Rspack) ─────────────────────────────
bun dev                       # → http://localhost:3000

# ── Production build ──────────────────────────────────────────────────────
bun run build                 # prebuild (pdf worker copy) + rsbuild build
                              # Output: ./dist/

# ── Preview production build locally ──────────────────────────────────────
bun run preview               # → http://localhost:4173

# ── Linting ───────────────────────────────────────────────────────────────
bun run lint                  # Oxlint

# ── Formatting ────────────────────────────────────────────────────────────
bun run format                # Oxfmt — formats all files in place

# ── Cloudflare Worker ─────────────────────────────────────────────────────
cd cloudflare-worker
wrangler deploy                            # Deploy contact edge function
wrangler secret put RESEND_API_KEY         # Set Resend API key
wrangler secret put TURNSTILE_SECRET_KEY   # Set Turnstile server-side secret
wrangler tail                              # Stream live worker logs
```

---

## Technologies

### Core

| Package                 | Version  | Purpose                            |
| ----------------------- | -------- | ---------------------------------- |
| `react`                 | `19.2.4` | UI framework — concurrent mode     |
| `react-dom`             | `19.2.4` | DOM renderer                       |
| `typescript`            | `6.0.2`  | Static typing, strict mode         |
| `@rsbuild/core`         | `1.3.x`  | Build orchestrator (Rspack)        |
| `@rsbuild/plugin-react` | `1.3.x`  | React / JSX transform              |
| `unocss`                | `66.x`   | Atomic CSS engine                  |
| `@unocss/preset-wind`   | `66.x`   | Tailwind-compatible utility preset |
| `@unocss/postcss`       | `66.x`   | PostCSS integration                |
| `@unocss/reset`         | `66.x`   | Tailwind v4 reset styles           |

### UI & Animation

| Package              | Version   | Purpose                                               |
| -------------------- | --------- | ----------------------------------------------------- |
| `gsap`               | `3.14.x`  | Animations — scroll reveals, parallax, magnetic hover |
| `@gsap/react`        | `2.1.x`   | React integration for GSAP                            |
| `lenis`              | `1.3.21`  | Smooth inertia scroll (side-effect init)              |
| `three`              | `0.183.x` | 3D WebGL rendering                                    |
| `@react-three/fiber` | `9.5.x`   | React renderer for Three.js                           |
| `@react-three/drei`  | `10.7.x`  | Three.js helpers (Points, Materials…)                 |
| `lucide-react`       | `1.7.0`   | Outline icon set                                      |
| `react-icons`        | `5.6.x`   | Brand icons (GitHub, LinkedIn…)                       |
| `simple-icons`       | `16.14.x` | Tech stack SVG logos                                  |

### Internationalisation & Content

| Package                            | Version  | Purpose                        |
| ---------------------------------- | -------- | ------------------------------ |
| `i18next`                          | `26.x`   | i18n framework                 |
| `react-i18next`                    | `17.x`   | React hooks (`useTranslation`) |
| `i18next-browser-languagedetector` | `8.2.1`  | Auto-detect browser language   |
| `pdfjs-dist`                       | `5.6.x`  | PDF rendering (web worker)     |
| `react-pdf`                        | `10.4.x` | React PDF viewer component     |

### Forms & Security

| Package                     | Version | Purpose                              |
| --------------------------- | ------- | ------------------------------------ |
| `@marsidev/react-turnstile` | `1.5.x` | Cloudflare Turnstile CAPTCHA widget  |
| `class-variance-authority`  | `0.7.x` | Component variant system             |
| `clsx`                      | `2.1.x` | Conditional class name helper        |
| `tailwind-merge`            | `3.5.0` | Safely merge UnoCSS/Tailwind classes |

### Dev Tooling

| Tool                | Purpose                   |
| ------------------- | ------------------------- |
| `oxlint`            | Linting                   |
| `oxfmt`             | Code formatting           |
| `@types/react 19.x` | React TypeScript types    |
| `@types/three`      | Three.js TypeScript types |

---

## Cloudflare Deployment

### Pages — Frontend

The site is deployed on **Cloudflare Pages** via Git integration.

| Setting          | Value           |
| ---------------- | --------------- |
| Build command    | `bun run build` |
| Output directory | `dist`          |
| Root directory   | `/`             |

Security headers are enforced via [`public/_headers`](public/_headers):

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-XSS-Protection: 1; mode=block
```

### Worker — Contact API

The contact form backend runs as a **Cloudflare Worker**.

| Feature         | Implementation                       |
| --------------- | ------------------------------------ |
| Email sending   | Resend API                           |
| CAPTCHA         | Cloudflare Turnstile (server-side)   |
| Rate limiting   | KV namespace (per-IP sliding window) |
| Spam protection | Honeypot field + fill-time heuristic |
| i18n emails     | EN / FR auto-reply                   |
| Email themes    | Dark / Light styled HTML templates   |

```bash
cd cloudflare-worker
wrangler deploy
wrangler secret put RESEND_API_KEY
wrangler secret put TURNSTILE_SECRET_KEY
```

---

## Environment Variables

No `.env` is needed for the frontend — all config is build-time.

The Cloudflare Worker requires two **Wrangler secrets** (never committed to the repo):

| Secret                 | Description                             |
| ---------------------- | --------------------------------------- |
| `RESEND_API_KEY`       | Resend API key for sending emails       |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile server-side secret |

A **KV namespace** must be bound in `wrangler.toml`:

| Binding      | KV Namespace ID                    | Purpose              |
| ------------ | ---------------------------------- | -------------------- |
| `RATE_LIMIT` | `898ccbfd2a1c4018b1bf4880ff7b2dfa` | Per-IP rate limiting |

---

## Security

| Control       | Implementation                                                                             |
| ------------- | ------------------------------------------------------------------------------------------ |
| CAPTCHA       | Cloudflare Turnstile — server-side token verification in the Worker                        |
| Rate limiting | KV sliding window per IP on the edge                                                       |
| Spam          | Honeypot field + minimum form-fill time heuristic                                          |
| HTTP headers  | `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` |
| Framing       | `DENY` — cannot be embedded in iframes                                                     |
| Secrets       | Wrangler secrets only — no `.env` or credentials in the repository                         |

---

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://capsule-render.vercel.app/api?type=waving&color=ffffff&height=80&section=footer&fontColor=000000">
  <source media="(prefers-color-scheme: light)" srcset="https://capsule-render.vercel.app/api?type=waving&color=000000&height=80&section=footer&fontColor=ffffff">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=ffffff&height=80&section=footer" alt="" />
</picture>

**Thomas P.** — [thomastp.ch](https://thomastp.ch) · [GitHub](https://github.com/Thomas-TP) · [LinkedIn](https://www.linkedin.com/in/thomas-tp/)

[![MIT License](https://img.shields.io/badge/License-MIT-000?style=flat-square)](LICENSE)

</div>
