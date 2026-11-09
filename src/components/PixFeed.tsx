import { BUSINESSES } from '../data/model'
import { eventAt, eventsUpTo, KICKOFF_SEC } from '../data/feed'
import { clock, money } from '../lib/format'
import { BAND_COLOR, band, scoreOf, type Band } from '../sim/derive'
import { useSim } from '../sim/store'

const ROWS = 26
const ROW_REM = 2.75
const BANDS: Band[] = ['low', 'mid', 'high']

export function PixFeed() {
  const idx = useSim((s) => eventsUpTo(s.sim))
  const rate = useSim((s) => Math.round((eventsUpTo(s.sim) - eventsUpTo(s.sim - 10)) / 10))
  const surge = useSim((s) => s.sim >= KICKOFF_SEC - 30)
  const cur = useSim((s) => s.currency)
  const bands = useSim((s) => BUSINESSES.map((b) => BANDS.indexOf(band(scoreOf(b, s.step, s.elapsed)))).join(''))

  const rows = []
  for (let k = 0; k < ROWS && idx - 1 - k >= 0; k++) rows.push(eventAt(idx - 1 - k))

  return (
    <aside className="card flex min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-start justify-between px-4 pb-3 pt-3.5">
        <div>
          <div className="text-[1rem] font-semibold text-ink">Incoming payments</div>
          <div className="text-[0.8rem] text-tx3">Live Pix into business accounts</div>
        </div>
        <div
          className={`rounded-full px-2.5 py-1 text-[0.8rem] font-medium transition-colors ${
            surge ? 'bg-moneysoft text-moneyink' : 'bg-soft text-tx3'
          }`}
        >
          {rate} / sec
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden border-t border-line">
        {rows.map((ev, k) => {
          const bi = BUSINESSES.indexOf(ev.business)
          const bd = BANDS[Number(bands[bi])] ?? 'low'
          const hot = bd !== 'low'
          return (
            <div
              key={ev.i}
              className={`absolute inset-x-0 border-b border-line/70 px-4 ${k === 0 ? 'row-in' : ''}`}
              style={{ height: `${ROW_REM}rem`, transform: `translateY(${k * ROW_REM}rem)`, transition: 'transform 160ms ease-out' }}
            >
              <div className="flex h-full items-center gap-2.5">
                <span className="mono w-[4.1rem] shrink-0 text-[0.74rem] text-tx4">{clock(ev.t)}</span>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: hot ? BAND_COLOR[bd] : '#E2E5EA' }} />
                <span className={`min-w-0 flex-1 truncate text-[0.9rem] ${hot ? 'font-medium text-ink' : 'text-tx2'}`}>{ev.business.short}</span>
                <span className="shrink-0 text-[0.9rem] font-medium text-ink">{money(ev.amount, cur)}</span>
              </div>
            </div>
          )
        })}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </div>
      <div className="shrink-0 border-t border-line px-4 py-2.5 text-[0.76rem] text-tx3">
        Payers stay anonymous. Only businesses are scored, never people.
      </div>
    </aside>
  )
}
