import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { FullScreenLoader } from '@/components/app/FullScreenLoader'
import { useAuthStore } from '@/state/auth'
import { useAuth } from './useAuth'

interface RoleGuardProps {
  /** Allowed roles. Omit to allow any authenticated user. */
  allow?: string[]
  children: ReactNode
}

/**
 * Route guard (02-FRONTEND-PRD §4). UI gating is convenience — the backend re-enforces
 * every rule. Not signed in → /login; wrong role → back to the dashboard.
 */
export function RoleGuard({ allow, children }: RoleGuardProps) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const { user, role, isLoading } = useAuth()

  if (!accessToken) return <Navigate to="/login" replace />
  if (isLoading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace />
  if (allow && (!role || !allow.includes(role))) return <Navigate to="/" replace />

  return <>{children}</>
}
