import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-card border border-line rounded-xl shadow-card', className)} {...props} />
}

interface CardHeaderProps {
  title: ReactNode
  hint?: ReactNode
  right?: ReactNode
  className?: string
}

export function CardHeader({ title, hint, right, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-[18px] pt-4 pb-1', className)}>
      <div>
        <h2 className="text-[15px] font-bold text-ink">{title}</h2>
        {hint ? <div className="text-[11.5px] text-muted mt-0.5">{hint}</div> : null}
      </div>
      {right ? <div className="flex items-center">{right}</div> : null}
    </div>
  )
}
