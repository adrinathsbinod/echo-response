/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-ops': '#070B14',
        'primary-blue': '#1C9BE6',
        'safe-teal': '#00E5A0',
        'critical-red': '#FF3B3B',
        'warning-amber': '#FFA500',
        'text-gray': '#C9D6E3',
      },
      fontFamily: {
        'barlow': ['"Barlow Condensed"', 'sans-serif'],
        'share-tech': ['"Share Tech Mono"', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px #FF3B3B, inset 0 0 5px #FF3B3B' },
          '50%': { boxShadow: '0 0 20px #FF3B3B, inset 0 0 10px #FF3B3B' },
        }
      }
    },
  },
  plugins: [],
}
