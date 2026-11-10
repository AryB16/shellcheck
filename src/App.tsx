import { useEffect } from 'react'
import { CasePanel } from './components/CasePanel'
import { NetworkGraph } from './components/NetworkGraph'
import { PixFeed } from './components/PixFeed'
import { ReportDrawer } from './components/ReportDrawer'
import { StoryBar } from './components/StoryBar'
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
      else if (k === 'c' || k === 'C') controls.toggleCurrency()
      else if (k >= '1' && k <= '5') controls.goto(Number(k) as Step)
      else if (k === 'Escape' && getState().step < 3) controls.select(null)
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [])

  return (
    <div className="flex min-h-full flex-col bg-bg lg:h-full">
      <TopBar />
      <StoryBar />
      <main className="flex flex-col gap-3 px-3 pb-4 md:px-4 lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[clamp(305px,20vw,370px)_minmax(0,1fr)_clamp(350px,24vw,450px)]">
        <PixFeed />
        <section className="card relative order-first aspect-[1/1.12] max-h-[78vh] min-h-[400px] md:aspect-auto md:h-[64vh] min-w-0 overflow-hidden lg:order-none lg:h-auto lg:max-h-none lg:min-h-0">
          <NetworkGraph />
          <ReportDrawer />
        </section>
        <CasePanel />
      </main>
      <p className="px-4 pb-5 text-[0.72rem] leading-snug text-tx4 lg:hidden">
        Source: company fields and CNAE codes follow Receita Federal CNPJ open data; payments follow the Banco Central Pix format. Accounts are simulated.
      </p>
    </div>
  )
}
