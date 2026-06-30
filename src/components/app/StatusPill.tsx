import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'ok' | 'warn' | 'open'
type Size = 'sm' | 'md'

interface StatusPillProps {
  variant: Variant
  size?: Size
  /** Show a leading status dot (used by the "Day open" pill). */
  dot?: boolean
  children: ReactNode
  className?: string
}

const variantStyles: Record<Variant, string> = {
  ok: 'bg-okbg text-ok',
  warn: 'bg-warnbg text-warn',
  open: 'bg-okbg text-ok',
}

const sizeStyles: Record<Size, string> = {
  sm: 'text-[10.5px] px-[9px] py-[3px]',
  md: 'text-xs px-[11px] py-[6px]',
}

export function StatusPill({ variant, size = 'md', dot = false, children, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[7px] font-semibold rounded-full whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {dot ? (
        <span className="h-[7px] w-[7px] rounded-full bg-ok shadow-[0_0_0_3px_rgba(30,158,98,.18)]" />
      ) : null}
      {children}
    </span>
  )
}
