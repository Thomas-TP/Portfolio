import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const STORAGE_BEST = '404-best-score';

interface Obstacle {
    x: number;
    width: number;
    height: number;
    type: 'wall' | 'bug';
}

/**
 * 404 page — terminal-themed endless runner.
 * Jump over firewalls (▮) and bugs (▼) using SPACE / ↑ / click / tap.
 */
export function NotFound() {
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [best, setBest] = useState(() => {
        if (typeof localStorage === 'undefined') return 0;
        return parseInt(localStorage.getItem(STORAGE_BEST) ?? '0', 10);
    });
    const [running, setRunning] = useState(false);
    const [gameOver, setGameOver] = useState(false);

    // Mutable game state (avoid React re-renders during the loop)
    const stateRef = useRef({
        playerY: 0,
        velY: 0,
        onGround: true,
        ducking: false,
        speed: 5,
        obstacles: [] as Obstacle[],
        spawnTimer: 0,
        score: 0,
        running: false,
        gameOver: false,
        time: 0,
    });

    const startGame = useCallback(() => {
        stateRef.current = {
            playerY: 0,
            velY: 0,
            onGround: true,
            ducking: false,
            speed: 5,
            obstacles: [],
            spawnTimer: 60,
            score: 0,
            running: true,
            gameOver: false,
            time: 0,
        };
        setScore(0);
        setGameOver(false);
        setRunning(true);
    }, []);

    const jump = useCallback(() => {
        const s = stateRef.current;
        if (s.gameOver) {
            startGame();
            return;
        }
        if (!s.running) {
            startGame();
            return;
        }
        if (s.onGround) {
            s.velY = -13;
            s.onGround = false;
        }
    }, [startGame]);

    // Input
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                e.preventDefault();
                jump();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [jump]);

    // Game loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // HiDPI
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cssWidth = canvas.clientWidth;
        const cssHeight = canvas.clientHeight;
        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;
        ctx.scale(dpr, dpr);

        const W = cssWidth;
        const H = cssHeight;
        const groundY = H - 30;
        const playerX = 50;
        const playerW = 28;
        const playerH = 36;
        const gravity = 0.7;

        // Theme colors — read from CSS variables for dark/light support
        const styles = getComputedStyle(document.documentElement);
        const fg = `rgb(${styles.getPropertyValue('--foreground').trim() || '0 0 0'})`;
        const muted = `rgb(${styles.getPropertyValue('--muted-foreground').trim() || '128 128 128'})`;

        let raf = 0;
        let lastBest = best;

        const loop = () => {
            const s = stateRef.current;
            ctx.clearRect(0, 0, W, H);

            // Background grid
            ctx.strokeStyle = muted;
            ctx.globalAlpha = 0.08;
            ctx.lineWidth = 1;
            const gridSize = 24;
            const offset = (s.time * s.speed) % gridSize;
            for (let x = -offset; x < W; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, H);
                ctx.stroke();
            }
            for (let y = 0; y < H; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(W, y);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;

            // Ground line
            ctx.strokeStyle = fg;
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, groundY);
            ctx.lineTo(W, groundY);
            ctx.stroke();
            ctx.globalAlpha = 1;

            if (s.running && !s.gameOver) {
                // Physics
                s.velY += gravity;
                s.playerY += s.velY;
                if (s.playerY >= 0) {
                    s.playerY = 0;
                    s.velY = 0;
                    s.onGround = true;
                }

                // Score + difficulty ramp
                s.time += 1;
                s.score = Math.floor(s.time / 6);
                s.speed = 5 + Math.min(8, s.time / 600);

                // Spawn
                s.spawnTimer -= 1;
                if (s.spawnTimer <= 0) {
                    const isBug = Math.random() < 0.25;
                    s.obstacles.push({
                        x: W,
                        width: isBug ? 26 : 14,
                        height: isBug ? 18 : 32 + Math.random() * 16,
                        type: isBug ? 'bug' : 'wall',
                    });
                    s.spawnTimer = 60 + Math.floor(Math.random() * 60);
                }

                // Move + collide
                const px1 = playerX;
                const px2 = playerX + playerW;
                const py1 = groundY - playerH + s.playerY;
                const py2 = groundY + s.playerY;

                for (const o of s.obstacles) {
                    o.x -= s.speed;
                    const ox1 = o.x;
                    const ox2 = o.x + o.width;
                    const oy1 = groundY - o.height;
                    const oy2 = groundY;
                    if (px2 > ox1 && px1 < ox2 && py2 > oy1 && py1 < oy2) {
                        s.gameOver = true;
                        s.running = false;
                        if (s.score > lastBest) {
                            lastBest = s.score;
                            try { localStorage.setItem(STORAGE_BEST, String(s.score)); } catch { /* noop */ }
                            setBest(s.score);
                        }
                        setGameOver(true);
                        setRunning(false);
                    }
                }
                s.obstacles = s.obstacles.filter(o => o.x + o.width > -10);
                setScore(s.score);
            }

            // Render obstacles
            ctx.fillStyle = fg;
            for (const o of s.obstacles) {
                if (o.type === 'wall') {
                    ctx.fillRect(o.x, groundY - o.height, o.width, o.height);
                    // Inner pattern
                    ctx.fillStyle = `rgb(var(--background))`;
                    for (let i = 4; i < o.height; i += 6) {
                        ctx.fillRect(o.x + 3, groundY - o.height + i, o.width - 6, 1);
                    }
                    ctx.fillStyle = fg;
                } else {
                    // Bug — diamond
                    const cx = o.x + o.width / 2;
                    const cy = groundY - o.height / 2;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - o.height / 2);
                    ctx.lineTo(cx + o.width / 2, cy);
                    ctx.lineTo(cx, cy + o.height / 2);
                    ctx.lineTo(cx - o.width / 2, cy);
                    ctx.closePath();
                    ctx.fill();
                    // Eye
                    ctx.fillStyle = `rgb(var(--background))`;
                    ctx.fillRect(cx - 2, cy - 1, 4, 2);
                    ctx.fillStyle = fg;
                }
            }

            // Render player — chunky pixel character
            const py = groundY - playerH + s.playerY;
            ctx.fillStyle = fg;
            // Body
            ctx.fillRect(playerX, py + 8, playerW, playerH - 8);
            // Head
            ctx.fillRect(playerX + 4, py, playerW - 8, 12);
            // Eye (glitch)
            ctx.fillStyle = `rgb(var(--background))`;
            ctx.fillRect(playerX + 16, py + 4, 4, 4);
            ctx.fillStyle = fg;
            // Legs animate
            if (s.onGround && s.running) {
                const phase = Math.floor(s.time / 6) % 2;
                if (phase === 0) {
                    ctx.fillRect(playerX + 4, groundY, 6, 2);
                    ctx.fillRect(playerX + 18, groundY - 1, 6, 1);
                } else {
                    ctx.fillRect(playerX + 4, groundY - 1, 6, 1);
                    ctx.fillRect(playerX + 18, groundY, 6, 2);
                }
            }

            raf = requestAnimationFrame(loop);
        };

        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 selection:bg-foreground/20">
            <div className="w-full max-w-3xl">
                {/* Header */}
                <div className="flex items-baseline justify-between mb-6 font-mono">
                    <div className="flex items-baseline gap-3">
                        <span className="text-7xl md:text-9xl font-bold tracking-tighter">404</span>
                        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{t('notfound.title')}</span>
                    </div>
                    <a
                        href="/"
                        className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground border-b border-border hover:border-foreground transition-colors pb-1"
                    >
                        ← {t('notfound.home')}
                    </a>
                </div>

                <p className="text-muted-foreground mb-8 max-w-md">{t('notfound.desc')}</p>

                {/* Game canvas */}
                <div
                    className="relative bg-card border border-border rounded-2xl overflow-hidden cursor-pointer select-none"
                    onClick={jump}
                    onTouchStart={(e) => { e.preventDefault(); jump(); }}
                    role="button"
                    tabIndex={0}
                    aria-label="Mini game — jump"
                >
                    <canvas ref={canvasRef} className="w-full h-[280px] block" />

                    {/* Score HUD */}
                    <div className="absolute top-3 right-4 font-mono text-xs uppercase tracking-widest text-muted-foreground flex gap-4">
                        <span>HI <span className="text-foreground font-bold">{String(best).padStart(5, '0')}</span></span>
                        <span><span className="text-foreground font-bold">{String(score).padStart(5, '0')}</span></span>
                    </div>

                    {/* Start / GameOver overlay */}
                    {!running && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[2px] pointer-events-none">
                            <div className="text-center font-mono">
                                {gameOver ? (
                                    <>
                                        <div className="text-2xl font-bold mb-2 text-foreground">// SYSTEM CRASH</div>
                                        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Score: {score}{score > 0 && score >= best ? ' — NEW BEST' : ''}</div>
                                        <div className="text-xs uppercase tracking-widest text-foreground border border-foreground/30 px-4 py-2 inline-block">Press SPACE to retry</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold mb-2 text-foreground">// READY</div>
                                        <div className="text-xs uppercase tracking-widest text-muted-foreground">Click or press SPACE to jump</div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <div className="mt-6 flex items-center justify-between text-2xs uppercase tracking-[0.25em] text-muted-foreground font-mono">
                    <span>SPACE / ↑ / TAP — JUMP</span>
                    <span>thomastp.ch</span>
                </div>
            </div>
        </div>
    );
}
