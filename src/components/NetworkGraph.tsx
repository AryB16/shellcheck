import { AnimatePresence, motion } from 'framer-motion'
import { BUSINESSES, LEGIT_LINKS, PARTNER_LINKS, RING_ORDER, SHARED_ADDRESS, SHARED_PHONE } from '../data/model'
import { ADDR_ID, H, PHONE_ID, POS_A, POS_B, W, type Pt } from '../data/layout'
import { brlShort, easeOut, lerp } from '../lib/format'
import {
  BAND_COLOR,
  band,
  edgeProgress,
  hourOf,
  kickoffShown,
  moveT,
  networkTally,
  scoreOf,
  type EdgeDef,
} from '../sim/derive'
import { controls, useSim } from '../sim/store'
import { T2, T4, type Step } from '../sim/timeline'

const EDGES: EdgeDef[] = []
RING_ORDER.forEach((id, k) => {
  EDGES.push({ id: `${id}-phone`, a: id, b: PHONE_ID, kind: 'phone', start: T4.edge0 + 2 * k * T4.edgeGap })
  EDGES.push({ id: `${id}-addr`, a: id, b: ADDR_ID, kind: 'address', start: T4.edge0 + (2 * k + 1) * T4.edgeGap })
})
PARTNER_LINKS.forEach((l, j) => EDGES.push({ id: `p-${j}`, a: l.a, b: l.b, kind: 'partner', start: T4.partner0 + j * T4.partnerGap }))
LEGIT_LINKS.forEach((l, j) =>
  EDGES.push({ id: `l-${j}`, a: l.a, b: l.b, kind: l.kind === 'address' ? 'legit-address' : 'legit-partner', start: 0 }),
)

const UNMASK_AT = T4.partner0
const MAX_HOUR = 38_600
const RED = '#E5383B'
const SLATE_LINE = '#3A4566'

const radius = (hour: number) => 8 + Math.sqrt(hour / MAX_HOUR) * 30

function posOf(id: string, t: number): Pt {
  if (id === PHONE_ID || id === ADDR_ID) return POS_B[id]
  const a = POS_A[id]
  const b = POS_B[id]
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }
}

const EDGE_LABEL: Record<EdgeDef['kind'], string> = {
  phone: 'SAME PHONE',
  address: 'SAME ADDRESS',
  partner: 'SAME PARTNER',
  'legit-address': 'SAME ADDRESS',
  'legit-partner': 'SAME PARTNER',
}

function EdgeTag({ x, y, text, color, opacity }: { x: number; y: number; text: string; color: string; opacity: number }) {
  const w = text.length * 7.4 + 12
  return (
    <g opacity={opacity} transform={`translate(${x},${y})`}>
      <rect x={-w / 2} y={-9} width={w} height={18} fill="#0A0F1E" stroke={color} strokeOpacity={0.45} strokeWidth={1} />
      <text textAnchor="middle" y={4} fontSize={11} fill={color} fontFamily="IBM Plex Mono" letterSpacing="0.06em">
        {text}
      </text>
    </g>
  )
}

