import type { UserConfig } from '@unocss/core';
import { presetWind } from '@unocss/preset-wind';

export default {
  content: {
    filesystem: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  },
  presets: [
    presetWind({
      dark: 'class',
    }),
  ],
  theme: {
    colors: {
      background: 'rgb(var(--background) / <alpha-value>)',
      foreground: 'rgb(var(--foreground) / <alpha-value>)',
      card: {
        DEFAULT: 'rgb(var(--card) / <alpha-value>)',
        foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
      },
      popover: {
        DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
        foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
      },
      primary: {
        DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
        foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
      },
      secondary: {
        DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
        foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
      },
      muted: {
        DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
        foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
      },
      accent: {
        DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
        foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
      },
      destructive: {
        DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
        foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
      },
      border: 'rgb(var(--border) / <alpha-value>)',
      input: 'rgb(var(--input) / <alpha-value>)',
      ring: 'rgb(var(--ring) / <alpha-value>)',
    },
    borderRadius: {
      // Single knob: --radius drives the whole scale (shadcn-style derivation).
      DEFAULT: 'var(--radius)',
      sm: 'calc(var(--radius) - 4px)',
      md: 'calc(var(--radius) - 2px)',
      lg: 'var(--radius)',
      xl: 'calc(var(--radius) + 4px)',
    },
    fontSize: {
      // Sub-12px micro scale (presetWind starts at text-xs = 12px). Prefer these
      // tokens over one-off text-[8px]/text-[10px] arbitrary values.
      '3xs': ['0.5rem', '0.75rem'], // 8px
      '2xs': ['0.625rem', '0.875rem'], // 10px
    },
    fontFamily: {
      // Body/UI = Inter (--font-body); display/brand = Bruno Ace (--font-main).
      // Headings stay on Bruno Ace via the h1–h6 rule in globals.css.
      sans: 'var(--font-body)',
      display: 'var(--font-main)',
    },
  },
  shortcuts: {
    // `glass` is defined in globals.css (.glass) so it can ship an explicit
    // -webkit-backdrop-filter for Safari. Keep only derivable shortcuts here.
    'text-gradient':
      'bg-clip-text text-transparent bg-gradient-to-br from-black via-black/80 to-black/40 dark:from-white dark:via-white/80 dark:to-white/40',
  },
} satisfies UserConfig;
