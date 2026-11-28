/**
 * Fetch wrapper used by the orval-generated client.
 *
 * Returns orval's fetch envelope `{ status, data, headers }` (never throws on HTTP status;
 * callers branch on `status`). Injects the Bearer access token and, on a 401, transparently
 * refreshes once and retries (02-FRONTEND-PRD §5–6).
 *
 * Renewal happens once at a time: requests that hit a 401 together share one refresh, and
 * tabs take turns (Web Locks) — the server treats a refresh token used twice as stolen.
 */
import { useAuthStore } from '@/state/auth'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function requestWithAuth(url: string, options: RequestInit, token: string | null): Promise<Response> {
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(`${BASE}${url}`, { ...options, headers })
}

let inflight: Promise<boolean> | null = null

function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
  return locks ? (locks.request('ski-auth-refresh', fn) as Promise<T>) : fn()
}

async function reloadFromStorage(): Promise<void> {
  try {
    await useAuthStore.persist.rehydrate()
  } catch {
    // storage unavailable: keep what is in memory
  }
}

/** `usedToken` is the access token the server just refused. */
async function refreshSession(usedToken: string | null): Promise<boolean> {
  await reloadFromStorage() // another tab may have renewed already
  const { accessToken, refreshToken, setTokens, clear } = useAuthStore.getState()
  if (!refreshToken) return false
  if (accessToken && accessToken !== usedToken) return true // already renewed: just retry

  const res = await fetch(`${BASE}/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) {
    await reloadFromStorage()
    // Lost a race with another tab that renewed first: use its tokens.
    if (useAuthStore.getState().refreshToken !== refreshToken) return true
    clear()
    return false
  }
  const data = (await res.json()) as { access_token: string; refresh_token: string }
  setTokens(data.access_token, data.refresh_token)
  return true
}

function tryRefresh(usedToken: string | null): Promise<boolean> {
  if (!inflight) {
    inflight = withRefreshLock(() => refreshSession(usedToken)).finally(() => {
      inflight = null
    })
  }
  return inflight
}

/** Sign out on the server too (the refresh token stops working), then forget the tokens. */
export async function signOut(): Promise<void> {
  const { refreshToken, clear } = useAuthStore.getState()
  clear()
  if (!refreshToken) return
  try {
    await fetch(`${BASE}/v1/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  } catch {
    // offline: the token still expires on its own
  }
}

export const customFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const sent = useAuthStore.getState().accessToken
  let response = await requestWithAuth(url, options, sent)

  const isAuthRoute = url.includes('/v1/auth/')
  if (response.status === 401 && !isAuthRoute && useAuthStore.getState().refreshToken) {
    if (await tryRefresh(sent)) {
      response = await requestWithAuth(url, options, useAuthStore.getState().accessToken)
    }
  }

  const text = await response.text()
  const data = text ? JSON.parse(text) : undefined
  return { status: response.status, data, headers: response.headers } as T
}
