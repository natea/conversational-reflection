import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Ginger Design Tokens
        background: 'var(--background)',
        surface: 'var(--surface)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'voice-accent': 'var(--voice-accent)',
        'damasio-lens': 'var(--damasio-lens)',
        // Additional lens colors
        'cbt-lens': 'var(--cbt-lens)',
        'act-lens': 'var(--act-lens)',
        'ifs-lens': 'var(--ifs-lens)',
        'stoic-lens': 'var(--stoic-lens)',
        // UI colors
        'border-light': 'var(--border-light)',
        'border-medium': 'var(--border-medium)',
        'hover-surface': 'var(--hover-surface)',
        'active-surface': 'var(--active-surface)',
        // Status colors
        'success': 'var(--success)',
        'warning': 'var(--warning)',
        'error': 'var(--error)',
        // Emotion colors
        'emotion-fear': 'var(--emotion-fear)',
        'emotion-anger': 'var(--emotion-anger)',
        'emotion-joy': 'var(--emotion-joy)',
        'emotion-sadness': 'var(--emotion-sadness)',
        'emotion-disgust': 'var(--emotion-disgust)',
        'emotion-surprise': 'var(--emotion-surprise)',
        // Consciousness/Body colors
        'body-energy': 'var(--body-energy)',
        'body-stress': 'var(--body-stress)',
        'body-tension': 'var(--body-tension)',
        'body-arousal': 'var(--body-arousal)',
        'body-valence-positive': 'var(--body-valence-positive)',
        'body-valence-negative': 'var(--body-valence-negative)',
        // Voice indicators
        'voice-contact': 'var(--voice-contact)',
        'voice-ai': 'var(--voice-ai)',
        // Memory salience
        'salience-high': 'var(--salience-high)',
        'salience-medium': 'var(--salience-medium)',
        'salience-low': 'var(--salience-low)',
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'monospace'],
      },
      spacing: {
        'panel-left': '280px',
        'panel-left-collapsed': '60px',
        'panel-right': '320px',
      },
      transitionDuration: {
        'panel': '400ms',
        'message': '250ms',
        'lens': '300ms',
      },
      animation: {
        'waveform': 'waveform 1s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'slide-up': 'slide-up 250ms ease-out',
        'slide-in-right': 'slide-in-right 400ms ease-in-out',
        'fade-in': 'fade-in 250ms ease-out',
        'scale-in': 'scale-in 200ms ease-out',
        'somatic-pulse': 'somatic-pulse 2s ease-in-out infinite',
        'emotion-decay': 'emotion-decay 5s ease-out forwards',
        'consciousness-flow': 'consciousness-flow 3s ease-in-out infinite',
      },
      keyframes: {
        'waveform': {
          '0%, 100%': { transform: 'scaleY(0.5)' },
          '50%': { transform: 'scaleY(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'somatic-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.7' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
        'emotion-decay': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0.3', transform: 'scale(0.95)' },
        },
        'consciousness-flow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      boxShadow: {
        'panel': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card': '0 1px 4px rgba(0, 0, 0, 0.06)',
        'modal': '0 8px 32px rgba(0, 0, 0, 0.16)',
        'voice-bar': '0 2px 12px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
export default config
