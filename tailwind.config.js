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
        // "Safari Luxe" — a calm, desaturated travel palette. Muted sage-pine
        // primary (not neon, not electric-cyan) so CTAs read premium & grounded.
        // Because the app used Tailwind's built-in `teal-*` ~275 times, we
        // OVERRIDE that built-in scale here so every site updates at once.
        teal: {
          50: '#f1f8f5',
          100: '#dceee6',
          200: '#bbdcd0',
          300: '#8fc2b2',
          400: '#5fa494',
          500: '#3f8576',
          600: '#346c60',
          700: '#2c5750',
          800: '#274842',
          900: '#223d38',
          950: '#12211d',
        },
        brand: {
          50: '#f1f8f5',
          100: '#dceee6',
          200: '#bbdcd0',
          300: '#8fc2b2',
          400: '#5fa494',
          500: '#3f8576',
          600: '#346c60',
          700: '#2c5750',
          800: '#274842',
          900: '#223d38',
          950: '#12211d',
        },
        // Champagne / brass gold — a soft, muted luxury secondary for price
        // badges, ratings and tiny warm highlights. Kept low-saturation so it
        // complements rather than competes with the sage primary.
        warm: {
          50: '#fbf9f4',
          100: '#f5f0e2',
          200: '#e9dfc1',
          300: '#d8c698',
          400: '#c7aa71',
          500: '#b99454',
          600: '#a07842',
          700: '#826138',
          800: '#69512f',
          900: '#574428',
          950: '#302316',
        },
        // Muted slate-mist accent — a soft blue-grey reserved for rare, subtle
        // secondary touches. Replaces the old plum & the loud blue, keeping the
        // overall feel calm and "travel-magazine" understated.
        accent: {
          50: '#f6f8f9',
          100: '#eaeef1',
          200: '#d2dce2',
          300: '#aec4cd',
          400: '#83a3b0',
          500: '#668a98',
          600: '#53717f',
          700: '#465d68',
          800: '#3e4f58',
          900: '#36434b',
          950: '#222c31',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #2c5750 0%, #3f8576 45%, #346c60 100%)',
        'brand-soft': 'linear-gradient(135deg, rgba(63,133,118,0.12) 0%, rgba(52,108,96,0.05) 100%)',
        'gold-gradient': 'linear-gradient(135deg, #a07842 0%, #c7aa71 50%, #d8c698 100%)',
        'accent-glow':
          'radial-gradient(60% 80% at 30% 20%, rgba(102,138,152,0.16) 0%, rgba(63,133,118,0.10) 50%, rgba(255,255,255,0) 100%)',
        'warm-glow':
          'radial-gradient(50% 70% at 80% 30%, rgba(185,148,84,0.12) 0%, rgba(255,255,255,0) 70%)',
      },
      boxShadow: {
        'neumorph-light': '6px 6px 14px rgba(120, 110, 90, 0.07), -6px -6px 14px rgba(255, 255, 255, 0.9)',
        'neumorph-dark': '6px 6px 16px rgba(0, 0, 0, 0.45), -4px -4px 12px rgba(70, 64, 54, 0.2)',
        'brand-glow': '0 12px 34px -10px rgba(63, 133, 118, 0.4)',
        'accent-glow': '0 12px 34px -12px rgba(102, 138, 152, 0.4)',
        'gold-glow': '0 12px 34px -12px rgba(185, 148, 84, 0.4)',
        'soft-lift': '0 16px 40px -18px rgba(20, 14, 8, 0.35)',
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