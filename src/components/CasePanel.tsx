import { AnimatePresence, motion } from 'framer-motion'
import { BUSINESSES, BY_ID, RING, RING_TOTAL_30D, STATS, TAROT, type Business, type FactorKey } from '../data/model'
import { int, moneyShort, pct, type Cur } from '../lib/format'
import { BAND_COLOR, THRESHOLD, TAROT_FLAGS, band, isLinked, kickoffShown, scoreOf, tarotFlagsVisible, tarotGauge } from '../sim/derive'
import { controls, useSim } from '../sim/store'
import { REPORT_DONE, T4, T4_DONE } from '../sim/timeline'
import { KickoffSparkline } from './Charts'

export function CasePanel() {
  const selected = useSim((s) => s.selected)
  return (
    <aside className="card flex min-h-[480px] flex-col overflow-hidden lg:min-h-0">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={selected ?? 'empty'}
          className="flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {selected ? <CaseView b={BY_ID[selected]} /> : <EmptyState />}
        </motion.div>
      </AnimatePresence>
    </aside>
  )
}

/* ---------- No case open ---------- */

function EmptyState() {
  const anomaly = useSim((s) => s.step === 2 && kickoffShown(s.step, s.elapsed))
  const scores = useSim((s) => BUSINESSES.map((b) => Math.round(scoreOf(b, s.step, s.elapsed))).join(','))
  const sc = scores.split(',').map(Number)
  const rows = BUSINESSES.map((b, i) => ({ b, score: sc[i] }))
    .filter((r) => r.score >= 40)
    .sort((a, z) => z.score - a.score)
  const open = rows.filter((r) => r.score >= THRESHOLD)
  const watching = rows.filter((r) => r.score < THRESHOLD)
  const t = BY_ID[TAROT]
  return (
    <div className="flex min-h-0 flex-1 flex-col p-5">
      <div className="text-[1rem] font-semibold text-ink">Cases</div>
      <div className="text-[0.8rem] text-tx3">{BUSINESSES.length} business accounts monitored</div>
      <div className="scroll-thin mt-3 min-h-0 flex-1 space-y-4 overflow-y-auto">
        <AnimatePresence initial={false}>
          {anomaly && (
            <motion.button
              key="a"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={(ev) => {
                ev.currentTarget.blur()
                controls.select(TAROT)
              }}
              className="w-full rounded-xl border border-money/40 bg-moneysoft p-4 text-left"
            >
              <div className="text-[0.8rem] font-semibold text-moneyink">New alert · just now</div>
              <div className="mt-1 text-[1.1rem] font-semibold text-ink">{t.short}</div>
              <div className="mt-1 text-[0.9rem] text-tx2">
                Money coming in is <b className="text-ink">{Math.round(t.hourSurge / t.hourCalm)}×</b> its normal rate since kick-off.
              </div>
            </motion.button>
          )}
        </AnimatePresence>
        <CaseList title="Open cases" rows={open.filter((r) => !(anomaly && r.b.id === TAROT))} />
        <CaseList title="Watching" rows={watching.filter((r) => !(anomaly && r.b.id === TAROT))} />
      </div>
      <div className="mt-3 border-t border-line pt-3 text-[0.8rem] text-tx3">Click any business to see why it was scored.</div>
    </div>
  )
}

