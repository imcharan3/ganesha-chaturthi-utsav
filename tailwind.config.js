/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#fff8f0',
          100: '#ffeed9',
          200: '#fed8b1',
          300: '#fdbd7f',
          400: '#fb9b48',
          500: '#f97e1e', // primary bright saffron
          600: '#ea6212',
          700: '#c2480e',
          800: '#9b3913',
          900: '#7d3013',
          950: '#441607',
        },
        marigold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        crimson: {
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        temple: {
          dark: '#1a0b06',
          card: '#29120a',
          gold: '#ffd700',
          border: '#692b15',
        }
      },
      fontFamily: {
        devotional: ['Cinzel Decorative', 'Cinzel', 'Georgia', 'serif'],
        telugu: ['Noto Sans Telugu', 'sans-serif'],
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'divine': '0 10px 30px -5px rgba(249, 126, 30, 0.3), 0 0 20px 2px rgba(255, 215, 0, 0.2)',
        'gold': '0 0 15px rgba(255, 215, 0, 0.4)',
        'diya': '0 0 25px 5px rgba(251, 155, 72, 0.45)',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(0.96) translateY(-2px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(249, 126, 30, 0.4)' },
          '50%': { boxShadow: '0 0 28px rgba(255, 215, 0, 0.7)' },
        }
      },
      animation: {
        flicker: 'flicker 2s infinite ease-in-out',
        float: 'float 3.5s ease-in-out infinite',
        glow: 'pulseGlow 2.5s infinite',
      }
    },
  },
  plugins: [],
}
