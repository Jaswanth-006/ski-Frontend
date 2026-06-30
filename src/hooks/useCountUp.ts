import { animate, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

/**
 * Count-up animation for KPI numbers (DESIGN_SYSTEM §5): ease-out cubic, ~950ms.
 * Respects prefers-reduced-motion by jumping straight to the target.
 */
export function useCountUp(target: number, durationSeconds = 0.95): number {
  const reduceMotion = useReducedMotion()
  const [value, setValue] = useState(reduceMotion ? target : 0)

  useEffect(() => {
    if (reduceMotion) {
      setValue(target)
      return
    }
    const controls = animate(0, target, {
      duration: durationSeconds,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: setValue,
    })
    return () => controls.stop()
  }, [target, durationSeconds, reduceMotion])

  return value
}
