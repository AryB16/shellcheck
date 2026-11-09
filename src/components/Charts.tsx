import { KICKOFFS, SERIES, SERIES_MIN } from '../data/model'

const BUCKET = 6

/** Payments per minute over the last 48h, with football kick-offs marked. */
export function KickoffSparkline({ id }: { id: string }) {
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
  const Hd = 54
  const top = 6
  const x = (i: number) => (i / (n - 1)) * Wd
  const y = (v: number) => top + (Hd - top) * (1 - v / max)
  let d = ''
  vals.forEach((v, i) => (d += `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`))
  const area = `${d}L${Wd},${Hd}L0,${Hd}Z`
  return (
    <svg viewBox={`0 0 ${Wd} ${Hd + 16}`} className="block h-auto w-full">
      <line x1={0} y1={Hd} x2={Wd} y2={Hd} stroke="#E6E8EC" />
      <path d={area} fill="#F2A900" fillOpacity={0.16} />
      <path d={d} fill="none" stroke="#D99700" strokeWidth={1.4} />
      {KICKOFFS.map((k) => {
        const kx = (k.idx / SERIES_MIN) * Wd
        return <line key={k.idx} x1={kx} y1={0} x2={kx} y2={Hd} stroke="#0E1525" strokeOpacity={0.35} strokeDasharray="2 3" />
      })}
      <text x={0} y={Hd + 13} fontSize={10} fill="#9AA2B1" fontFamily="IBM Plex Sans">Thu</text>
      <text x={Wd / 2} y={Hd + 13} fontSize={10} fill="#9AA2B1" fontFamily="IBM Plex Sans" textAnchor="middle">Fri</text>
      <text x={Wd} y={Hd + 13} fontSize={10} fill="#9AA2B1" fontFamily="IBM Plex Sans" textAnchor="end">Sat (now)</text>
    </svg>
  )
}
