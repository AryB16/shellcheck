import { mulberry32 } from '../lib/rng'

/**
 * Synthetic data model. Every figure on screen is derived from these
 * constants or from series generated with a fixed seed, so totals reconcile
 * and every run is identical. No real companies, people or CNPJs.
 */
export const SEED = 20261114

export type Category =
  | 'supermarket'
  | 'pharmacy'
  | 'restaurant'
  | 'bakery'
  | 'mechanic'
  | 'autoparts'
  | 'optician'
  | 'school'
  | 'petshop'
  | 'ring'

export type FactorKey = 'volume' | 'payers' | 'kickoff' | 'passthrough'

export interface Business {
  id: string
  name: string
  short: string
  cnpj: string
  cnae: string
  activity: string
  city: string
  opened: string
  staff: number
  capital: number
  account: string
  category: Category
  ring: boolean
  /** R$ received in the trailing 60 minutes — calm afternoon vs. match window */
  hourCalm: number
  hourSurge: number
  pix24h: number
  payers24h: number
  amount24h: number
  inflow30d: number
  payers30d: number
  fwd10: number
  firstTime: number
  peerPix: number
  peerFwd: number
  medianTicket: number
  factors: Record<FactorKey, number>
  /** Points added by registry linkage once the network is unmasked */
  networkPts: number
  /** Shares a partner (QSA) with other ring members */
  partner: boolean
}

type Raw = Omit<Business, 'cnpj' | 'account'>

