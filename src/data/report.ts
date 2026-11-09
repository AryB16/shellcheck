import { brl, brlShort, int, pct } from '../lib/format'
import {
  BY_ID,
  RING,
  RING_FWD_PCT,
  RING_PAYERS_30D,
  RING_TOTAL_30D,
  SHARED_ADDRESS,
  SHARED_PHONE,
  STATS,
  TAROT,
  scoreBase,
} from './model'

export type Block =
  | { kind: 'h'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'table'; head: string[]; rows: string[][]; right: number[]; foot?: string[] }
  | { kind: 'ul'; items: string[] }

const t = BY_ID[TAROT]
const finalScore = (id: string) => scoreBase(BY_ID[id]) + BY_ID[id].networkPts

export const REPORT: Block[] = [
  { kind: 'h', text: '01  Summary' },
  {
    kind: 'p',
    text:
      `Seven business accounts registered to the same phone number and the same address received ${brl(RING_TOTAL_30D)} via Pix in 30 days ` +
      `from ${int(RING_PAYERS_30D)} individual payers. Inflows spike within minutes of football kick-offs and ${pct(RING_FWD_PCT)} of funds are ` +
      `forwarded to third-party accounts within 10 minutes. Declared activities — esoteric services, psychology clinic, bakery, tailoring, ` +
      `fitness, grocery and events — are inconsistent with the volume, payer dispersion and timing observed. The pattern is consistent ` +
      `with collection accounts for unauthorised online betting.`,
  },
  { kind: 'h', text: '02  Entities' },
  {
    kind: 'table',
    head: ['Business', 'CNPJ', 'Declared', 'Inflow 30d', 'Score'],
    right: [3, 4],
    rows: RING.map((b) => [b.short, b.cnpj, b.activity, brl(b.inflow30d), String(finalScore(b.id))]),
    foot: ['Total · 7 entities', '', '', brl(RING_TOTAL_30D), ''],
  },
  { kind: 'h', text: '03  Evidence' },
  {
    kind: 'table',
    head: ['Indicator', 'Observed', 'Reference', 'Source'],
    right: [],
    rows: [
      ['Pix received, 24h — ' + t.short, int(t.pix24h), `Peer median ${t.peerPix}`, 'Pix SPI'],
      ['Distinct payers, 24h — ' + t.short, int(t.payers24h), `${pct(t.firstTime)} first-time`, 'Pix SPI'],
      ['Spikes at football kick-off', `${STATS[TAROT].hits} of 4`, `Peak ${STATS[TAROT].peak} Pix/min`, 'Pix SPI · fixtures'],
      ['Forwarded within 10 min (network)', pct(RING_FWD_PCT), `Peer median ${pct(t.peerFwd)}`, 'Ledger'],
      ['Shared phone ' + SHARED_PHONE, '7 CNPJs', '—', 'CNPJ registry'],
      ['Shared address ' + SHARED_ADDRESS.split(' – ')[0], '7 CNPJs', '—', 'CNPJ registry'],
      ['Common partner R.M.S.', '3 CNPJs', '—', 'QSA registry'],
      ['Companies opened', 'Jul–Sep 2026', 'Capital ≤ R$ 10,000', 'CNPJ registry'],
    ],
  },
  { kind: 'h', text: '04  Recommended action' },
  {
    kind: 'ul',
    items: [
      'File COS with COAF under Lei 9.613/1998, art. 11.',
      `Place all 7 accounts (${brlShort(RING_TOTAL_30D)} in 30 days) under enhanced monitoring; hold outbound Pix above R$ 1,000 pending review.`,
      'Do not notify account holders (tipping-off prohibited).',
      'Individual payers are not reported as subjects and are not scored.',
    ],
  },
]

const ROW_COST = 70
export const blockCost = (b: Block) =>
  b.kind === 'table' ? (b.rows.length + 1 + (b.foot ? 1 : 0)) * ROW_COST : b.kind === 'ul' ? b.items.reduce((s, i) => s + i.length, 0) : b.text.length
export const REPORT_COST = REPORT.reduce((s, b) => s + blockCost(b), 0)
export { ROW_COST }
