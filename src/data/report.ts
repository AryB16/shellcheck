import { int, money, moneyShort, pct, type Cur } from '../lib/format'
import { RING, RING_FWD_PCT, RING_PAYERS_30D, RING_TOTAL_30D, SHARED_ADDRESS, SHARED_PHONE } from './model'

export type Block =
  | { kind: 'h'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'table'; head: string[]; rows: string[][]; foot: string[] }
  | { kind: 'ul'; items: string[] }

/** Short, plain-English COAF draft. Every figure comes from the model. */
export function buildReport(cur: Cur): Block[] {
  return [
    { kind: 'h', text: 'Summary' },
    {
      kind: 'p',
      text:
        `Seven businesses registered to the same phone number, ${SHARED_PHONE}, and the same address, ${SHARED_ADDRESS.split(' – ')[0]}, ` +
        `received ${moneyShort(RING_TOTAL_30D, cur)} via Pix in 30 days from ${int(RING_PAYERS_30D)} people. Payments spike at football ` +
        `kick-offs and ${pct(RING_FWD_PCT)} of the money is moved out within 10 minutes. This pattern is consistent with collection accounts for illegal online betting.`,
    },
    { kind: 'h', text: 'Businesses' },
    {
      kind: 'table',
      head: ['Business', 'Says it is', 'Received in 30 days'],
      rows: RING.map((b) => [b.short, b.activity, money(b.inflow30d, cur)]),
      foot: ['Total', '7 businesses', money(RING_TOTAL_30D, cur)],
    },
    { kind: 'h', text: 'Recommended action' },
    {
      kind: 'ul',
      items: [
        'File a suspicious-activity report with COAF (Lei 9.613/1998, art. 11).',
        'Put all 7 accounts under enhanced monitoring. Do not alert the account holders.',
      ],
    },
  ]
}

export const ROW_COST = 60
export const blockCost = (b: Block) =>
  b.kind === 'table' ? (b.rows.length + 2) * ROW_COST : b.kind === 'ul' ? b.items.reduce((s, i) => s + i.length, 0) : b.text.length
export const reportCost = (blocks: Block[]) => blocks.reduce((s, b) => s + blockCost(b), 0)
