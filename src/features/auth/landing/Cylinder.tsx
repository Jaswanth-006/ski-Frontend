import { cn } from '@/lib/cn'

/** Flat LPG cylinder illustration; `squat` widens it for the small 5 kg size. */
export function Cylinder({ className, squat = false }: { className?: string; squat?: boolean }) {
  const w = squat ? 96 : 80
  const x = (120 - w) / 2
  return (
    <svg viewBox="0 0 120 220" aria-hidden="true" className={cn('drop-shadow-xl', className)}>
      <defs>
        <linearGradient id="cyl-body" x1="0" x2="1">
          <stop offset="0" stopColor="#A81C22" />
          <stop offset=".35" stopColor="#E0383E" />
          <stop offset=".55" stopColor="#D7262E" />
          <stop offset="1" stopColor="#8E161B" />
        </linearGradient>
        <linearGradient id="cyl-metal" x1="0" x2="1">
          <stop offset="0" stopColor="#7A8599" />
          <stop offset=".45" stopColor="#E3E8F0" />
          <stop offset="1" stopColor="#6B7487" />
        </linearGradient>
      </defs>
      {/* valve + guard ring */}
      <rect x="54" y="6" width="12" height="16" rx="3" fill="url(#cyl-metal)" />
      <path
        d="M34 46 V26 a8 8 0 0 1 8-8 h36 a8 8 0 0 1 8 8 V46"
        fill="none"
        stroke="url(#cyl-body)"
        strokeWidth="8"
      />
      <rect x="46" y="22" width="28" height="10" rx="3" fill="#0E1B3A" opacity=".18" />
      {/* body */}
      <rect x={x} y="42" width={w} height="152" rx={w / 2.4} fill="url(#cyl-body)" />
      <rect x={x} y="78" width={w} height="5" fill="#000" opacity=".12" />
      <rect x={x} y="152" width={w} height="5" fill="#000" opacity=".12" />
      <rect x={x + 10} y="56" width="8" height="120" rx="4" fill="#fff" opacity=".22" />
      {/* label */}
      <rect x={x + w / 2 - 22} y="100" width="44" height="34" rx="6" fill="#fff" opacity=".92" />
      <circle cx="60" cy="117" r="9" fill="#F26522" />
      <path d="M60 110c2.2 2.2 3.3 3.9 3.3 6a3.3 3.3 0 1 1-6.6 0c0-1.1.6-2 1.4-2.8.2 1.1.7 1.7 1.4 1.7 0-1.7.2-3.3.5-4.9z" fill="#fff" />
      {/* foot ring */}
      <rect x={x + 6} y="190" width={w - 12} height="18" rx="4" fill="url(#cyl-body)" />
      <rect x={x + 6} y="190" width={w - 12} height="4" fill="#000" opacity=".2" />
      <ellipse cx="60" cy="214" rx={w / 2} ry="4" fill="#0A1A3F" opacity=".18" />
    </svg>
  )
}