const RAW: Raw[] = [
  // ---------- Legitimate businesses ----------
  {
    id: 'superbomlar', name: 'Supermercado Bom Lar Ltda', short: 'Supermercado Bom Lar',
    cnae: '4711-3/02', activity: 'Supermarket', city: 'Campinas – SP', opened: '17 Mar 2009',
    staff: 46, capital: 850_000, category: 'supermarket', ring: false,
    hourCalm: 8_400, hourSurge: 8_900, pix24h: 2_310, payers24h: 1_980, amount24h: 96_400,
    inflow30d: 2_684_000, payers30d: 21_400, fwd10: 0.03, firstTime: 0.12, peerPix: 2_050,
    peerFwd: 0.04, medianTicket: 34.9, factors: { volume: 2, payers: 3, kickoff: 0, passthrough: 1 },
    networkPts: 0, partner: false,
  },
  {
    id: 'farmavida', name: 'Farmácia Vida Saudável Ltda', short: 'Farmácia Vida Saudável',
    cnae: '4771-7/01', activity: 'Pharmacy', city: 'Santos – SP', opened: '02 Jun 2014',
    staff: 14, capital: 300_000, category: 'pharmacy', ring: false,
    hourCalm: 4_900, hourSurge: 5_100, pix24h: 860, payers24h: 790, amount24h: 41_200,
    inflow30d: 1_192_000, payers30d: 9_800, fwd10: 0.02, firstTime: 0.18, peerPix: 720,
    peerFwd: 0.04, medianTicket: 38.5, factors: { volume: 4, payers: 3, kickoff: 0, passthrough: 2 },
    networkPts: 0, partner: false,
  },
  {
    id: 'sabormineiro', name: 'Restaurante Sabor Mineiro Ltda', short: 'Restaurante Sabor Mineiro',
    cnae: '5611-2/01', activity: 'Restaurant', city: 'São Paulo – SP', opened: '12 Sep 2017',
    staff: 11, capital: 120_000, category: 'restaurant', ring: false,
    hourCalm: 3_600, hourSurge: 3_900, pix24h: 540, payers24h: 510, amount24h: 27_800,
    inflow30d: 806_000, payers30d: 6_900, fwd10: 0.05, firstTime: 0.31, peerPix: 480,
    peerFwd: 0.05, medianTicket: 48, factors: { volume: 5, payers: 6, kickoff: 2, passthrough: 1 },
    networkPts: 0, partner: false,
  },
  {
    id: 'santaluzia', name: 'Padaria Santa Luzia Ltda', short: 'Padaria Santa Luzia',
    cnae: '1091-1/02', activity: 'Bakery', city: 'Sorocaba – SP', opened: '20 Jan 2011',
    staff: 9, capital: 80_000, category: 'bakery', ring: false,
    hourCalm: 900, hourSurge: 950, pix24h: 610, payers24h: 480, amount24h: 9_150,
    inflow30d: 268_000, payers30d: 3_100, fwd10: 0.02, firstTime: 0.09, peerPix: 560,
    peerFwd: 0.03, medianTicket: 12.5, factors: { volume: 4, payers: 2, kickoff: 0, passthrough: 1 },
    networkPts: 0, partner: false,
  },
  {
    id: 'torquecerto', name: 'Oficina Mecânica Torque Certo ME', short: 'Oficina Torque Certo',
    cnae: '4520-0/01', activity: 'Auto repair', city: 'Diadema – SP', opened: '08 May 2015',
    staff: 6, capital: 60_000, category: 'mechanic', ring: false,
    hourCalm: 2_800, hourSurge: 2_600, pix24h: 38, payers24h: 36, amount24h: 21_400,
    inflow30d: 512_000, payers30d: 640, fwd10: 0.06, firstTime: 0.58, peerPix: 34,
    peerFwd: 0.07, medianTicket: 420, factors: { volume: 8, payers: 9, kickoff: 0, passthrough: 4 },
    networkPts: 0, partner: false,
  },
  {
    id: 'rotasul', name: 'Auto Peças Rota Sul ME', short: 'Auto Peças Rota Sul',
    cnae: '4530-7/03', activity: 'Auto parts retail', city: 'Santo André – SP', opened: '29 Oct 2012',
    staff: 8, capital: 150_000, category: 'autoparts', ring: false,
    hourCalm: 2_300, hourSurge: 2_200, pix24h: 120, payers24h: 112, amount24h: 18_900,
    inflow30d: 498_000, payers30d: 2_600, fwd10: 0.04, firstTime: 0.41, peerPix: 110,
    peerFwd: 0.05, medianTicket: 96, factors: { volume: 6, payers: 5, kickoff: 0, passthrough: 2 },
    networkPts: 0, partner: false,
  },
  {
    id: 'visaoclara', name: 'Ótica Visão Clara Ltda', short: 'Ótica Visão Clara',
    cnae: '4774-1/00', activity: 'Optical goods retail', city: 'Santos – SP', opened: '14 Feb 2019',
    staff: 5, capital: 90_000, category: 'optician', ring: false,
    hourCalm: 1_900, hourSurge: 1_700, pix24h: 31, payers24h: 31, amount24h: 11_600,
    inflow30d: 286_000, payers30d: 690, fwd10: 0.03, firstTime: 0.74, peerPix: 28,
    peerFwd: 0.04, medianTicket: 310, factors: { volume: 7, payers: 8, kickoff: 0, passthrough: 1 },
    networkPts: 0, partner: false,
  },
  {
    id: 'idiomasponte', name: 'Escola de Idiomas Ponte Ltda', short: 'Escola de Idiomas Ponte',
    cnae: '8593-7/00', activity: 'Language school', city: 'Sorocaba – SP', opened: '01 Aug 2016',
    staff: 12, capital: 100_000, category: 'school', ring: false,
    hourCalm: 1_500, hourSurge: 1_300, pix24h: 44, payers24h: 44, amount24h: 19_300,
    inflow30d: 402_000, payers30d: 820, fwd10: 0.02, firstTime: 0.06, peerPix: 40,
    peerFwd: 0.03, medianTicket: 439, factors: { volume: 4, payers: 3, kickoff: 0, passthrough: 1 },
    networkPts: 0, partner: false,
  },
  {
    id: 'amigofiel', name: 'Pet Shop Amigo Fiel ME', short: 'Pet Shop Amigo Fiel',
    cnae: '4789-0/04', activity: 'Pet supplies retail', city: 'São Bernardo do Campo – SP', opened: '23 Nov 2020',
    staff: 4, capital: 40_000, category: 'petshop', ring: false,
    hourCalm: 1_300, hourSurge: 1_400, pix24h: 96, payers24h: 90, amount24h: 8_700,
    inflow30d: 236_000, payers30d: 1_900, fwd10: 0.05, firstTime: 0.37, peerPix: 84,
    peerFwd: 0.05, medianTicket: 72, factors: { volume: 9, payers: 8, kickoff: 3, passthrough: 4 },
    networkPts: 0, partner: false,
  },
  // ---------- Shell network (all registered to one phone + one address) ----------
  {
    id: 'luacheia', name: 'Espaço Místico Lua Cheia – Tarô e Oráculo', short: 'Espaço Místico Lua Cheia',
    cnae: '9609-2/99', activity: 'Esoteric services', city: 'São Paulo – SP', opened: '19 Aug 2026',
    staff: 2, capital: 5_000, category: 'ring', ring: true,
    hourCalm: 1_100, hourSurge: 38_600, pix24h: 4_100, payers24h: 3_200, amount24h: 118_450,
    inflow30d: 642_380, payers30d: 19_800, fwd10: 0.91, firstTime: 0.82, peerPix: 38,
    peerFwd: 0.04, medianTicket: 30, factors: { volume: 30, payers: 22, kickoff: 24, passthrough: 18 },
    networkPts: 0, partner: true,
  },
  {
    id: 'bemestar', name: 'Clínica Bem-Estar Psicossocial Ltda', short: 'Clínica Bem-Estar',
    cnae: '8650-0/03', activity: 'Psychology services', city: 'São Paulo – SP', opened: '30 Jul 2026',
    staff: 3, capital: 10_000, category: 'ring', ring: true,
    hourCalm: 800, hourSurge: 14_200, pix24h: 1_240, payers24h: 1_060, amount24h: 36_900,
    inflow30d: 486_950, payers30d: 14_300, fwd10: 0.88, firstTime: 0.79, peerPix: 22,
    peerFwd: 0.03, medianTicket: 30, factors: { volume: 10, payers: 9, kickoff: 8, passthrough: 7 },
    networkPts: 52, partner: true,
  },
  {
    id: 'paodourado', name: 'Padaria Pão Dourado ME', short: 'Padaria Pão Dourado',
    cnae: '1091-1/02', activity: 'Bakery', city: 'São Paulo – SP', opened: '05 Aug 2026',
    staff: 4, capital: 8_000, category: 'ring', ring: true,
    hourCalm: 600, hourSurge: 9_800, pix24h: 980, payers24h: 870, amount24h: 28_700,
    inflow30d: 371_220, payers30d: 10_900, fwd10: 0.86, firstTime: 0.76, peerPix: 560,
    peerFwd: 0.03, medianTicket: 25, factors: { volume: 4, payers: 9, kickoff: 9, passthrough: 9 },
    networkPts: 50, partner: false,
  },
  {
    id: 'costurafina', name: 'Ateliê Costura Fina Ltda', short: 'Ateliê Costura Fina',
    cnae: '1412-6/02', activity: 'Custom tailoring', city: 'São Paulo – SP', opened: '02 Sep 2026',
    staff: 1, capital: 3_000, category: 'ring', ring: true,
    hourCalm: 400, hourSurge: 6_100, pix24h: 640, payers24h: 590, amount24h: 18_200,
    inflow30d: 248_610, payers30d: 7_600, fwd10: 0.9, firstTime: 0.81, peerPix: 9,
    peerFwd: 0.03, medianTicket: 25, factors: { volume: 8, payers: 7, kickoff: 6, passthrough: 6 },
    networkPts: 51, partner: false,
  },
  {
    id: 'fitmovimento', name: 'Studio Fit Movimento ME', short: 'Studio Fit Movimento',
    cnae: '9313-1/00', activity: 'Fitness centre', city: 'São Paulo – SP', opened: '26 Aug 2026',
    staff: 2, capital: 6_000, category: 'ring', ring: true,
    hourCalm: 450, hourSurge: 5_400, pix24h: 590, payers24h: 540, amount24h: 16_500,
    inflow30d: 214_370, payers30d: 6_500, fwd10: 0.87, firstTime: 0.74, peerPix: 45,
    peerFwd: 0.04, medianTicket: 25, factors: { volume: 7, payers: 8, kickoff: 7, passthrough: 7 },
    networkPts: 47, partner: false,
  },
  {
    id: 'bompreco', name: 'Mercearia Bom Preço do Bairro ME', short: 'Mercearia Bom Preço',
    cnae: '4712-1/00', activity: 'Grocery store', city: 'São Paulo – SP', opened: '09 Sep 2026',
    staff: 2, capital: 5_000, category: 'ring', ring: true,
    hourCalm: 380, hourSurge: 5_000, pix24h: 520, payers24h: 480, amount24h: 14_900,
    inflow30d: 193_540, payers30d: 5_800, fwd10: 0.85, firstTime: 0.72, peerPix: 210,
    peerFwd: 0.03, medianTicket: 25, factors: { volume: 4, payers: 6, kickoff: 8, passthrough: 7 },
    networkPts: 49, partner: false,
  },
  {
    id: 'jreventos', name: 'JR Assessoria em Eventos Ltda', short: 'JR Assessoria em Eventos',
    cnae: '8230-0/01', activity: 'Event organisation', city: 'São Paulo – SP', opened: '22 Jul 2026',
    staff: 1, capital: 5_000, category: 'ring', ring: true,
    hourCalm: 300, hourSurge: 4_300, pix24h: 470, payers24h: 440, amount24h: 13_400,
    inflow30d: 162_180, payers30d: 5_140, fwd10: 0.89, firstTime: 0.8, peerPix: 6,
    peerFwd: 0.03, medianTicket: 25, factors: { volume: 9, payers: 8, kickoff: 8, passthrough: 8 },
    networkPts: 46, partner: true,
  },
]

