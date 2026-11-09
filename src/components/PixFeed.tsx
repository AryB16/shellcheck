import { BUSINESSES } from '../data/model'
import { eventAt, eventsUpTo, KICKOFF_SEC } from '../data/feed'
import { brl, clock } from '../lib/format'
import { BAND_COLOR, band, scoreOf, type Band } from '../sim/derive'
import { useSim } from '../sim/store'

const ROWS = 28
const ROW_REM = 3.15

const BANDS: Band[] = ['low', 'mid', 'high']

export function PixFeed() {
  const idx = useSim((s) => eventsUpTo(s.sim))
  const rate = useSim((s) => ((eventsUpTo(s.sim) - eventsUpTo(s.sim - 10)) / 10).toFixed(1))
  const surge = useSim((s) => s.sim >= KICKOFF_SEC - 30)
  const bands = useSim((s) => BUSINESSES.map((b) => BANDS.indexOf(band(scoreOf(b, s.step, s.elapsed)))).join(''))

  const rows = []
  for (let k = 0; k < ROWS && idx - 1 - k >= 0; k++) rows.push(eventAt(idx - 1 - k))

  return (
    <aside className="flex min-h-0 flex-col bg-panel">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-line px-4">
        <div className="cap !text-tx2">Live Pix feed · PJ accounts</div>
        <div className="mono flex items-center gap-2 text-[0.8rem]">
          <span className={surge ? 'text-money' : 'text-tx3'}>{rate}</span>
          <span className="text-tx3">Pix/s</span>
        </div>
      </div>
      <div className="grid shrink-0 grid-cols-[4.6rem_1fr_auto] gap-x-3 border-b border-line px-4 py-1.5">
        <span className="cap !text-[0.64rem] !text-tx4">Time</span>
        <span className="cap !text-[0.64rem] !text-tx4">Payer → Receiving business</span>
        <span className="cap !text-[0.64rem] !text-tx4">Amount</span>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {rows.map((ev, k) => {
          const bi = BUSINESSES.indexOf(ev.business)
          const bd = BANDS[Number(bands[bi])] ?? 'low'
          const flagged = bd !== 'low'
          return (
            <div
              key={ev.i}
              className={`absolute inset-x-0 border-b border-line/70 px-4 ${k === 0 ? 'row-in' : ''}`}
              style={{
                height: `${ROW_REM}rem`,
                transform: `translateY(${k * ROW_REM}rem)`,
                transition: 'transform 160ms ease-out',
              }}
            >
              <span
                className="absolute bottom-[0.45rem] left-0 top-[0.45rem] w-[2px]"
                style={{ background: flagged ? BAND_COLOR[bd] : 'transparent' }}
              />
              <div className="grid h-full grid-cols-[4.6rem_1fr_auto] items-center gap-x-3">
                <span className="mono self-start pt-[0.45rem] text-[0.8rem] text-tx3">{clock(ev.t)}</span>
                <div className="min-w-0 leading-[1.25]">
                  <div className="mono truncate text-[0.74rem] text-tx3">{ev.payer}</div>
                  <div className={`truncate text-[0.86rem] ${flagged ? 'text-tx' : 'text-tx2'}`}>{ev.business.short}</div>
                </div>
                <div className="flex flex-col items-end self-start pt-[0.4rem] leading-[1.25]">
                  <span className="mono text-[0.88rem] text-tx">{brl(ev.amount)}</span>
                  <span className="max-w-[8.5rem] truncate text-[0.7rem] text-tx4">{ev.desc || '—'}</span>
                </div>
              </div>
            </div>
          )
        })}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-panel to-transparent" />
      </div>
      <div className="flex h-9 shrink-0 items-center justify-between border-t border-line px-4 text-[0.72rem] text-tx3">
        <span>Payers masked · individuals are never scored</span>
        <span className="mono">16 accts</span>
      </div>
    </aside>
  )
}
