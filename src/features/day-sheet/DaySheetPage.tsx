import { useQueryClient } from '@tanstack/react-query'
import { Download, Loader2, Lock } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getGetDaySheetV1DaySheetOnDateGetQueryKey,
  useCloseDayV1DaySheetOnDateClosePost,
  useReopenDayV1DaySheetOnDateReopenPost,
  useGetDaySheetV1DaySheetOnDateGet,
} from '@/api/generated/day-sheet/day-sheet'
import type { DaySheetRow } from '@/api/generated/model'
import { useAuthStore } from '@/state/auth'
import { useAuth } from '@/auth/useAuth'
import { AppShell } from '@/components/app/AppShell'
import { DataTable, type Column } from '@/components/app/DataTable'
import { Money } from '@/components/app/Money'
import { StatusPill } from '@/components/app/StatusPill'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { todayISO } from '@/lib/date'

const today = todayISO

export function DaySheetPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const date = searchParams.get('date') ?? today()
  const setDate = (next: string) => setSearchParams(next === today() ? {} : { date: next })
  const [downloading, setDownloading] = useState(false)

  const sheetQuery = useGetDaySheetV1DaySheetOnDateGet(date)
  const closeMutation = useCloseDayV1DaySheetOnDateClosePost()
  const reopenMutation = useReopenDayV1DaySheetOnDateReopenPost()
  const { role } = useAuth()
  const isOwner = role === 'super_admin'

  const envelope = sheetQuery.data
  const sheet = envelope && envelope.status === 200 ? envelope.data : null
  const rows: DaySheetRow[] = sheet?.rows ?? []

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getGetDaySheetV1DaySheetOnDateGetQueryKey(date) })

  const reopenDay = async () => {
    const res = await reopenMutation.mutateAsync({ onDate: date })
    if (res.status === 200) await invalidate()
  }
  const closeDay = async () => {
    const res = await closeMutation.mutateAsync({ onDate: date })
    if (res.status === 200) await invalidate()
  }
  // Direct .xlsx download — no worker/object storage needed (streams from the API).
  const downloadXlsx = async () => {
    setDownloading(true)
    try {
      const base = import.meta.env.VITE_API_BASE_URL ?? ''
      const token = useAuthStore.getState().accessToken
      const res = await fetch(`${base}/v1/day-sheet/${date}/export.xlsx`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return
      const url = URL.createObjectURL(await res.blob())
      const a = document.createElement('a')
      a.href = url
      a.download = `day-sheet-${date}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  const dash = <span className="text-muted">—</span>
  const amount = (v: string) => (Number(v) ? <Money value={Number(v)} bare /> : dash)

  const columns: Column<DaySheetRow>[] = [
    {
      key: 'name',
      header: 'Party',
      render: (r) => (
        <span className="inline-flex items-center gap-1.5">
          {r.delivery_name}
          {r.party_kind === 'customer' ? (
            <span className="inline-flex items-center rounded-full bg-surface px-[7px] py-[2px] text-[10px] font-semibold text-muted">
              Customer
            </span>
          ) : null}
        </span>
      ),
    },
    { key: 'cyl', header: 'Sold', numeric: true, render: (r) => r.cylinders || dash },
    { key: 'empties', header: 'Empty', numeric: true, render: (r) => r.empties || dash },
    { key: 'damaged', header: 'Return', numeric: true, render: (r) => r.damaged || dash },
    { key: 'amount', header: 'Total amount ₹', numeric: true, render: (r) => amount(r.amount) },
    { key: 'upi', header: 'UPI ₹', numeric: true, render: (r) => amount(r.upi) },
    { key: 'cash', header: 'Cash ₹', numeric: true, render: (r) => amount(r.cash) },
    { key: 'online', header: 'Online ₹', numeric: true, render: (r) => amount(r.online) },
    {
      key: 'balance',
      header: 'Balance ₹',
      numeric: true,
      render: (r) => (Number(r.balance) ? <Money value={Number(r.balance)} bare className="text-bad" /> : dash),
    },
  ]

  return (
    <AppShell title="Day Sheet" subtitle="The day's consolidated register">
      <Card className="overflow-hidden">
        <CardHeader
          title="Day sheet"
          hint="Per delivery person"
          right={
            <div className="flex items-center gap-3">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 w-[150px]" />
              {sheet?.is_closed ? (
                <StatusPill variant="warn" size="sm">
                  <Lock size={12} /> Day closed
                </StatusPill>
              ) : (
                <StatusPill variant="open" dot>
                  Day open
                </StatusPill>
              )}
              <Button variant="ghost" className="h-9" onClick={downloadXlsx} disabled={downloading}>
                <Download size={16} />
                {downloading ? 'Preparing…' : 'Export'}
              </Button>
              {!sheet?.is_closed ? (
                <Button variant="primary" className="h-9" onClick={closeDay} disabled={closeMutation.isPending}>
                  {closeMutation.isPending ? 'Closing…' : 'Close day'}
                </Button>
              ) : isOwner ? (
                <Button variant="ghost" className="h-9" onClick={reopenDay} disabled={reopenMutation.isPending}>
                  {reopenMutation.isPending ? 'Reopening…' : 'Reopen day'}
                </Button>
              ) : null}
            </div>
          }
        />

        {sheetQuery.isLoading ? (
          <div className="grid place-items-center py-14 text-muted">
            <Loader2 className="animate-spin text-orange" size={22} />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            getRowKey={(r) => r.delivery_id}
            footer={
              sheet
                ? [
                    'Total',
                    sheet.totals.cylinders,
                    sheet.totals.empties,
                    sheet.totals.damaged,
                    <Money key="a" value={Number(sheet.totals.amount)} bare />,
                    <Money key="u" value={Number(sheet.totals.upi)} bare />,
                    <Money key="c" value={Number(sheet.totals.cash)} bare />,
                    <Money key="o" value={Number(sheet.totals.online)} bare />,
                    <Money
                      key="b"
                      value={Number(sheet.totals.balance)}
                      bare
                      className={Number(sheet.totals.balance) ? 'text-bad' : undefined}
                    />,
                  ]
                : undefined
            }
          />
        )}
      </Card>
    </AppShell>
  )
}
