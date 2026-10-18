import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowUpRight,
  ArrowDown,
  Code2,
  Database,
  Layers,
  Server,
  ChevronDown,
  GitBranch,
} from 'lucide-react';
import './project-case-study.css';

type Project = 'swiss3design' | 'calyroc';
const icons = [Code2, Server, Database, Layers];
const nodes = ['interface', 'runtime', 'data', 'services'] as const;
const projects = {
  swiss3design: {
    number: '01',
    name: 'Swiss3Design',
    url: 'https://swiss3design.ch',
    repo: 'https://github.com/Thomas-TP/Swiss3Design',
    logo: '/images/swiss3design-logo.webp',
    logoWidth: 320,
    logoHeight: 80,
    stack: ['Next.js', 'Cloudflare Workers', 'PostgreSQL'],
  },
  calyroc: {
    number: '02',
    name: 'Calyroc',
    url: 'https://calyroc.com',
    repo: 'https://github.com/Thomas-TP/calyroc',
    logo: '/images/calyroc-logo.webp',
    logoWidth: 320,
    logoHeight: 89,
    stack: ['Next.js', 'Cloudflare Workers', 'D1'],
  },
};

/** Public project facts, with an explorable map rather than marketing metrics. */
export function ProjectCaseStudy({ project }: { project: Project }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(1);
  const config = projects[project];
  const copy = (key: string) => t(`case_studies.${project}.${key}`);
  const panelId = `${project}-architecture-detail`;

  return (
    <section
      id={project}
      className="case-study container mx-auto px-4 cv-auto"
      aria-labelledby={`${project}-title`}
    >
      <div className="case-study-shell">
        <div className="case-study-copy">
          <div className="case-study-eyebrow">
            <span>{config.number}</span>
            {copy('category')}
          </div>
          <h3 id={`${project}-title`} className="case-study-title">
            {config.name}
          </h3>
          <p className="case-study-lead">{copy('context')}</p>
          <div className="case-study-role">
            <span className="case-study-label">{t('case_studies.role_label')}</span>
            <p>{copy('role')}</p>
          </div>
          <ul className="case-study-stack" aria-label={t('case_studies.stack_label')}>
            {config.stack.map(tech => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
          <details className="case-study-deep-dive">
            <summary>
              {t('case_studies.more')}
              <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <div>
              <h4>{t('case_studies.challenge_label')}</h4>
              <p>{copy('challenge')}</p>
              <h4>{t('case_studies.practice_label')}</h4>
              <p>{copy('practice')}</p>
            </div>
          </details>
          <div className="case-study-links">
            <a
              href={config.url}
              target="_blank"
              rel="noopener noreferrer"
              className="case-study-visit"
            >
              {t('case_studies.visit')}
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
            <a
              href={config.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="case-study-source"
            >
              <GitBranch size={15} aria-hidden="true" />
              {t('case_studies.source')}
            </a>
          </div>
        </div>
        <div className="case-architecture">
          <div className="case-architecture-top">
            <span className="case-browser-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>{new URL(config.url).host}</span>
            <ArrowUpRight size={13} aria-hidden="true" />
          </div>
          <div className="case-architecture-brand">
            <img
              src={config.logo}
              alt={config.name}
              width={config.logoWidth}
              height={config.logoHeight}
              loading="lazy"
              decoding="async"
            />
            <span>{t('case_studies.architecture_label')}</span>
          </div>
          <div
            className="case-architecture-map"
            role="group"
            aria-label={t('case_studies.explore_label')}
          >
            {nodes.map((node, index) => {
              const Icon = icons[index];
              return (
                <div className={`case-node-wrap case-node-${node}`} key={node}>
                  {index === 1 && (
                    <ArrowDown className="case-node-arrow" size={18} aria-hidden="true" />
                  )}
                  <button
                    type="button"
                    className="case-node"
                    aria-pressed={selected === index}
                    aria-controls={panelId}
                    onClick={() => setSelected(index)}
                  >
                    <Icon size={17} strokeWidth={1.5} aria-hidden="true" />
                    <span>
                      <small>{t(`case_studies.layers.${node}`)}</small>
                      <strong>{copy(`nodes.${node}.name`)}</strong>
                    </span>
                    <span className="case-node-light" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
          <div
            className="case-architecture-detail"
            id={panelId}
            aria-live="polite"
            aria-atomic="true"
          >
            <div>
              <span className="case-detail-index">0{selected + 1}</span>
              <h4>{copy(`nodes.${nodes[selected]}.title`)}</h4>
            </div>
            <p>{copy(`nodes.${nodes[selected]}.description`)}</p>
          </div>
          <p className="case-architecture-hint">
            <span aria-hidden="true">↳</span>
            {t('case_studies.map_hint')}
          </p>
        </div>
      </div>
    </section>
  );
}
