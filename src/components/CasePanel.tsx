import { AnimatePresence, motion } from 'framer-motion'
import {
  BUSINESSES,
  BY_ID,
  RING,
  SHARED_PHONE,
  STATS,
  TAROT,

  type Business,
  type FactorKey,
} from '../data/model'
import { brl0, brlShort, int, pct } from '../lib/format'
import {
  BAND_COLOR,
  TAROT_FLAGS,
  band,
  hourOf,
  isLinked,
  kickoffShown,
  scoreOf,
  tarotFlagsVisible,
  tarotGauge,
} from '../sim/derive'
import { controls, useSim } from '../sim/store'
import { REPORT_DONE, T4, T4_DONE } from '../sim/timeline'
import { KickoffSparkline, RiskGauge } from './Charts'

export function CasePanel() {
  const selected = useSim((s) => s.selected)
  return (
    <aside className="flex min-h-0 flex-col bg-panel">
      <AnimatePresence mode="wait" initial={false}>
        {selected ? (
          <motion.div
            key={selected}
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <CaseView b={BY_ID[selected]} />
          </motion.div>
        ) : (
          <motion.div
            key="watchlist"
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Watchlist />
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  )
}

/* ---------------- Watchlist ---------------- */

function Watchlist() {
  const scores = useSim((s) => BUSINESSES.map((b) => Math.round(scoreOf(b, s.step, s.elapsed))).join(','))
  const hours = useSim((s) => BUSINESSES.map((b) => Math.round(hourOf(b, s.step, s.elapsed) / 100)).join(','))
  const sc = scores.split(',').map(Number)
  const hr = hours.split(',').map((h) => Number(h) * 100)
  const rows = BUSINESSES.map((b, i) => ({ b, score: sc[i], hour: hr[i] })).sort(
    (a, z) => z.score - a.score || z.hour - a.hour,
  )
  return (
    <>
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-line px-5">
        <div className="cap !text-tx2">Watchlist · risk-ranked</div>
        <div className="mono text-[0.78rem] text-tx3">16 accounts</div>
      </div>
      <div className="grid shrink-0 grid-cols-[1fr_5.5rem_4.2rem] gap-x-3 border-b border-line px-5 py-1.5">
        <span className="cap !text-[0.64rem] !text-tx4">Business · declared activity</span>
        <span className="cap !text-right !text-[0.64rem] !text-tx4">R$ · 60 min</span>
        <span className="cap !text-right !text-[0.64rem] !text-tx4">Score</span>
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {rows.map(({ b, score, hour }) => {
          const bd = band(score)
          return (
            <motion.button
              layout="position"
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              key={b.id}
              onClick={(ev) => {
                ev.currentTarget.blur()
                controls.select(b.id)
              }}
              className="grid w-full grid-cols-[1fr_5.5rem_4.2rem] items-center gap-x-3 border-b border-line/70 px-5 py-2 text-left hover:bg-raised"
            >
              <div className="min-w-0">
                <div className={`truncate text-[0.9rem] ${bd === 'low' ? 'text-tx2' : 'text-tx'}`}>{b.short}</div>
                <div className="truncate text-[0.74rem] text-tx3">
                  {b.activity} · {b.staff} staff
                </div>
              </div>
              <div className={`mono text-right text-[0.86rem] ${bd !== 'low' ? 'text-money' : 'text-tx2'}`}>{brlShort(hour)}</div>
              <div className="flex items-center justify-end gap-2">
                <span className="h-[3px] w-6 bg-line">
                  <span className="block h-full" style={{ width: `${score}%`, background: BAND_COLOR[bd] }} />
                </span>
                <span className="mono w-6 text-right text-[0.9rem]" style={{ color: bd === 'low' ? '#A3ADC2' : BAND_COLOR[bd] }}>
                  {score}
                </span>
              </div>
            </motion.button>
          )
        })}
      </div>
      <div className="flex h-10 shrink-0 items-center border-t border-line px-5 text-[0.76rem] text-tx3">
        Select a business on the graph or list to open its case.
      </div>
    </>
  )
}

/* ---------------- Case view ---------------- */

const FLAG_TITLE: Record<FactorKey, string> = {
  volume: 'Volume vs declared size',
  payers: 'Distinct payer count',
  kickoff: 'Kick-off correlation',
  passthrough: 'Rapid pass-through',
}

function CaseView({ b }: { b: Business }) {
  const step = useSim((s) => s.step)
  const isTarot = b.id === TAROT
  const score = useSim((s) => Math.round(isTarot ? tarotGauge(s.step, s.elapsed) : scoreOf(b, s.step, s.elapsed)))
  const nodeScore = useSim((s) => Math.round(scoreOf(b, s.step, s.elapsed)))
  const flagsN = useSim((s) => (isTarot ? tarotFlagsVisible(s.step, s.elapsed) : 4))
  const linked = useSim((s) => (b.ring ? (isTarot ? s.step > 4 || (s.step === 4 && s.elapsed >= T4.partner0 + 250) : isLinked(b.id, s.step, s.elapsed)) : false))
  const ko = useSim((s) => kickoffShown(s.step, s.elapsed))
  const reportPct = useSim((s) => (s.step === 5 ? Math.min(100, Math.floor((s.elapsed / REPORT_DONE) * 100)) : 0))
  const filedAt = useSim((s) => s.filedAt)
  const t4done = useSim((s) => s.step > 4 || (s.step === 4 && s.elapsed >= T4_DONE))

  const bd = band(nodeScore)
  const scored = !isTarot || step >= 3
  const alert = bd === 'high'
  const status = filedAt != null && b.ring ? 'FILED · COAF' : bd === 'high' ? 'ALERT' : bd === 'mid' ? 'ANOMALY' : 'MONITORING'
  const statusColor = filedAt != null && b.ring ? '#DCE2EE' : BAND_COLOR[bd]

  const showFlags = scored
  const flagKeys = TAROT_FLAGS.slice(0, flagsN)

  return (
    <>
      {/* Header */}
      <div className="shrink-0 border-b border-line px-5 pb-3 pt-2.5">
        <div className="flex items-center justify-between">
          <button
            className="cap !text-[0.66rem] hover:!text-tx2"
            onClick={(ev) => {
              ev.currentTarget.blur()
              controls.select(null)
            }}
          >
            ← Watchlist
          </button>
          <span className="mono border px-2 py-[1px] text-[0.7rem] tracking-caps" style={{ color: statusColor, borderColor: statusColor + '99' }}>
            {status}
          </span>
        </div>
        <h2 className="mt-1.5 text-[1.16rem] font-semibold leading-snug text-tx">{b.name}</h2>
        <div className="mono mt-1 flex flex-wrap gap-x-3 text-[0.76rem] text-tx3">
          <span className="text-tx2">{b.cnpj}</span>
          <span>{b.account}</span>
          <span>{b.city}</span>
        </div>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {/* Declared vs observed */}
        <div className="grid grid-cols-2 border-b border-line">
          <div className="border-r border-line px-5 py-3">
            <div className="cap !text-[0.66rem]">Declared · registry</div>
            <div className="mt-1 text-[1.02rem] font-medium text-tx">{b.activity}</div>
            <div className="mono mt-0.5 text-[0.76rem] text-tx3">CNAE {b.cnae}</div>
            <div className="mt-1.5 text-[0.84rem] text-tx2">
              <span className="mono">{b.staff}</span> staff · capital <span className="mono">{brl0(b.capital)}</span>
            </div>
            <div className="text-[0.8rem] text-tx3">
              Opened <span className="mono">{b.opened}</span>
            </div>
          </div>
          <div className={`px-5 py-3 ${alert ? 'bg-risk/[0.05]' : ''}`}>
            <div className="cap !text-[0.66rem]" style={{ color: alert ? '#E5383B' : undefined }}>
              Observed · last 24h
            </div>
            {scored ? (
              <>
                <div className="mt-1 text-[1.02rem] text-tx">
                  <span className="mono font-medium">{int(b.pix24h)}</span> Pix received
                </div>
                <div className="mt-0.5 text-[0.86rem] text-tx2">
                  from <span className="mono text-tx">{int(b.payers24h)}</span> distinct payers
                </div>
                <div className="mt-1.5 text-[0.84rem] text-tx2">
                  <span className="mono text-money">{brlShort(b.amount24h)}</span> in ·{' '}
                  <span className="mono">{pct(b.fwd10)}</span> out ≤10 min
                </div>
              </>
            ) : (
              <>
                <div className="mt-1 text-[1.02rem] text-tx2">Scoring run pending</div>
                {ko ? (
                  <div className="mt-1 text-[0.84rem] text-money">
                    Inflow <span className="mono">{Math.round(b.hourSurge / b.hourCalm)}×</span> hourly baseline since kick-off
                  </div>
                ) : (
                  <div className="mt-1 text-[0.84rem] text-tx3">Next batch on anomaly trigger</div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Gauge + breakdown */}
        <div className="grid grid-cols-[10.5rem_1fr] items-center gap-4 border-b border-line px-5 py-3">
          <div>
            <div className="cap mb-1 !text-[0.66rem]">Risk score / 100</div>
            <RiskGauge value={score} />
          </div>
          <div className="space-y-1.5">
            {(['volume', 'payers', 'kickoff', 'passthrough'] as FactorKey[]).map((k, i) => {
              const on = showFlags && (!isTarot || i < flagsN)
              const pts = b.factors[k]
              return (
                <div key={k} className="grid grid-cols-[1fr_2.6rem] items-center gap-2">
                  <div>
                    <div className={`text-[0.76rem] ${on ? 'text-tx2' : 'text-tx4'}`}>{FLAG_TITLE[k]}</div>
                    <div className="mt-[2px] h-[3px] bg-line">
                      <motion.div
                        className="h-full"
                        style={{ background: alert || isTarot ? '#E5383B' : '#6B7590' }}
                        initial={false}
                        animate={{ width: on ? `${(pts / 30) * 100}%` : '0%' }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                  <span className={`mono text-right text-[0.84rem] ${on ? 'text-tx' : 'text-tx4'}`}>{on ? `+${pts}` : '—'}</span>
                </div>
              )
            })}
            {b.ring && b.networkPts > 0 && (
              <div className="grid grid-cols-[1fr_2.6rem] items-center gap-2">
                <div className={`text-[0.76rem] ${linked ? 'text-risk' : 'text-tx4'}`}>Registry linkage</div>
                <span className={`mono text-right text-[0.84rem] ${linked ? 'text-risk' : 'text-tx4'}`}>{linked ? `+${b.networkPts}` : '—'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Red flags */}
        <div className="px-5 pb-3 pt-2.5">
          <div className="flex items-center justify-between">
            <div className="cap !text-[0.66rem]">{alert || isTarot ? 'Red flags · evidence' : 'Indicators · below alert threshold'}</div>
            <div className="mono text-[0.72rem] text-tx3">
              {showFlags ? (isTarot ? flagKeys.length : 4) + (linked ? 1 : 0) : 0} items
            </div>
          </div>
          {!showFlags && <div className="mt-2 text-[0.84rem] text-tx3">Awaiting behavioural scoring.</div>}
          <div className="mt-1.5 space-y-1.5">
            <AnimatePresence initial={false}>
              {showFlags &&
                (isTarot ? flagKeys : (['volume', 'payers', 'kickoff', 'passthrough'] as FactorKey[])).map((k, i) => (
                  <Flag key={k} n={i + 1} b={b} k={k} strong={alert || isTarot} />
                ))}
              {linked && <NetworkFlag key="net" b={b} n={5} />}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Workflow + actions */}
      {b.ring && alert ? (
        <div className="shrink-0 border-t border-line bg-sunk px-5 py-3">
          <Workflow drafted={reportPct >= 100} drafting={step === 5 && reportPct < 100} filed={filedAt != null} />
          <div className="mt-2.5">
            {step < 5 ? (
              <button
                onClick={(ev) => {
                  ev.currentTarget.blur()
                  controls.draft()
                }}
                className={`flex h-10 w-full items-center justify-between border px-4 text-[0.92rem] font-medium transition-colors ${
                  t4done ? 'border-tx bg-tx text-bg hover:bg-white' : 'border-line2 text-tx hover:border-tx2'
                }`}
              >
                <span>Draft COAF report</span>
                <span className="mono text-[0.76rem] opacity-70">→</span>
              </button>
            ) : filedAt == null ? (
              <div className="flex h-10 items-center justify-between border border-line2 px-4 text-[0.88rem] text-tx2">
                <span>{reportPct < 100 ? 'Drafting report…' : 'Report ready — decision pending'}</span>
                <span className="mono text-[0.8rem] text-tx">{reportPct}%</span>
              </div>
            ) : (
              <div className="flex h-10 items-center justify-between border border-line2 px-4 text-[0.88rem] text-tx">
                <span>Filed with COAF</span>
                <span className="mono text-[0.8rem] text-tx2">SC-2026-0412</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-12 shrink-0 items-center border-t border-line px-5 text-[0.8rem] text-tx3">
          {bd === 'mid' ? 'Anomaly under scoring — no analyst action yet.' : 'Below alert threshold (70) — no action required.'}
        </div>
      )}
    </>
  )
}

function Workflow({ drafted, drafting, filed }: { drafted: boolean; drafting: boolean; filed: boolean }) {
  const steps = [
    { k: 'Detected', state: 'done' },
    { k: 'Report drafted', state: drafted ? 'done' : drafting ? 'active' : 'todo' },
    { k: 'Analyst decision', state: filed ? 'done' : drafted ? 'required' : 'todo' },
    { k: 'Filed', state: filed ? 'done' : 'todo' },
  ]
  return (
    <div className="grid grid-cols-4 gap-1">
      {steps.map((s, i) => (
        <div key={s.k}>
          <div
            className="h-[3px]"
            style={{
              background: s.state === 'done' ? '#DCE2EE' : s.state === 'required' ? '#E5383B' : s.state === 'active' ? '#7A84A0' : '#1B2440',
            }}
          />
          <div
            className={`mt-1 text-[0.7rem] leading-tight ${
              s.state === 'required' ? 'font-medium text-risk' : s.state === 'todo' ? 'text-tx4' : 'text-tx2'
            }`}
          >
            <span className="mono">{String(i + 1).padStart(2, '0')}</span> {s.k}
            {s.state === 'required' && <div className="cap !text-[0.6rem] !text-risk">Required</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

const flagMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const },
}

function FlagShell({ n, title, pts, strong, children, tone = 'risk' }: { n: number; title: string; pts: string; strong: boolean; children: React.ReactNode; tone?: 'risk' | 'muted' }) {
  const c = strong && tone === 'risk' ? '#E5383B' : '#4A5370'
  return (
    <motion.div {...flagMotion} className="relative border border-line bg-raised/60 py-2 pl-4 pr-3">
      <span className="absolute bottom-0 left-0 top-0 w-[2px]" style={{ background: c }} />
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="mono text-[0.72rem] text-tx4">{String(n).padStart(2, '0')}</span>
          <span className={`text-[0.9rem] font-medium ${strong ? 'text-tx' : 'text-tx2'}`}>{title}</span>
        </div>
        <span className="mono text-[0.84rem]" style={{ color: strong ? '#E5383B' : '#6E7891' }}>
          {pts}
        </span>
      </div>
      <div className="mt-1 text-[0.8rem] leading-snug text-tx2">{children}</div>
    </motion.div>
  )
}

const M = ({ children, c }: { children: React.ReactNode; c?: string }) => (
  <span className="mono" style={{ color: c ?? '#DCE2EE' }}>
    {children}
  </span>
)

function Flag({ n, b, k, strong }: { n: number; b: Business; k: FactorKey; strong: boolean }) {
  const pts = `+${b.factors[k]}`
  if (k === 'volume') {
    const ratio = b.pix24h / b.peerPix
    return (
      <FlagShell n={n} title={FLAG_TITLE[k]} pts={pts} strong={strong}>
        <M>{int(b.pix24h)}</M> Pix in 24h with <M>{b.staff}</M> declared staff. Peer median for CNAE {b.cnae}: <M>{int(b.peerPix)}</M>
        {ratio >= 3 && (
          <>
            {' '}— <M c={strong ? '#E5383B' : undefined}>{ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}×</M>
          </>
        )}
        <div className="mt-1.5 space-y-[3px]">
          <Bar label="This account" v={b.pix24h} max={Math.max(b.pix24h, b.peerPix)} c={strong ? '#E5383B' : '#7A84A0'} />
          <Bar label="Peer median" v={b.peerPix} max={Math.max(b.pix24h, b.peerPix)} c="#6B7590" />
        </div>
      </FlagShell>
    )
  }
  if (k === 'payers') {
    return (
      <FlagShell n={n} title={FLAG_TITLE[k]} pts={pts} strong={strong}>
        <M>{int(b.payers24h)}</M> distinct payers in 24h · <M>{pct(b.firstTime)}</M> first-time · median ticket <M>{brl0(b.medianTicket)}</M>
      </FlagShell>
    )
  }
  if (k === 'kickoff') {
    const st = STATS[b.id]
    return (
      <FlagShell n={n} title={FLAG_TITLE[k]} pts={pts} strong={strong}>
        {st.hits > 0 ? (
          <>
            Spikes at <M>{st.hits}</M> of <M>4</M> kick-offs in 48h · peak <M>{st.peak}</M> Pix/min ({st.peakLabel})
          </>
        ) : (
          <>No correlation with match times in 48h.</>
        )}
        <div className="mt-1">
          <div className="cap !text-[0.6rem] !text-tx4">Pix / min · last 48h</div>
          <KickoffSparkline id={b.id} highlight={st.hits > 0} />
        </div>
      </FlagShell>
    )
  }
  const out = b.amount24h * b.fwd10
  return (
    <FlagShell n={n} title={FLAG_TITLE[k]} pts={pts} strong={strong}>
      <M c={strong ? '#F2A900' : undefined}>{pct(b.fwd10)}</M> of inflow forwarded within 10 min (<M>{brlShort(out)}</M> of{' '}
      <M>{brlShort(b.amount24h)}</M>) · peer median <M>{pct(b.peerFwd)}</M>
      <div className="mt-1.5 flex h-[6px] w-full bg-line">
        <div className="h-full" style={{ width: pct(b.fwd10), background: strong ? '#F2A900' : '#6B7590' }} />
      </div>
    </FlagShell>
  )
}

function Bar({ label, v, max, c }: { label: string; v: number; max: number; c: string }) {
  return (
    <div className="grid grid-cols-[5.6rem_1fr_3.2rem] items-center gap-2 text-[0.7rem] text-tx3">
      <span>{label}</span>
      <span className="h-[5px] bg-line">
        <span className="block h-full" style={{ width: `${Math.max(0.6, (v / max) * 100)}%`, background: c }} />
      </span>
      <span className="mono text-right text-tx2">{int(v)}</span>
    </div>
  )
}

function NetworkFlag({ b, n }: { b: Business; n: number }) {
  const others = RING.length - 1
  const total = RING.reduce((s, x) => s + x.inflow30d, 0)
  return (
    <FlagShell n={n} title="Registry linkage" pts={b.networkPts ? `+${b.networkPts}` : 'NETWORK'} strong>
      Shares phone <M>{SHARED_PHONE}</M> and registered address with <M c="#E5383B">{others}</M> other businesses
      {b.partner && <> · common partner R.M.S. in 3</>}. Network total <M c="#F2A900">{brlShort(total)}</M> in 30 days.
    </FlagShell>
  )
}

