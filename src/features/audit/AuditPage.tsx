import { Loader2 } from 'lucide-react'
import { useListAuditV1AuditGet } from '@/api/generated/audit/audit'
import type { AuditOut } from '@/api/generated/model'
import { AppShell } from '@/components/app/AppShell'
import { Card, CardHeader } from '@/components/ui/card'

function fmt(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function summarize(value: AuditOut['new_value']): string {
  if (!value) return '—'
  return Object.entries(value)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(', ')
}

export function AuditPage() {
  const auditQuery = useListAuditV1AuditGet()
  const envelope = auditQuery.data
  const entries: AuditOut[] = envelope && envelope.status === 200 ? envelope.data : []

  return (
    <AppShell title="Audit Log" subtitle="Every change — who, what, and when">
      <Card className="overflow-hidden">
        <CardHeader title="Recent activity" hint={`${entries.length} entries`} />
        {auditQuery.isLoading ? (
          <div className="grid place-items-center py-14 text-muted">
            <Loader2 className="animate-spin text-orange" size={22} />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-14 text-center text-[13px] text-muted">No activity yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['When', 'Who', 'Action', 'Entity', 'Details'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[11px] uppercase tracking-[.05em] text-muted font-semibold bg-surface border-b border-line px-[18px] py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-surface/60">
                    <td className="text-[12.5px] num text-muted px-[18px] py-2.5 border-b border-line whitespace-nowrap">
                      {fmt(e.created_at)}
                    </td>
                    <td className="text-[13px] text-ink px-[18px] py-2.5 border-b border-line">
                      {e.actor_name ?? '—'}
                    </td>
                    <td className="px-[18px] py-2.5 border-b border-line">
                      <span className="inline-flex items-center rounded-md bg-orange-50 text-orange-600 px-2 py-0.5 text-[11px] font-semibold num">
                        {e.action}
                      </span>
                    </td>
                    <td className="text-[13px] text-ink px-[18px] py-2.5 border-b border-line">
                      {e.entity}
                    </td>
                    <td className="text-[12px] text-muted px-[18px] py-2.5 border-b border-line max-w-[420px] truncate">
                      {summarize(e.new_value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  )
}
