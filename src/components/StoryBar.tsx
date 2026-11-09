import { AnimatePresence, motion } from 'framer-motion'
import { RING_TOTAL_30D } from '../data/model'
import { moneyShort, type Cur } from '../lib/format'
import { kickoffShown } from '../sim/derive'
import { controls, useSim } from '../sim/store'
import { REPORT_DONE, T4_DONE, type Step } from '../sim/timeline'

/** Plain-English narration so anyone can follow the demo without a presenter. */

const STEPS: { n: Step; name: string }[] = [
  { n: 1, name: 'Watch' },
  { n: 2, name: 'Kick-off' },
  { n: 3, name: 'Score' },
  { n: 4, name: 'Connect' },
  { n: 5, name: 'Report' },
]

type Caption = { key: string; title: string; sub: string; next: string }

function caption(step: Step, e: number, filed: boolean, cur: Cur): Caption {
  switch (step) {
    case 1:
      return {
        key: '1',
        title: 'ShellCheck watches every Pix payment into business accounts',
        sub: 'Pix is Brazil’s instant payment system. Right now, all 16 businesses at this bank look normal.',
        next: 'Start the football match',
      }
    case 2:
      return kickoffShown(step, e)
        ? {
            key: '2b',
            title: 'Kick-off: betting money floods in, disguised as normal payments',
            sub: 'Betting payments are banned, so they are routed to fake businesses. Watch the tarot shop grow.',
            next: 'Investigate the tarot shop',
          }
        : {
            key: '2a',
            title: 'Saturday, 15:59: five football matches are about to start',
            sub: 'Illegal betting sites take deposits right before kick-off.',
            next: 'Investigate the tarot shop',
          }
    case 3:
      return {
        key: '3',
        title: 'A 2-person tarot shop received 4,100 payments in one day',
        sub: 'ShellCheck compares what a business says it does with what its money actually does.',
        next: 'Check who it’s connected to',
      }
    case 4:
      return {
        key: e >= T4_DONE ? '4b' : '4a',
        title: e >= T4_DONE ? 'It’s not one shop. It’s a network of 7' : 'Checking public company records…',
        sub:
          e >= T4_DONE
            ? `All 7 share one phone number and one address, and received ${moneyShort(RING_TOTAL_30D, cur)} in 30 days.`
            : 'Businesses registered with the same phone, address or owner get linked.',
        next: 'Draft the report',
      }
    case 5:
      if (filed)
        return {
          key: '5c',
          title: 'Filed with COAF. 7 shell accounts are now under review',
          sub: 'From first signal to filed report in about a minute, with a human in control.',
          next: 'Restart demo',
        }
      return e >= REPORT_DONE
        ? {
            key: '5b',
            title: 'Your call: approve and file the report',
            sub: 'ShellCheck never files on its own. A human analyst reviews the evidence and decides.',
            next: 'Approve & file',
          }
        : {
            key: '5a',
            title: 'ShellCheck drafts the report for COAF, Brazil’s financial-intelligence unit',
            sub: 'Evidence, entities and a recommended action, written in seconds.',
            next: 'Skip to the decision',
          }
  }
}

export function StoryBar() {
  const step = useSim((s) => s.step)
  const cur = useSim((s) => s.currency)
  const key = useSim((s) => caption(s.step, s.elapsed, s.filedAt != null, s.currency).key)
  const filed = useSim((s) => s.filedAt != null)
  const e = useSim((s) => (s.step === 2 || s.step === 4 || s.step === 5 ? s.elapsed : 0))
  const c = caption(step, e, filed, cur)
  void key

  const onNext = () => (step === 5 && filed ? controls.reset() : controls.next())

  return (
    <div className="flex shrink-0 items-center gap-6 px-4 py-3">
      <div className="card flex flex-1 items-center gap-6 px-5 py-3">
        {/* Progress */}
        <div className="flex shrink-0 items-center gap-1.5">
          {STEPS.map((s) => {
            const state = s.n < step || (s.n === 5 && filed) ? 'done' : s.n === step ? 'now' : 'todo'
            return (
              <button
                key={s.n}
                onClick={(ev) => {
                  ev.currentTarget.blur()
                  controls.goto(s.n)
                }}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.8rem] font-medium transition-colors ${
                  state === 'now'
                    ? 'border-ink bg-ink text-white'
                    : state === 'done'
                      ? 'border-line bg-soft text-tx2 hover:text-ink'
                      : 'border-line text-tx4 hover:text-tx2'
                }`}
              >
                <span className={`grid h-4 w-4 place-items-center rounded-full text-[0.66rem] ${state === 'now' ? 'bg-white text-ink' : state === 'done' ? 'bg-tx3 text-white' : 'bg-line text-tx3'}`}>
                  {state === 'done' ? '✓' : s.n}
                </span>
                {s.name}
              </button>
            )
          })}
        </div>

        <span className="h-10 w-px shrink-0 bg-line" />

        {/* Narration */}
        <div className="relative h-[3.2rem] min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={c.key}
              className="absolute inset-0 flex flex-col justify-center"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="truncate text-[1.28rem] font-semibold tracking-[-0.01em] text-ink">{c.title}</div>
              <div className="truncate text-[0.92rem] text-tx2">{c.sub}</div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {step > 1 && (
            <button
              onClick={(ev) => {
                ev.currentTarget.blur()
                controls.prev()
              }}
              className="h-10 rounded-lg border border-line px-3 text-[0.9rem] text-tx2 hover:border-line2 hover:text-ink"
            >
              ← Back
            </button>
          )}
          <button
            onClick={(ev) => {
              ev.currentTarget.blur()
              onNext()
            }}
            className="flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-[0.92rem] font-medium text-white shadow-sm hover:bg-[#1d2638]"
          >
            {c.next}
            <span className="opacity-70">{step === 5 && filed ? '↺' : '→'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
