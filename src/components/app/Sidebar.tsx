import {
  Banknote,
  Boxes,
  CalendarRange,
  ClipboardList,
  HandCoins,
  Landmark,
  Layers,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Receipt,
  ScrollText,
  Send,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { cn } from '@/lib/cn'
import { BrandMark } from './BrandMark'

interface NavItem {
  label: string
  icon: LucideIcon
  to: string
  end?: boolean
  roles: string[]
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

const ALL = ['super_admin', 'office_admin']
const OWNER = ['super_admin']

const NAV: NavGroup[] = [
  { items: [{ label: 'Dashboard', icon: LayoutDashboard, to: '/', end: true, roles: ALL }] },
  {
    label: 'Daily operations',
    items: [
      { label: 'Stock Intake', icon: Boxes, to: '/stock', roles: ALL },
      { label: 'Sales Entry', icon: Receipt, to: '/sales/new', roles: ALL },
      { label: 'Day Sheet', icon: ClipboardList, to: '/day-sheet', roles: ALL },
      { label: 'Month Sheet', icon: CalendarRange, to: '/month-sheet', roles: ALL },
      { label: 'Expenses', icon: Wallet, to: '/expenses', roles: ALL },
      { label: 'Deposits', icon: Send, to: '/deposits', roles: ALL },
      { label: 'Credit', icon: HandCoins, to: '/credit', roles: ALL },
      { label: 'Cashier Box', icon: Banknote, to: '/cashier-box', roles: ALL },
    ],
  },
  {
    label: 'Manage',
    items: [
      { label: 'Reports', icon: BarChart3, to: '/reports', roles: ALL },
      { label: 'Master Catalog', icon: Layers, to: '/catalog', roles: OWNER },
      { label: 'Banking', icon: Landmark, to: '/banking', roles: OWNER },
      { label: 'Audit Log', icon: ScrollText, to: '/audit', roles: OWNER },
      { label: 'Users', icon: Users, to: '/users', roles: OWNER },
    ],
  },
]

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U'
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Owner · Super Admin',
  office_admin: 'Office Admin',
  delivery: 'Delivery',
}

export function Sidebar() {
  const navigate = useNavigate()
  const { user, role, logout } = useAuth()
  const currentRole = role ?? 'office_admin'

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

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
          const items = group.items.filter((item) => item.roles.includes(currentRole))
          if (items.length === 0) return null
          return (
            <div key={group.label ?? gi} className="flex flex-col gap-0.5">
              {group.label ? (
                <div className="text-[10.5px] tracking-[.14em] uppercase text-[#6F84AC] px-3 pt-3.5 pb-1.5">
                  {group.label}
                </div>
              ) : null}
              {items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-[11px] px-3 py-[9px] rounded-[10px] text-[13.5px] font-medium transition-colors',
                        isActive
                          ? 'bg-orange text-white shadow-nav'
                          : 'text-[#C2CFE6] hover:bg-white/[.06] hover:text-white',
                      )
                    }
                  >
                    <Icon size={18} className="shrink-0" />
                    {item.label}
                  </NavLink>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div className="mt-auto p-3.5 border-t border-white/[.08]">
        <div className="flex items-center gap-2.5 p-2 rounded-xl">
          <div className="h-[34px] w-[34px] rounded-full bg-orange text-white grid place-items-center font-display font-bold text-[13px] shrink-0">
            {initials(user?.name ?? 'User')}
          </div>
          <div className="min-w-0 flex-1">
            <b className="text-white text-[13px] block leading-tight truncate">
              {user?.name ?? '—'}
            </b>
            <span className="text-[11px] text-[#8EA2C6]">{ROLE_LABEL[currentRole] ?? currentRole}</span>
          </div>
          <button
            onClick={onLogout}
            aria-label="Log out"
            className="h-8 w-8 grid place-items-center rounded-lg text-[#8EA2C6] hover:text-white hover:bg-white/[.06] transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
