import { motion, useReducedMotion } from 'framer-motion'

interface Point {
  label: string
  /** SVG x/y already projected into the 0–700 × 0–200 viewBox. */
  x: number
  y: number
  today?: boolean
}

const POINTS: Point[] = [
  { label: 'Tue', x: 40, y: 122 },
  { label: 'Wed', x: 145, y: 91 },
  { label: 'Thu', x: 250, y: 107 },
  { label: 'Fri', x: 355, y: 99 },
  { label: 'Sat', x: 460, y: 70 },
  { label: 'Sun', x: 565, y: 39 },
  { label: 'Today', x: 660, y: 57, today: true },
]

const linePath = POINTS.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
const areaPath = `${linePath} L660,165 L40,165 Z`

/** Collections trend — custom SVG with a draw-in line (DESIGN_SYSTEM §5). */
export function CollectionsChart() {
  const reduceMotion = useReducedMotion()
  return (
    <svg
      viewBox="0 0 700 200"
      preserveAspectRatio="none"
      role="img"
      aria-label="Collections over the last 7 days, trending up to today"
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

      {POINTS.map((p, i) => (
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

      {POINTS.map((p) => (
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
