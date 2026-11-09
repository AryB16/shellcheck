/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#D5DAE1',
        card: '#ECEFF3',
        soft: '#E1E5EB',
        line: '#CDD3DC',
        line2: '#B7BFCB',
        ink: '#0E1525',
        tx2: '#3F4859',
        tx3: '#5E6778',
        tx4: '#858D9C',
        risk: '#E5383B',
        risksoft: '#F5DCDC',
        money: '#F2A900',
        moneyink: '#9A6500',
        moneysoft: '#F6E9C4',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