const rng = mulberry32(SEED)
const d = (n: number) => Math.floor(rng() * n)
const p3 = (n: number) => String(n).padStart(3, '0')
const p2 = (n: number) => String(n).padStart(2, '0')

export const BUSINESSES: Business[] = RAW.map((r) => ({
  ...r,
  // Obviously fake CNPJ range: 00.000.xxx/0001-xx
  cnpj: `00.000.${p3(100 + d(899))}/0001-${p2(10 + d(89))}`,
  account: `Ag 0001 · CC ${10000 + d(89999)}-${d(10)}`,
}))

export const BY_ID: Record<string, Business> = Object.fromEntries(BUSINESSES.map((b) => [b.id, b]))
export const INDEX: Record<string, number> = Object.fromEntries(BUSINESSES.map((b, i) => [b.id, i]))

export const TAROT = 'luacheia'
/** Ring members in the order the unmasking links them. */
export const RING_ORDER = ['luacheia', 'bemestar', 'paodourado', 'costurafina', 'fitmovimento', 'bompreco', 'jreventos']
export const RING = RING_ORDER.map((id) => BY_ID[id])
export const LEGIT = BUSINESSES.filter((b) => !b.ring)

export const SHARED_PHONE = '(11) 9 0000-4417'
export const SHARED_ADDRESS = 'Rua Fictícia das Flores, 1180 – sala 4'
export const SHARED_ADDRESS_FULL = 'Rua Fictícia das Flores, 1180 – sala 4 · Brás · São Paulo – SP'
export const SHARED_PARTNER = 'R.M.S. (CPF ***.118.***-**)'

