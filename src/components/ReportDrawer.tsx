import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef } from 'react'
import { ROW_COST, blockCost, buildReport, reportCost, type Block } from '../data/report'
import { clamp01, clock } from '../lib/format'
import { controls, useSim } from '../sim/store'
import { T5 } from '../sim/timeline'

export function ReportDrawer() {
  const open = useSim((s) => s.step === 5)
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="drawer"
          className="absolute inset-0 z-20 flex items-stretch justify-center bg-ink/20 p-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="flex w-full max-w-[52rem] flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-[0_24px_60px_rgba(14,21,37,0.18)]"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Report />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Report() {
  const cur = useSim((s) => s.currency)
  const blocks = useMemo(() => buildReport(cur), [cur])
  const total = reportCost(blocks)
  const p = useSim((s) => Math.floor(clamp01((s.elapsed - T5.stream) / T5.streamDur) * 1000))
  const units = Math.floor((p / 1000) * total)
  const filedAt = useSim((s) => s.filedAt)
  const done = p >= 1000
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    if (!done) el.scrollTop = el.scrollHeight
    else el.scrollTo({ top: 0, behavior: 'smooth' })
  }, [units, done])

  let left = units
  return (
    <>
      <div className="flex shrink-0 items-start justify-between border-b border-line px-7 py-5">
        <div>
          <div className="text-[0.8rem] font-medium text-tx3">Draft for COAF · Brazil’s financial-intelligence unit</div>
          <h2 className="mt-0.5 text-[1.4rem] font-semibold tracking-[-0.01em] text-ink">Suspicious activity report</h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[0.8rem] font-semibold ${
            filedAt != null ? 'bg-ink text-white' : done ? 'bg-risksoft text-risk' : 'bg-soft text-tx2'
          }`}
        >
          {filedAt != null ? 'Filed' : done ? 'Needs your decision' : 'Writing…'}
        </span>
      </div>

      <div ref={scroller} className="scroll-thin min-h-0 flex-1 overflow-y-auto px-7 py-5">
        {blocks.map((b, i) => {
          if (left <= 0) return null
          const cost = blockCost(b)
          const shown = Math.min(left, cost)
          const writing = left < cost
          left -= cost
          return <BlockView key={i} b={b} shown={shown} writing={writing} />
        })}
      </div>

      <Decision done={done} filedAt={filedAt} />
    </>
  )
}

const Caret = () => <span className="caret ml-[1px] inline-block h-[1em] w-[2px] translate-y-[3px] bg-ink" />

function BlockView({ b, shown, writing }: { b: Block; shown: number; writing: boolean }) {
  if (b.kind === 'h') return <div className="mb-2 mt-5 text-[0.95rem] font-semibold text-ink first:mt-0">{b.text.slice(0, shown)}</div>
  if (b.kind === 'p')
    return (
      <p className="text-[1rem] leading-relaxed text-tx2">
        {b.text.slice(0, shown)}
        {writing && <Caret />}
      </p>
    )
  if (b.kind === 'ul') {
    let left = shown
    return (
      <ul className="space-y-1.5">
        {b.items.map((it, i) => {
          if (left <= 0) return null
          const s = it.slice(0, left)
          left -= it.length
          return (
            <li key={i} className="flex gap-3 text-[0.98rem] text-tx2">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-tx3" />
              <span>
                {s}
                {writing && left <= 0 && <Caret />}
              </span>
            </li>
          )
        })}
      </ul>
    )
  }
  const rows = Math.floor(shown / ROW_COST)
  const body = b.rows.slice(0, Math.max(0, rows - 1))
  const showFoot = rows > b.rows.length
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="w-full border-collapse text-[0.92rem]">
        <thead>
          <tr className="bg-soft">
            {b.head.map((h, i) => (
              <th key={h} className={`px-4 py-2 text-[0.78rem] font-semibold text-tx3 ${i === 2 ? 'text-right' : 'text-left'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, ri) => (
            <motion.tr key={ri} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="border-t border-line">
              {r.map((c, ci) => (
                <td key={ci} className={`px-4 py-2 ${ci === 0 ? 'font-medium text-ink' : 'text-tx2'} ${ci === 2 ? 'text-right' : ''}`}>
                  {c}
                </td>
              ))}
            </motion.tr>
          ))}
          {showFoot && (
            <tr className="border-t border-line2 bg-soft">
              {b.foot.map((c, ci) => (
                <td key={ci} className={`px-4 py-2 font-semibold ${ci === 2 ? 'text-right text-moneyink' : 'text-ink'}`}>
                  {c}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function Decision({ done, filedAt }: { done: boolean; filedAt: number | null }) {
  return (
    <div className={`shrink-0 border-t px-7 py-4 transition-colors ${done && filedAt == null ? 'border-risk/30 bg-risksoft/60' : 'border-line bg-soft'}`}>
      <AnimatePresence mode="wait" initial={false}>
        {filedAt == null ? (
          <motion.div key="ask" exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex items-center justify-between gap-6">
            <div>
              <div className={`text-[1rem] font-semibold ${done ? 'text-risk' : 'text-tx3'}`}>Analyst decision required</div>
              <div className="text-[0.88rem] text-tx2">ShellCheck drafts. Only a person can file.</div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button disabled={!done} className="h-11 rounded-lg border border-line2 bg-card px-4 text-[0.92rem] text-tx2 disabled:opacity-40">
                Send back
              </button>
              <button
                disabled={!done}
                onClick={(ev) => {
                  ev.currentTarget.blur()
                  controls.file()
                }}
                className="h-11 rounded-lg bg-ink px-5 text-[0.95rem] font-semibold text-white shadow-sm hover:bg-[#1d2638] disabled:cursor-not-allowed disabled:opacity-30"
              >
                Approve &amp; file
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="filed"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-4"
          >
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="grid h-10 w-10 place-items-center rounded-full bg-ink text-[1.1rem] text-white"
            >
              ✓
            </motion.span>
            <div>
              <div className="text-[1.05rem] font-semibold text-ink">
                Filed · case <span className="mono">SC-2026-0412</span>
              </div>
              <div className="text-[0.86rem] text-tx2">Approved by analyst A-0417 at {clock(filedAt)}. 7 accounts now under enhanced monitoring.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
