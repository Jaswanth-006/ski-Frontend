import { useCallback, useState } from 'react'

/**
 * One Idempotency-Key per entry being entered. The same key goes with every retry of that
 * entry (a slow server, a second click), so the server saves it once; call `renew()` after
 * it saved so the next entry gets its own key.
 */
export function useSaveKey() {
  const [key, setKey] = useState(() => crypto.randomUUID())
  const renew = useCallback(() => setKey(crypto.randomUUID()), [])
  return { request: { headers: { 'Idempotency-Key': key } }, renew }
}
