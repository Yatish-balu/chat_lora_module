import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7C3AED',
          50: '#F5F0FF',
          100: '#EDE0FF',
          200: '#D4B8FF',
          300: '#BB90FF',
          400: '#9B60FF',
          500: '#7C3AED',
          600: '#6027CC',
          700: '#4A1FAB',
          800: '#36178A',
          900: '#240F69',
        },
        secondary: {
          DEFAULT: '#A855F7',
          500: '#A855F7',
          600: '#9333EA',
        },
        accent: {
          DEFAULT: '#00E5FF',
          500: '#00E5FF',
          600: '#00B8D9',
        },
        bg: {
          DEFAULT: '#0B1020',
          surface: '#111827',
          card: '#1F2937',
          elevated: '#243044',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
        'gradient-accent': 'linear-gradient(135deg, #00E5FF 0%, #7C3AED 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0B1020 0%, #1a0533 100%)',
        'gradient-card': 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
      },
      boxShadow: {
        'neon-primary': '0 0 20px rgba(124, 58, 237, 0.5)',
        'neon-accent': '0 0 20px rgba(0, 229, 255, 0.5)',
        'neon-sm': '0 0 10px rgba(124, 58, 237, 0.3)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          from: { boxShadow: '0 0 10px rgba(124, 58, 237, 0.3)' },
          to: { boxShadow: '0 0 25px rgba(124, 58, 237, 0.7), 0 0 50px rgba(124, 58, 237, 0.3)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
