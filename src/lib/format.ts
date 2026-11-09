const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const nf2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const int = (n: number) => nf0.format(Math.round(n))
export const brl = (n: number) => 'R$ ' + nf2.format(n)
export const brl0 = (n: number) => 'R$ ' + nf0.format(Math.round(n))

/** Compact currency: R$ 2.3M · R$ 642k · R$ 830 */
export function brlShort(n: number) {
  if (n >= 1e6) return `R$ ${(n / 1e6).toFixed(1)}M`
  if (n >= 1e4) return `R$ ${Math.round(n / 1e3)}k`
  if (n >= 1e3) return `R$ ${(n / 1e3).toFixed(1)}k`
  return `R$ ${Math.round(n)}`
}

export const pct = (x: number) => `${Math.round(x * 100)}%`

const pad = (n: number) => String(n).padStart(2, '0')

/** Seconds since midnight → HH:MM:SS */
export function clock(sec: number) {
  const s = Math.floor(sec)
  return `${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`
}
export function clockHM(sec: number) {
  const s = Math.floor(sec)
  return `${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}`
}

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3)
export const easeInOut = (t: number) => {
  const x = clamp01(t)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

// ---------- Currency (BRL native; USD at a fixed demo rate) ----------
export type Cur = 'BRL' | 'USD'
export const USD_RATE = 5.4
const conv = (n: number, c: Cur) => (c === 'USD' ? n / USD_RATE : n)
const sym = (c: Cur) => (c === 'USD' ? '$' : 'R$ ')

/** Full amount: R$ 1,284.50 · $237.87 */
export const money = (n: number, c: Cur) => sym(c) + nf2.format(conv(n, c))

/** Compact: R$ 2.3M · $429k · R$ 830 */
export function moneyShort(n: number, c: Cur) {
  const v = conv(n, c)
  const s = sym(c)
  if (v >= 1e6) return `${s}${(v / 1e6).toFixed(1)}M`
  if (v >= 1e4) return `${s}${Math.round(v / 1e3)}k`
  if (v >= 1e3) return `${s}${(v / 1e3).toFixed(1)}k`
  return `${s}${Math.round(v)}`
}
