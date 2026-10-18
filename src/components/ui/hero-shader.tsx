import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/ui/theme-provider';

// A single full-screen quad needs no scene graph. Keep the exact original
// fragment shader and mouse interpolation, while avoiding a full 3D engine.
const vertexShader = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
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

export function HeroShader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contextVersion, setContextVersion] = useState(0);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!gl) return; // The existing CSS background remains available without WebGL.

    const shaders: WebGLShader[] = [];
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vertex = compile(gl.VERTEX_SHADER, vertexShader);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentShader);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) {
      shaders.forEach(shader => gl.deleteShader(shader));
      if (program) gl.deleteProgram(program);
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      shaders.forEach(shader => gl.deleteShader(shader));
      gl.deleteProgram(program);
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const timeUniform = gl.getUniformLocation(program, 'uTime');
    const mouseUniform = gl.getUniformLocation(program, 'uMouse');
    const resolutionUniform = gl.getUniformLocation(program, 'uResolution');
    const darkUniform = gl.getUniformLocation(program, 'uIsDark');
    const systemDark = matchMedia('(prefers-color-scheme: dark)');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true;
    let lost = false;
    let frame = 0;
    let lastTime = 0;
    let elapsed = 0;
    const target = { x: 0.5, y: 0.5 };
    const current = { ...target };

    const paint = (now: number) => {
      frame = 0;
      if (lost || !visible || document.hidden) {
        lastTime = 0;
        return;
      }
      const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 0;
      lastTime = now;
      if (!reducedMotion.matches) elapsed += delta;
      current.x += (target.x - current.x) * Math.min(1, delta * 6);
      current.y += (target.y - current.y) * Math.min(1, delta * 6);
      gl.uniform1f(timeUniform, elapsed);
      gl.uniform2f(mouseUniform, current.x, current.y);
      gl.uniform1f(
        darkUniform,
        theme === 'dark' || (theme !== 'light' && systemDark.matches) ? 1 : 0
      );
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!reducedMotion.matches) frame = requestAnimationFrame(paint);
    };
    const schedule = () => {
      if (!frame && !lost && visible && !document.hidden) frame = requestAnimationFrame(paint);
    };
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      const ratio = Math.min(Math.max(devicePixelRatio || 1, 1), 1.5);
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolutionUniform, width, height);
      schedule();
    };
    const onMove = (event: MouseEvent) => {
      target.x = event.clientX / innerWidth;
      target.y = 1 - event.clientY / innerHeight;
      schedule();
    };
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
      } else schedule();
    };
    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(frame);
      frame = 0;
      container.classList.remove('hero3d-ready');
    };
    const onRestored = () => setContextVersion(version => version + 1);
    const resizeObserver = new ResizeObserver(resize);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
      }
    });
    resizeObserver.observe(container);
    visibilityObserver.observe(container);
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    systemDark.addEventListener('change', schedule);
    reducedMotion.addEventListener('change', schedule);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    resize();
    container.classList.add('hero3d-ready');
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
      systemDark.removeEventListener('change', schedule);
      reducedMotion.removeEventListener('change', schedule);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      shaders.forEach(shader => gl.deleteShader(shader));
    };
  }, [theme, contextVersion]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-[150vh] z-[-1] pointer-events-none flex items-center justify-center overflow-hidden hero3d-fade"
      style={{
        maskImage: 'linear-gradient(to bottom, black 0%, black 55%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 55%, transparent 100%)',
      }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
