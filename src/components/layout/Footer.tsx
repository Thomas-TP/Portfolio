import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { PrivacyPolicyModal } from '@/components/modals/PrivacyPolicyModal';
import { TermsModal } from '@/components/modals/TermsModal';

interface GitHubStats {
    repos: number;
    stars: number;
}

function useGitHubStats() {
    const [stats, setStats] = useState<GitHubStats | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        async function fetchStats() {
            try {
                const res = await fetch(
                    'https://api.github.com/users/Thomas-TP/repos?per_page=100&sort=updated',
                    { signal: controller.signal }
                );
                if (!res.ok) return;
                const repos: { stargazers_count: number; fork: boolean }[] = await res.json();
                const stars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
                setStats({ repos: repos.length, stars });
            } catch { /* network error or aborted */ }
        }
        fetchStats();
        return () => controller.abort();
    }, []);

    return stats;
}

export function Footer() {
    const { t } = useTranslation();
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const stats = useGitHubStats();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="py-8 border-t border-border">
            <div className="container mx-auto px-4 flex flex-col items-center gap-4 text-center text-sm text-muted-foreground md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:text-left">
                <p className="md:col-start-1 md:justify-self-start">
                    &copy; {currentYear} Thomas P. {t('footer.rights')}
                </p>

                {stats && (
                    <a
                        href="https://github.com/Thomas-TP"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 text-xs hover:text-foreground transition-colors md:col-start-2 md:row-start-1 md:justify-self-center"
                    >
                        <span className="flex items-center gap-1.5">
                            <FaGithub size={14} />
                            {stats.repos} repos
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Star size={14} />
                            {stats.stars} stars
                        </span>
                    </a>
                )}

                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 md:col-start-3 md:row-start-1 md:justify-self-end md:text-right">
                    <button
                        onClick={() => setIsPrivacyOpen(true)}
                        className="hover:text-foreground transition-colors cursor-pointer"
                    >
                        {t('footer.privacy')}
                    </button>
                    <button
                        onClick={() => setIsTermsOpen(true)}
                        className="hover:text-foreground transition-colors cursor-pointer"
                    >
                        {t('footer.terms')}
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-6 flex justify-center">
                <p className="text-xs text-muted-foreground/70">
                    {t('footer.crafted_by')}{' '}
                    <a
                        href="https://tom-web.ch"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        TomWeb
                    </a>
                </p>
            </div>

            <PrivacyPolicyModal
                isOpen={isPrivacyOpen}
                onClose={() => setIsPrivacyOpen(false)}
            />
            <TermsModal
                isOpen={isTermsOpen}
                onClose={() => setIsTermsOpen(false)}
            />
        </footer>
    );
}
