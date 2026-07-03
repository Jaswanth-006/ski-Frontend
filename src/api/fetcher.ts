/**
 * Fetch wrapper used by the orval-generated client.
 *
 * Phase 0-E keeps it minimal: prefix the API base URL and parse JSON (204 → undefined).
 * The auth (Bearer), idempotency-key, and 401-refresh interceptors are added with the
 * data layer in Phase 1 (02-FRONTEND-PRD §5–6).
 */
export const customFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const base = import.meta.env.VITE_API_BASE_URL ?? ''
  const response = await fetch(`${base}${url}`, options)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}
