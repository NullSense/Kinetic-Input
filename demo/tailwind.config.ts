import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Core palette from DESIGN_SYSTEM_V2.4.md
        bg: '#0A0B0D',
        fg: '#E7EDF2',
        muted: '#9DB1BE',
        hairline: '#15181B',

        // Brand colors
        accent: '#3EDCFF',
        secondary: '#8E77B5',

        // Semantic
        success: '#31E889',
        danger: '#E03E3E',
        warning: '#FFB84D',

        // Workflow states
        pending: '#FFB84D',
        complete: '#4ADE80',
      },
      fontFamily: {
        display: ['Anta', 'sans-serif'],
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      spacing: {
        '1x': '8px',
        '2x': '16px',
        '3x': '24px',
        '4x': '32px',
        '6x': '48px',
        '8x': '64px',
      },
      animation: {
        // Cyber-Editorial Brutalism: subtle, precise
        'fade-in': 'fadeIn 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 200ms cubic-bezier(0, 0, 0.2, 1)',
        'scale-in': 'scaleIn 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionDuration: {
        instant: '100ms',
        fast: '200ms',
        medium: '300ms',
        slow: '500ms',
      },
      zIndex: {
        base: '0',
        dropdown: '50',
        modal: '60',
        drawer: '65',
        dialog: '70',
        toast: '80',
      },
    },
  },
  plugins: [],
};

export default config;
