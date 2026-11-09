import { useEffect } from 'react'
import { CasePanel } from './components/CasePanel'
import { NetworkGraph } from './components/NetworkGraph'
import { PixFeed } from './components/PixFeed'
import { ReportDrawer } from './components/ReportDrawer'
import { StatusBar } from './components/StatusBar'
import { TopBar } from './components/TopBar'
import { controls, getState } from './sim/store'
import type { Step } from './sim/timeline'

export function App() {
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return
      const k = ev.key
      if (k === ' ' || k === 'ArrowRight' || k === 'ArrowLeft') ev.preventDefault()
      if (ev.repeat) return
      if (k === ' ') controls.toggle()
      else if (k === 'ArrowRight') controls.next()
      else if (k === 'ArrowLeft') controls.prev()
      else if (k === 'r' || k === 'R') controls.reset()
      else if (k >= '1' && k <= '5') controls.goto(Number(k) as Step)
      else if (k === 'Escape' && getState().step < 3) controls.select(null)
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [])

  return (
    <div className="flex h-full flex-col bg-bg">
      <TopBar />
      <main
        className="grid min-h-0 flex-1 border-b border-line"
        style={{ gridTemplateColumns: 'clamp(300px, 20vw, 390px) minmax(0, 1fr) clamp(380px, 25.5vw, 500px)' }}
      >
        <PixFeed />
        <section className="relative min-w-0 overflow-hidden border-x border-line">
          <NetworkGraph />
          <ReportDrawer />
        </section>
        <CasePanel />
      </main>
      <StatusBar />
    </div>
  )
}