export function NetworkGraph() {
  const step = useSim((s) => s.step)
  const e = useSim((s) => s.elapsed)
  const selected = useSim((s) => s.selected)

  const t = moveT(step, e)
  const unmasked = step > 4 || (step === 4 && e >= UNMASK_AT)
  const hubScale = step < 4 ? 0 : step > 4 ? 1 : easeOut((e - T4.hubIn) / 320)

  return (
    <div className="gridbg absolute inset-0">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
        {/* Edges */}
        {EDGES.map((edge) => {
          const p = edgeProgress(edge, step, e)
          if (p <= 0) return null
          const a = posOf(edge.a, t)
          const b = posOf(edge.b, t)
          const x2 = lerp(a.x, b.x, p)
          const y2 = lerp(a.y, b.y, p)
          const legit = edge.kind.startsWith('legit')
          const color = legit ? SLATE_LINE : RED
          return (
            <line
              key={edge.id}
              x1={a.x}
              y1={a.y}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth={legit ? 1.2 : edge.kind === 'partner' ? 1.4 : 1.6}
              strokeOpacity={legit ? (step >= 4 ? 0.5 : 0.9) : 0.75}
              strokeDasharray={edge.kind === 'partner' || legit ? '5 4' : undefined}
            />
          )
        })}

        {/* Hubs: shared phone + shared address */}
        {hubScale > 0 &&
          [PHONE_ID, ADDR_ID].map((id) => {
            const p = POS_B[id]
            const c = unmasked ? RED : '#8892AA'
            const pulse = id === PHONE_ID && unmasked
            const phase = pulse ? ((e - (step === 4 ? UNMASK_AT : 0)) % 2400) / 1500 : 2
            return (
              <g key={id} transform={`translate(${p.x},${p.y}) scale(${hubScale})`}>
                {phase < 1 && <circle r={18 + 56 * phase} fill="none" stroke={RED} strokeWidth={1.5} opacity={0.75 * (1 - phase)} />}
                <rect x={-11} y={-11} width={22} height={22} transform="rotate(45)" fill="#0A0F1E" stroke={c} strokeWidth={1.8} style={{ transition: 'stroke 300ms' }} />
                <rect x={-4} y={-4} width={8} height={8} transform="rotate(45)" fill={c} style={{ transition: 'fill 300ms' }} />
              </g>
            )
          })}

        {/* Business nodes */}
        {BUSINESSES.map((b) => {
          const p = posOf(b.id, t)
          const score = scoreOf(b, step, e)
          const bd = band(score)
          const c = BAND_COLOR[bd]
          const r = radius(hourOf(b, step, e))
          const isSel = selected === b.id
          const dim = !b.ring ? 1 - 0.55 * t : 1
          return (
            <g
              key={b.id}
              transform={`translate(${p.x},${p.y})`}
              opacity={dim}
              onClick={() => controls.select(b.id)}
              style={{ cursor: 'pointer' }}
            >
              <circle r={r + 14} fill="transparent" />
              <circle r={r} fill={c} fillOpacity={bd === 'low' ? 0.1 : 0.16} stroke={c} strokeWidth={1.6} style={{ transition: 'fill 350ms, stroke 350ms' }} />
              <circle r={2.4} fill={c} style={{ transition: 'fill 350ms' }} />
              {isSel && <Brackets r={r + 9} />}
            </g>
          )
        })}

        {/* Hub labels */}
        {hubScale > 0 &&
          [
            { id: PHONE_ID, k: 'SHARED PHONE', v: SHARED_PHONE },
            { id: ADDR_ID, k: 'SHARED ADDRESS', v: SHARED_ADDRESS.split(' – ')[0] },
          ].map(({ id, k, v }) => {
            const p = POS_B[id]
            const w = Math.max(v.length * 8.3, (k.length + (unmasked ? 14 : 0)) * 7.6) + 20
            const c = unmasked ? RED : '#8892AA'
            const x0 = id === PHONE_ID ? -26 - w : 26
            return (
              <g key={id} transform={`translate(${p.x},${p.y - 21})`} opacity={hubScale}>
                <rect x={x0} y={0} width={w} height={42} fill="#0A0F1E" stroke={c} strokeOpacity={0.6} />
                <text x={x0 + 10} y={15} fontSize={10.5} fill={c} fontFamily="IBM Plex Sans" fontWeight={600} letterSpacing="0.1em">
                  {k}
                  {unmasked ? ' · 7 BUSINESSES' : ''}
                </text>
                <text x={x0 + 10} y={33} fontSize={14} fill="#DCE2EE" fontFamily="IBM Plex Mono">
                  {v}
                </text>
              </g>
            )
          })}

        {/* Edge tags */}
        {EDGES.map((edge) => {
          const legit = edge.kind.startsWith('legit')
          const p = edgeProgress(edge, step, e)
          if (p < 1) return null
          let op = 1
          if (edge.kind === 'phone' || edge.kind === 'address') {
            if (step !== 4) return null
            const age = e - (edge.start + T4.edgeDur)
            if (age > 1500) return null
            op = age < 1000 ? 1 : 1 - (age - 1000) / 500
          } else if (legit) {
            op = step >= 4 ? 0.45 : 0.9
          }
          const a = posOf(edge.a, t)
          const b = posOf(edge.b, t)
          const f = edge.kind === 'phone' || edge.kind === 'address' ? 0.42 : edge.kind === 'partner' ? 0.66 : 0.5
          return (
            <EdgeTag
              key={edge.id}
              x={lerp(a.x, b.x, f)}
              y={lerp(a.y, b.y, f)}
              text={EDGE_LABEL[edge.kind]}
              color={legit ? '#7A84A0' : RED}
              opacity={op}
            />
          )
        })}

        {/* Node labels on top */}
        {BUSINESSES.map((b) => {
          const p = posOf(b.id, t)
          const score = scoreOf(b, step, e)
          const bd = band(score)
          const r = radius(hourOf(b, step, e))
          const isSel = selected === b.id
          const dim = !b.ring ? 1 - 0.55 * t : 1
          return (
            <g key={b.id} transform={`translate(${p.x},${p.y + r + 19})`} opacity={dim} pointerEvents="none">
              <text
                textAnchor="middle"
                fontSize={14}
                fontFamily="IBM Plex Sans"
                fontWeight={isSel || bd !== 'low' ? 500 : 400}
                fill={isSel || bd === 'high' ? '#DCE2EE' : '#A3ADC2'}
                stroke="#0A0F1E"
                strokeWidth={4}
                paintOrder="stroke"
              >
                {b.short}
                {bd !== 'low' && (
                  <tspan fill={BAND_COLOR[bd]} fontFamily="IBM Plex Mono" fontWeight={500}>
                    {'  '}
                    {Math.round(score)}
                  </tspan>
                )}
              </text>
            </g>
          )
        })}
      </svg>

      <GraphHeader step={step} />
      <KickoffChip step={step} e={e} />
      <NetworkReadout step={step} e={e} />
      <Legend />
    </div>
  )
}

