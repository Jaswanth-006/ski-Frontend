import { Loader2 } from 'lucide-react'

/** Centered spinner for the "checking who you are" gate state (DESIGN_SYSTEM §1). */
export function FullScreenLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="min-h-screen grid place-items-center bg-surface">
      <div className="flex flex-col items-center gap-3 text-muted">
        <Loader2 className="animate-spin text-orange" size={28} />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  )
}
