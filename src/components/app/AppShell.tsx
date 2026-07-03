import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface AppShellProps {
  title: string
  subtitle?: string
  topbarActions?: ReactNode
  notificationCount?: number
  children: ReactNode
}

/** App frame: navy sidebar + main column with a sticky topbar (DESIGN_SYSTEM §6). */
export function AppShell({
  title,
  subtitle,
  topbarActions,
  notificationCount,
  children,
}: AppShellProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[248px_1fr] min-h-screen">
      <Sidebar />
      <div className="flex flex-col min-w-0">
        <Topbar
          title={title}
          subtitle={subtitle}
          actions={topbarActions}
          notificationCount={notificationCount}
        />
        <main className="px-7 py-6 pb-10 flex flex-col gap-5">{children}</main>
      </div>
    </div>
  )
}
