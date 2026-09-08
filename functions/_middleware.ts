interface ProjectMeta {
  slug: string;
  title: string;
  description: string;
}

const PROJECTS: ProjectMeta[] = [
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

interface PagesContext {
  request: Request;
  next: () => Promise<Response>;
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const url = new URL(context.request.url);

  if (url.hostname === 'www.thomastp.ch') {
    url.hostname = 'thomastp.ch';
    return Response.redirect(url.toString(), 301);
  }

  const slug = url.searchParams.get('p');

  if (!slug || (url.pathname !== '/' && url.pathname !== '/index.html')) {
    return context.next();
  }

  const project = PROJECTS.find(p => p.slug === slug);
  if (!project) {
    return context.next();
  }

  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  let html = await response.text();
  const ogTitle = `${project.title} | Thomas P.`;
  const ogDesc = project.description;
  const ogImage = `https://thomastp.ch/images/og/${project.slug}.png`;

  html = html
    .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${ogTitle}"`)
    .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${ogDesc}"`)
    .replace(/(<meta property="og:image" content=")[^"]*"/, `$1${ogImage}"`)
    .replace(
      /(<meta property="og:image:alt" content=")[^"]*"/,
      `$1${project.title} — Thomas P. Portfolio"`
    )
    .replace(/(<meta name="twitter:title" content=")[^"]*"/, `$1${ogTitle}"`)
    .replace(/(<meta name="twitter:description" content=")[^"]*"/, `$1${ogDesc}"`)
    .replace(/(<meta name="twitter:image" content=")[^"]*"/, `$1${ogImage}"`);

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(html, { status: response.status, headers });
}
