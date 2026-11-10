/** @type {import('tailwindcss').Config} */
// Graphite theme. Colour carries meaning only:
//   ok (green)  = normal business      warn (amber) = unusual
//   risk (red)  = high risk            link (blue)  = registry records (phone, address)
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: { md: '700px', lg: '1100px' },
    extend: {
      colors: {
        bg: '#0E1015',
        card: '#161920',
        soft: '#1E222B',
        line: '#252A34',
        line2: '#353B47',
        ink: '#F2F3F5',
        tx2: '#B6BCC8',
        tx3: '#8890A0',
        tx4: '#5E6576',
        risk: '#FF5A4E',
        risksoft: '#3A1D1D',
        money: '#FFB020',
        moneyink: '#FFC24D',
        moneysoft: '#3A2C12',
        ok: '#3DD68C',
        oksoft: '#12301F',
        link: '#5B9DFF',
        linksoft: '#14223A',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
