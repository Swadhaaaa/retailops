/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brandNavy: '#0F1B4C',
        brandDarkNavy: '#091339',
        brandRed: '#E31837',
        brandGold: '#F5A623',
        brandMuted: '#8B9CC7',
        brandBg: '#F8F9FC',
      },
      fontFamily: {
        dmSans: ['"DM Sans"', 'sans-serif'],
        sora: ['"Sora"', 'sans-serif'],
      },
      keyframes: {
        'slide-up-fade': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.7)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'draw-check': {
          '0%': { strokeDasharray: '200', strokeDashoffset: '200' },
          '100%': { strokeDasharray: '200', strokeDashoffset: '0' },
        },
        'fill-progress': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        'blob-expand': {
          '0%': { transform: 'scale(0)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'spin-custom': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'float-ring-1': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
        'float-ring-2': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(15px) rotate(-3deg)' },
        },
        'dot-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
      animation: {
        'slide-up-fade': 'slide-up-fade 0.5s ease-out both',
        'scale-in': 'scale-in 0.4s ease-out both',
        'draw-check': 'draw-check 0.6s ease-out 0.3s both',
        'fill-progress': 'fill-progress 2s ease-in-out both',
        'blob-expand': 'blob-expand 1.5s ease-in-out both',
        'spin-custom': 'spin-custom 1s linear infinite',
        'float-ring-1': 'float-ring-1 8s ease-in-out infinite',
        'float-ring-2': 'float-ring-2 10s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}