import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, invalidate } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { useTheme } from '@/components/ui/theme-provider';

function ParticleNetwork({ paused, ...props }: { paused?: boolean } & Record<string, unknown>) {
  const ref = useRef<import('three').Points>(null);
  const { theme } = useTheme();

  // Safely resolve the actual displayed theme
  const isDark = useMemo(() => {
    if (typeof document === 'undefined') return false;
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return theme === 'dark' || (theme === 'system' && isSystemDark);
  }, [theme]);

  // Create random points once
  const positions = useMemo(() => {
    const count = 3000;
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 10;
      p[i * 3 + 1] = (Math.random() - 0.5) * 10;
      p[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return p;
  }, []);

  // Manual mouse tracking since Canvas has pointer-events: none
  const mouse = useRef({ x: 0, y: 0 });
  const smoothedMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    if (paused || !ref.current) return;
    // Lerp mouse position for smooth transitions
    smoothedMouse.current.x += (mouse.current.x - smoothedMouse.current.x) * delta * 2;
    smoothedMouse.current.y += (mouse.current.y - smoothedMouse.current.y) * delta * 2;

    // Base rotation (slower) + smoothed mouse influence (less reactive)
    ref.current.rotation.x -= delta / 30 + smoothedMouse.current.y * delta * 0.15;
    ref.current.rotation.y -= delta / 40 - smoothedMouse.current.x * delta * 0.15;
    invalidate(); // request next frame
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color={isDark ? '#4ade80' : '#000000'}
          size={0.02}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={isDark ? 0.6 : 1}
        />
      </Points>
    </group>
  );
}

export function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-x-0 top-0 h-[150vh] z-[-1] pointer-events-none flex items-center justify-center overflow-hidden hero3d-fade"
      style={{
        maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 1] }}
        frameloop="demand"
        className="!h-full !w-full"
        onCreated={() => {
          // Fade in only after Three.js canvas is ready
          containerRef.current?.classList.add('hero3d-ready');
        }}
      >
        <ParticleNetwork paused={!visible} />
      </Canvas>
    </div>
  );
}
