import { AnimatePresence, motion } from 'framer-motion'
import { BUSINESSES, RING_ORDER, SHARED_ADDRESS, SHARED_PHONE } from '../data/model'
import { ADDR_ID, H, PHONE_ID, POS_A, POS_B, W, type Pt } from '../data/layout'
import { easeOut, lerp, moneyShort, type Cur } from '../lib/format'
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
const RED = '#E5383B'
const INK = '#0E1525'

const radius = (hour: number) => 9 + Math.sqrt(hour / MAX_HOUR) * 30

function posOf(id: string, t: number): Pt {
  if (id === PHONE_ID || id === ADDR_ID) return POS_B[id]
  const a = POS_A[id]
  const b = POS_B[id]
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }
}

export function NetworkGraph() {
  const step = useSim((s) => s.step)
  const e = useSim((s) => s.elapsed)
  const selected = useSim((s) => s.selected)
  const cur = useSim((s) => s.currency)

  const t = moveT(step, e)
  const unmasked = step > 4 || (step === 4 && e >= UNMASK_AT)
  const hubScale = step < 4 ? 0 : step > 4 ? 1 : easeOut((e - T4.hubIn) / 320)

  return (
    <div className="dotgrid absolute inset-0">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0E1525" floodOpacity="0.10" />
          </filter>
        </defs>

        {/* Links */}
        {EDGES.map((edge) => {
          const p = edgeProgress(edge, step, e)
          if (p <= 0) return null
          const a = posOf(edge.a, t)
          const b = posOf(edge.b, t)
          return (
            <line
              key={edge.id}
              x1={a.x}
              y1={a.y}
              x2={lerp(a.x, b.x, p)}
              y2={lerp(a.y, b.y, p)}
              stroke={RED}
              strokeWidth={2}
              strokeOpacity={0.55}
              strokeLinecap="round"
            />
          )
        })}

        {/* Hubs */}
        {hubScale > 0 &&
          [PHONE_ID, ADDR_ID].map((id) => {
            const p = POS_B[id]
            const c = unmasked ? RED : INK
            const phase = id === PHONE_ID && unmasked ? ((e - (step === 4 ? UNMASK_AT : 0)) % 2400) / 1500 : 2
            return (
              <g key={id} transform={`translate(${p.x},${p.y}) scale(${hubScale})`}>
                {phase < 1 && <circle r={18 + 60 * phase} fill={RED} fillOpacity={0.14 * (1 - phase)} stroke={RED} strokeOpacity={0.5 * (1 - phase)} />}
                <rect x={-13} y={-13} width={26} height={26} rx={4} transform="rotate(45)" fill={c} stroke="#E6E9EE" strokeWidth={3} filter="url(#shadow)" style={{ transition: 'fill 300ms' }} />
              </g>
            )
          })}

        {/* Businesses */}
        {BUSINESSES.map((b) => {
          const p = posOf(b.id, t)
          const bd = band(scoreOf(b, step, e))
          const r = radius(hourOf(b, step, e))
          const dim = !b.ring ? 1 - 0.6 * t : 1
          const isSel = selected === b.id
          const low = bd === 'low'
          return (
            <g key={b.id} transform={`translate(${p.x},${p.y})`} opacity={dim} onClick={() => controls.select(b.id)} style={{ cursor: 'pointer' }}>
              <circle r={r + 16} fill="transparent" />
              {!low && <circle r={r + 8} fill={BAND_COLOR[bd]} fillOpacity={0.14} />}
              <circle
                r={r}
                fill={low ? '#D6DBE2' : BAND_COLOR[bd]}
                stroke={low ? '#9EA7B5' : '#E6E9EE'}
                strokeWidth={low ? 1.5 : 3}
                filter={low ? undefined : 'url(#shadow)'}
                style={{ transition: 'fill 350ms, stroke 350ms' }}
              />
              {isSel && <circle r={r + 12} fill="none" stroke={INK} strokeWidth={2} strokeDasharray="4 4" />}
            </g>
          )
        })}

        {/* Hub labels */}
        {hubScale > 0 &&
          [
            { id: PHONE_ID, k: 'Same phone number', v: SHARED_PHONE },
            { id: ADDR_ID, k: 'Same address', v: SHARED_ADDRESS.split(' – ')[0] },
          ].map(({ id, k, v }) => {
            const p = POS_B[id]
            const w = Math.max(v.length * 8.4, (k.length + (unmasked ? 15 : 0)) * 7.4) + 24
            const x0 = id === PHONE_ID ? -30 - w : 30
            return (
              <g key={id} transform={`translate(${p.x},${p.y - 24})`} opacity={hubScale}>
                <rect x={x0} y={0} width={w} height={48} rx={8} fill="#F1F3F6" stroke={unmasked ? RED : '#B7BFCB'} strokeWidth={1.5} filter="url(#shadow)" />
                <text x={x0 + 12} y={19} fontSize={12.5} fill={unmasked ? RED : '#6B7485'} fontFamily="IBM Plex Sans" fontWeight={600}>
                  {k}
                  {unmasked ? ' · 7 businesses' : ''}
                </text>
                <text x={x0 + 12} y={38} fontSize={15} fill={INK} fontFamily="IBM Plex Sans" fontWeight={500}>
                  {v}
                </text>
              </g>
            )
          })}

        {/* Labels */}
        {BUSINESSES.map((b) => {
          const p = posOf(b.id, t)
          const score = Math.round(scoreOf(b, step, e))
          const bd = band(score)
          const r = radius(hourOf(b, step, e))
          const isSel = selected === b.id
          const dim = !b.ring ? 1 - t : 1
          const strong = bd !== 'low' || isSel
          const tw = b.short.length * (strong ? 9.4 : 7.7)
          const pill = bd !== 'low'
          return (
            <g key={b.id} transform={`translate(${p.x},${p.y + r + (isSel ? 30 : 24)})`} opacity={dim} pointerEvents="none">
              <text
                textAnchor="middle"
                x={pill ? -22 : 0}
                fontSize={strong ? 17 : 14.5}
                fontFamily="IBM Plex Sans"
                fontWeight={strong ? 600 : 400}
                fill={strong ? INK : '#7A8394'}
                stroke="#E6E9EE"
                strokeWidth={5}
                paintOrder="stroke"
              >
                {b.short}
              </text>
              {pill && (
                <g transform={`translate(${tw / 2 - 15},-15)`}>
                  <rect width={34} height={20} rx={10} fill={BAND_COLOR[bd]} />
                  <text x={17} y={14.5} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={bd === 'mid' ? INK : '#fff'} fontFamily="IBM Plex Sans">
                    {score}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>

      <div className="pointer-events-none absolute left-5 top-4">
        <div className="text-[1rem] font-semibold text-ink">Business network</div>
        <div className="text-[0.8rem] text-tx3">Bigger circle = more money in the last hour</div>
      </div>
      <KickoffChip step={step} e={e} />
      <NetworkReadout step={step} e={e} cur={cur} />
      <Legend />
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
          className={`absolute right-4 top-4 flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 ${
            live ? 'border-money/50 bg-moneysoft' : 'border-line bg-card'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${live ? 'livedot bg-money' : 'bg-tx4'}`} />
          <span className={`text-[0.9rem] font-semibold ${live ? 'text-moneyink' : 'text-tx2'}`}>
            {live ? 'Kick-off · 5 matches live' : `Kick-off in ${left}s`}
          </span>
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
          className="absolute left-5 top-[4.4rem] flex overflow-hidden rounded-xl border border-risk/40 bg-card shadow-[0_4px_16px_rgba(229,56,59,0.12)]"
        >
          <Stat v={String(n)} k={n === 1 ? 'business' : 'businesses'} />
          <Stat v={n ? '1' : '0'} k="phone" />
          <Stat v={n ? '1' : '0'} k="address" />
          <Stat v={moneyShort(amount, cur)} k="in 30 days" money />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const Stat = ({ v, k, money }: { v: string; k: string; money?: boolean }) => (
  <div className="border-r border-line px-4 py-2 last:border-r-0">
    <div className={`text-[1.5rem] font-semibold leading-none ${money ? 'text-moneyink' : 'text-risk'}`}>{v}</div>
    <div className="mt-1 text-[0.76rem] text-tx3">{k}</div>
  </div>
)

function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-3.5 left-5 flex items-center gap-4 rounded-full border border-line bg-card/90 px-3.5 py-1.5 text-[0.78rem] text-tx2">
      <span className="flex items-center gap-1.5">
        <i className="h-2.5 w-2.5 rounded-full border border-[#9EA7B5] bg-[#D6DBE2]" /> Normal
      </span>
      <span className="flex items-center gap-1.5">
        <i className="h-2.5 w-2.5 rounded-full bg-money" /> Unusual
      </span>
      <span className="flex items-center gap-1.5">
        <i className="h-2.5 w-2.5 rounded-full bg-risk" /> High risk
      </span>
    </div>
  )
}
