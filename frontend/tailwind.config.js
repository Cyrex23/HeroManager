/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-deep': '#0a0a1a',
        'bg-dark': '#0f0f23',
        'bg-card': '#1a1a2e',
        'border-subtle': '#16213e',
        accent: {
          DEFAULT: '#e94560',
          dark: '#c73852',
          light: '#f05a73',
        },
        gold: '#fbbf24',
        diamond: '#60a5fa',
        'hero-purple': '#a78bfa',
        success: '#4ade80',
        'hero-orange': '#f97316',
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'gold-shimmer': 'goldShimmer 3s linear infinite',
        'diamond-shimmer': 'diamondShimmer 3s linear infinite',
        'float': 'float 4s ease-in-out infinite',
        'logo-glow': 'logoGlow 2.5s ease-in-out infinite',
        'shimmer-sweep': 'shimmerSweep 0.6s ease forwards',
        'fade-in-up': 'fadeInUp 0.4s ease forwards',
        'legendary-pulse': 'legendaryPulse 3s ease-in-out infinite',
        'elite-pulse': 'elitePulse 3s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(233,69,96,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(233,69,96,0.7)' },
        },
        goldShimmer: {
          from: { backgroundPosition: '0% center' },
          to: { backgroundPosition: '200% center' },
        },
        diamondShimmer: {
          from: { backgroundPosition: '0% center' },
          to: { backgroundPosition: '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        logoGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 6px rgba(233,69,96,0.6))' },
          '50%': { filter: 'drop-shadow(0 0 20px rgba(233,69,96,1)) drop-shadow(0 0 40px rgba(249,115,22,0.5))' },
        },
        shimmerSweep: {
          from: { transform: 'translateX(-100%) skewX(-15deg)' },
          to: { transform: 'translateX(300%) skewX(-15deg)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        legendaryPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(249,115,22,0.4), 0 0 0 1px rgba(249,115,22,0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(249,115,22,0.8), 0 0 0 1px rgba(249,115,22,0.5)' },
        },
        elitePulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(167,139,250,0.4), 0 0 0 1px rgba(167,139,250,0.2)' },
          '50%': { boxShadow: '0 0 16px rgba(167,139,250,0.8), 0 0 0 1px rgba(167,139,250,0.4)' },
        },
      },
    },
  },
  plugins: [],
};
