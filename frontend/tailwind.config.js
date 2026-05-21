/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // True gray design system (no blue undertones)
        brand: {
          bg: '#09090B',
          surface: '#111113',
          'surface-hover': '#18181B',
          elevated: '#1C1C1F',
          border: '#27272A',
          'border-subtle': '#1E1E21',
          'border-hover': '#3F3F46',
          text: '#FAFAFA',
          'text-secondary': '#A1A1AA',
          'text-tertiary': '#71717A',
          'text-ghost': '#52525B',
        },
        accent: {
          DEFAULT: '#10B981',
          hover: '#059669',
          muted: 'rgba(16, 185, 129, 0.1)',
        },
        // Keep primary/dark for backward compatibility with existing page files
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8B5CF6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
