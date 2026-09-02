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
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      },
      boxShadow: {
        'neumorph-light': '6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)',
        'neumorph-dark': '6px 6px 16px rgba(0, 0, 0, 0.4), -4px -4px 12px rgba(30, 41, 59, 0.3)',
      },
    },
  },
  plugins: [],
};