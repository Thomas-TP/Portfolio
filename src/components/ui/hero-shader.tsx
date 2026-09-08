import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useTheme } from '@/components/ui/theme-provider';

/**
 * Mouse-reactive liquid blueprint shader.
 * Renders a full-screen quad through an orthographic camera. Vertex shader
 * is trivial; the fragment uses layered simplex noise distorted toward the
 * mouse to create a flowing iso-line pattern. Theme-aware.
 */

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2  uMouse;
uniform vec2  uResolution;
uniform float uIsDark;
varying vec2  vUv;

// — Ashima simplex 2D noise — public domain
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);

  // Aspect-correct coordinates so the mouse halo stays a circle
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
  vec2 m = vec2((uMouse.x - 0.5) * aspect, uMouse.y - 0.5);

  // Mouse pull — strong + reactive locally, falls off quickly so the rest stays calm
  float d = distance(p, m);
  float pull = exp(-d * 2.6) * 0.50;
  vec2 distortion = (m - p) * pull;

  // Layered noise — VERY slow ambient drift, almost meditative.
  // p * 1.8 keeps the original "tighter, more detailed" pattern density.
  vec2 q = p * 1.8 + distortion;
  float n1 = snoise(q + uTime * 0.010);
  float n2 = snoise(q * 2.3 - uTime * 0.015);
  float n  = n1 * 0.7 + n2 * 0.3;

  // Iso-line bands — denser than before so the pattern feels less "zoomed in"
  float bandFreq = 4.5;
  float band = abs(fract(n * bandFreq) - 0.5);
  float lineWidth = 0.05;
  float lines = 1.0 - smoothstep(0.0, lineWidth, band);

  // Mouse halo — concentrated near cursor for clear hover reactivity
  float halo = exp(-d * 2.4);

  vec3 col;
  if (uIsDark > 0.5) {
    // Near-black base + clean WHITE bands + WHITE halo (no color tint)
    vec3 base = vec3(0.020, 0.020, 0.027);
    vec3 lineCol = vec3(1.0) * 0.16;
    vec3 haloCol = vec3(1.0) * 0.18;
    col = base + lineCol * lines + haloCol * halo;
  } else {
    // Off-white base + BLACK bands + faint dark halo (no color tint)
    vec3 base = vec3(0.992, 0.992, 0.996);
    col = base - vec3(lines) * 0.10 - vec3(halo) * 0.06;
  }

  // Very subtle film grain — kills banding without adding noise
  float grain = (fract(sin(dot(uv * uResolution, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.012;
  col += vec3(grain);

  gl_FragColor = vec4(col, 1.0);
}
`;

function ShaderQuad({ paused, isDark }: { paused: boolean; isDark: boolean }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size, invalidate } = useThree();

  // Smoothed mouse target — lerps each frame for that liquid feel
  const target = useRef({ x: 0.5, y: 0.5 });
  const current = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX / window.innerWidth;
      // Flip Y so 0 is top in CSS, matching shader uv convention
      target.current.y = 1 - e.clientY / window.innerHeight;
      invalidate();
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [invalidate]);

  // Update isDark uniform when theme changes
  useEffect(() => {
    if (matRef.current) {
      (matRef.current.uniforms.uIsDark.value as number) = isDark ? 1 : 0;
      invalidate();
    }
  }, [isDark, invalidate]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uIsDark: { value: isDark ? 1 : 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
    invalidate();
  }, [size, uniforms, invalidate]);

  useFrame((_, delta) => {
    if (paused || !matRef.current) return;
    // Lerp toward the target mouse — snappy follow so the halo reacts crisply
    // to motion. Ambient drift stays slow (controlled in the shader by uTime),
    // so the contrast between still-cursor and moving-cursor feels alive.
    current.current.x += (target.current.x - current.current.x) * Math.min(1, delta * 6);
    current.current.y += (target.current.y - current.current.y) * Math.min(1, delta * 6);

    uniforms.uMouse.value.set(current.current.x, current.current.y);
    uniforms.uTime.value += delta;
    invalidate();
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export function HeroShader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const { theme } = useTheme();

  const isDark = useMemo(() => {
    if (typeof document === 'undefined') return false;
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, [theme]);

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
        maskImage: 'linear-gradient(to bottom, black 0%, black 55%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 55%, transparent 100%)',
      }}
    >
      <Canvas
        orthographic
        camera={{ position: [0, 0, 1], near: 0, far: 1, zoom: 1 }}
        frameloop="demand"
        className="!h-full !w-full"
        dpr={[1, 1.5]}
        onCreated={() => {
          containerRef.current?.classList.add('hero3d-ready');
        }}
      >
        <ShaderQuad paused={!visible} isDark={isDark} />
      </Canvas>
    </div>
  );
}
