/**
 * Fetch wrapper used by the orval-generated client.
 *
 * Returns orval's fetch envelope `{ status, data, headers }` (never throws on HTTP status;
 * callers branch on `status`). Injects the Bearer access token and, on a 401, transparently
 * refreshes once and retries (02-FRONTEND-PRD §5–6).
 */
import { useAuthStore } from '@/state/auth'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function requestWithAuth(url: string, options: RequestInit): Promise<Response> {
  const { accessToken } = useAuthStore.getState()
  const headers = new Headers(options.headers)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  return fetch(`${BASE}${url}`, { ...options, headers })
}

async function tryRefresh(): Promise<boolean> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState()
  if (!refreshToken) return false
  const res = await fetch(`${BASE}/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) {
    clear()
    return false
  }
  const data = (await res.json()) as { access_token: string; refresh_token: string }
  setTokens(data.access_token, data.refresh_token)
  return true
}

export const customFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  let response = await requestWithAuth(url, options)

  const isAuthRoute = url.includes('/v1/auth/')
  if (response.status === 401 && !isAuthRoute && useAuthStore.getState().refreshToken) {
    if (await tryRefresh()) {
      response = await requestWithAuth(url, options)
    }
  }

  const text = await response.text()
  const data = text ? JSON.parse(text) : undefined
  return { status: response.status, data, headers: response.headers } as T
}
