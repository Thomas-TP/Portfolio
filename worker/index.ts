const projects = [
  {
    slug: 'x-clone',
    title: 'X-clone',
    description: 'A responsive clone of the X platform with AI chat integration',
  },
  {
    slug: 'powershell-empire',
    title: 'PowerShell Empire',
    description: 'Post-exploitation framework for ethical security testing',
  },
  { slug: 'tank-io', title: 'Tank.io', description: 'Real-time multiplayer tank battle game' },
  {
    slug: 'tomboard',
    title: 'TomBoard',
    description: 'Open-source soundboard for Windows — free Voicemod alternative',
  },
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.hostname === 'www.thomastp.ch') {
      url.hostname = 'thomastp.ch';
      return Response.redirect(url.toString(), 301);
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    // The response is streamed, including project-specific social previews.
    headers.set('X-Portfolio-Hosting', 'cloudflare-workers');
    let result = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    if (!response.headers.get('content-type')?.includes('text/html')) return result;

    const project = projects.find(p => p.slug === url.searchParams.get('p'));
    if (!project || !['/', '/index.html'].includes(url.pathname)) return result;
    const title = `${project.title} | Thomas P.`;
    const image = `https://thomastp.ch/images/og/${project.slug}.webp`;
    result = new HTMLRewriter()
      .on('meta[property="og:title"], meta[name="twitter:title"]', {
        element(el) {
          el.setAttribute('content', title);
        },
      })
      .on('meta[property="og:description"], meta[name="twitter:description"]', {
        element(el) {
          el.setAttribute('content', project.description);
        },
      })
      .on('meta[property="og:image"], meta[name="twitter:image"]', {
        element(el) {
          el.setAttribute('content', image);
        },
      })
      .on('meta[property="og:image:alt"]', {
        element(el) {
          el.setAttribute('content', `${project.title} — Thomas P. Portfolio`);
        },
      })
      .transform(result);
    return result;
  },
} satisfies ExportedHandler<Env>;
