/**
 * Seed the Vectorize index with portfolio knowledge chunks.
 *
 * Prerequisites:
 *   1. Create the index:
 *      wrangler vectorize create portfolio-knowledge --dimensions 768 --metric cosine
 *   2. Set environment variables:
 *      CF_ACCOUNT_ID=<your account id>
 *      CF_API_TOKEN=<your API token with Workers AI + Vectorize permissions>
 *   3. Run:
 *      bun run scripts/seed-vectorize.ts
 */

const ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const API_TOKEN = process.env.CF_API_TOKEN;
const INDEX_NAME = 'portfolio-knowledge';
const CV_FR_URL = 'https://thomastp.ch/documents/cv-fr.pdf?v=20260502';
const CV_EN_URL = 'https://thomastp.ch/documents/cv-en.pdf?v=20260502';
const CV_SOURCES = `CV FR ${CV_FR_URL}; CV EN ${CV_EN_URL}`;

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error('Missing CF_ACCOUNT_ID or CF_API_TOKEN environment variables.');
  process.exit(1);
}

interface Chunk {
  id: string;
  text: string;
  category: string;
}

const chunks: Chunk[] = [
  {
    id: 'bio',
    category: 'identity',
    text: `Sources: ${CV_SOURCES}; Portfolio https://thomastp.ch/llms.txt; GitHub profile https://github.com/Thomas-TP. Thomas Prudhomme is a Swiss CFC computer science apprentice/student in exploitation and infrastructure at Geneva Institute of Technology. In 2026 he is in the second year / specialization period and is looking to continue the CFC in company/alternance from July 2026 across the Lake Geneva region. Public GitHub handle: Thomas-TP. GitHub display name: Thomas. Location: Switzerland / Lake Geneva region.`,
  },
  {
    id: 'education',
    category: 'education',
    text: `Source: ${CV_SOURCES}. Education: 2024-2028 Geneva Institute of Technology, CFC Informaticien exploitation et infrastructure. 2023-2024 FuturPlus Lausanne, pre-apprenticeship year. 2020-2023 compulsory school in Gland / Grand-Champ, option architecture and technical drawing.`,
  },
  {
    id: 'experience',
    category: 'experience',
    text: `Source: ${CV_SOURCES}. Professional experiences: February 20-22, 2024 EPFL discovery internship / IT activity. April 22-26, 2024 LRG Informatique internship focused on PC installation/configuration.`,
  },
  {
    id: 'skills-cv',
    category: 'skills',
    text: `Sources: ${CV_SOURCES}; Portfolio https://thomastp.ch/llms.txt. Core skills and interests: web development, cloud, cybersecurity/ethical hacking, IoT and smart home, systems/infrastructure. CV skills: Linux (Debian, APT, SSH), React, Node, TypeScript, AWS, Azure, Google Cloud, Home Assistant, Zigbee, Matter, Claude Code, GitHub Copilot, LM Studio.`,
  },
  {
    id: 'certifications',
    category: 'credentials',
    text: `Sources: ${CV_SOURCES}; Credly https://www.credly.com/users/thomas-prudhomme; LinkedIn https://www.linkedin.com/in/thomas-tp/. Certifications are public via Credly and LinkedIn. Examples listed on the CV: GitHub Foundations, English for IT 1/2, Linux Essentials, Microsoft generative AI, EF SET English Certificate 69/100. Do not invent additional badges; link to Credly/LinkedIn for the complete verified list.`,
  },
  {
    id: 'tech-portfolio',
    category: 'tech',
    text: 'Sources: Portfolio https://thomastp.ch/llms.txt; repository https://github.com/Thomas-TP/Thomas-TP.github.io. Portfolio site stack: Bun, Rsbuild/Rspack, React 19, TypeScript 6, UnoCSS, GSAP, Three.js/react-three-fiber, i18next, Cloudflare Pages, Cloudflare Workers, KV, Workers AI, Turnstile, Resend, react-pdf/pdfjs. The site includes Ask Thomas, contact form, CV modal, 3D hero, bilingual FR/EN content, STT/TTS, and privacy-focused analytics wording.',
  },
  {
    id: 'github-profile',
    category: 'github',
    text: 'Source: GitHub profile https://github.com/Thomas-TP. Public GitHub metadata: 13 public repositories, 2 followers, 6 following, hireable=true, organization @Satom-IT-Learning-Solutions, location Switzerland, bio Student, public links include links.thomastp.ch, LinkedIn, thomastp.ch, tomweb.dev, and WhatsApp.',
  },
  {
    id: 'repo-inventory-featured',
    category: 'project',
    text: 'Source: GitHub repositories https://github.com/Thomas-TP?tab=repositories. Featured public repos: Thomas-TP.github.io portfolio (TypeScript, React, Bun, Rsbuild, UnoCSS, Cloudflare) https://github.com/Thomas-TP/Thomas-TP.github.io; TomBoard modern Windows soundboard with Tauri/Rust/React/TypeScript https://github.com/Thomas-TP/TomBoard; links personal link-in-bio site with Next.js/React/TypeScript/GitHub Pages https://github.com/Thomas-TP/links; Link-Catcher privacy-first Chrome extension for keyword URL redirects https://github.com/Thomas-TP/Link-Catcher.',
  },
  {
    id: 'repo-inventory-other',
    category: 'project',
    text: 'Source: GitHub repositories https://github.com/Thomas-TP?tab=repositories. Other non-fork public repos: meals-app meal planner https://github.com/Thomas-TP/meals-app; LEGENDES-DONJONS C#/TypeScript project https://github.com/Thomas-TP/LEGENDES-DONJONS; E-Commerce test/e-commerce repo using JavaScript/PHP/Blade https://github.com/Thomas-TP/E-Commerce; Tank.io multiplayer tank game https://github.com/Thomas-TP/Tank.io live https://tank-io-wr49.onrender.com; Powershell-Empire security learning repo https://github.com/Thomas-TP/Powershell-Empire; X-clone realistic X/Twitter clone https://github.com/Thomas-TP/X-clone live https://x-clone-delta-nine.vercel.app.',
  },
  {
    id: 'repo-inventory-forks',
    category: 'project',
    text: 'Source: GitHub repositories https://github.com/Thomas-TP?tab=repositories. Forked public repos: cv, an interactive resume template built with React, TypeScript, Tailwind CSS and Framer Motion, https://github.com/Thomas-TP/cv; typr, a Rust/R-related project described as a safer complement of R for statistics and data science, https://github.com/Thomas-TP/typr.',
  },
  {
    id: 'project-tomboard',
    category: 'project',
    text: 'Source: GitHub repository https://github.com/Thomas-TP/TomBoard. TomBoard is a modern Windows soundboard built with Tauri, Rust, React and TypeScript. Features from public README: instant audio playback for MP3/WAV/OGG/FLAC/AAC; audio extraction from videos; dual output to speakers + virtual microphone; per-sound and master volume; playback speed; loop mode; real-time voice changer with presets; TTS with automatic language detection; AI noise suppression; microphone passthrough; light/dark design; drag-and-drop categories; profiles; global hotkeys; online library; recording; import/export backup; system tray/minimized startup.',
  },
  {
    id: 'project-link-catcher',
    category: 'project',
    text: 'Source: GitHub repository https://github.com/Thomas-TP/Link-Catcher. Link-Catcher is a privacy-first Chrome extension for instant keyword-based URL redirects. Public README features: transparent search interception via Omnibox; premium glassmorphism interface; drag-and-drop organization; light/dark themes; multilingual UI in French, English, Spanish and German; JSON import/export; local-only privacy-first storage; Manifest V3, vanilla JavaScript, HTML5/CSS3, chrome.storage.sync and chrome.webNavigation APIs.',
  },
  {
    id: 'contact',
    category: 'contact',
    text: `Sources: Portfolio https://thomastp.ch/llms.txt; ${CV_SOURCES}; Link hub https://links.thomastp.ch. Contact Thomas: portfolio email thomas@prudhomme.li, contact form https://thomastp.ch/#contact, all links https://links.thomastp.ch, GitHub https://github.com/Thomas-TP, LinkedIn https://www.linkedin.com/in/thomas-tp/, Credly https://www.credly.com/users/thomas-prudhomme, CV PDFs ${CV_FR_URL} and ${CV_EN_URL}. CV email: T+CV@prudhomme.li.`,
  },
  {
    id: 'source-rules',
    category: 'behavior',
    text: 'Answering rules: cite sources in a final Sources line with Markdown links. Merge duplicate facts instead of repeating them. Source priority: CV for education/experience/languages/certifications/availability; Portfolio for current positioning/contact/site stack; GitHub repositories for repo inventory and project metadata; GitHub profile for public profile metadata; LinkedIn/Credly/Link hub for public profile URLs. Do not invent facts.',
  },
];

