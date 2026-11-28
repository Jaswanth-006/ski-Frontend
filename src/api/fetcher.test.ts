import { useAuthStore } from '@/state/auth'
import { customFetch } from './fetcher'

describe('customFetch token renewal', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    useAuthStore.getState().clear()
  })

  it('renews once when several requests hit an expired token together', async () => {
    useAuthStore.getState().setTokens('old-access', 'refresh-1')
    let refreshes = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.endsWith('/v1/auth/refresh')) {
          refreshes += 1
          await new Promise((r) => setTimeout(r, 10))
          return new Response(JSON.stringify({ access_token: 'new-access', refresh_token: 'refresh-2' }), {
            status: 200,
          })
        }
        const auth = new Headers(init?.headers).get('Authorization')
        return auth === 'Bearer new-access'
          ? new Response('{"ok":true}', { status: 200 })
          : new Response('{"detail":"expired"}', { status: 401 })
      }),
    )

    const results = await Promise.all([
      customFetch<{ status: number }>('/v1/a'),
      customFetch<{ status: number }>('/v1/b'),
      customFetch<{ status: number }>('/v1/c'),
    ])
    expect(results.map((r) => r.status)).toEqual([200, 200, 200])
    expect(refreshes).toBe(1)
    expect(useAuthStore.getState().refreshToken).toBe('refresh-2')
  })

  it('keeps the session in storage so a reload stays signed in', () => {
    useAuthStore.getState().setTokens('a', 'r')
    expect(JSON.parse(localStorage.getItem('ski-session') ?? '{}').state).toMatchObject({
      accessToken: 'a',
      refreshToken: 'r',
    })
  })
})
