import { Bell } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface TopbarProps {
  title: string
  subtitle?: string
  /** Page-specific action buttons rendered on the right (before the bell). */
  actions?: ReactNode
  notificationCount?: number
}

export function Topbar({ title, subtitle, actions, notificationCount = 0 }: TopbarProps) {
  return (
    <header className="flex items-center justify-between gap-4 px-7 py-[18px] bg-white/80 backdrop-blur border-b border-line sticky top-0 z-10">
      <div>
        <h1 className="text-[20px] font-bold text-ink">{title}</h1>
        {subtitle ? <div className="text-[12.5px] text-muted mt-0.5">{subtitle}</div> : null}
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell size={18} />
          {notificationCount > 0 ? (
            <span className="absolute -top-1 -right-1 bg-orange text-white text-[10px] font-bold min-w-[16px] h-4 rounded-lg grid place-items-center px-[3px]">
              {notificationCount}
            </span>
          ) : null}
        </Button>
      </div>
    </header>
  )
}
