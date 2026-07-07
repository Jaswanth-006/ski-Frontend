import { Navigate, Route, Routes } from 'react-router-dom'
import { RoleGuard } from '@/auth/RoleGuard'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { AuditPage } from '@/features/audit/AuditPage'
import { CatalogPage } from '@/features/catalog/CatalogPage'
import { DaySheetPage } from '@/features/day-sheet/DaySheetPage'
import { ExpensesPage } from '@/features/expenses/ExpensesPage'
import { LoginPage } from '@/features/auth/LoginPage'
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
      <Route
        path="/day-sheet"
        element={
          <RoleGuard allow={OFFICE_AND_OWNER}>
            <DaySheetPage />
          </RoleGuard>
        }
      />
      <Route
        path="/expenses"
        element={
          <RoleGuard allow={OFFICE_AND_OWNER}>
            <ExpensesPage />
          </RoleGuard>
        }
      />

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
      <Route
        path="/audit"
        element={
          <RoleGuard allow={OWNER_ONLY}>
            <AuditPage />
          </RoleGuard>
        }
      />
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
