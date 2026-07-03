import { Navigate, Route, Routes } from 'react-router-dom'
import { RoleGuard } from '@/auth/RoleGuard'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { PlaceholderPage } from '@/features/placeholder/PlaceholderPage'

const OFFICE_AND_OWNER = ['super_admin', 'office_admin']
const OWNER_ONLY = ['super_admin']

/** Route table with role gating (02-FRONTEND-PRD §4). Web is for owner + office staff. */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <RoleGuard allow={OFFICE_AND_OWNER}>
            <DashboardPage />
          </RoleGuard>
        }
      />

      {/* Daily operations — owner + office */}
      <Route path="/stock" element={guard(OFFICE_AND_OWNER, 'Stock Intake', 'Phase 2')} />
      <Route path="/sales/new" element={guard(OFFICE_AND_OWNER, 'Sales Entry', 'Phase 3')} />
      <Route path="/day-sheet" element={guard(OFFICE_AND_OWNER, 'Day Sheet', 'Phase 4')} />
      <Route path="/expenses" element={guard(OFFICE_AND_OWNER, 'Expenses', 'Phase 4')} />

      {/* Owner-only */}
      <Route path="/pricing" element={guard(OWNER_ONLY, 'Daily Pricing', 'Phase 1-E')} />
      <Route path="/catalog" element={guard(OWNER_ONLY, 'Master Catalog', 'Phase 1-C/D')} />
      <Route path="/audit" element={guard(OWNER_ONLY, 'Audit Log', 'Phase 3')} />
      <Route path="/users" element={guard(OWNER_ONLY, 'Users', 'Phase 1-B')} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function guard(allow: string[], title: string, phase: string) {
  return (
    <RoleGuard allow={allow}>
      <PlaceholderPage title={title} phase={phase} />
    </RoleGuard>
  )
}