function Brackets({ r }: { r: number }) {
  const l = Math.max(6, r * 0.35)
  const d = `M${-r},${-r + l}V${-r}H${-r + l} M${r - l},${-r}H${r}V${-r + l} M${r},${r - l}V${r}H${r - l} M${-r + l},${r}H${-r}V${r - l}`
  return <path d={d} fill="none" stroke="#DCE2EE" strokeWidth={1.5} />
}

function GraphHeader({ step }: { step: Step }) {
  return (
    <div className="pointer-events-none absolute left-5 top-4">
      <div className="cap !text-tx2">Entity network</div>
      <div className="mt-1 text-[0.8rem] text-tx3">
        16 business accounts · Receita Federal CNPJ registry
        {step >= 4 && <span className="text-tx2"> · 2 shared attributes resolved</span>}
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
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={`absolute right-5 top-4 flex items-center gap-3 border bg-sunk px-3.5 py-2 ${live ? 'border-money' : 'border-line2'}`}
        >
          <span className={`h-2 w-2 ${live ? 'bg-money' : 'bg-tx3'}`} />
          <div className="leading-tight">
            <div className={`text-[0.95rem] font-semibold tracking-caps ${live ? 'text-money' : 'text-tx2'}`}>
              {live ? 'KICK-OFF · 16:00' : `KICK-OFF IN 0:0${left}`}
            </div>
            <div className="text-[0.74rem] text-tx3">Série A · 5 matches · betting deposit window</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function NetworkReadout({ step, e }: { step: Step; e: number }) {
  const show = step > 4 || (step === 4 && e >= T4.edge0)
  const { n, amount } = networkTally(step, e)
  const done = step > 4 || (step === 4 && e >= UNMASK_AT)
  const phones = n > 0 ? 1 : 0
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="ro"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute left-5 top-[4.4rem] border border-risk/70 bg-sunk px-4 py-2.5"
        >
          <div className="cap !text-[0.66rem] !text-risk">{done ? 'Network unmasked' : 'Resolving registry links…'}</div>
          <div className="mono mt-1 flex items-baseline gap-2 whitespace-nowrap text-[1.2rem] text-tx">
            <Num v={n} /> <span className="text-tx2">{n === 1 ? 'business' : 'businesses'}</span>
            <Sep />
            <Num v={phones} /> <span className="text-tx2">phone</span>
            <Sep />
            <Num v={phones} /> <span className="text-tx2">address</span>
          </div>
          <div className="mono mt-0.5 flex items-baseline gap-2 whitespace-nowrap text-[1.2rem]">
            <span className="font-medium text-money">{amount > 0 ? brlShort(amount) : 'R$ 0'}</span>
            <span className="text-[0.9rem] text-tx2">received in 30 days</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const Num = ({ v }: { v: number }) => <span className="font-medium text-tx">{v}</span>
const Sep = () => <span className="text-tx4">·</span>

function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-4 left-5 flex items-center gap-5 text-[0.74rem] text-tx3">
      <span className="flex items-center gap-1.5">
        <svg width="26" height="14">
          <circle cx="5" cy="7" r="3.5" fill="none" stroke="#6B7590" />
          <circle cx="18" cy="7" r="6" fill="none" stroke="#6B7590" />
        </svg>
        Size = R$ received, last 60 min
      </span>
      <span className="flex items-center gap-1.5"><i className="h-2 w-2 border border-node" /> Score &lt; 40</span>
      <span className="flex items-center gap-1.5"><i className="h-2 w-2 border border-money" /> 40–69</span>
      <span className="flex items-center gap-1.5"><i className="h-2 w-2 border border-risk" /> ≥ 70 alert</span>
      <span className="flex items-center gap-1.5">
        <svg width="22" height="10"><line x1="0" y1="5" x2="22" y2="5" stroke="#7A84A0" strokeDasharray="4 3" /></svg>
        Shared registry attribute
      </span>
    </div>
  )
}

