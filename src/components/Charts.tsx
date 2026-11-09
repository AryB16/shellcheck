import { KICKOFFS, SERIES, SERIES_MIN } from '../data/model'
import { BAND_COLOR, THRESHOLD, band } from '../sim/derive'

/** Semicircular 0–100 gauge with alert threshold tick. */
export function RiskGauge({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value))
  const c = BAND_COLOR[band(v)]
  const R = 70
  const cx = 86
  const cy = 84
  const pt = (pctv: number, r = R) => {
    const a = Math.PI * (1 - pctv / 100)
    return [cx + Math.cos(a) * r, cy - Math.sin(a) * r]
  }
  const [x0, y0] = pt(0)
  const [x1, y1] = pt(v)
  const [xe, ye] = pt(100)
  const ticks = Array.from({ length: 11 }, (_, i) => i * 10)
  const [tx0, ty0] = pt(THRESHOLD, R + 9)
  const [tx1, ty1] = pt(THRESHOLD, R - 9)
  return (
    <svg viewBox="0 0 172 100" className="block h-auto w-full">
      <path d={`M${x0},${y0} A${R},${R} 0 0 1 ${xe},${ye}`} fill="none" stroke="#1B2440" strokeWidth={8} />
      {v > 0.3 && <path d={`M${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1}`} fill="none" stroke={c} strokeWidth={8} style={{ transition: 'stroke 300ms' }} />}
      {ticks.map((tk) => {
        const [a, b] = pt(tk, R - 7)
        const [d, e] = pt(tk, R - 12)
        return <line key={tk} x1={a} y1={b} x2={d} y2={e} stroke="#3A4566" strokeWidth={1} />
      })}
      <line x1={tx0} y1={ty0} x2={tx1} y2={ty1} stroke="#E5383B" strokeWidth={1.5} />
      <text x={pt(THRESHOLD, R + 17)[0]} y={pt(THRESHOLD, R + 17)[1] + 2} fontSize={8} fill="#E5383B" fontFamily="IBM Plex Mono" textAnchor="middle">
        70
      </text>
      <text x={x0} y={cy + 13} fontSize={8} fill="#6E7891" fontFamily="IBM Plex Mono" textAnchor="middle">0</text>
      <text x={xe} y={cy + 13} fontSize={8} fill="#6E7891" fontFamily="IBM Plex Mono" textAnchor="middle">100</text>
      <text x={cx} y={cy - 4} fontSize={40} fill={c} fontFamily="IBM Plex Mono" fontWeight={500} textAnchor="middle" style={{ transition: 'fill 300ms' }}>
        {Math.round(v)}
      </text>
    </svg>
  )
}

const BUCKET = 6

/** Pix per minute, trailing 48h, with football kick-off markers. */
export function KickoffSparkline({ id, highlight }: { id: string; highlight: boolean }) {
  const s = SERIES[id]
  const n = SERIES_MIN / BUCKET
  const vals: number[] = []
  for (let i = 0; i < n; i++) {
    let m = 0
    for (let j = 0; j < BUCKET; j++) m = Math.max(m, s[i * BUCKET + j])
    vals.push(m)
  }
  const max = Math.max(...vals, 1)
  const Wd = 400
  const Hd = 64
  const top = 12
  const x = (i: number) => (i / (n - 1)) * Wd
  const y = (v: number) => top + (Hd - top) * (1 - v / max)
  let d = ''
  vals.forEach((v, i) => (d += `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`))
  const area = `${d}L${Wd},${Hd}L0,${Hd}Z`
  const line = highlight ? '#F2A900' : '#7A84A0'
  return (
    <svg viewBox={`0 0 ${Wd} ${Hd + 24}`} className="block h-auto w-full">
      <line x1={0} y1={Hd} x2={Wd} y2={Hd} stroke="#273254" />
      {[1440].map((m) => (
        <line key={m} x1={(m / SERIES_MIN) * Wd} y1={top} x2={(m / SERIES_MIN) * Wd} y2={Hd} stroke="#1B2440" />
      ))}
      <path d={area} fill={line} fillOpacity={0.1} />
      <path d={d} fill="none" stroke={line} strokeWidth={1.2} />
      {KICKOFFS.map((k, i) => {
        const kx = (k.idx / SERIES_MIN) * Wd
        const anchor = kx > Wd - 40 ? 'end' : kx < 40 ? 'start' : 'middle'
        const row = i === 1 ? 1 : 0
        return (
          <g key={k.idx}>
            <line x1={kx} y1={top - 2} x2={kx} y2={Hd + 3 + row * 10} stroke="#DCE2EE" strokeOpacity={0.5} strokeDasharray="2 2" />
            <text x={anchor === 'end' ? Wd : anchor === 'start' ? Math.max(0, kx - 3) : kx} y={Hd + 11 + row * 10} fontSize={8.5} fill="#A3ADC2" fontFamily="IBM Plex Mono" textAnchor={anchor}>
              {k.label}
            </text>
          </g>
        )
      })}
      <text x={2} y={8} fontSize={8} fill="#6E7891" fontFamily="IBM Plex Mono">
        {max}/min
      </text>
    </svg>
  )
}
