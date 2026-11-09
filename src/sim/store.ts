import { useSyncExternalStore } from 'react'
import type { Cur } from '../lib/format'
import { TAROT } from '../data/model'
import { REPORT_DONE, STEP_BASE, type Step } from './timeline'

export interface SimState {
  step: Step
  /** ms of playback inside the current step */
  elapsed: number
  /** simulated wall clock, seconds since midnight */
  sim: number
  playing: boolean
  selected: string | null
  filedAt: number | null
  currency: Cur
}

const initial = (): SimState => ({
  step: 1,
  elapsed: 0,
  sim: STEP_BASE[1],
  playing: true,
  selected: null,
  filedAt: null,
  currency: 'BRL',
})

let state: SimState = initial()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const set = (patch: Partial<SimState>) => {
  state = { ...state, ...patch }
  emit()
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const getState = () => state

/** Subscribe to a primitive slice; components re-render only when it changes. */
export function useSim<T extends string | number | boolean | null>(sel: (s: SimState) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state))
}

let started = false
export function startLoop() {
  if (started) return
  started = true
  let last = performance.now()
  const frame = (now: number) => {
    const dt = Math.min(now - last, 80)
    last = now
    if (state.playing) {
      state = { ...state, elapsed: state.elapsed + dt, sim: state.sim + dt / 1000 }
      emit()
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

/** Dev/test helper: advance playback deterministically (used when rAF is throttled). */
export function advance(ms: number) {
  const stepMs = 16
  for (let t = 0; t < ms; t += stepMs) {
    state = { ...state, elapsed: state.elapsed + stepMs, sim: state.sim + stepMs / 1000 }
  }
  emit()
}

function goto(step: Step) {
  const back = step <= state.step
  const base = STEP_BASE[step]
  const sim = back || state.sim < base ? base : state.sim
  let selected = state.selected
  if (step >= 3) selected = TAROT
  else if (back) selected = null
  set({ step, elapsed: 0, sim, selected, filedAt: null, playing: true })
}

export const controls = {
  toggle: () => set({ playing: !state.playing }),
  goto,
  next() {
    if (state.step < 5) return goto((state.step + 1) as Step)
    if (state.elapsed < REPORT_DONE) return set({ elapsed: REPORT_DONE, playing: true })
    controls.file()
  },
  prev() {
    if (state.step > 1) goto((state.step - 1) as Step)
  },
  reset() {
    state = { ...initial(), currency: state.currency }
    emit()
  },
  toggleCurrency: () => set({ currency: state.currency === 'BRL' ? 'USD' : 'BRL' }),
  setCurrency: (c: Cur) => set({ currency: c }),
  select: (id: string | null) => set({ selected: id }),
  draft() {
    if (state.step < 5) goto(5)
  },
  file() {
    if (state.step === 5 && state.elapsed >= REPORT_DONE && state.filedAt == null) set({ filedAt: state.sim })
  },
}
