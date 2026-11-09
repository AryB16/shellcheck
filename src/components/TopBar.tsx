import { BUSINESSES } from '../data/model'
import { clock, int, moneyShort, type Cur } from '../lib/format'
import { THRESHOLD, scoreOf } from '../sim/derive'
import { controls, useSim } from '../sim/store'
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
  const cur = useSim((s) => s.currency)
  const flagged = useSim((s) => flaggedKey(s.step, s.elapsed))
  const [nFlag, amt] = flagged.split('|').map(Number)

  return (
    <header className="flex h-[3.9rem] shrink-0 items-center gap-6 border-b border-line bg-card px-5">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-ink">
            <span className="h-2.5 w-2.5 rounded-[2px] bg-risk" />
          </span>
          <span className="text-[1.3rem] font-semibold tracking-[-0.02em] text-ink">ShellCheck</span>
        </div>
        <span className="h-6 w-px bg-line" />
        <div className="leading-tight">
          <div className="text-[0.92rem] font-medium text-ink">Banco Exemplo S.A.</div>
          <div className="text-[0.76rem] text-tx3">Compliance</div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-7">
        <Kpi
          label="Businesses flagged"
          value={<AnimatedNumber value={nFlag} format={int} duration={0.4} />}
          tone={nFlag > 0 ? 'text-risk' : undefined}
        />
        <Kpi
          label="Money under review"
          value={<AnimatedNumber value={amt} format={(v) => (v < 1 ? moneyShort(0, cur) : moneyShort(v, cur))} />}
          tone={amt > 0 ? 'text-moneyink' : undefined}
        />
        <span className="h-8 w-px bg-line" />
        <CurrencyToggle cur={cur} />
        <div className="flex items-center gap-2.5 rounded-lg border border-line bg-soft px-3 py-1.5">
          <span className={`h-2 w-2 rounded-full ${playing ? 'livedot bg-ok' : 'bg-tx4'}`} />
          <div className="leading-tight">
            <div className="text-[0.95rem] font-medium text-ink">Sat 14 Nov · <span className="mono">{clock(sec)}</span></div>
            <div className="text-[0.7rem] text-tx3">{playing ? 'Live simulation' : 'Paused — press Space'}</div>
          </div>
        </div>
      </div>
    </header>
  )
}

function Kpi({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="text-right leading-tight">
      <div className="text-[0.74rem] text-tx3">{label}</div>
      <div className={`text-[1.3rem] font-semibold ${tone ?? 'text-ink'}`}>{value}</div>
    </div>
  )
}

function CurrencyToggle({ cur }: { cur: Cur }) {
  return (
    <div className="flex rounded-lg border border-line bg-soft p-0.5" title="Press C to switch">
      {(['BRL', 'USD'] as Cur[]).map((c) => (
        <button
          key={c}
          onClick={(ev) => {
            ev.currentTarget.blur()
            controls.setCurrency(c)
          }}
          className={`rounded-md px-2.5 py-1 text-[0.8rem] font-medium transition-colors ${
            cur === c ? 'bg-card text-ink shadow-[0_1px_2px_rgba(0,0,0,0.4)]' : 'text-tx3 hover:text-ink'
          }`}
        >
          {c === 'BRL' ? 'R$ BRL' : '$ USD'}
        </button>
      ))}
    </div>
  )
}
