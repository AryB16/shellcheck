import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { EV_BIZ, EV_TIME, eventsUpTo } from '../data/feed'
import { BUSINESSES, RING_ORDER, SHARED_ADDRESS, SHARED_PHONE } from '../data/model'
import { ADDR_ID, H, PHONE_ID, POS_A, POS_B, W, type Pt } from '../data/layout'
import { clamp01, easeOut, lerp, moneyShort, type Cur } from '../lib/format'
import { BAND_COLOR, band, edgeProgress, hourOf, kickoffShown, moveT, networkTally, scoreOf, type EdgeDef } from '../sim/derive'
import { controls, useSim } from '../sim/store'
import { T2, T4, type Step } from '../sim/timeline'

const EDGES: EdgeDef[] = []
RING_ORDER.forEach((id, k) => {
  EDGES.push({ id: `${id}-phone`, a: id, b: PHONE_ID, kind: 'phone', start: T4.edge0 + 2 * k * T4.edgeGap })
  EDGES.push({ id: `${id}-addr`, a: id, b: ADDR_ID, kind: 'address', start: T4.edge0 + (2 * k + 1) * T4.edgeGap })
})

const UNMASK_AT = T4.partner0
const MAX_HOUR = 38_600
const RED = '#FF5A4E'
const BLUE = '#5B9DFF'
const TEXT = '#F2F3F5'
const CANVAS = '#12151B'
const RIPPLE_SEC = 1.1

const radius = (hour: number) => 8 + Math.sqrt(hour / MAX_HOUR) * 30

// Outline of the ring once unmasked
const RING_PTS = RING_ORDER.map((id) => POS_B[id])
const HULL = {
  cx: RING_PTS.reduce((s, p) => s + p.x, 0) / RING_PTS.length,
  cy: RING_PTS.reduce((s, p) => s + p.y, 0) / RING_PTS.length,
}
const HULL_RX = Math.max(...RING_PTS.map((p) => Math.abs(p.x - HULL.cx))) + 70
const HULL_RY = Math.max(...RING_PTS.map((p) => Math.abs(p.y - HULL.cy))) + 62

function posOf(id: string, t: number): Pt {
  if (id === PHONE_ID || id === ADDR_ID) return POS_B[id]
  const a = POS_A[id]
  const b = POS_B[id]
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }
}

