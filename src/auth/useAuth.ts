import { useMeV1MeGet } from '@/api/generated/auth/auth'
import type { UserOut } from '@/api/generated/model'
import { useAuthStore } from '@/state/auth'

export interface AuthInfo {
  user: UserOut | null
  role: string | null
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => void
}

/**
 * Verified identity from GET /v1/me (the server is authoritative). The query only runs
 * once an access token exists; loading is true while it resolves so guards can wait
 * instead of bouncing a just-logged-in user.
 */
export function useAuth(): AuthInfo {
  const accessToken = useAuthStore((s) => s.accessToken)
  const clear = useAuthStore((s) => s.clear)

  const me = useMeV1MeGet({ query: { enabled: !!accessToken, retry: false } })
  const envelope = me.data
  const user = envelope && envelope.status === 200 ? envelope.data : null

  return {
    user,
    role: user?.role ?? null,
    isAuthenticated: !!user,
    isLoading: !!accessToken && me.isLoading,
    logout: clear,
  }
}
