import { motion, useReducedMotion } from 'framer-motion'

export interface CollectionPoint {
  label: string
  total: number
  today?: boolean
}

// SVG projection window (matches DESIGN_SYSTEM §5).
const X0 = 40
const X1 = 660
const Y_TOP = 39
const Y_BOT = 165

/** Collections trend — custom SVG with a draw-in line, projected from real daily totals. */
export function CollectionsChart({ points }: { points: CollectionPoint[] }) {
  const reduceMotion = useReducedMotion()

  if (points.length === 0) {
    return (
      <div className="h-[200px] grid place-items-center text-[13px] text-muted">
        No collections recorded yet
      </div>
    )
  }

  const max = Math.max(...points.map((p) => p.total), 1)
  const projected = points.map((p, i) => ({
    ...p,
    x: points.length === 1 ? (X0 + X1) / 2 : X0 + (i * (X1 - X0)) / (points.length - 1),
    y: Y_BOT - (p.total / max) * (Y_BOT - Y_TOP),
  }))

  const linePath = projected.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const first = projected[0]
  const last = projected[projected.length - 1]
  const areaPath = `${linePath} L${last.x},${Y_BOT} L${first.x},${Y_BOT} Z`

  return (
    <svg
      viewBox="0 0 700 200"
      preserveAspectRatio="none"
      role="img"
      aria-label="Total collections over the last 7 days"
      className="w-full h-[200px] block"
    >
      <defs>
        <linearGradient id="collections-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F26522" stopOpacity="0.2" />
          <stop offset="1" stopColor="#F26522" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[40, 90, 140].map((y) => (
        <line key={y} x1="0" y1={y} x2="700" y2={y} className="stroke-line" strokeWidth={1} />
      ))}

      <motion.path
        d={areaPath}
        fill="url(#collections-area)"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />

      <motion.path
        d={linePath}
        className="stroke-orange"
        fill="none"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={reduceMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1], delay: 0.15 }}
      />

      {projected.map((p, i) => (
        <motion.circle
          key={p.label}
          cx={p.x}
          cy={p.y}
          r={p.today ? 5 : 4}
          className="stroke-orange"
          fill={p.today ? '#F26522' : '#fff'}
          strokeWidth={2.5}
          initial={reduceMotion ? false : { opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
        />
      ))}

      {projected.map((p) => (
        <text
          key={`${p.label}-x`}
          x={p.x}
          y={190}
          textAnchor="middle"
          className={p.today ? 'fill-orange-600 text-[11px] font-semibold' : 'fill-muted text-[11px]'}
        >
          {p.label}
        </text>
      ))}
    </svg>
  )
}
