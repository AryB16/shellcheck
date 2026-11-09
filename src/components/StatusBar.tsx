import { controls, useSim } from '../sim/store'
import { STEP_NAMES, type Step } from '../sim/timeline'

const STEPS: Step[] = [1, 2, 3, 4, 5]

export function StatusBar() {
  const step = useSim((s) => s.step)
  return (
    <footer className="flex h-8 shrink-0 items-stretch bg-panel text-[0.74rem]">
      <div className="flex items-stretch">
        {STEPS.map((s) => (
          <button
            key={s}
            onClick={(ev) => {
              ev.currentTarget.blur()
              controls.goto(s)
            }}
            className={`flex items-center gap-2 border-r border-line px-3.5 ${s === step ? 'bg-raised text-tx' : s < step ? 'text-tx2' : 'text-tx4'}`}
          >
            <span className={`mono ${s === step ? 'text-tx' : ''}`}>{String(s).padStart(2, '0')}</span>
            <span>{STEP_NAMES[s]}</span>
            {s === step && <span className="h-1.5 w-1.5 bg-tx" />}
          </button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-4 px-4 text-tx4">
        <span>
          <Key>Space</Key> play/pause <Key>→</Key> next <Key>R</Key> reset <Key>1–5</Key> jump
        </span>
      </div>
      <div className="flex items-center border-l border-line px-4">
        <span className="mono tracking-caps text-tx3">SYNTHETIC DEMO DATA</span>
      </div>
    </footer>
  )
}

const Key = ({ children }: { children: React.ReactNode }) => (
  <span className="mono mx-1 border border-line2 px-1 py-[0px] text-[0.68rem] text-tx3">{children}</span>
)
