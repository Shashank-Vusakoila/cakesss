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
          orange: '#FC8019',
          red: '#E46D47',
          amber: '#FF9A3C',
          cream: '#FFFFFF',
          dark: '#02060C',
          primary: '#FC8019',
          'primary-hover': '#E86E0D',
          background: '#F0F2F5',
          card: '#FFFFFF',
          border: '#E9E9EB',
          'text-dark': '#02060C',
          'text-light': '#686B78',
          success: '#118C4F',
          error: '#FF5252',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #FC8019 0%, #FF9A3C 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
      },
      boxShadow: {
        'card': '0 2px 12px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.08)',
        'orange': '0 4px 14px rgba(252,128,25,0.25)',
        'glass': '0 8px 32px 0 rgba(0,0,0,0.05)',
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
