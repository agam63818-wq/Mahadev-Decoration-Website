import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand color tokens — exact values from spec
        'bg-void': '#0A0710',
        'bg-purple': '#1A0B2E',
        'bg-burgundy': '#3D0F24',
        gold: '#D4AF37',
        'gold-light': '#F0C868',
        champagne: '#F5E6C8',
        amber: '#E8A33D',
        emerald: '#145A32',
        'floral-red': '#8B1E3F',
        'text-primary': '#F5F0E8',
        'text-muted': '#B8A9C9',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        devanagari: ['var(--font-devanagari)', 'serif'],
      },
      backgroundImage: {
        'gradient-void-purple': 'linear-gradient(135deg, #0A0710 0%, #1A0B2E 50%, #3D0F24 100%)',
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #F0C868 50%, #D4AF37 100%)',
        'gradient-champagne-gold': 'linear-gradient(135deg, #F5E6C8 0%, #D4AF37 100%)',
        'gradient-radial-purple': 'radial-gradient(ellipse at center, #1A0B2E 0%, #0A0710 70%)',
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(212, 175, 55, 0.3), 0 0 40px rgba(212, 175, 55, 0.1)',
        'gold-glow-sm': '0 0 10px rgba(212, 175, 55, 0.2)',
        'card-lift': '0 20px 60px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'marquee': 'marquee 30s linear infinite',
        'marquee-pause': 'marquee 30s linear infinite paused',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(212, 175, 55, 0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(212, 175, 55, 0.5)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionTimingFunction: {
        'ease-luxury': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [],
}

export default config
