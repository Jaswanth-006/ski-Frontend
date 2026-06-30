import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface GaugeProps {
  name: ReactNode
  /** Small muted qualifier shown next to the name, e.g. "Domestic". */
  sub?: string
  /** Right-aligned figure, e.g. "268 sold · 52 left". */
  figure: ReactNode
  /** 0–100. */
  value: number
  fill?: 'navy' | 'orange'
  className?: string
}

const fillStyles = {
  navy: 'bg-gradient-to-r from-navy to-[#3C63A8]',
  orange: 'bg-gradient-to-r from-orange to-[#FF9550]',
}

export function Gauge({ name, sub, figure, value, fill = 'orange', className }: GaugeProps) {
  const reduceMotion = useReducedMotion()
  return (
    <div className={className}>
      <div className="flex justify-between items-baseline mb-[7px]">
        <div className="text-[13px] font-semibold text-ink">
          {name}
          {sub ? <small className="text-muted font-medium ml-1.5 text-[11px]">{sub}</small> : null}
        </div>
        <div className="text-[12.5px] text-muted">{figure}</div>
      </div>
      <div className="h-[9px] rounded-md bg-line overflow-hidden">
        <motion.span
          className={cn('block h-full rounded-md', fillStyles[fill])}
          initial={reduceMotion ? false : { width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.15 }}
        />
      </div>
    </div>
  )
}
