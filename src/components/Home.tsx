import { lazy, Suspense } from 'react';
import { Hero } from '@/components/sections/Hero';

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
const Venture = lazy(() =>
    import('@/components/sections/Venture').then(m => ({ default: m.Venture }))
);
const Contact = lazy(() =>
    import('@/components/sections/Contact').then(m => ({ default: m.Contact }))
);

export function Home() {
    return (
        <main id="main-content" className="relative z-10 flex flex-col gap-20">
            <Hero />
            <Suspense fallback={<div className="min-h-screen" />}>
                <AboutBento />
                <TechStack />
                <Projects />
                <Venture />
                <Contact />
            </Suspense>
        </main>
    );
}
