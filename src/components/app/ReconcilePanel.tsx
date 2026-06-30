import { Check, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface ReconcileRow {
  label: ReactNode
  value: ReactNode
  /** Tint the value green (e.g. "₹0" variance, "None" mismatches). */
  good?: boolean
}

interface ReconcilePanelProps {
  status: 'ok' | 'warn'
  title: string
  subtitle: string
  rows: ReconcileRow[]
  className?: string
}

/** The signature reconciliation card (DESIGN_SYSTEM §1, §6) — flame-tinted, status-led. */
export function ReconcilePanel({ status, title, subtitle, rows, className }: ReconcilePanelProps) {
  const ok = status === 'ok'
  return (
    <div className={cn('bg-flame border border-line rounded-xl shadow-card p-[18px] overflow-hidden relative', className)}>
      <h2 className="text-[15px] font-bold text-ink">Today&rsquo;s reconciliation</h2>

      <div className="flex items-center gap-3 mt-[14px] mb-1">
        <div
          className={cn(
            'h-[46px] w-[46px] rounded-full grid place-items-center shrink-0',
            ok ? 'bg-okbg text-ok' : 'bg-warnbg text-warn',
          )}
        >
          {ok ? <Check size={24} strokeWidth={2.4} /> : <TriangleAlert size={22} strokeWidth={2.2} />}
        </div>
        <div>
          <b className={cn('font-display text-[18px] leading-tight block', ok ? 'text-ok' : 'text-warn')}>
            {title}
          </b>
          <span className="text-xs text-muted">{subtitle}</span>
        </div>
      </div>

      <div className="mt-[14px] border-t border-dashed border-line pt-3 flex flex-col gap-[9px]">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-between items-center text-[13px]">
            <span className="text-muted">{row.label}</span>
            <span className={cn('font-display font-bold num', row.good ? 'text-ok' : 'text-ink')}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
