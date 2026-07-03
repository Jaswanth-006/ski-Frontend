import { create } from 'zustand'

/**
 * Session tokens (02-FRONTEND-PRD §6). Access token in memory; refresh token in memory too
 * for this build (documented tradeoff — a page reload requires re-login). The production
 * path is an httpOnly refresh cookie set by the backend.
 */
interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  setTokens: (accessToken: string, refreshToken: string) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
  clear: () => set({ accessToken: null, refreshToken: null }),
}))
