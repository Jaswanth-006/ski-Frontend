import { inr } from '@/lib/format'
import { cn } from '@/lib/cn'

interface MoneyProps {
  value: number
  /** Hide the ₹ prefix (e.g. when a column header already shows the unit). */
  bare?: boolean
  className?: string
}

/** Renders an amount with Indian grouping and tabular figures (DESIGN_SYSTEM §3, §6). */
export function Money({ value, bare = false, className }: MoneyProps) {
  const sign = value < 0 ? '-' : ''
  return (
    <span className={cn('num', className)}>
      {sign}
      {bare ? '' : '₹'}
      {inr(Math.abs(value))}
    </span>
  )
}
