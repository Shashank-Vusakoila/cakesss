import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF6B2C',
          red: '#E84040',
          amber: '#FF9A3C',
          cream: '#FFF8F0',
          dark: '#1A0A00',
          primary: '#FF6B2C',
          'primary-hover': '#E84040',
          background: '#FAFAF8',
          card: '#FFFFFF',
          border: '#E9E9EB',
          'text-dark': '#1A0A00',
          'text-light': '#7E808C',
          success: '#22c55e',
          error: '#ef4444',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #FF6B2C 0%, #E84040 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)',
      },
      boxShadow: {
        'card': '0 8px 30px rgba(0,0,0,0.04)',
        'card-hover': '0 20px 40px rgba(255,107,44,0.15)',
        'orange': '0 10px 30px rgba(255,107,44,0.3)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite linear',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
export default config
