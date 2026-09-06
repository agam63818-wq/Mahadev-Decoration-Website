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
        'bg-void':        'rgb(var(--theme-bg-void, 7 4 12) / <alpha-value>)',
        'bg-void-2':      'rgb(var(--theme-bg-void-2, 13 8 21) / <alpha-value>)',
        'bg-rich':        'rgb(var(--theme-bg-rich, 17 8 31) / <alpha-value>)',
        'bg-purple':      'rgb(var(--theme-bg-purple, 26 11 46) / <alpha-value>)',
        'bg-burgundy':    'rgb(var(--theme-bg-burgundy, 45 11 28) / <alpha-value>)',
        'bg-deep-red':    'rgb(var(--theme-bg-deep-red, 58 15 36) / <alpha-value>)',

        // Refined gold family
        gold:             'rgb(var(--theme-gold, 201 168 76) / <alpha-value>)',
        'gold-warm':      'rgb(var(--theme-gold-warm, 212 175 55) / <alpha-value>)',
        'gold-bright':    'rgb(var(--theme-gold-bright, 232 200 88) / <alpha-value>)',
        'gold-light':     'rgb(var(--theme-gold-light, 240 200 104) / <alpha-value>)',
        'gold-muted':     'rgb(var(--theme-gold-muted, 138 112 40) / <alpha-value>)',
        'gold-dim':       'rgb(var(--theme-gold-dim, 90 74 21) / <alpha-value>)',

        // Warm accent tones
        champagne:        'rgb(var(--theme-champagne, 245 232 208) / <alpha-value>)',
        ivory:            'rgb(var(--theme-ivory, 253 248 240) / <alpha-value>)',
        amber:            'rgb(var(--theme-amber, 232 163 61) / <alpha-value>)',
        emerald:          'rgb(var(--theme-emerald, 26 107 74) / <alpha-value>)',
        'floral-red':     'rgb(var(--theme-floral-red, 139 30 63) / <alpha-value>)',
        rose:             'rgb(var(--theme-rose, 232 160 180) / <alpha-value>)',

        // Text
        'text-primary':   'rgb(var(--theme-text-primary, 248 243 236) / <alpha-value>)',
        'text-muted':     'rgb(var(--theme-text-muted, 176 160 197) / <alpha-value>)',
        'text-dim':       'rgb(var(--theme-text-dim, 123 107 138) / <alpha-value>)',
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
