/** Sree Kamala Indane agency mark (matches docs/reference/dashboard.html). */
export function BrandMark({ size = 38, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={className}
    >
      <circle cx="24" cy="24" r="22" fill="#fff" />
      <circle cx="24" cy="24" r="22" fill="none" stroke="#10295C" strokeWidth="3" />
      <circle cx="24" cy="24" r="15" fill="#F26522" />
      <path
        d="M24 13c4 4 6 7 6 11a6 6 0 1 1-12 0c0-2 1-3.5 2.5-5 .3 2 1.2 3 2.5 3 0-3 .3-6 1-9z"
        fill="#fff"
      />
    </svg>
  )
}
