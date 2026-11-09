import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { REPORT, REPORT_COST, ROW_COST, blockCost, type Block } from '../data/report'
import { clock, clamp01 } from '../lib/format'
import { controls, useSim } from '../sim/store'
import { STEP_BASE, T5 } from '../sim/timeline'

export function ReportDrawer() {
  const open = useSim((s) => s.step === 5)
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="drawer"
          className="absolute inset-0 z-20 flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-bg/70" />
          <motion.div
            className="relative ml-auto flex h-full w-[min(100%,58rem)] flex-col border-l border-line2 bg-panel"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <Report />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Report() {
  const units = useSim((s) => Math.floor(clamp01((s.elapsed - T5.stream) / T5.streamDur) * REPORT_COST))
  const filedAt = useSim((s) => s.filedAt)
  const draftedAt = useSim((s) => Math.floor(Math.max(s.sim - s.elapsed / 1000, STEP_BASE[5] - 1)))
  const done = units >= REPORT_COST
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scroller.current
    if (el && !done) el.scrollTop = el.scrollHeight
  }, [units, done])

  let left = units
  return (
    <>
      <div className="shrink-0 border-b border-line px-7 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <div className="cap !text-tx2">Suspicious activity report · SISCOAF draft</div>
          <span className={`mono border px-2 py-[1px] text-[0.7rem] tracking-caps ${filedAt != null ? 'border-tx2 text-tx' : 'border-line2 text-tx3'}`}>
            {filedAt != null ? 'FILED' : done ? 'DRAFT · AWAITING ANALYST' : 'DRAFTING'}
          </span>
        </div>
        <h2 className="mt-1 text-[1.3rem] font-semibold text-tx">Comunicação de Operação Suspeita — Network SP-0412</h2>
        <div className="mono mt-1 flex flex-wrap gap-x-5 text-[0.76rem] text-tx3">
          <span>Banco Exemplo S.A.</span>
          <span>Prepared by ShellCheck · {clock(draftedAt)} BRT</span>
          <span>Subjects: 7 PJ accounts</span>
        </div>
      </div>

      <div ref={scroller} className="scroll-thin min-h-0 flex-1 overflow-y-auto px-7 py-4">
        {REPORT.map((b, i) => {
          if (left <= 0) return null
          const cost = blockCost(b)
          const shown = Math.min(left, cost)
          const writing = left < cost
          left -= cost
          return <BlockView key={i} b={b} shown={shown} writing={writing} />
        })}
        {!done && <span className="caret mono inline-block h-4 w-2 translate-y-[2px] bg-tx2" />}
      </div>

      <Decision done={done} filedAt={filedAt} />
    </>
  )
}

function BlockView({ b, shown, writing }: { b: Block; shown: number; writing: boolean }) {
  if (b.kind === 'h')
    return <div className="cap mb-1.5 mt-4 border-b border-line pb-1 !text-[0.72rem] !text-tx2 first:mt-0">{b.text.slice(0, shown)}</div>
  if (b.kind === 'p') return <p className="text-[0.92rem] leading-relaxed text-tx">{b.text.slice(0, shown)}{writing && <Caret />}</p>
  if (b.kind === 'ul') {
    let left = shown
    return (
      <ul className="space-y-1">
        {b.items.map((it, i) => {
          if (left <= 0) return null
          const s = it.slice(0, left)
          left -= it.length
          return (
            <li key={i} className="flex gap-3 text-[0.9rem] text-tx">
              <span className="mono text-tx4">{String(i + 1).padStart(2, '0')}</span>
              <span>{s}</span>
            </li>
          )
        })}
      </ul>
    )
  }
  const rows = Math.floor(shown / ROW_COST)
  const body = b.rows.slice(0, Math.max(0, rows - 1))
  const showFoot = b.foot && rows > b.rows.length
  return (
    <table className="w-full border-collapse text-[0.84rem]">
      {rows >= 1 && (
        <thead>
          <tr>
            {b.head.map((h, i) => (
              <th key={h} className={`cap border-b border-line py-1 pr-3 !text-[0.64rem] font-medium ${b.right.includes(i) ? 'text-right' : 'text-left'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {body.map((r, ri) => (
          <motion.tr key={ri} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="border-b border-line/60">
            {r.map((c, ci) => (
              <td
                key={ci}
                className={`py-[5px] pr-3 ${b.right.includes(ci) || ci === 1 ? 'mono' : ''} ${b.right.includes(ci) ? 'text-right' : ''} ${
                  ci === 0 ? 'text-tx' : 'text-tx2'
                } ${b.head[ci] === 'Score' ? '!text-risk' : ''}`}
              >
                {c}
              </td>
            ))}
          </motion.tr>
        ))}
        {showFoot && b.foot && (
          <tr>
            {b.foot.map((c, ci) => (
              <td key={ci} className={`py-[5px] pr-3 font-medium ${b.right.includes(ci) ? 'mono text-right text-money' : 'text-tx'}`}>
                {c}
              </td>
            ))}
          </tr>
        )}
      </tbody>
    </table>
  )
}

const Caret = () => <span className="caret ml-[1px] inline-block h-[0.9em] w-[0.5em] translate-y-[2px] bg-tx2" />

function Decision({ done, filedAt }: { done: boolean; filedAt: number | null }) {
  return (
    <div className="shrink-0 border-t border-line2 bg-sunk px-7 py-4">
      <AnimatePresence mode="wait" initial={false}>
        {filedAt == null ? (
          <motion.div key="ask" exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex items-center justify-between gap-6">
            <div className={`border-l-2 pl-3 ${done ? 'border-risk' : 'border-line2'}`}>
              <div className={`text-[0.95rem] font-semibold tracking-caps ${done ? 'text-risk' : 'text-tx3'}`}>ANALYST DECISION REQUIRED</div>
              <div className="mt-0.5 text-[0.82rem] text-tx2">ShellCheck drafts the report. Only a human analyst can file it with COAF.</div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button disabled={!done} className="h-11 border border-line2 px-4 text-[0.9rem] text-tx2 disabled:opacity-40">
                Return for review
              </button>
              <button
                disabled={!done}
                onClick={(ev) => {
                  ev.currentTarget.blur()
                  controls.file()
                }}
                className="h-11 border border-tx bg-tx px-5 text-[0.95rem] font-semibold text-bg transition-opacity hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
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
            className="flex items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="mono border-2 border-tx px-3 py-1 text-[1rem] font-semibold tracking-caps text-tx"
              >
                FILED
              </motion.div>
              <div>
                <div className="text-[0.95rem] text-tx">
                  Case <span className="mono font-medium">SC-2026-0412</span> · COAF protocol{' '}
                  <span className="mono font-medium">2026.11.0047731</span>
                </div>
                <div className="mono mt-0.5 text-[0.78rem] text-tx3">
                  Approved by analyst A-0417 · {clock(filedAt)} BRT · 7 accounts under enhanced monitoring
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
