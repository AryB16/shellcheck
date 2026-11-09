import { hash01, hashU32 } from '../lib/rng'
import { BUSINESSES, INDEX, SEED, type Business } from './model'

/**
 * Deterministic Pix event stream for the monitored PJ segment.
 * Events are generated per simulated second; the feed, the "Pix monitored
 * today" counter and the live rate are all read from these arrays.
 */
export const FEED_T0 = 15 * 3600 // 15:00:00
export const FEED_T1 = 18 * 3600 // 18:00:00
export const KICKOFF_SEC = 16 * 3600 // 16:00:00
export const PIX_BEFORE_T0 = 58_904 // Pix received by monitored accounts 00:00–15:00

const LEGIT_RATE = 1.7
const RING_CALM = 0.14
const RING_SURGE = 6.3

function ringRate(t: number) {
  const rampStart = KICKOFF_SEC - 150
  if (t < rampStart) return RING_CALM
  if (t < KICKOFF_SEC) return RING_CALM + (RING_SURGE * 0.55 - RING_CALM) * ((t - rampStart) / 150)
  const s = t - KICKOFF_SEC
  if (s < 25) return RING_SURGE * (0.55 + 0.45 * (s / 25))
  return RING_SURGE * (0.9 + 0.1 * Math.sin(s / 17))
}

const legitW: [number, number][] = BUSINESSES.filter((b) => !b.ring).map((b) => [INDEX[b.id], Math.max(0.2, b.pix24h / 60)])
const ringW: [number, number][] = [
  ['luacheia', 34], ['bemestar', 18], ['paodourado', 14], ['costurafina', 9],
  ['fitmovimento', 9], ['bompreco', 8], ['jreventos', 8],
].map(([id, w]) => [INDEX[id as string], w as number])

function pick(table: [number, number][], u: number) {
  const total = table.reduce((s, [, w]) => s + w, 0)
  let x = u * total
  for (const [i, w] of table) {
    x -= w
    if (x <= 0) return i
  }
  return table[table.length - 1][0]
}

const times: number[] = []
const biz: number[] = []
for (let t = FEED_T0; t < FEED_T1; t++) {
  const rl = LEGIT_RATE * (0.85 + 0.3 * hash01(SEED ^ (t * 7)))
  const rr = ringRate(t)
  const lam = rl + rr
  const k = Math.floor(lam) + (hash01(SEED + t * 13) < lam - Math.floor(lam) ? 1 : 0)
  for (let j = 0; j < k; j++) {
    const h = SEED + t * 101 + j * 7919
    const isRing = hash01(h) < rr / lam
    times.push(t + (j + 0.15 + 0.7 * hash01(h + 1)) / k)
    biz.push(isRing ? pick(ringW, hash01(h + 2)) : pick(legitW, hash01(h + 3)))
  }
}
export const EV_TIME = Float64Array.from(times)
export const EV_BIZ = Uint8Array.from(biz)
export const EV_COUNT = EV_TIME.length

/** Number of events with time <= t */
export function eventsUpTo(t: number) {
  let lo = 0
  let hi = EV_COUNT
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (EV_TIME[mid] <= t) lo = mid + 1
    else hi = mid
  }
  return lo
}

export const pixToday = (t: number) => PIX_BEFORE_T0 + eventsUpTo(t)

// ---------- Event detail, derived on demand ----------
// Betting deposits: mostly round values, some odd ones to look like purchases
const BET = [10, 20, 20, 25, 30, 30, 37.9, 50, 50, 50, 59.9, 100, 100, 150, 200, 300, 47.5, 89.9]
const RANGES: Record<string, [number, number]> = {
  supermarket: [18, 420], pharmacy: [12, 240], restaurant: [24, 190], bakery: [4, 46],
  mechanic: [120, 2400], autoparts: [38, 860], optician: [180, 1200], school: [290, 890], petshop: [28, 340],
  butcher: [22, 260], gym: [89, 199], snack: [9, 48], dental: [150, 1800], construction: [35, 2200], salon: [40, 320],
  fuel: [60, 380], electronics: [45, 2800], beverage: [120, 4800], realestate: [1500, 95000],
}
const ENDINGS = [0, 0.5, 0.9, 0.99, 0, 0.9]
const DESC: Record<string, string[]> = {
  supermarket: ['compras do mês', 'mercado', '', 'feira semana'],
  pharmacy: ['farmácia', 'remédios', '', 'receita'],
  restaurant: ['almoço', 'jantar', '', 'marmitex'],
  bakery: ['pão e leite', 'café da manhã', 'encomenda bolo', ''],
  mechanic: ['revisão freios', 'troca de óleo', 'orçamento 0412', ''],
  autoparts: ['pastilha freio', 'peças', 'filtro de ar', ''],
  optician: ['óculos', 'lentes', 'armação', ''],
  school: ['mensalidade nov', 'matrícula', 'mensalidade', ''],
  petshop: ['ração', 'banho e tosa', 'petshop', ''],
}

export interface PixEvent {
  i: number
  t: number
  business: Business
  payer: string
  amount: number
  desc: string
}

export function eventAt(i: number): PixEvent {
  const h = hashU32(SEED ^ (i * 2654435761))
  const b = BUSINESSES[EV_BIZ[i]]
  const u = (n: number) => hash01(h + n)
  let amount: number
  let desc: string
  if (b.ring) {
    amount = BET[Math.floor(u(1) * BET.length)]
    desc = u(2) < 0.55 ? `QR dinâmico · ref ${(h >>> 8).toString(16).toUpperCase().slice(0, 4)}-${String(h % 9000 + 1000)}` : u(2) < 0.8 ? 'créditos' : 'pagamento'
  } else {
    const [lo, hi] = RANGES[b.category] ?? [20, 300]
    const x = lo + (hi - lo) * Math.pow(u(1), 1.8)
    // Realistic price endings: R$ 47.90, R$ 129.99, R$ 85.50
    amount = Math.floor(x) + ENDINGS[Math.floor(u(4) * ENDINGS.length)]
    const opts = DESC[b.category] ?? ['']
    desc = opts[Math.floor(u(2) * opts.length)]
  }
  const mid = String(Math.floor(u(3) * 1000)).padStart(3, '0')
  return { i, t: EV_TIME[i], business: b, payer: `***.${mid}.***-**`, amount, desc }
}
