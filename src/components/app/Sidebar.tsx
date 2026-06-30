import {
  Boxes,
  ClipboardList,
  IndianRupee,
  Layers,
  LayoutDashboard,
  Receipt,
  ScrollText,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { BrandMark } from './BrandMark'

export type Role = 'super_admin' | 'office_admin'

interface NavItem {
  label: string
  icon: LucideIcon
  href: string
  roles: Role[]
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

const ALL: Role[] = ['super_admin', 'office_admin']
const OWNER: Role[] = ['super_admin']

const NAV: NavGroup[] = [
  { items: [{ label: 'Dashboard', icon: LayoutDashboard, href: '#', roles: ALL }] },
  {
    label: 'Daily operations',
    items: [
      { label: 'Stock Intake', icon: Boxes, href: '#', roles: ALL },
      { label: 'Daily Pricing', icon: IndianRupee, href: '#', roles: OWNER },
      { label: 'Sales Entry', icon: Receipt, href: '#', roles: ALL },
      { label: 'Day Sheet', icon: ClipboardList, href: '#', roles: ALL },
      { label: 'Expenses', icon: Wallet, href: '#', roles: ALL },
    ],
  },
  {
    label: 'Manage',
    items: [
      { label: 'Master Catalog', icon: Layers, href: '#', roles: OWNER },
      { label: 'Audit Log', icon: ScrollText, href: '#', roles: OWNER },
      { label: 'Users', icon: Users, href: '#', roles: OWNER },
    ],
  },
]

interface SidebarProps {
  role?: Role
  active?: string
  user?: { initials: string; name: string; subtitle: string }
}

export function Sidebar({
  role = 'super_admin',
  active = 'Dashboard',
  user = { initials: 'RK', name: 'R. Kamala', subtitle: 'Owner · Super Admin' },
}: SidebarProps) {
  return (
    <aside className="bg-sidebar text-[#C9D4EA] hidden md:flex flex-col sticky top-0 h-screen">
      <div className="flex gap-3 items-center px-5 pt-[22px] pb-[18px]">
        <BrandMark className="shrink-0" />
        <div>
          <b className="font-display font-extrabold text-white text-[15px] tracking-[-.01em] block leading-tight">
            Sree Kamala
          </b>
          <span className="text-[11px] text-[#8EA2C6] tracking-[.08em] uppercase">Indane Agency</span>
        </div>
      </div>

      <nav className="px-3 pt-2 flex flex-col gap-0.5 mt-1.5" aria-label="Primary">
        {NAV.map((group, gi) => {
          const items = group.items.filter((item) => item.roles.includes(role))
          if (items.length === 0) return null
          return (
            <div key={group.label ?? gi} className="flex flex-col gap-0.5">
              {group.label ? (
                <div className="text-[10.5px] tracking-[.14em] uppercase text-[#6F84AC] px-3 pt-3.5 pb-1.5">
                  {group.label}
                </div>
              ) : null}
              {items.map((item) => {
                const isActive = item.label === active
                const Icon = item.icon
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-[11px] px-3 py-[9px] rounded-[10px] text-[13.5px] font-medium transition-colors',
                      isActive
                        ? 'bg-orange text-white shadow-nav'
                        : 'text-[#C2CFE6] hover:bg-white/[.06] hover:text-white',
                    )}
                  >
                    <Icon size={18} className="shrink-0" />
                    {item.label}
                  </a>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div className="mt-auto p-3.5 border-t border-white/[.08]">
        <div className="flex items-center gap-2.5 p-2 rounded-xl">
          <div className="h-[34px] w-[34px] rounded-full bg-orange text-white grid place-items-center font-display font-bold text-[13px] shrink-0">
            {user.initials}
          </div>
          <div>
            <b className="text-white text-[13px] block leading-tight">{user.name}</b>
            <span className="text-[11px] text-[#8EA2C6]">{user.subtitle}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
