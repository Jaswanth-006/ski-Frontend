/** The server's `detail` message when it is plain text, otherwise a fallback. */
export function detailOf(data: unknown, fallback: string): string {
  const detail = (data as { detail?: unknown } | null | undefined)?.detail
  return typeof detail === 'string' ? detail : fallback
}
