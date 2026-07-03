import { Construction } from 'lucide-react'
import { AppShell } from '@/components/app/AppShell'
import { Card } from '@/components/ui/card'

/** Generic "not built yet" page so the shell + nav + role gating are fully navigable. */
export function PlaceholderPage({ title, phase }: { title: string; phase: string }) {
  return (
    <AppShell title={title}>
      <Card className="p-10 grid place-items-center text-center">
        <Construction className="text-orange" size={28} />
        <h2 className="text-[15px] font-bold text-ink mt-3">{title}</h2>
        <p className="text-[13px] text-muted mt-1 max-w-sm">
          This screen arrives in {phase}. The shell, navigation, and role gating are live now.
        </p>
      </Card>
    </AppShell>
  )
}
