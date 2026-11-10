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
    <header className="sticky top-0 z-30 shrink-0 border-b border-line bg-card/95 backdrop-blur lg:static">
      <div className="flex h-14 items-center gap-3 px-3 md:gap-5 md:px-5 lg:h-[3.9rem]">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-[1.25rem] font-semibold tracking-[-0.025em] text-ink">ShellCheck</span>
        </div>
        <span className="hidden h-6 w-px bg-line md:block" />
        <div className="hidden leading-tight md:block">
          <div className="text-[0.9rem] font-medium text-ink">Banco Exemplo S.A.</div>
          <div className="text-[0.74rem] text-tx3">Financial crime compliance</div>
        </div>

        <div className="ml-auto flex items-center gap-3 md:gap-6">
          <div className="hidden items-center gap-6 md:flex">
            <Kpi label="Businesses flagged" value={<AnimatedNumber value={nFlag} format={int} duration={0.4} />} tone={nFlag > 0 ? 'text-risk' : undefined} />
            <Kpi
              label="Money under review"
              value={<AnimatedNumber value={amt} format={(v) => moneyShort(v < 1 ? 0 : v, cur)} />}
              tone={amt > 0 ? 'text-moneyink' : undefined}
            />
            <span className="h-8 w-px bg-line" />
          </div>
          <CurrencyToggle cur={cur} />
          <div className="flex items-center gap-2 rounded-lg border border-line bg-soft px-2.5 py-1.5 md:gap-2.5 md:px-3">
            <span className={`h-2 w-2 rounded-full ${playing ? 'livedot bg-ok' : 'bg-tx4'}`} />
            <div className="leading-tight">
              <div className="text-[0.92rem] font-medium text-ink">
                <span className="hidden md:inline">Sat 14 Nov · </span>
                <span className="mono">{clock(sec)}</span>
              </div>
              <div className="hidden text-[0.7rem] text-tx3 md:block">{playing ? 'Live simulation' : 'Paused — press Space'}</div>
            </div>
          </div>
        </div>
      </div>
      {/* Phone: KPIs on their own row */}
      <div className="flex items-center justify-between gap-4 border-t border-line px-3 py-2 md:hidden">
        <Kpi label="Businesses flagged" value={<AnimatedNumber value={nFlag} format={int} duration={0.4} />} tone={nFlag > 0 ? 'text-risk' : undefined} left />
        <Kpi label="Money under review" value={<AnimatedNumber value={amt} format={(v) => moneyShort(v < 1 ? 0 : v, cur)} />} tone={amt > 0 ? 'text-moneyink' : undefined} />
      </div>
    </header>
  )
}

/** Wordmark glyph: a ledger square with one entry flagged. */
function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
      <rect x="0.5" y="0.5" width="27" height="27" rx="7" fill="#1E222B" stroke="#353B47" />
      <rect x="7" y="8" width="14" height="2" rx="1" fill="#878C94" />
      <rect x="7" y="13" width="9" height="2" rx="1" fill="#FF5A4E" />
      <rect x="7" y="18" width="12" height="2" rx="1" fill="#878C94" />
      <circle cx="20" cy="14" r="2" fill="#FF5A4E" />
    </svg>
  )
}

function Kpi({ label, value, tone, left }: { label: string; value: React.ReactNode; tone?: string; left?: boolean }) {
  return (
    <div className={`leading-tight ${left ? 'text-left' : 'text-right'}`}>
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
          {c}
        </button>
      ))}
    </div>
  )
}
