import type { Config } from 'tailwindcss';

// Sistema de diseño Atlas — ver plan §14
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        atlas: {
          yellow: '#E5F000',
          'yellow-pure': '#FFE600',
          black: '#0A0A0A',
          ink: '#171717',
          white: '#FFFFFF',
          coral: '#F06A6A',
          'coral-hover': '#E45555',
          lime: '#7DDE1F',
          success: '#2E9D5C',
          danger: '#E5484D',
        },
      },
      fontFamily: {
        display: ['"Archivo Black"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'atlas-gradient': 'linear-gradient(135deg, #E6378C, #F77F2E, #FFE600)',
        'atlas-ring':
          'conic-gradient(from 180deg, #E6378C, #F77F2E, #FFE600, #E6378C)',
      },
      boxShadow: {
        'atlas-glow': '0 0 40px rgba(229, 240, 0, 0.3)',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
