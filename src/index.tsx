import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@unocss/reset/tailwind-v4.css';
import './i18n';

// THREE.Clock was deprecated in Three.js r170 in favour of THREE.Timer.
// @react-three/fiber still uses Clock internally (upstream issue).
// Suppress until R3F ships the fix.
const _consoleWarn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('Clock') && args[0].includes('deprecated'))
    return;
  _consoleWarn(...args);
};
import './globals.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
