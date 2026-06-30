import { motion, useReducedMotion } from 'framer-motion'
import { Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCountUp } from '@/hooks/useCountUp'
import { inr } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Card } from '@/components/ui/card'

interface KpiCardProps {
  icon: ReactNode
  label: string
  value: number
  /** Prefix for the value, e.g. "₹". */
  prefix?: string
  sub?: ReactNode
  /** 0–100; renders the orange progress bar when set. */
  progress?: number
  /** Tags the metric as owner-only (shows the lock chip). */
  owner?: boolean
  /** When false on an owner metric, the value is hidden (non-owner viewer). */
  canViewValue?: boolean
  className?: string
}

export function KpiCard({
  icon,
  label,
  value,
  prefix = '',
  sub,
  progress,
  owner = false,
  canViewValue = true,
  className,
}: KpiCardProps) {
  const reduceMotion = useReducedMotion()
  const count = useCountUp(value)
  const showValue = !owner || canViewValue

  return (
    <Card className={cn('p-4 pb-[14px] relative overflow-hidden', className)}>
      <div className="flex items-center justify-between">
        <div className="h-[30px] w-[30px] rounded-[9px] grid place-items-center bg-orange-50 text-orange-600">
          {icon}
        </div>
        {owner ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-navy bg-[#EEF2FB] rounded-md px-1.5 py-0.5">
            <Lock size={10} strokeWidth={2.4} />
            Owner
          </span>
        ) : null}
      </div>

      <div className="text-[11.5px] text-muted font-semibold tracking-[.02em] mt-3">{label}</div>
      <div className="num font-display font-extrabold text-[25px] tracking-[-.02em] mt-[3px] text-ink">
        {showValue ? `${prefix}${inr(count)}` : '••••'}
      </div>
      {sub ? <div className="text-[11.5px] text-muted mt-[5px] flex items-center gap-1.5">{sub}</div> : null}

      {typeof progress === 'number' ? (
        <div className="h-[6px] rounded-md bg-line mt-[11px] overflow-hidden">
          <motion.span
            className="block h-full rounded-md bg-gradient-to-r from-orange to-[#FFA15C]"
            initial={reduceMotion ? false : { width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.15 }}
          />
        </div>
      ) : null}
    </Card>
  )
}
