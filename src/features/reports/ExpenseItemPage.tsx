import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import type { ExpenseItemEntry } from '@/api/generated/model'
import { useExpenseItemLedgerV1ReportsExpensesItemIdGet } from '@/api/generated/reports/reports'
import { AppShell } from '@/components/app/AppShell'
import { DataTable, type Column } from '@/components/app/DataTable'
import { Money } from '@/components/app/Money'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { todayISO } from '@/lib/date'
import { downloadCsv } from './csv'

const today = todayISO
const monthStart = () => today().slice(0, 8) + '01'
const ddmmyyyy = (iso: string) => iso.split('-').reverse().join('.')
const n = (v: string | number | undefined | null) => Number(v ?? 0)
const METHOD: Record<string, string> = { cash: 'Cash', upi: 'UPI', transfer: 'Transfer' }

/** Who it was spent by: the delivery boy, else whoever entered it. */
const doneBy = (r: ExpenseItemEntry) => r.delivery_name ?? r.entered_by ?? '—'

/** One expense item over a date range: every entry with its day, who and how much. */
export function ExpenseItemPage() {
  const { itemId = '' } = useParams()
  const [search, setSearch] = useSearchParams()
  const start = search.get('start') ?? monthStart()
  const end = search.get('end') ?? today()
  const setRange = (next: { start?: string; end?: string }) =>
    setSearch({ start: next.start ?? start, end: next.end ?? end }, { replace: true })

  const q = useExpenseItemLedgerV1ReportsExpensesItemIdGet(itemId, { start, end })
  const data = q.data?.status === 200 ? q.data.data : null
  const notFound = q.data !== undefined && q.data.status !== 200
  const rows: ExpenseItemEntry[] = data?.rows ?? []

  const columns: Column<ExpenseItemEntry>[] = [
    { key: 'date', header: 'Date', render: (r) => <span className="num">{ddmmyyyy(r.business_date)}</span> },
    {
      key: 'who',
      header: 'Done by',
      render: (r) => (
        <div>
          <div className="font-medium text-ink">{doneBy(r)}</div>
          {r.delivery_name && r.entered_by ? (
            <div className="text-[11.5px] text-muted">entered by {r.entered_by}</div>
          ) : null}
        </div>
      ),
    },
    { key: 'method', header: 'Paid by', render: (r) => METHOD[r.method] ?? r.method },
    {
      key: 'note',
      header: 'Note',
      render: (r) => (
        <span className="text-muted">
          {[r.invoice_no ? `Invoice ${r.invoice_no}` : null, r.note].filter(Boolean).join(' · ') || '—'}
        </span>
      ),
    },
    { key: 'amount', header: 'Amount ₹', numeric: true, render: (r) => <Money value={n(r.amount)} bare /> },
  ]

  const footer = data
    ? ['Total', `${data.count} entr${data.count === 1 ? 'y' : 'ies'}`, '', '', <Money key="t" value={n(data.total)} bare />]
    : undefined

  const exportCsv = () => {
    if (!data) return
    downloadCsv(
      `${data.item_name.replace(/\s+/g, '_')}_${start}_${end}`,
      ['Date', 'Done by', 'Entered by', 'Paid by', 'Invoice', 'Note', 'Amount'],
      [
        ...data.rows.map((r) => [
          ddmmyyyy(r.business_date),
          doneBy(r),
          r.entered_by ?? '',
          METHOD[r.method] ?? r.method,
          r.invoice_no ?? '',
          r.note ?? '',
          r.amount,
        ]),
        ['Total', '', '', '', '', '', data.total],
      ],
    )
  }

  return (
    <AppShell title={data?.item_name ?? 'Expense'} subtitle="Expense · every entry in the range">
      <Link
        to={`/reports?tab=expenses&start=${start}&end=${end}`}
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-orange"
      >
        <ArrowLeft size={15} /> All expenses
      </Link>

      <Card className="overflow-hidden">
        <CardHeader
          title={data ? `${data.item_name} · entries` : 'Entries'}
          hint="Which day, who and how much"
          right={
            <div className="flex flex-wrap items-center gap-3">
              <Input type="date" value={start} onChange={(e) => setRange({ start: e.target.value })} className="h-9 w-[150px]" />
              <span className="text-muted text-[13px]">→</span>
              <Input type="date" value={end} onChange={(e) => setRange({ end: e.target.value })} className="h-9 w-[150px]" />
              <Button variant="ghost" className="h-9" onClick={exportCsv} disabled={!data}>
                <Download size={16} /> CSV
              </Button>
            </div>
          }
        />

        {data ? (
          <div className="grid grid-cols-2 gap-3 px-[18px] pb-4 pt-3 sm:max-w-[420px]">
            <div className="rounded-[12px] border border-line bg-surface px-4 py-3">
              <div className="text-[11.5px] text-muted">Total spent</div>
              <Money value={n(data.total)} className="font-display text-[18px] font-extrabold text-ink" />
            </div>
            <div className="rounded-[12px] border border-line bg-surface px-4 py-3">
              <div className="text-[11.5px] text-muted">Entries</div>
              <div className="font-display text-[18px] font-extrabold text-ink num">{data.count}</div>
            </div>
          </div>
        ) : null}

        {q.isLoading ? (
          <div className="grid place-items-center py-14 text-muted">
            <Loader2 className="animate-spin text-orange" size={22} />
          </div>
        ) : notFound ? (
          <div className="py-14 text-center text-[13px] text-muted">Expense item not found.</div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-muted">No entries in this range.</div>
        ) : (
          <DataTable columns={columns} data={rows} getRowKey={(r) => r.id} footer={footer} />
        )}
      </Card>
    </AppShell>
  )
}