/** Co-registration among legitimate businesses — linkage alone is not guilt. */
export const LEGIT_LINKS: { a: string; b: string; kind: 'address' | 'partner' }[] = [
  { a: 'farmavida', b: 'visaoclara', kind: 'address' },
  { a: 'santaluzia', b: 'idiomasponte', kind: 'partner' },
]
export const PARTNER_LINKS: { a: string; b: string }[] = [
  { a: 'luacheia', b: 'bemestar' },
  { a: 'luacheia', b: 'jreventos' },
]

export const scoreBase = (b: Business) =>
  b.factors.volume + b.factors.payers + b.factors.kickoff + b.factors.passthrough

// ---------- Network aggregates (single source of truth) ----------
export const RING_TOTAL_30D = RING.reduce((s, b) => s + b.inflow30d, 0) // 2,319,250
export const RING_PAYERS_30D = RING.reduce((s, b) => s + b.payers30d, 0)
export const RING_AMOUNT_24H = RING.reduce((s, b) => s + b.amount24h, 0)
export const RING_FWD_24H = RING.reduce((s, b) => s + b.amount24h * b.fwd10, 0)
export const RING_FWD_PCT = RING_FWD_24H / RING_AMOUNT_24H

// ---------- Pix-per-minute series, 48h trailing ----------
export const SERIES_MIN = 2880
/** Index 2879 = Sat 16:02. Kick-offs inside the window. */
export const KICKOFFS = [
  { idx: 177, label: 'THU 19:00' },
  { idx: 327, label: 'THU 21:30' },
  { idx: 1737, label: 'FRI 21:00' },
  { idx: 2877, label: 'SAT 16:00' },
]
/** minute index → minutes since Thu 00:00 (index 0 = Thu 16:03) */
const minuteOfDay = (i: number) => (16 * 60 + 3 + i) % 1440

