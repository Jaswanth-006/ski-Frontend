import { Navigate, Route, Routes } from 'react-router-dom'
import { RoleGuard } from '@/auth/RoleGuard'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { CatalogPage } from '@/features/catalog/CatalogPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { PlaceholderPage } from '@/features/placeholder/PlaceholderPage'
import { PricingPage } from '@/features/pricing/PricingPage'
import { SalesEntryPage } from '@/features/sales/SalesEntryPage'
import { StockPage } from '@/features/stock/StockPage'
import { UsersPage } from '@/features/users/UsersPage'

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
      <Route
        path="/stock"
        element={
          <RoleGuard allow={OFFICE_AND_OWNER}>
            <StockPage />
          </RoleGuard>
        }
      />
      <Route
        path="/sales/new"
        element={
          <RoleGuard allow={OFFICE_AND_OWNER}>
            <SalesEntryPage />
          </RoleGuard>
        }
      />
      <Route path="/day-sheet" element={guard(OFFICE_AND_OWNER, 'Day Sheet', 'Phase 4')} />
      <Route path="/expenses" element={guard(OFFICE_AND_OWNER, 'Expenses', 'Phase 4')} />

      {/* Owner-only */}
      <Route
        path="/pricing"
        element={
          <RoleGuard allow={OWNER_ONLY}>
            <PricingPage />
          </RoleGuard>
        }
      />
      <Route
        path="/catalog"
        element={
          <RoleGuard allow={OWNER_ONLY}>
            <CatalogPage />
          </RoleGuard>
        }
      />
      <Route path="/audit" element={guard(OWNER_ONLY, 'Audit Log', 'Phase 3')} />
      <Route
        path="/users"
        element={
          <RoleGuard allow={OWNER_ONLY}>
            <UsersPage />
          </RoleGuard>
        }
      />

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
