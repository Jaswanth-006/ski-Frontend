/**
 * Indian-grouped integer formatting: 342180 -> "3,42,180" (lakh grouping).
 * DESIGN_SYSTEM §6. Use with the <Money> component for amounts.
 */
export const inr = (n: number): string => {
  const s = Math.round(Math.abs(n)).toString()
  let last3 = s.slice(-3)
  let rest = s.slice(0, -3)
  if (rest) {
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')
    last3 = ',' + last3
  }
  const sign = n < 0 ? '-' : ''
  return sign + rest + last3
}
