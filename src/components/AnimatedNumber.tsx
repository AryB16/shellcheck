import { animate } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

/** Counts toward new values when data arrives; snaps instantly when values drop (reset). */
export function AnimatedNumber({ value, format, duration = 0.7 }: { value: number; format: (n: number) => string; duration?: number }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    if (value <= from.current) {
      from.current = value
      setShown(value)
      return
    }
    const c = animate(from.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        from.current = v
        setShown(v)
      },
    })
    return () => c.stop()
  }, [value, duration])
  return <>{format(shown)}</>
}
