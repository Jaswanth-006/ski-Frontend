import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * Session tokens (02-FRONTEND-PRD §6). Kept in localStorage so a page reload or a new tab
 * stays signed in (tradeoff: readable by scripts on this origin — the app loads no
 * third-party scripts; the longer-term path is an httpOnly refresh cookie). Every tab
 * shares them: when one tab renews or signs out, the others follow.
 */
interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  setTokens: (accessToken: string, refreshToken: string) => void
  clear: () => void
}

export const SESSION_KEY = 'ski-session'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clear: () => set({ accessToken: null, refreshToken: null }),
    }),
    {
      name: SESSION_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken }),
    },
  ),
)

// Another tab renewed or signed out: pick up its tokens.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === SESSION_KEY) void useAuthStore.persist.rehydrate()
  })
}
