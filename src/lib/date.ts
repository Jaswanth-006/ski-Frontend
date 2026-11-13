/** Today's date (YYYY-MM-DD) on this device's clock — India time for the office.
 * `toISOString()` is UTC, which is still yesterday until 05:30 IST. */
export function todayISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
