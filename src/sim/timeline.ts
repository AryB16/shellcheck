/** Scripted demo timeline (ms within each step). Pausing freezes all of it. */
export type Step = 1 | 2 | 3 | 4 | 5

export const STEP_NAMES: Record<Step, string> = {
  1: 'Baseline monitoring',
  2: 'Kick-off surge',
  3: 'Behavioural scoring',
  4: 'Registry linkage',
  5: 'COAF report',
}

/** Sim-clock (seconds since midnight) applied when entering a step. */
export const STEP_BASE: Record<Step, number> = {
  1: 15 * 3600 + 41 * 60 + 20, // 15:41:20
  2: 16 * 3600 - 3, // 15:59:57 → kick-off three seconds later
  3: 16 * 3600 + 14,
  4: 16 * 3600 + 30,
  5: 16 * 3600 + 48,
}

export const T2 = { kickoff: 3000, grow: 3200, growDur: 2600, score: 3600, scoreDur: 2600 }
export const T3 = { flag0: 650, flagGap: 900, flagAnim: 650 }
export const T4 = {
  move: 1700,
  hubIn: 250,
  edge0: 650,
  edgeGap: 230,
  edgeDur: 340,
  partner0: 650 + 14 * 230 + 200,
  partnerGap: 220,
}
export const T4_DONE = T4.partner0 + 2 * T4.partnerGap + 400
export const T5 = { stream: 500, streamDur: 6800 }
export const REPORT_DONE = T5.stream + T5.streamDur
