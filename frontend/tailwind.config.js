/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0a0c10',
          secondary: '#111318',
          tertiary: '#181c24',
          card: '#1e2330',
        },
        accent: {
          green: '#4ade80',
          cyan: '#22d3ee',
          amber: '#f59e0b',
          purple: '#a78bfa',
          pink: '#fb7185',
          blue: '#60a5fa',
        },
        border: 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans: ['Instrument Sans', 'system-ui', 'sans-serif'],
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
