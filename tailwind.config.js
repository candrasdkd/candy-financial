/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        sage: {
          50: '#f4f7f4',
          100: '#e6ede6',
          200: '#cddcce',
          300: '#a8c2aa',
          400: '#7da180',
          500: '#5a845d',
          600: '#466949',
          700: '#39543c',
          800: '#2f4431',
          900: '#27392a',
        },
        cream: {
          50: '#fdfbf7',
          100: '#f9f4eb',
          200: '#f2e8d4',
          300: '#e8d5b4',
          400: '#dabb8c',
          500: '#cda06a',
          600: '#b8855a',
          700: '#9a6d4c',
          800: '#7d5840',
          900: '#664838',
        },
        rose: {
          50: '#fdf2f4',
          100: '#fce7ea',
          200: '#f9d0d7',
          300: '#f4aab7',
          400: '#ec7a90',
          500: '#e14f6c',
          600: '#cd3055',
          700: '#ac2245',
          800: '#901f3d',
          900: '#7b1e39',
        }
      },
      animation: {
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