function CaseList({ title, rows }: { title: string; rows: { b: Business; score: number }[] }) {
  if (!rows.length) return null
  return (
    <div>
      <div className="label mb-1.5">
        {title} · {rows.length}
      </div>
      <div className="overflow-hidden rounded-xl border border-line">
        {rows.map(({ b, score }) => (
          <motion.button
            layout="position"
            key={b.id}
            onClick={(ev) => {
              ev.currentTarget.blur()
              controls.select(b.id)
            }}
            className="flex w-full items-center gap-3 border-b border-line px-3.5 py-2.5 text-left last:border-b-0 hover:bg-soft"
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: BAND_COLOR[band(score)] }} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[0.95rem] font-medium text-ink">{b.short}</div>
              <div className="truncate text-[0.78rem] text-tx3">{b.activity}</div>
            </div>
            <span className="text-[1rem] font-semibold" style={{ color: BAND_COLOR[band(score)] }}>
              {score}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

/* ---------- Case ---------- */

function CaseView({ b }: { b: Business }) {
  const step = useSim((s) => s.step)
  const cur = useSim((s) => s.currency)
  const isTarot = b.id === TAROT
  const score = useSim((s) => Math.round(isTarot ? tarotGauge(s.step, s.elapsed) : scoreOf(b, s.step, s.elapsed)))
  const nodeScore = useSim((s) => Math.round(scoreOf(b, s.step, s.elapsed)))
  const flagsN = useSim((s) => (isTarot ? tarotFlagsVisible(s.step, s.elapsed) : 4))
  const linked = useSim((s) =>
    b.ring ? (isTarot ? s.step > 4 || (s.step === 4 && s.elapsed >= T4.partner0 + 250) : isLinked(b.id, s.step, s.elapsed)) : false,
  )
  const reportPct = useSim((s) => (s.step === 5 ? Math.min(100, Math.floor((s.elapsed / REPORT_DONE) * 100)) : 0))
  const filed = useSim((s) => s.filedAt != null)
  const t4done = useSim((s) => s.step > 4 || (s.step === 4 && s.elapsed >= T4_DONE))

  const bd = band(nodeScore)
  const alert = bd === 'high'
  const scored = !isTarot || step >= 3
  const status = filed && b.ring ? 'Filed with COAF' : alert ? 'High risk' : bd === 'mid' ? 'Unusual' : 'Normal'
  const statusCls = filed && b.ring ? 'bg-ink text-bg' : alert ? 'bg-risksoft text-risk' : bd === 'mid' ? 'bg-moneysoft text-moneyink' : 'bg-soft text-tx2'
  const flagKeys: FactorKey[] = isTarot ? [...TAROT_FLAGS.slice(0, flagsN)] : ['volume', 'payers', 'kickoff', 'passthrough']
  const showFlags = scored && (b.ring || score >= 40)

  return (
    <>
      <div className="shrink-0 px-5 pb-4 pt-4">
        <div className="flex items-center justify-between">
          <button
            className="text-[0.8rem] text-tx3 hover:text-ink"
            onClick={(ev) => {
              ev.currentTarget.blur()
              controls.select(null)
            }}
          >
            ← All cases
          </button>
          <span className={`rounded-full px-2.5 py-0.5 text-[0.78rem] font-semibold ${statusCls}`}>{status}</span>
        </div>
        <h2 className="mt-2 text-[1.3rem] font-semibold leading-tight tracking-[-0.01em] text-ink">{b.short}</h2>
        <div className="text-[0.85rem] text-tx3">{b.city}</div>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        {/* The mismatch */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-soft p-3.5">
            <div className="label">It says it is</div>
            <div className="mt-1.5 text-[1.15rem] font-semibold leading-tight text-ink">{b.activity}</div>
            <div className="mt-1 text-[0.86rem] text-tx2">
              {b.staff} {b.staff === 1 ? 'employee' : 'employees'}
            </div>
          </div>
          <div className={`rounded-xl p-3.5 ${alert ? 'bg-risksoft' : 'bg-soft'}`}>
            <div className={`label ${alert ? '!text-risk' : ''}`}>What its money shows</div>
            {scored ? (
              <>
                <div className="mt-1.5 text-[1.15rem] font-semibold leading-tight text-ink">{int(b.pix24h)} payments</div>
                <div className="mt-1 text-[0.86rem] text-tx2">in 24h, from {int(b.payers24h)} people</div>
              </>
            ) : (
              <>
                <div className="mt-1.5 text-[1.15rem] font-semibold leading-tight text-tx3">Analysing…</div>
                <div className="mt-1 text-[0.86rem] text-tx3">scoring starts on alert</div>
              </>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="mt-4">
          <div className="flex items-end justify-between">
            <div className="label">Risk score</div>
            <div className="leading-none">
              <span className="text-[2.2rem] font-semibold tracking-[-0.02em]" style={{ color: score >= 40 ? BAND_COLOR[band(score)] : '#0E1525', transition: 'color 300ms' }}>
                {score}
              </span>
              <span className="text-[0.95rem] text-tx4"> /100</span>
            </div>
          </div>
          <div className="relative mt-2 h-2.5 rounded-full bg-soft ring-1 ring-line">
            <div className="h-full rounded-full" style={{ width: `${score}%`, background: score >= 40 ? BAND_COLOR[band(score)] : '#B4BCC8' }} />
            <div className="absolute -top-1 bottom-[-4px] w-[2px] bg-ink/60" style={{ left: `${THRESHOLD}%` }} />
          </div>
          <div className="relative mt-1 h-4 text-[0.72rem] text-tx3">
            <span className="absolute -translate-x-1/2" style={{ left: `${THRESHOLD}%` }}>Alert at {THRESHOLD}</span>
          </div>
        </div>

        {/* Flags */}
        <div className="mt-4">
          <div className="label">{!scored ? 'Why it may be flagged' : alert || isTarot ? 'Why it’s flagged' : b.ring ? 'Weak signals on its own' : bd === 'mid' ? 'Why it’s unusual' : 'Checks'}</div>
          {!showFlags && scored && <div className="mt-2 text-[0.9rem] text-tx2">No red flags. Its money matches what it declared.</div>}
          {!scored && <div className="mt-2 text-[0.9rem] text-tx3">Waiting for the scoring run…</div>}
          <div className="mt-2 space-y-2">
            <AnimatePresence initial={false}>
              {showFlags && flagKeys.map((k) => <Flag key={k} b={b} k={k} strong={alert || isTarot} />)}
              {linked && <NetworkFlag key="net" b={b} cur={cur} />}
            </AnimatePresence>
          </div>
        </div>
        {b.note && (
          <div className="mt-4 rounded-xl border border-line bg-soft p-3.5">
            <div className="label">Analyst note</div>
            <div className="mt-1 text-[0.9rem] leading-snug text-tx2">{b.note}</div>
          </div>
        )}
      </div>

      {b.ring && alert && (
        <div className="shrink-0 border-t border-line p-4">
          {step < 5 ? (
            <button
              onClick={(ev) => {
                ev.currentTarget.blur()
                controls.draft()
              }}
              className={`h-11 w-full rounded-lg text-[0.95rem] font-semibold transition-colors ${
                t4done ? 'bg-ink text-bg hover:bg-white' : 'border border-line2 text-ink hover:bg-soft'
              }`}
            >
              Draft report for COAF →
            </button>
          ) : filed ? (
            <button onClick={(ev) => { ev.currentTarget.blur(); controls.showReport() }} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-soft text-[0.92rem] font-medium text-ink hover:bg-line">
              Filed · case SC-2026-0412 · view report
            </button>
          ) : (
            <button onClick={(ev) => { ev.currentTarget.blur(); controls.showReport() }} className="block h-11 w-full overflow-hidden rounded-lg bg-soft ring-1 ring-line">
              <div className="relative flex h-full items-center justify-center text-[0.92rem] font-medium text-ink">
                <div className="absolute inset-y-0 left-0 bg-line" style={{ width: `${reportPct}%` }} />
                <span className="relative">{reportPct < 100 ? `Drafting report… ${reportPct}%` : 'Waiting for analyst decision'}</span>
              </div>
            </button>
          )}
        </div>
      )}
    </>
  )
}

const flagMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const },
}

function FlagRow({ strong, pts, children, extra }: { strong: boolean; pts: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <motion.div {...flagMotion} className={`rounded-xl border p-3 ${strong ? 'border-risk/30 bg-risksoft/40' : 'border-line bg-soft'}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${strong ? 'bg-risk' : 'bg-money'}`} />
        <div className={`flex-1 text-[0.95rem] leading-snug ${strong ? 'text-ink' : 'text-tx2'}`}>{children}</div>
        <span className={`shrink-0 text-[0.85rem] font-semibold ${strong ? 'text-risk' : 'text-tx4'}`}>{pts}</span>
      </div>
      {extra && <div className="mt-2 pl-5">{extra}</div>}
    </motion.div>
  )
}

function Flag({ b, k, strong }: { b: Business; k: FactorKey; strong: boolean }) {
  const pts = `+${b.factors[k]}`
  if (k === 'volume') {
    const r = b.pix24h / b.peerPix
    return (
      <FlagRow strong={strong} pts={pts}>
        {r >= 3 ? (
          <>
            <b>{Math.round(r)}× more payments</b> than similar businesses
          </>
        ) : r >= 1.4 ? (
          <>
            <b>{r.toFixed(1)}×</b> the payments of similar businesses
          </>
        ) : (
          <>Payment volume is normal for its sector</>
        )}
      </FlagRow>
    )
  }
  if (k === 'payers')
    return (
      <FlagRow strong={strong} pts={pts}>
        <b>{int(b.payers24h)} different people</b> paid it in one day
      </FlagRow>
    )
  if (k === 'kickoff') {
    const st = STATS[b.id]
    return (
      <FlagRow strong={strong} pts={pts} extra={st.hits > 0 ? <KickoffSparkline id={b.id} /> : undefined}>
        {st.hits > 0 ? (
          <>
            Payments spike at <b>every football kick-off</b>
          </>
        ) : (
          <>No link to football match times</>
        )}
      </FlagRow>
    )
  }
  return (
    <FlagRow strong={strong} pts={pts}>
      <b>{pct(b.fwd10)} of the money</b> leaves again within 10 minutes
    </FlagRow>
  )
}

function NetworkFlag({ b, cur }: { b: Business; cur: Cur }) {
  return (
    <FlagRow strong pts={b.networkPts ? `+${b.networkPts}` : ''}>
      Shares a phone and address with <b>{RING.length - 1} other businesses</b>, which together received {moneyShort(RING_TOTAL_30D, cur)} in 30 days
    </FlagRow>
  )
}
