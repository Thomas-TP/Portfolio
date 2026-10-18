import { useEffect, useState, lazy, Suspense } from 'react';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { GsapProvider } from '@/components/ui/motion-provider';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Home } from '@/components/Home';
import { BootSequence } from '@/components/ui/boot-sequence';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

const NotFound = lazy(() => import('@/components/NotFound').then(m => ({ default: m.NotFound })));

// Treat any path other than the root or index.html as a 404. We don't have a
// real router because the site is a single page — anything else is unknown.
function isUnknownPath(): boolean {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname.replace(/\/+$/, '');
  return p !== '' && p !== '/index.html';
}

export function App() {
  const [unknown] = useState(isUnknownPath);
  useDocumentMeta();

  useEffect(() => {
    if (!unknown) return;

    let robotsMeta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previousContent = robotsMeta?.content;
    const createdMeta = !robotsMeta;

    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }

    const meta = robotsMeta;
    meta.content = 'noindex, follow';

    return () => {
      if (createdMeta) {
        meta.remove();
      } else if (previousContent) {
        meta.content = previousContent;
      }
    };
  }, [unknown]);

  useEffect(() => {
    document.getElementById('lcp-prerender')?.remove();
  }, []);

  if (unknown) {
    return (
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <NotFound />
        </Suspense>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <GsapProvider>
        <BootSequence />
        <div className="min-h-screen">
          <ClientLayout>
            <Home />
          </ClientLayout>
        </div>
      </GsapProvider>
    </ThemeProvider>
  );
}
