import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetMonthSheetV1MonthSheetYearMonthGet } from '@/api/generated/month-sheet/month-sheet'
import type { MonthSheetDay } from '@/api/generated/model'
import { AppShell } from '@/components/app/AppShell'
import { DataTable, type Column } from '@/components/app/DataTable'
import { Money } from '@/components/app/Money'
import { StatusPill } from '@/components/app/StatusPill'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'

const now = new Date()
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const fmtDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', weekday: 'short' })

export function MonthSheetPage() {
  const navigate = useNavigate()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-12

  const sheetQuery = useGetMonthSheetV1MonthSheetYearMonthGet(year, month)
  const envelope = sheetQuery.data
  const sheet = envelope && envelope.status === 200 ? envelope.data : null
  const days: MonthSheetDay[] = sheet?.days ?? []

  const shiftMonth = (delta: number) => {
    let m = month + delta
    let y = year
    if (m < 1) {
      m = 12
      y -= 1
    } else if (m > 12) {
      m = 1
      y += 1
    }
    setMonth(m)
    setYear(y)
  }

  const columns: Column<MonthSheetDay>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (r) => (
        <button
          className="text-orange font-medium hover:underline"
          onClick={() => navigate(`/day-sheet?date=${r.business_date}`)}
        >
          {fmtDate(r.business_date)}
        </button>
      ),
    },
    { key: 'cyl', header: 'Sold', numeric: true, render: (r) => r.cylinders },
    {
      key: 'empty',
      header: 'Empty ret.',
      numeric: true,
      render: (r) => r.empty_returned || <span className="text-muted">—</span>,
    },
    { key: 'cash', header: 'Hand cash ₹', numeric: true, render: (r) => <Money value={Number(r.cash)} bare /> },
    {
      key: 'notes',
      header: 'Notes',
      render: (r) =>
        r.denominations.length ? (
          <span className="num text-[11.5px] text-muted whitespace-nowrap">
            {r.denominations.map((d) => `₹${d.note_value}×${d.note_count}`).join('  ')}
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    { key: 'upi', header: 'UPI ₹', numeric: true, render: (r) => <Money value={Number(r.upi)} bare /> },
    {
      key: 'online',
      header: 'Online ₹',
      numeric: true,
      render: (r) => Number(r.online) ? <Money value={Number(r.online)} bare /> : <span className="text-muted">—</span>,
    },
    { key: 'total', header: 'Total ₹', numeric: true, render: (r) => <Money value={Number(r.total)} bare /> },
    { key: 'expenses', header: 'Expenses ₹', numeric: true, render: (r) => <Money value={Number(r.expenses)} bare /> },
    { key: 'net', header: 'Net ₹', numeric: true, render: (r) => <Money value={Number(r.net)} bare /> },
    {
      key: 'status',
      header: '',
      render: (r) =>
        r.is_closed ? (
          <StatusPill variant="warn" size="sm">
            Closed
          </StatusPill>
        ) : (
          <StatusPill variant="open" size="sm" dot>
            Open
          </StatusPill>
        ),
    },
  ]

  return (
    <AppShell title="Month Sheet" subtitle="Overall sales rolled up by day — click a date for its full day sheet">
      <Card className="overflow-hidden">
        <CardHeader
          title={`${MONTH_NAMES[month - 1]} ${year}`}
          hint="Per-day totals for the month"
          right={
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="h-9 px-3" onClick={() => shiftMonth(-1)}>
                ← Prev
              </Button>
              <Button variant="ghost" className="h-9 px-3" onClick={() => shiftMonth(1)}>
                Next →
              </Button>
            </div>
          }
        />

        {sheetQuery.isLoading ? (
          <div className="grid place-items-center py-14 text-muted">
            <Loader2 className="animate-spin text-orange" size={22} />
          </div>
        ) : days.length === 0 ? (
          <div className="py-14 text-center text-[13px] text-muted">No activity this month.</div>
        ) : (
          <DataTable
            columns={columns}
            data={days}
            getRowKey={(r) => r.business_date}
            footer={
              sheet
                ? [
                    'Total',
                    sheet.totals.cylinders,
                    sheet.totals.empty_returned,
                    <Money key="c" value={Number(sheet.totals.cash)} bare />,
                    '',
                    <Money key="u" value={Number(sheet.totals.upi)} bare />,
                    <Money key="o" value={Number(sheet.totals.online)} bare />,
                    <Money key="t" value={Number(sheet.totals.total)} bare />,
                    <Money key="e" value={Number(sheet.totals.expenses)} bare />,
                    <Money key="n" value={Number(sheet.totals.net)} bare />,
                    '',
                  ]
                : undefined
            }
          />
        )}
      </Card>
    </AppShell>
  )
}
