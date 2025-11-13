
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-cyan': '#00FFFF',
        'brand-blue': '#007FFF',
        'brand-pink': '#FF00FF',
        'brand-red': '#FF0000',
        'brand-green': '#00FF00',
        'brand-yellow': '#F3FF00',
        'base-900': '#0A0A0F',
        'base-800': '#14141E',
        'base-700': '#1E1E2D',
        'theme-accent': 'var(--theme-accent-primary)',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'mono': ['Roboto Mono', 'monospace'],
        'display': ['Orbitron', 'sans-serif'],
        'classic': ['Bebas Neue', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 5px #00FFFF, 0 0 10px #00FFFF, 0 0 15px #007FFF',
        'glow-blue': '0 0 5px #007FFF, 0 0 10px #007FFF',
        'glow-red': '0 0 5px #FF0000, 0 0 10px #FF0000',
        'glow-yellow': '0 0 5px #F3FF00, 0 0 10px #F3FF00',
        'glow-green': '0 0 5px #00FF00, 0 0 10px #00FF00',
        'glow-theme': '0 0 8px var(--theme-accent-primary), 0 0 12px var(--theme-accent-primary)',
        'neumorphic-light': 'inset 6px 6px 12px var(--neumorphic-shadow-dark), inset -6px -6px 12px var(--neumorphic-shadow-light)',
        'neumorphic-dark': '6px 6px 12px var(--neumorphic-shadow-dark), -6px -6px 12px var(--neumorphic-shadow-light)',
      }
    },
  },
  plugins: [],
}