export function NetworkGraph() {
  const step = useSim((s) => s.step)
  const e = useSim((s) => s.elapsed)
  const sim = useSim((s) => s.sim)
  const selected = useSim((s) => s.selected)
  const cur = useSim((s) => s.currency)
  const [hover, setHover] = useState<string | null>(null)

  // Keep labels readable on small screens: scale SVG text up as the canvas shrinks.
  const box = useRef<HTMLDivElement>(null)
  const [k, setK] = useState(1)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const px = Math.min(width / W, height / H) // screen px per SVG unit
      setK(Math.min(2, Math.max(1, 11.5 / (16.5 * px))))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const narrow = k > 1.25

  const t = moveT(step, e)
  const unmasked = step > 4 || (step === 4 && e >= UNMASK_AT)
  const hubScale = step < 4 ? 0 : step > 4 ? 1 : easeOut((e - T4.hubIn) / 320)
  const hullT = step > 4 ? 1 : step === 4 ? clamp01((e - UNMASK_AT) / 700) : 0

  // Every incoming Pix sends a ripple out of the receiving business.
  const lo = eventsUpTo(sim - RIPPLE_SEC)
  const hi = eventsUpTo(sim)
  const ripples = []
  for (let i = Math.max(lo, hi - 40); i < hi; i++) ripples.push({ i, b: BUSINESSES[EV_BIZ[i]], age: (sim - EV_TIME[i]) / RIPPLE_SEC })

  // Phones: zoom towards the network as it forms so it fills the screen.
  const zoom = narrow ? t : 0
  const crop = { x: HULL.cx - HULL_RX - 120, y: HULL.cy - HULL_RY - 250, w: (HULL_RX + 120) * 2, h: HULL_RY * 2 + 250 + 90 }
  const vb = { x: lerp(0, crop.x, zoom), y: lerp(0, crop.y, zoom), w: lerp(W, crop.w, zoom), h: lerp(H, crop.h, zoom) }
  const viewBox = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`

  const nodes = BUSINESSES.map((b) => {
    const score = Math.round(scoreOf(b, step, e))
    return { b, p: posOf(b.id, t), score, bd: band(score), r: radius(hourOf(b, step, e)), dim: !b.ring ? 1 - 0.65 * t : 1 }
  })
  const byId = Object.fromEntries(nodes.map((n) => [n.b.id, n]))

  return (
    <div ref={box} className="dotgrid absolute inset-0">
      <svg viewBox={viewBox} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
        {/* Network outline */}
        {hullT > 0 && (
          <g opacity={hullT}>
            <ellipse cx={HULL.cx} cy={HULL.cy} rx={HULL_RX * lerp(0.9, 1, hullT)} ry={HULL_RY * lerp(0.9, 1, hullT)} fill={RED} fillOpacity={0.035} stroke={RED} strokeOpacity={0.45} strokeWidth={1.5} strokeDasharray="7 7" />
            <text x={HULL.cx} y={HULL.cy - HULL_RY - 10} textAnchor="middle" fontSize={13 * k} fontWeight={600} letterSpacing="0.08em" fill={RED} fontFamily="IBM Plex Sans">
              NETWORK SP-0412
            </text>
          </g>
        )}

        {/* Payment ripples */}
        {ripples.map(({ i, b, age }) => {
          const n = byId[b.id]
          return (
            <circle
              key={i}
              cx={n.p.x}
              cy={n.p.y}
              r={n.r + 3 + 22 * age}
              fill="none"
              stroke={BAND_COLOR[n.bd]}
              strokeWidth={1.5}
              opacity={0.55 * (1 - age) * n.dim}
            />
          )
        })}

        {/* Registry links */}
        {EDGES.map((edge) => {
          const p = edgeProgress(edge, step, e)
          if (p <= 0) return null
          const a = posOf(edge.a, t)
          const b = posOf(edge.b, t)
          return (
            <line key={edge.id} x1={a.x} y1={a.y} x2={lerp(a.x, b.x, p)} y2={lerp(a.y, b.y, p)} stroke={RED} strokeWidth={1.8} strokeOpacity={0.6} strokeLinecap="round" />
          )
        })}

        {/* Registry records: phone + address */}
        {hubScale > 0 &&
          [PHONE_ID, ADDR_ID].map((id) => {
            const p = POS_B[id]
            const phase = id === PHONE_ID && unmasked ? ((e - (step === 4 ? UNMASK_AT : 0)) % 2400) / 1500 : 2
            return (
              <g key={id} transform={`translate(${p.x},${p.y}) scale(${hubScale})`}>
                {phase < 1 && <circle r={18 + 60 * phase} fill="none" stroke={RED} strokeWidth={1.5} strokeOpacity={0.7 * (1 - phase)} />}
                <rect x={-12} y={-12} width={24} height={24} rx={3} transform="rotate(45)" fill={CANVAS} stroke={BLUE} strokeWidth={2.5} />
                <rect x={-5} y={-5} width={10} height={10} rx={1.5} transform="rotate(45)" fill={unmasked ? RED : BLUE} style={{ transition: 'fill 300ms' }} />
              </g>
            )
          })}

        {/* Businesses */}
        {nodes.map(({ b, p, bd, r, dim }) => {
          const c = BAND_COLOR[bd]
          const isSel = selected === b.id
          return (
            <g
              key={b.id}
              transform={`translate(${p.x},${p.y})`}
              opacity={dim}
              onClick={() => controls.select(b.id)}
              onMouseEnter={() => setHover(b.id)}
              onMouseLeave={() => setHover((h) => (h === b.id ? null : h))}
              style={{ cursor: 'pointer' }}
            >
              <circle r={r + 16} fill="transparent" />
              <circle r={r} fill={c} fillOpacity={bd === 'low' ? 0.22 : 0.95} stroke={c} strokeWidth={bd === 'low' ? 1.5 : 0} style={{ transition: 'fill 350ms, stroke 350ms' }} />
              {bd === 'low' && <circle r={2.5} fill={c} />}
              {isSel && <circle r={r + 11} fill="none" stroke={TEXT} strokeWidth={1.5} strokeDasharray="3 4" />}
            </g>
          )
        })}

        {/* Hub labels */}
        {hubScale > 0 &&
          [
            { id: PHONE_ID, title: 'Same phone number', v: SHARED_PHONE },
            { id: ADDR_ID, title: 'Same address', v: SHARED_ADDRESS.split(' – ')[0] },
          ].map(({ id, title, v }) => {
            const p = POS_B[id]
            if (narrow) {
              const tag = `${id === PHONE_ID ? 'PHONE' : 'ADDRESS'}${unmasked ? ' · 7' : ''}`
              const tw = tag.length * 8 + 16
              const tx = id === PHONE_ID ? -24 - tw : 24
              return (
                <g key={id} transform={`translate(${p.x},${p.y}) scale(${k})`} opacity={hubScale}>
                  <rect x={tx} y={-12} width={tw} height={24} rx={6} fill="#161B24" stroke={BLUE} strokeOpacity={0.7} />
                  <text x={tx + tw / 2} y={4.5} textAnchor="middle" fontSize={12} fontWeight={600} fill={unmasked ? RED : BLUE} fontFamily="IBM Plex Sans" letterSpacing="0.05em">
                    {tag}
                  </text>
                </g>
              )
            }
            const w = Math.max(v.length * 8.4, (title.length + (unmasked ? 15 : 0)) * 7.4) + 24
            const x0 = id === PHONE_ID ? -28 - w : 28
            return (
              <g key={id} transform={`translate(${p.x},${p.y - 24})`} opacity={hubScale}>
                <rect x={x0} y={0} width={w} height={48} rx={7} fill="#161B24" stroke={BLUE} strokeOpacity={0.7} strokeWidth={1.2} />
                <text x={x0 + 12} y={19} fontSize={12.5} fill={BLUE} fontFamily="IBM Plex Sans" fontWeight={600}>
                  {title}
                  {unmasked && <tspan fill={RED}> · 7 businesses</tspan>}
                </text>
                <text x={x0 + 12} y={38} fontSize={15} fill={TEXT} fontFamily="IBM Plex Sans" fontWeight={500}>
                  {v}
                </text>
              </g>
            )
          })}

        {/* Labels: only flagged, selected or hovered businesses */}
        {nodes.map(({ b, p, score, bd, r, dim }) => {
          const isSel = selected === b.id
          const isHover = hover === b.id
          const flagged = bd !== 'low'
          // During the unmasking, only the ring keeps its labels.
          if (!b.ring && t > 0.3 && !isSel && !isHover) return null
          if (!flagged && !isSel && !isHover) return null
          const two = b.short.split(' ').slice(0, 2).join(' ')
          const name = !narrow ? b.short : two.length > 13 && b.id !== 'luacheia' ? two.split(' ')[0] : two
          const tw = name.length * 9.2
          const half = ((tw + (flagged ? 40 : 0)) / 2) * k + 6
          const lx = Math.min(vb.x + vb.w - half, Math.max(vb.x + half, p.x))
          return (
            <g key={b.id} transform={`translate(${lx},${p.y + r + 26 * k}) scale(${k})`} opacity={isHover || isSel ? 1 : dim} pointerEvents="none">
              <text
                textAnchor="middle"
                x={flagged ? -22 : 0}
                fontSize={16.5}
                fontFamily="IBM Plex Sans"
                fontWeight={600}
                fill={TEXT}
                stroke={CANVAS}
                strokeWidth={5}
                paintOrder="stroke"
              >
                {name}
              </text>
              {flagged && (
                <g transform={`translate(${tw / 2 - 14},-15)`}>
                  <rect width={34} height={20} rx={10} fill={BAND_COLOR[bd]} />
                  <text x={17} y={14.5} textAnchor="middle" fontSize={12.5} fontWeight={700} fill="#141619" fontFamily="IBM Plex Sans">
                    {score}
                  </text>
                </g>
              )}
              {!flagged && (
                <text y={18} textAnchor="middle" fontSize={12.5} fill="#878C94" fontFamily="IBM Plex Sans" stroke={CANVAS} strokeWidth={4} paintOrder="stroke">
                  {b.activity} · score {score}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <div className="vignette pointer-events-none absolute inset-0" />

      <div className="pointer-events-none absolute left-4 top-4 md:left-5">
        <div className="text-[1rem] font-semibold text-ink">Business network</div>
        <div className="hidden text-[0.8rem] text-tx3 md:block">Each ripple is a Pix payment arriving · bigger circle = more money in the last hour</div>
      </div>
      <KickoffChip step={step} e={e} />
      <NetworkReadout step={step} e={e} cur={cur} />
      <Legend />
      <div className="pointer-events-none absolute bottom-4 right-5 hidden max-w-[46%] text-right lg:block text-[0.7rem] leading-snug text-tx4">
        Source: company fields and CNAE codes follow Receita Federal CNPJ open data; payments follow the Banco Central Pix format. Accounts are simulated.
      </div>
    </div>
  )
}

function KickoffChip({ step, e }: { step: Step; e: number }) {
  const live = kickoffShown(step, e)
  const pre = step === 2 && !live
  const left = Math.max(0, Math.ceil((T2.kickoff - e) / 1000))
  return (
    <AnimatePresence>
      {(live || pre) && (
        <motion.div
          key="ko"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={`absolute right-3 top-3.5 flex items-center gap-2 rounded-full border px-3 py-1.5 md:right-4 md:top-4 md:gap-2.5 md:px-3.5 ${live ? 'border-money/40 bg-moneysoft' : 'border-line2 bg-card'}`}
        >
          <span className={`h-2 w-2 rounded-full ${live ? 'livedot bg-money' : 'bg-tx4'}`} />
          <span className={`text-[0.9rem] font-semibold ${live ? 'text-moneyink' : 'text-tx2'}`}>{live ? <>Kick-off<span className="hidden md:inline"> · 5 matches live</span></> : `Kick-off in ${left}s`}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function NetworkReadout({ step, e, cur }: { step: Step; e: number; cur: Cur }) {
  const show = step > 4 || (step === 4 && e >= T4.edge0)
  const { n, amount } = networkTally(step, e)
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="ro"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute left-4 top-[3.2rem] flex overflow-hidden rounded-xl md:left-5 md:top-[4.4rem] border border-risk/40 bg-card"
        >
          <Stat v={String(n)} k={n === 1 ? 'business' : 'businesses'} c="text-risk" />
          <Stat v={n ? '1' : '0'} k="phone" c="text-link" />
          <Stat v={n ? '1' : '0'} k="address" c="text-link" />
          <Stat v={moneyShort(amount, cur)} k="in 30 days" c="text-moneyink" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const Stat = ({ v, k, c }: { v: string; k: string; c: string }) => (
  <div className="border-r border-line px-3 py-1.5 last:border-r-0 md:px-4 md:py-2">
    <div className={`text-[1.15rem] font-semibold leading-none md:text-[1.5rem] ${c}`}>{v}</div>
    <div className="mt-1 text-[0.76rem] text-tx3">{k}</div>
  </div>
)

function Legend() {
  const Dot = ({ c, hollow }: { c: string; hollow?: boolean }) => (
    <i className="h-2.5 w-2.5 rounded-full" style={hollow ? { border: `1.5px solid ${c}`, background: `${c}33` } : { background: c }} />
  )
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-3 rounded-full md:bottom-3.5 md:left-5 md:gap-4 border border-line bg-card/90 px-3.5 py-1.5 text-[0.78rem] text-tx2">
      <span className="flex items-center gap-1.5"><Dot c="#3DD68C" hollow /> Normal</span>
      <span className="flex items-center gap-1.5"><Dot c="#FFB020" /> Unusual</span>
      <span className="flex items-center gap-1.5"><Dot c="#FF5A4E" /> High risk</span>
      <span className="hidden items-center gap-1.5 md:flex">
        <i className="h-2.5 w-2.5 rotate-45 rounded-[2px] border-[1.5px] border-link" /> Registry record
      </span>
    </div>
  )
}