const API_BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}`;
const headers = { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' };

async function embed(texts: string[]): Promise<number[][]> {
  const res = await fetch(`${API_BASE}/ai/run/@cf/baai/bge-base-en-v1.5`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text: texts }),
  });
  if (!res.ok) throw new Error(`Embedding failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { result: { data: number[][] } };
  return data.result.data;
}

async function upsertVectors(
  vectors: Array<{ id: string; values: number[]; metadata: Record<string, string> }>
) {
  const ndjson = vectors.map(v => JSON.stringify(v)).join('\n');
  const res = await fetch(`${API_BASE}/vectorize/v2/indexes/${INDEX_NAME}/upsert`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/x-ndjson' },
    body: ndjson,
  });
  if (!res.ok) throw new Error(`Upsert failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log(`Seeding ${chunks.length} chunks into Vectorize index "${INDEX_NAME}"...`);

  console.log('Generating embeddings...');
  const texts = chunks.map(c => c.text);
  const embeddings = await embed(texts);
  console.log(`  Got ${embeddings.length} embeddings (${embeddings[0].length} dimensions)`);

  const vectors = chunks.map((c, i) => ({
    id: c.id,
    values: embeddings[i],
    metadata: { text: c.text, category: c.category },
  }));

  console.log('Upserting vectors...');
  const result = await upsertVectors(vectors);
  console.log('Done:', JSON.stringify(result, null, 2));
}

main();
