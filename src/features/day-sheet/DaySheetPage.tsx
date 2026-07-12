import { useQueryClient } from '@tanstack/react-query'
import { Download, Loader2, Lock } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getGetDaySheetV1DaySheetOnDateGetQueryKey,
  useCloseDayV1DaySheetOnDateClosePost,
  useGetDaySheetV1DaySheetOnDateGet,
} from '@/api/generated/day-sheet/day-sheet'
import type { DaySheetRow } from '@/api/generated/model'
import { useAuthStore } from '@/state/auth'
import { AppShell } from '@/components/app/AppShell'
import { DataTable, type Column } from '@/components/app/DataTable'
import { Money } from '@/components/app/Money'
import { StatusPill } from '@/components/app/StatusPill'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const today = () => new Date().toISOString().slice(0, 10)

export function DaySheetPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const date = searchParams.get('date') ?? today()
  const setDate = (next: string) => setSearchParams(next === today() ? {} : { date: next })
  const [downloading, setDownloading] = useState(false)

  const sheetQuery = useGetDaySheetV1DaySheetOnDateGet(date)
  const closeMutation = useCloseDayV1DaySheetOnDateClosePost()

  const envelope = sheetQuery.data
  const sheet = envelope && envelope.status === 200 ? envelope.data : null
  const rows: DaySheetRow[] = sheet?.rows ?? []

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getGetDaySheetV1DaySheetOnDateGetQueryKey(date) })

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

  // Note values that appear anywhere today (high → low) become inline columns.
  const noteValues = (sheet?.denomination_totals ?? []).map((d) => d.note_value)
  const noteCount = (r: DaySheetRow, value: number) =>
    r.denominations.find((x) => x.note_value === value)?.note_count ?? 0

  const columns: Column<DaySheetRow>[] = [
    { key: 'name', header: 'Delivery staff', render: (r) => r.delivery_name },
    { key: 'loaded', header: 'Loaded', numeric: true, render: (r) => r.loaded || <span className="text-muted">—</span> },
    { key: 'cyl', header: 'Sold', numeric: true, render: (r) => r.cylinders },
    { key: 'returned', header: 'Returned', numeric: true, render: (r) => r.returned || <span className="text-muted">—</span> },
    ...noteValues.map(
      (v): Column<DaySheetRow> => ({
        key: `n${v}`,
        header: `₹${v}`,
        numeric: true,
        render: (r) => noteCount(r, v) || <span className="text-muted">—</span>,
      }),
    ),
    { key: 'cash', header: 'Cash ₹', numeric: true, render: (r) => <Money value={Number(r.cash)} bare /> },
    { key: 'upi', header: 'UPI ₹', numeric: true, render: (r) => <Money value={Number(r.upi)} bare /> },
    {
      key: 'online',
      header: 'Online ₹',
      numeric: true,
      render: (r) =>
        Number(r.online) ? <Money value={Number(r.online)} bare /> : <span className="text-muted">—</span>,
    },
    { key: 'total', header: 'Settled ₹', numeric: true, render: (r) => <Money value={Number(r.total)} bare /> },
    {
      key: 'expense',
      header: 'Expense ₹',
      numeric: true,
      render: (r) =>
        Number(r.expense) ? <Money value={Number(r.expense)} bare /> : <span className="text-muted">—</span>,
    },
    { key: 'net', header: 'Net ₹', numeric: true, render: (r) => <Money value={Number(r.net)} bare /> },
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
                    sheet.stock.loaded,
                    sheet.totals.cylinders,
                    sheet.stock.returned,
                    ...sheet.denomination_totals.map((d) => d.note_count),
                    <Money key="c" value={Number(sheet.totals.cash)} bare />,
                    <Money key="u" value={Number(sheet.totals.upi)} bare />,
                    <Money key="o" value={Number(sheet.totals.online)} bare />,
                    <Money key="t" value={Number(sheet.totals.total)} bare />,
                    <Money key="e" value={Number(sheet.totals.expense)} bare />,
                    <Money key="n" value={Number(sheet.totals.net)} bare />,
                  ]
                : undefined
            }
          />
        )}

        {sheet ? (
          <div className="px-[18px] py-3 border-t border-line flex flex-wrap items-center justify-end gap-x-8 gap-y-2 text-[13px]">
            <span className="text-muted">Warehouse stock</span>
            <div className="flex items-center gap-2">
              <span className="text-muted">Opening</span>
              <span className="num font-medium text-ink">{sheet.stock.opening}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted">Loaded</span>
              <span className="num font-medium text-ink">{sheet.stock.loaded}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted">Returned</span>
              <span className="num font-medium text-ink">{sheet.stock.returned}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-ink font-semibold">Closing</span>
              <span className="num font-display font-bold text-ink">{sheet.stock.closing}</span>
            </div>
          </div>
        ) : null}

        {sheet ? (
          <div className="px-[18px] py-3 border-t border-line flex flex-wrap items-center justify-end gap-x-8 gap-y-2 text-[13px]">
            <div className="flex items-center gap-2">
              <span className="text-muted">Opening cash</span>
              <Money value={Number(sheet.cashier_opening)} className="font-medium text-ink" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted">Total cash</span>
              <Money value={Number(sheet.totals.cash)} className="font-medium text-ink" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted">Total UPI</span>
              <Money value={Number(sheet.totals.upi)} className="font-medium text-ink" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted">Expenses</span>
              <Money value={-Number(sheet.expenses_total)} className="font-medium text-bad" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-ink font-semibold">Net</span>
              <Money value={Number(sheet.net)} className="font-display font-bold text-ink" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-ink font-semibold">Closing cash</span>
              <Money value={Number(sheet.cashier_closing)} className="font-display font-bold text-ink" />
            </div>
          </div>
        ) : null}
      </Card>
    </AppShell>
  )
}
