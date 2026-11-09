import { BUSINESSES } from '../data/model'
import { pixToday } from '../data/feed'
import { brlShort, clock, int } from '../lib/format'
import { THRESHOLD, scoreOf } from '../sim/derive'
import { useSim } from '../sim/store'
import { AnimatedNumber } from './AnimatedNumber'

function flaggedKey(step: Parameters<typeof scoreOf>[1], e: number) {
  let n = 0
  let amt = 0
  for (const b of BUSINESSES) {
    if (scoreOf(b, step, e) >= THRESHOLD) {
      n++
      amt += b.inflow30d
    }
  }
  return `${n}|${amt}`
}

export function TopBar() {
  const sec = useSim((s) => Math.floor(s.sim))
  const playing = useSim((s) => s.playing)
  const pix = useSim((s) => pixToday(s.sim))
  const flagged = useSim((s) => flaggedKey(s.step, s.elapsed))
  const [nFlag, amt] = flagged.split('|').map(Number)

  return (
    <header className="flex h-14 shrink-0 items-stretch border-b border-line bg-panel">
      {/* Wordmark */}
      <div className="flex items-center gap-4 border-r border-line pl-5 pr-6">
        <div className="flex items-baseline">
          <span className="text-[1.36rem] font-semibold tracking-[-0.02em] text-tx">Shell</span>
          <span className="text-[1.36rem] font-normal tracking-[-0.02em] text-tx2">Check</span>
          <span className="ml-[3px] inline-block h-[7px] w-[7px] translate-y-[-1px] bg-risk" />
        </div>
        <div className="h-6 w-px bg-line2" />
        <div className="leading-tight">
          <div className="text-[0.9rem] font-medium text-tx">Banco Exemplo S.A.</div>
          <div className="cap !text-[0.66rem]">Compliance · Pix PJ monitoring</div>
        </div>
      </div>

      {/* Simulation clock */}
      <div className="flex items-center gap-4 border-r border-line px-6">
        <div>
          <div className="cap !text-[0.66rem]">Simulation clock · BRT</div>
          <div className="mono flex items-baseline gap-2 text-tx">
            <span className="text-[0.86rem] text-tx2">SAT 14 NOV 2026</span>
            <span className="text-[1.3rem] font-medium leading-none">{clock(sec)}</span>
          </div>
        </div>
        <div
          className={`mono flex h-6 w-[78px] items-center justify-center gap-1.5 border text-[0.7rem] tracking-caps ${
            playing ? 'border-line2 text-tx2' : 'border-money/60 text-money'
          }`}
        >
          {playing ? (
            <>
              <span className="h-1.5 w-1.5 bg-tx2" /> LIVE
            </>
          ) : (
            <>
              <span className="flex gap-[2px]">
                <span className="h-2 w-[2px] bg-money" />
                <span className="h-2 w-[2px] bg-money" />
              </span>
              PAUSED
            </>
          )}
        </div>
      </div>

      {/* Counters */}
      <div className="flex flex-1 items-stretch justify-end">
        <Counter label="Pix monitored today" value={int(pix)} />
        <Counter
          label="Businesses flagged"
          value={<AnimatedNumber value={nFlag} format={int} duration={0.4} />}
          tone={nFlag > 0 ? 'risk' : undefined}
        />
        <Counter
          label="R$ under review · 30d"
          value={<AnimatedNumber value={amt} format={(v) => (v < 1 ? 'R$ 0' : brlShort(v))} />}
          tone={amt > 0 ? 'money' : undefined}
          wide
        />
        <div className="flex items-center gap-3 border-l border-line px-5">
          <div className="leading-tight">
            <div className="cap !text-[0.66rem]">Analyst</div>
            <div className="mono text-[0.86rem] text-tx">A-0417</div>
          </div>
        </div>
      </div>
    </header>
  )
}

function Counter({ label, value, tone, wide }: { label: string; value: React.ReactNode; tone?: 'risk' | 'money'; wide?: boolean }) {
  const color = tone === 'risk' ? 'text-risk' : tone === 'money' ? 'text-money' : 'text-tx'
  return (
    <div className={`flex flex-col justify-center border-l border-line px-5 ${wide ? 'min-w-[11.5rem]' : 'min-w-[10rem]'}`}>
      <div className="cap !text-[0.66rem]">{label}</div>
      <div className={`mono text-[1.3rem] font-medium leading-tight ${color}`}>{value}</div>
    </div>
  )
}
