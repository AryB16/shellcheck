/** @type {import('tailwindcss').Config} */
// Graphite theme. Colour carries meaning only:
//   ok (green)  = normal business      warn (amber) = unusual
//   risk (red)  = high risk            link (blue)  = registry records (phone, address)
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#141619',
        card: '#1C1F23',
        soft: '#24282D',
        line: '#2C3036',
        line2: '#3A3F46',
        ink: '#ECEAE6',
        tx2: '#B3B6BB',
        tx3: '#878C94',
        tx4: '#5F656E',
        risk: '#EF4B43',
        risksoft: '#33201F',
        money: '#F0A92E',
        moneyink: '#F3B54A',
        moneysoft: '#33291A',
        ok: '#5DB08F',
        oksoft: '#1D2B26',
        link: '#7BA6F0',
        linksoft: '#1D2533',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
