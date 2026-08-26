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
        // Deep background noir tones
        'bg-void':        '#07040C',
        'bg-void-2':      '#0D0815',
        'bg-rich':        '#11081F',
        'bg-purple':      '#1A0B2E',
        'bg-burgundy':    '#2D0B1C',
        'bg-deep-red':    '#3A0F24',

        // Refined gold family
        gold:             '#C9A84C',
        'gold-warm':      '#D4AF37',
        'gold-bright':    '#E8C858',
        'gold-light':     '#F0C868',
        'gold-muted':     '#8A7028',
        'gold-dim':       '#5A4A15',

        // Warm accent tones
        champagne:        '#F5E8D0',
        ivory:            '#FDF8F0',
        amber:            '#E8A33D',
        emerald:          '#1A6B4A',
        'floral-red':     '#8B1E3F',
        rose:             '#E8A0B4',

        // Text
        'text-primary':   '#F8F3EC',
        'text-muted':     '#B0A0C5',
        'text-dim':       '#7B6B8A',
      },
      fontFamily: {
        display:   ['var(--font-display)', 'serif'],
        body:      ['var(--font-body)', 'sans-serif'],
        devanagari: ['var(--font-devanagari)', 'serif'],
      },
      backgroundImage: {
        'gradient-gold-warm':    'linear-gradient(135deg, #D4AF37 0%, #C9A84C 50%, #E8C858 100%)',
        'gradient-gold-bright':  'linear-gradient(135deg, #F5E8D0 0%, #C9A84C 40%, #E8C858 70%, #F5E8D0 100%)',
        'gradient-champagne':    'linear-gradient(135deg, #F5E8D0 0%, #D4AF37 50%, #F5E8D0 100%)',
        'gradient-void-purple':  'linear-gradient(135deg, #07040C 0%, #1A0B2E 50%, #2D0B1C 100%)',
        'gradient-deep':         'linear-gradient(135deg, #0D0815 0%, #1A0B2E 40%, #3A0F24 100%)',
        'gradient-radial-purple': 'radial-gradient(ellipse at center, #1A0B2E 0%, #07040C 70%)',
      },
      boxShadow: {
        'gold-glow':     '0 0 20px rgba(201, 168, 76, 0.3), 0 0 40px rgba(201, 168, 76, 0.1)',
        'gold-glow-sm':  '0 0 10px rgba(201, 168, 76, 0.2)',
        'gold-glow-lg':  '0 0 30px rgba(201, 168, 76, 0.25), 0 0 50px rgba(201, 168, 76, 0.1)',
        'card-lift':     '0 12px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.08)',
        'card-lift-lg':  '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.12)',
        'emerald-glow':  '0 0 20px rgba(18, 140, 126, 0.2), 0 0 40px rgba(18, 140, 126, 0.1)',
        'rose-glow':     '0 0 15px rgba(232, 160, 180, 0.2)',
      },
      animation: {
        'float-slow':     'float 8s ease-in-out infinite',
        'float-medium':   'float 6s ease-in-out infinite',
        'pulse-gold':     'pulseGold 2.5s ease-in-out infinite',
        'pulse-subtle':   'pulseSubtle 3s ease-in-out infinite',
        'marquee':        'marquee 30s linear infinite',
        'marquee-pause':  'marquee 30s linear infinite paused',
        'fade-in-up':     'fadeInUp 0.6s ease-out forwards',
        'reveal-up':      'revealUp 0.6s ease-out forwards',
        'shine':          'shine 2s ease-in-out infinite',
        'spin-gold':      'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.05' },
          '33%':      { transform: 'translate(20px, -15px) scale(1.1)', opacity: '0.07' },
          '66%':      { transform: 'translate(-15px, 15px) scale(0.9)', opacity: '0.04' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(201, 168, 76, 0.2)' },
          '50%':      { boxShadow: '0 0 30px rgba(201, 168, 76, 0.4), 0 0 15px rgba(201, 168, 76, 0.2)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        revealUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shine: {
          '0%':   { transform: 'translateX(-100%)' },
          '20%, 100%': { transform: 'translateX(200%)' },
        },
      },
      transitionTimingFunction: {
        'ease-luxury': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'ease-premium': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

export default config
