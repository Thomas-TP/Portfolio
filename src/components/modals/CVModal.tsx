import { X, Download, Printer, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useScrollLock } from '@/hooks/useScrollLock';
import { loadGsap } from '@/lib/gsap-init';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Set PDF.js worker — Rsbuild emits the worker as a hashed asset automatically
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface CVModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CVModal({ isOpen, onClose }: CVModalProps) {
  const { t, i18n } = useTranslation();
  const cvBaseUrl = 'https://cv.thomastp.ch';
  const cvLang = (i18n.resolvedLanguage ?? i18n.language).toLowerCase().startsWith('fr')
    ? 'fr'
    : 'en';
  const cvPath = cvLang === 'fr' ? `${cvBaseUrl}/cv-fr.pdf` : `${cvBaseUrl}/cv-en.pdf`;

  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [viewportSize, setViewportSize] = useState({ width: 760, height: 980 });
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Mount guard
  useEffect(() => {
    setMounted(true);
  }, []);

  // Enter/exit animations
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else if (shouldRender) {
      let active = true;
      loadGsap().then(({ gsap }) => {
        if (!active) return;
        const tl = gsap.timeline({
          onComplete: () => setShouldRender(false),
        });
        if (backdropRef.current) tl.to(backdropRef.current, { opacity: 0, duration: 0.2 }, 0);
        if (panelRef.current)
          tl.to(panelRef.current, { opacity: 0, scale: 0.96, y: 24, duration: 0.2 }, 0);
      });
      return () => {
        active = false;
      };
    }
  }, [isOpen, shouldRender]);

  // Enter animation when shouldRender becomes true
  useEffect(() => {
    if (!shouldRender || !isOpen) return;
    // Wait one frame for DOM to render
    const raf = requestAnimationFrame(() => {
      loadGsap().then(({ gsap }) => {
        if (backdropRef.current)
          gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
        if (panelRef.current)
          gsap.fromTo(
            panelRef.current,
            { opacity: 0, scale: 0.96, y: 24 },
            { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'power2.out' }
          );
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [shouldRender, isOpen]);

  // Reset to first page when modal opens or when the site language changes
  useEffect(() => {
    if (!isOpen) return;
    setCurrentPage(1);
    setNumPages(0);
    setZoom(1);
  }, [isOpen, cvPath]);

  // Measure content area width responsively
  useEffect(() => {
    if (!isOpen) return;
    const el = contentRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setViewportSize({
          width: Math.max(300, entry.contentRect.width),
          height: Math.max(360, entry.contentRect.height),
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isOpen]);

  useScrollLock(isOpen);

  // ESC to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const prevPage = useCallback(() => setCurrentPage(p => Math.max(1, p - 1)), []);
  const nextPage = useCallback(() => setCurrentPage(p => Math.min(numPages, p + 1)), [numPages]);
  const zoomOut = useCallback(
    () => setZoom(value => Math.max(1, Number((value - 0.15).toFixed(2)))),
    []
  );
  const zoomIn = useCallback(
    () => setZoom(value => Math.min(2.2, Number((value + 0.15).toFixed(2)))),
    []
  );
  const resetZoom = useCallback(() => setZoom(1), []);
  const mobileAvailableHeight = Math.max(240, viewportSize.height - 96);
  const fitPageWidth = Math.max(
    220,
    viewportSize.width < 640
      ? Math.min(viewportSize.width - 40, mobileAvailableHeight / 1.414)
      : viewportSize.width - 32
  );
  const pageWidth = Math.round(fitPageWidth * zoom);

  // Don't render server-side — portal requires document.body
  if (!mounted) return null;

  const modal = shouldRender ? (
    <>
      <div
        ref={backdropRef}
        onClick={onClose}
        className="fixed inset-0 bg-background/85 z-[900]"
        style={{ opacity: 0 }}
      />

      <div className="fixed inset-0 z-[901] flex items-center justify-center pointer-events-none">
        <div
          ref={panelRef}
          className="w-[95vw] max-w-4xl pointer-events-auto sm:w-[95vw]"
          style={{ height: '92dvh', opacity: 0 }}
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-foreground">CV</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Thomas Prudhomme</p>
                  <p className="text-xs text-muted-foreground">
                    {t('cv.subtitle', 'Curriculum Vitæ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(cvPath, '_blank', 'noopener,noreferrer')}
                  aria-label={t('cv.print', 'Imprimer le CV')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Printer size={15} />
                  <span className="hidden sm:inline">{t('cv.print', 'Imprimer')}</span>
                </button>

                <a
                  href={cvPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('cv.download', 'Télécharger le CV')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all hover:scale-105 active:scale-95"
                >
                  <Download size={15} />
                  <span className="hidden sm:inline">{t('cv.download', 'Télécharger')}</span>
                </a>

                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all hover:scale-105 active:scale-95 ml-1 cursor-pointer"
                  aria-label="Fermer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* PDF viewer — single page at a time for performance */}
            {/* data-lenis-prevent: stops Lenis from hijacking wheel events */}
            <div
              ref={contentRef}
              data-lenis-prevent
              className="flex-1 overflow-auto min-h-0 custom-scrollbar bg-muted/30"
              style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
            >
              <div className="min-w-max flex flex-col items-center py-3 px-4 sm:py-6">
                <Document
                  file={cvPath}
                  onLoadSuccess={onDocumentLoadSuccess}
                  externalLinkTarget="_blank"
                  loading={
                    <div className="flex items-center justify-center h-96 text-muted-foreground">
                      <span className="text-sm">Chargement du CV…</span>
                    </div>
                  }
                  error={
                    <div className="flex items-center justify-center h-96 text-muted-foreground">
                      <span className="text-sm text-destructive">Impossible de charger le CV.</span>
                    </div>
                  }
                >
                  {/* Render ONLY the current page — avoids rendering 500+ DOM nodes per page */}
                  <div className="shadow-xl rounded overflow-hidden">
                    <Page
                      pageNumber={currentPage}
                      width={pageWidth}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  </div>
                </Document>
              </div>
            </div>

            {/* Page navigator */}
            {numPages > 0 && (
              <div className="flex items-center justify-center gap-3 px-5 py-3 border-t border-border shrink-0">
                <button
                  onClick={zoomOut}
                  disabled={zoom <= 1}
                  aria-label="Dézoomer"
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  onClick={resetZoom}
                  disabled={zoom === 1}
                  className="min-w-12 h-8 px-2 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Réinitialiser le zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  onClick={zoomIn}
                  disabled={zoom >= 2.2}
                  aria-label="Zoomer"
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ZoomIn size={16} />
                </button>
                <div className="w-px h-6 bg-border mx-1" />
                <button
                  onClick={prevPage}
                  disabled={currentPage <= 1}
                  aria-label="Page précédente"
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {currentPage} / {numPages}
                </span>
                <button
                  onClick={nextPage}
                  disabled={currentPage >= numPages}
                  aria-label="Page suivante"
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  ) : null;

  return createPortal(modal, document.body);
}
