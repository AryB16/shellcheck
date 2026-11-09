import { BY_ID, RING_ORDER, TAROT, scoreBase, type Business } from '../data/model'
import { clamp01, easeInOut, easeOut, lerp } from '../lib/format'
import { T2, T3, T4, type Step } from './timeline'

/** Everything visual is a pure function of (step, elapsed) — jumps and resets are exact. */

export const THRESHOLD = 70
export type Band = 'low' | 'mid' | 'high'
export const band = (s: number): Band => (s >= THRESHOLD ? 'high' : s >= 40 ? 'mid' : 'low')
export const BAND_COLOR: Record<Band, string> = { low: '#9EA7B5', mid: '#F2A900', high: '#E5383B' }

export const kickoffShown = (step: Step, e: number) => step > 2 || (step === 2 && e >= T2.kickoff)

export const TAROT_FLAGS = ['volume', 'payers', 'kickoff', 'passthrough'] as const

export const tarotFlagTime = (k: number) => T3.flag0 + k * T3.flagGap

/** Number of tarot red flags visible during scoring. */
export function tarotFlagsVisible(step: Step, e: number) {
  if (step < 3) return 0
  if (step > 3) return 4
  let n = 0
  for (let k = 0; k < 4; k++) if (e >= tarotFlagTime(k)) n++
  return n
}

/** Score shown on the gauge for the tarot shop (rebuilt flag by flag in step 3). */
export function tarotGauge(step: Step, e: number) {
  const b = BY_ID[TAROT]
  if (step === 1) return 18
  if (step === 2) return e < T2.score ? 18 : lerp(18, 58, easeOut((e - T2.score) / T2.scoreDur))
  if (step > 3) return scoreBase(b)
  let v = 0
  TAROT_FLAGS.forEach((f, k) => {
    v += b.factors[f] * easeOut((e - tarotFlagTime(k)) / T3.flagAnim)
  })
  return v
}

export function linkTime(id: string) {
  const k = RING_ORDER.indexOf(id)
  return T4.edge0 + (2 * k + 1) * T4.edgeGap + T4.edgeDur
}

export function isLinked(id: string, step: Step, e: number) {
  if (step < 4) return false
  if (step > 4) return true
  return e >= linkTime(id)
}

export function scoreOf(b: Business, step: Step, e: number): number {
  if (!b.ring) return scoreBase(b)
  if (b.id === TAROT) return step === 3 ? Math.max(58, tarotGauge(step, e)) : tarotGauge(step, e)
  const base = scoreBase(b)
  if (step < 4) return base
  if (step > 4) return base + b.networkPts
  return base + b.networkPts * easeOut((e - linkTime(b.id)) / 500)
}

/** R$ received in the trailing 60 min — drives node size. */
export function hourOf(b: Business, step: Step, e: number) {
  if (step === 1) return b.hourCalm
  if (step === 2) return lerp(b.hourCalm, b.hourSurge, easeOut((e - T2.grow) / T2.growDur))
  return b.hourSurge
}

export const moveT = (step: Step, e: number) => (step < 4 ? 0 : step > 4 ? 1 : easeInOut(e / T4.move))

export interface EdgeDef {
  id: string
  a: string
  b: string
  kind: 'phone' | 'address' | 'partner' | 'legit-address' | 'legit-partner'
  start: number
}

export function edgeProgress(edge: EdgeDef, step: Step, e: number) {
  if (edge.kind.startsWith('legit')) return 1
  if (step < 4) return 0
  if (step > 4) return 1
  return clamp01((e - edge.start) / T4.edgeDur)
}

/** Businesses linked so far and their combined 30-day inflow. */
export function networkTally(step: Step, e: number) {
  let n = 0
  let amount = 0
  for (const id of RING_ORDER) {
    if (isLinked(id, step, e)) {
      n++
      amount += BY_ID[id].inflow30d
    }
  }
  return { n, amount }
}
