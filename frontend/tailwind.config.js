/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff', 100: '#dae5ff', 200: '#bdd0ff', 300: '#90b0ff',
          400: '#5c85fc', 500: '#375ff5', 600: '#213fea', 700: '#1a2fd7',
          800: '#1c29ae', 900: '#1c2a89', 950: '#151b53',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '33%': { transform: 'translate3d(6%, -8%, 0) scale(1.08)' },
          '66%': { transform: 'translate3d(-5%, 6%, 0) scale(0.94)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-38px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 currentColor' },
          '50%': { opacity: '0.55', boxShadow: '0 0 12px 3px currentColor' },
        },
        // --- sign-in screen ---
        'float-card': {
          '0%, 100%': { transform: 'translateY(-6px)' },
          '50%': { transform: 'translateY(6px)' },
        },
        'card-in': {
          from: { opacity: '0', transform: 'scale(.95) translateY(12px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '15%, 55%': { transform: 'translateX(-9px)' },
          '35%, 75%': { transform: 'translateX(9px)' },
          '90%': { transform: 'translateX(-3px)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(.6)' },
          '70%': { opacity: '1', transform: 'scale(1.08)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        drift: 'drift 24s ease-in-out infinite',
        float: 'float 16s ease-in-out infinite',
        'float-slow': 'float-slow 7s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        // `both` holds the from-state, so staggered items stay hidden until
        // their delay elapses instead of flashing in first.
        'float-card': 'float-card 7s ease-in-out infinite',
        'card-in': 'card-in 620ms cubic-bezier(.16,1,.3,1) both',
        rise: 'rise 520ms cubic-bezier(.16,1,.3,1) both',
        'fade-in': 'fade-in 900ms ease-out both',
        shake: 'shake 480ms cubic-bezier(.36,.07,.19,.97)',
        'pop-in': 'pop-in 380ms cubic-bezier(.16,1,.3,1) both',
      },
    },
  },
  plugins: [],
};
