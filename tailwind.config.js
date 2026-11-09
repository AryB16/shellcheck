/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F3F4F6',
        card: '#FFFFFF',
        soft: '#F7F8FA',
        line: '#E6E8EC',
        line2: '#D3D7DE',
        ink: '#0E1525',
        tx2: '#475163',
        tx3: '#6B7485',
        tx4: '#9AA2B1',
        risk: '#E5383B',
        risksoft: '#FDEEEE',
        money: '#F2A900',
        moneyink: '#9A6500',
        moneysoft: '#FEF6E0',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
