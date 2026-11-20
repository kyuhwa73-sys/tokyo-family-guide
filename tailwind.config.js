/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', '"Noto Sans KR"', 'sans-serif'],
        serif: ['"Noto Serif KR"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f2f7f5',
          100: '#e0ede8',
          200: '#c3dcd3',
          300: '#9ac3b6',
          400: '#6ea394',
          500: '#4d8778',
          600: '#396b5f',
          700: '#2e564d',
          800: '#194c43',
          900: '#133933',
          950: '#0b221e',
        },
        gold: {
          50: '#fbf8f1',
          100: '#f5eedb',
          200: '#eadab6',
          300: '#dcc089',
          400: '#cea25d',
          500: '#c38b3f',
          600: '#b27233',
          700: '#94582c',
          800: '#794729',
          900: '#643c24',
        }
      }
    },
  },
  plugins: [],
};