function matchProfile(dm: number) {
  if (dm < -45) return 0
  if (dm < 0) return Math.pow(1 + dm / 45, 2) * 0.75
  if (dm <= 8) return 1
  if (dm <= 45) return 0.55
  if (dm <= 62) return 0.8
  if (dm <= 105) return 0.45
  if (dm <= 125) return 0.45 * (1 - (dm - 105) / 20)
  return 0
}

function diurnal(m: number, cat: Category) {
  const h = m / 60
  if (cat === 'ring') return h < 7 ? 0.25 : h < 18 ? 0.6 : 1
  if (cat === 'restaurant') return h < 10 ? 0.02 : h < 15 ? 1 : h < 18 ? 0.3 : h < 23 ? 0.9 : 0.05
  if (cat === 'bakery') return h < 6 ? 0.03 : h < 10 ? 1 : h < 17 ? 0.5 : h < 20 ? 0.8 : 0.05
  if (cat === 'supermarket' || cat === 'pharmacy') return h < 7 ? 0.04 : h < 22 ? 0.75 + 0.25 * Math.sin((h - 7) / 2.4) : 0.1
  return h < 8 ? 0.01 : h < 18 ? 1 : h < 20 ? 0.3 : 0.02
}

function buildSeries(b: Business, seed: number): Uint16Array {
  const r = mulberry32(seed)
  const raw = new Float64Array(SERIES_MIN)
  for (let i = 0; i < SERIES_MIN; i++) {
    let v = diurnal(minuteOfDay(i), b.category)
    if (b.ring) {
      let spike = 0
      // Today's kick-off (5 simultaneous Série A matches) draws the heaviest deposit wave.
      KICKOFFS.forEach((k, j) => (spike = Math.max(spike, matchProfile(i - k.idx) * (j === KICKOFFS.length - 1 ? 2.2 : 1))))
      v = v * 0.06 + spike * 1.0
    }
    raw[i] = v * (0.72 + 0.56 * r())
  }
  // Scale so the trailing 24h sums exactly to pix24h.
  let sum = 0
  for (let i = SERIES_MIN - 1440; i < SERIES_MIN; i++) sum += raw[i]
  const k = b.pix24h / sum
  const out = new Uint16Array(SERIES_MIN)
  let acc = 0
  let carry = 0
  for (let i = 0; i < SERIES_MIN; i++) {
    const x = raw[i] * k + carry
    const n = Math.max(0, Math.round(x))
    carry = x - n
    out[i] = n
    if (i >= SERIES_MIN - 1440) acc += n
  }
  // Fix rounding residual on the last-24h busiest minute.
  let maxI = SERIES_MIN - 1440
  for (let i = maxI; i < SERIES_MIN; i++) if (out[i] > out[maxI]) maxI = i
  out[maxI] += b.pix24h - acc
  return out
}

export const SERIES: Record<string, Uint16Array> = Object.fromEntries(
  BUSINESSES.map((b, i) => [b.id, buildSeries(b, SEED + 97 * (i + 1))]),
)

export interface SeriesStats { peak: number; peakLabel: string; hits: number }
export function seriesStats(id: string): SeriesStats {
  const s = SERIES[id]
  let peak = 0
  let peakI = 0
  for (let i = 0; i < s.length; i++) if (s[i] > peak) { peak = s[i]; peakI = i }
  const sorted = Array.from(s).sort((a, b) => a - b)
  const median = Math.max(1, sorted[Math.floor(sorted.length / 2)])
  let hits = 0
  for (const k of KICKOFFS) {
    let m = 0
    for (let i = k.idx; i < Math.min(s.length, k.idx + 15); i++) m = Math.max(m, s[i])
    if (m > median * 4 && m >= 6) hits++
  }
  const mod = minuteOfDay(peakI)
  const dayIdx = Math.floor((16 * 60 + 3 + peakI) / 1440)
  const day = ['THU', 'FRI', 'SAT'][dayIdx] ?? 'SAT'
  return {
    peak,
    peakLabel: `${day} ${String(Math.floor(mod / 60)).padStart(2, '0')}:${String(mod % 60).padStart(2, '0')}`,
    hits,
  }
}
export const STATS: Record<string, SeriesStats> = Object.fromEntries(BUSINESSES.map((b) => [b.id, seriesStats(b.id)]))
