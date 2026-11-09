import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationNodeDatum } from 'd3-force'
import { mulberry32 } from '../lib/rng'
import { BUSINESSES, LEGIT_LINKS, RING_ORDER, SEED } from './model'

/**
 * Two deterministic layouts computed once with d3-force:
 *  A — the calm view (ring members scattered among legitimate businesses)
 *  B — after registry linkage (ring pulled onto the shared phone + address)
 * The graph interpolates A → B during the unmasking.
 */
export const W = 1000
export const H = 880
const TOP = 150
const BOTTOM = H - 110
const LEFT = 90
const RIGHT = W - 90

export const PHONE_ID = 'hub-phone'
export const ADDR_ID = 'hub-address'

interface N extends SimulationNodeDatum {
  id: string
  rad: number
  hx?: number
  hy?: number
}

export type Pt = { x: number; y: number }

const clampPt = (n: N) => {
  n.x = Math.max(LEFT, Math.min(RIGHT, n.x ?? 0))
  n.y = Math.max(TOP, Math.min(BOTTOM, n.y ?? 0))
}

const rng = mulberry32(SEED + 5)
// Seeded scatter: ring members start mixed in among legitimate businesses.
const nodesA: N[] = BUSINESSES.map((b) => {
  const a = rng() * Math.PI * 2
  const rr = 120 + rng() * 260
  return { id: b.id, rad: 46, x: W / 2 + Math.cos(a) * rr * 1.2, y: (TOP + BOTTOM) / 2 + Math.sin(a) * rr * 0.85 }
})

const simA = forceSimulation<N>(nodesA)
  .force('charge', forceManyBody<N>().strength(-650))
  .force('collide', forceCollide<N>((n) => n.rad + 18).strength(1))
  .force('x', forceX<N>(W / 2).strength(0.03))
  .force('y', forceY<N>((TOP + BOTTOM) / 2).strength(0.05))
  .force(
    'link',
    forceLink<N, { source: string; target: string }>(LEGIT_LINKS.map((l) => ({ source: l.a, target: l.b })))
      .id((n) => n.id)
      .distance(250)
      .strength(0.4),
  )
  .stop()
for (let i = 0; i < 420; i++) {
  simA.tick()
  nodesA.forEach(clampPt)
}

export const POS_A: Record<string, Pt> = Object.fromEntries(nodesA.map((n) => [n.id, { x: n.x!, y: n.y! }]))

// ---------- Layout B ----------
// The unmasked ring is placed by hand like a case board: two hubs in the middle,
// members on a clean ring around them. Legitimate businesses are then relaxed
// out of that zone with d3-force while staying close to where they were.
const CX = W / 2
const CY = (TOP + BOTTOM) / 2 + 20
const SLOTS: Record<string, Pt> = {
  luacheia: { x: CX, y: CY - 235 },
  bemestar: { x: CX + 285, y: CY - 140 },
  jreventos: { x: CX - 285, y: CY - 140 },
  paodourado: { x: CX + 285, y: CY + 125 },
  bompreco: { x: CX - 285, y: CY + 125 },
  costurafina: { x: CX + 120, y: CY + 235 },
  fitmovimento: { x: CX - 120, y: CY + 235 },
}
const ringSet = new Set(RING_ORDER)
const HUBS: Record<string, Pt> = { [PHONE_ID]: { x: CX - 120, y: CY }, [ADDR_ID]: { x: CX + 120, y: CY } }

const nodesB: N[] = nodesA.map((n) => {
  const slot = SLOTS[n.id]
  return slot
    ? { id: n.id, rad: 40, x: slot.x, y: slot.y, fx: slot.x, fy: slot.y }
    : { id: n.id, rad: 46, x: n.x, y: n.y, hx: n.x, hy: n.y }
})
for (const id of [PHONE_ID, ADDR_ID]) nodesB.push({ id, rad: 60, x: HUBS[id].x, y: HUBS[id].y, fx: HUBS[id].x, fy: HUBS[id].y })

// Keep legitimate nodes outside the case-board ellipse.
const RX = 440
const RY = 340
function exclusion(alpha: number) {
  for (const n of nodesB) {
    if (ringSet.has(n.id) || n.id.startsWith('hub')) continue
    const dx = (n.x! - CX) / RX
    const dy = (n.y! - CY) / RY
    const d = Math.hypot(dx, dy)
    if (d < 1) {
      const k = ((1 - d) / Math.max(d, 0.05)) * alpha * 2
      n.vx = (n.vx ?? 0) + dx * RX * k * 0.5
      n.vy = (n.vy ?? 0) + dy * RY * k * 0.5
    }
  }
}

const simB = forceSimulation<N>(nodesB)
  .force('collide', forceCollide<N>((n) => n.rad + 18).strength(1))
  .force('ex', exclusion)
  .force(
    'link',
    forceLink<N, { source: string; target: string }>(LEGIT_LINKS.map((l) => ({ source: l.a, target: l.b })))
      .id((n) => n.id)
      .distance(250)
      .strength(0.3),
  )
  .force('hx', forceX<N>((n) => n.hx ?? n.x ?? CX).strength(0.06))
  .force('hy', forceY<N>((n) => n.hy ?? n.y ?? CY).strength(0.06))
  .stop()
const LEFT_B = 70
const RIGHT_B = W - 70
for (let i = 0; i < 500; i++) {
  simB.tick()
  for (const n of nodesB) {
    if (n.fx != null) continue
    n.x = Math.max(LEFT_B, Math.min(RIGHT_B, n.x ?? 0))
    n.y = Math.max(TOP - 20, Math.min(BOTTOM + 20, n.y ?? 0))
  }
}

export const POS_B: Record<string, Pt> = Object.fromEntries(nodesB.map((n) => [n.id, { x: n.x!, y: n.y! }]))
