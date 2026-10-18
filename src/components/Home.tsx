import { lazy, Suspense } from 'react';
import { Hero } from '@/components/sections/Hero';
import { useTranslation } from 'react-i18next';

// Sections below the fold are lazy-loaded to reduce initial JS bundle size
// and avoid parsing/executing heavy components (BentoGrid ~847 lines, Projects ~444 lines)
// before they are needed.
const AboutBento = lazy(() =>
  import('@/components/sections/BentoGrid').then(m => ({ default: m.AboutBento }))
);
const TechStack = lazy(() =>
  import('@/components/sections/TechStack').then(m => ({ default: m.TechStack }))
);
const Projects = lazy(() =>
  import('@/components/sections/Projects').then(m => ({ default: m.Projects }))
);
const ProjectCaseStudy = lazy(() =>
  import('@/components/sections/ProjectCaseStudy').then(m => ({ default: m.ProjectCaseStudy }))
);
const Contact = lazy(() =>
  import('@/components/sections/Contact').then(m => ({ default: m.Contact }))
);

export function Home() {
  const { t } = useTranslation();
  return (
    <main id="main-content" className="relative z-10 flex flex-col gap-20">
      <Hero />
      <Suspense fallback={<div className="min-h-screen" />}>
        <AboutBento />
        <TechStack />
        <div id="projects" className="case-studies-group">
          <div className="container mx-auto px-4 case-studies-intro">
            <span className="case-study-label">{t('case_studies.eyebrow')}</span>
            <h2>{t('case_studies.title')}</h2>
            <p>{t('case_studies.intro')}</p>
          </div>
          <ProjectCaseStudy project="swiss3design" />
          <ProjectCaseStudy project="calyroc" />
          <Projects />
        </div>
        <Contact />
      </Suspense>
    </main>
  );
}
