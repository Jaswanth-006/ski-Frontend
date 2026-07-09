import { useQueryClient } from '@tanstack/react-query'
import { Check, Download, Loader2, Lock } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getGetDaySheetV1DaySheetOnDateGetQueryKey,
  useCloseDayV1DaySheetOnDateClosePost,
  useExportDaySheetV1DaySheetOnDateExportPost,
  useGetDaySheetV1DaySheetOnDateGet,
} from '@/api/generated/day-sheet/day-sheet'
import { useGetJobV1JobsJobIdGet } from '@/api/generated/jobs/jobs'
import type { DaySheetRow } from '@/api/generated/model'
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
  const [jobId, setJobId] = useState<string | null>(null)

  const sheetQuery = useGetDaySheetV1DaySheetOnDateGet(date)
  const closeMutation = useCloseDayV1DaySheetOnDateClosePost()
  const exportMutation = useExportDaySheetV1DaySheetOnDateExportPost()

  const jobQuery = useGetJobV1JobsJobIdGet(jobId ?? '', {
    query: {
      enabled: !!jobId,
      refetchInterval: (query) => {
        const env = query.state.data
        const done = env?.status === 200 && ['done', 'failed'].includes(env.data.status)
        return done ? false : 1500
      },
    },
  })

  const envelope = sheetQuery.data
  const sheet = envelope && envelope.status === 200 ? envelope.data : null
  const rows: DaySheetRow[] = sheet?.rows ?? []

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getGetDaySheetV1DaySheetOnDateGetQueryKey(date) })

  const closeDay = async () => {
    const res = await closeMutation.mutateAsync({ onDate: date })
    if (res.status === 200) await invalidate()
  }
  const startExport = async () => {
    setJobId(null)
    const res = await exportMutation.mutateAsync({ onDate: date })
    if (res.status === 202) setJobId(res.data.job_id)
  }

  const job = jobQuery.data?.status === 200 ? jobQuery.data.data : null

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
    { key: 'total', header: 'Total ₹', numeric: true, render: (r) => <Money value={Number(r.total)} bare /> },
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
              <Button variant="ghost" className="h-9" onClick={startExport} disabled={exportMutation.isPending}>
                <Download size={16} />
                Export
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
                    <Money key="t" value={Number(sheet.totals.total)} bare />,
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

        {/* Export progress / link */}
        {jobId ? (
          <div className="px-[18px] py-3 border-t border-line text-[13px]">
            {job?.status === 'done' && job.result_url ? (
              <a href={job.result_url} className="inline-flex items-center gap-1.5 text-ok font-semibold">
                <Check size={15} /> Export ready — download .xlsx
              </a>
            ) : job?.status === 'failed' ? (
              <span className="text-bad">Export failed{job.error ? `: ${job.error}` : ''}.</span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-muted">
                <Loader2 className="animate-spin text-orange" size={14} /> Building export…
              </span>
            )}
          </div>
        ) : null}
      </Card>
    </AppShell>
  )
}
