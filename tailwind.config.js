/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './public/**/*.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#ecfdfb',
          100: '#d1faf5',
          200: '#a7f3eb',
          300: '#6ee7df',
          400: '#34d3c7',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        // Premium violet accent — reserved for gradients, glows & "special" highlights
        accent: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Warm amber — the "human" accent for CTA warmth, tags & hand-made details
        warm: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #0d9488 0%, #14b8a6 45%, #10b981 100%)',
        'brand-soft': 'linear-gradient(135deg, rgba(20,184,166,0.12) 0%, rgba(16,185,129,0.06) 100%)',
        'accent-glow':
          'radial-gradient(60% 80% at 30% 20%, rgba(99,102,241,0.28) 0%, rgba(20,184,166,0.14) 50%, rgba(255,255,255,0) 100%)',
        'warm-glow':
          'radial-gradient(50% 70% at 80% 30%, rgba(245,158,11,0.16) 0%, rgba(255,255,255,0) 70%)',
      },
      boxShadow: {
        'neumorph-light': '6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)',
        'neumorph-dark': '6px 6px 16px rgba(0, 0, 0, 0.4), -4px -4px 12px rgba(30, 41, 59, 0.3)',
        'brand-glow': '0 12px 34px -10px rgba(20, 184, 166, 0.55)',
        'accent-glow': '0 12px 34px -12px rgba(99, 102, 241, 0.55)',
        'soft-lift': '0 16px 40px -18px rgba(2, 6, 23, 0.35)',
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-240% 0' },
          '100%': { backgroundPosition: '240% 0' },
        },
      },
      animation: {
        'float-slow': 'float-slow 7s ease-in-out infinite',
        shimmer: 'shimmer 2.6s linear infinite',
      },
      maxWidth: {
        app: '68rem',
      },
    },
  },
  plugins: [],
};