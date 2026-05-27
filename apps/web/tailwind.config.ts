import type { Config } from 'tailwindcss';

// Sistema de diseño Atlas — ver plan §14
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        atlas: {
          yellow: '#DFFF00',
          'yellow-pure': '#DFFF00',
          black: '#000000',
          ink: '#141414',
          white: '#FFFFFF',
          coral: '#FF007F',
          'coral-hover': '#D60070',
          lime: '#7DDE1F',
          success: '#2E9D5C',
          danger: '#E5484D',
        },
      },
      fontFamily: {
        display: ['"Oswald"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'atlas-gradient': 'linear-gradient(135deg, #E6378C, #F77F2E, #DAD803)',
        'atlas-ring':
          'conic-gradient(from 180deg, #E6378C, #F77F2E, #DAD803, #E6378C)',
      },
      boxShadow: {
        'atlas-glow': '0 0 40px rgba(218, 216, 3, 0.3)',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        marquee: 'marquee 28s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
