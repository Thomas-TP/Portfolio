import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface ProjectOG {
  slug: string;
  title: string;
  description: string;
  year: string;
  tags: string[];
}

const projects: ProjectOG[] = [
  {
    slug: 'x-clone',
    title: 'X-clone',
    description: 'A responsive clone of the X platform with AI chat integration',
    year: '2024',
    tags: ['HTML/CSS', 'JavaScript', 'AI Integration', 'Responsive'],
  },
  {
    slug: 'powershell-empire',
    title: 'PowerShell Empire',
    description: 'Post-exploitation framework for ethical security testing',
    year: '2024',
    tags: ['PowerShell', 'Cybersecurity', 'Automation', 'Scripting'],
  },
  {
    slug: 'tank-io',
    title: 'Tank.io',
    description: 'Real-time multiplayer tank battle game',
    year: '2025',
    tags: ['React', 'Canvas API', 'Multiplayer', 'Game Dev'],
  },
  {
    slug: 'tomboard',
    title: 'TomBoard',
    description: 'Open-source soundboard for Windows — free Voicemod alternative',
    year: '2026',
    tags: ['Rust', 'Tauri', 'React', 'Audio DSP'],
  },
];

async function loadFont(weight: number): Promise<ArrayBuffer> {
  // Firefox 38 UA → Google Fonts returns WOFF (not woff2). Satori supports ttf/woff/otf.
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&display=swap`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:38.0) Gecko/20100101 Firefox/38.0',
      },
    }
  ).then(r => r.text());

  const match = css.match(/src:\s*url\(([^)]+)\)\s*format\('woff'\)/);
  if (!match) {
    // Fallback: grab any URL from the CSS
    const any = css.match(/src:\s*url\(([^)]+)\)/);
    if (!any) throw new Error(`No font URL found for Inter weight ${weight}`);
    return fetch(any[1]).then(r => r.arrayBuffer());
  }
  return fetch(match[1]).then(r => r.arrayBuffer());
}

function createOgElement(project: ProjectOG): Record<string, unknown> {
  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#09090b',
        fontFamily: 'Inter',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              width: '100%',
              height: '4px',
              background: 'linear-gradient(90deg, #a78bfa, #818cf8, #6366f1)',
              flexShrink: 0,
            },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              flex: 1,
              padding: '56px 72px 48px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column', gap: '20px' },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: { display: 'flex', alignItems: 'center' },
                        children: [
                          {
                            type: 'span',
                            props: {
                              style: {
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#a78bfa',
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase' as const,
                              },
                              children: `Project · ${project.year}`,
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '64px',
                          fontWeight: 700,
                          color: '#ffffff',
                          letterSpacing: '-0.03em',
                          lineHeight: 1.1,
                        },
                        children: project.title,
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '22px',
                          fontWeight: 400,
                          color: '#a1a1aa',
                          lineHeight: 1.5,
                        },
                        children: project.description,
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: { display: 'flex', gap: '10px', flexWrap: 'wrap' as const },
                        children: project.tags.map(tag => ({
                          type: 'span',
                          props: {
                            style: {
                              fontSize: '14px',
                              fontWeight: 500,
                              color: '#a1a1aa',
                              padding: '6px 16px',
                              border: '1px solid #27272a',
                              borderRadius: '9999px',
                              backgroundColor: '#18181b',
                            },
                            children: tag,
                          },
                        })),
                      },
                    },
                    {
                      type: 'span',
                      props: {
                        style: { fontSize: '16px', fontWeight: 600, color: '#52525b' },
                        children: 'thomastp.ch',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

async function main() {
  console.log('Loading fonts...');
  const [regular, bold] = await Promise.all([loadFont(400), loadFont(700)]);

  const outDir = join(process.cwd(), 'public', 'images', 'og');
  mkdirSync(outDir, { recursive: true });

  for (const project of projects) {
    console.log(`Generating: ${project.slug}.png`);
    const svg = await satori(createOgElement(project) as never, {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Inter', data: regular, weight: 400 as const, style: 'normal' as const },
        { name: 'Inter', data: bold, weight: 700 as const, style: 'normal' as const },
      ],
    });

    const resvg = new Resvg(svg, { fitTo: { mode: 'width' as const, value: 1200 } });
    const png = resvg.render().asPng();
    writeFileSync(join(outDir, `${project.slug}.png`), png);
    console.log(`  Done (${(png.length / 1024).toFixed(1)} KB)`);
  }

  console.log('All OG images generated.');
}

main();
