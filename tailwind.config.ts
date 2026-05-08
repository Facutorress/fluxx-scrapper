import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Fluxx brand tokens (the source of truth)
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        overlay: 'var(--overlay)',
        violet: {
          DEFAULT: 'var(--violet)',
          deep: 'var(--violet-deep)',
        },
        cyan: 'var(--cyan)',
        'green-live': 'var(--green-live)',
        'text-muted': 'var(--text-muted)',
        'text-dim': 'var(--text-dim)',
        'border-strong': 'var(--border-strong)',

        // shadcn/ui token aliases mapped to brand
        background: 'var(--bg)',
        foreground: 'var(--text)',
        card: {
          DEFAULT: 'var(--surface)',
          foreground: 'var(--text)',
        },
        popover: {
          DEFAULT: 'var(--overlay)',
          foreground: 'var(--text)',
        },
        primary: {
          DEFAULT: 'var(--violet)',
          foreground: 'var(--text)',
        },
        secondary: {
          DEFAULT: 'var(--surface)',
          foreground: 'var(--text)',
        },
        muted: {
          DEFAULT: 'var(--surface)',
          foreground: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: 'var(--overlay)',
          foreground: 'var(--text)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--text)',
        },
        border: 'var(--border)',
        input: 'var(--border)',
        ring: 'var(--violet)',
      },
      borderRadius: {
        DEFAULT: '0',
        none: '0',
        sm: '2px',
        md: '2px',
        lg: '4px',
        xl: '4px',
      },
      fontFamily: {
        display: ['var(--font-anton)', 'sans-serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.035em',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'pulse-live': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-live': 'pulse-live 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
