/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B1020',
        panel: '#0D1325',
        raised: '#111931',
        sunk: '#090D1A',
        line: '#1B2440',
        line2: '#273254',
        tx: '#DCE2EE',
        tx2: '#A3ADC2',
        tx3: '#6E7891',
        tx4: '#4A5370',
        risk: '#E5383B',
        money: '#F2A900',
        node: '#6B7590',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: { caps: '0.09em' },
    },
  },
  plugins: [],
}
