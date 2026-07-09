import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import {
  useDeliveryReportV1ReportsDeliveryGet,
  useDepositReportV1ReportsDepositsGet,
  useExpenseReportV1ReportsExpensesGet,
  useStockReportV1ReportsStockGet,
} from '@/api/generated/reports/reports'
import { AppShell } from '@/components/app/AppShell'
import { DataTable, type Column } from '@/components/app/DataTable'
import { Money } from '@/components/app/Money'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/cn'

const today = () => new Date().toISOString().slice(0, 10)
const monthStart = () => today().slice(0, 8) + '01'

type Tab = 'stock' | 'delivery' | 'expenses' | 'deposits'
const TABS: { key: Tab; label: string }[] = [
  { key: 'stock', label: 'Stock' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'deposits', label: 'Deposits' },
]

function downloadCsv(name: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ReportsPage() {
  const [tab, setTab] = useState<Tab>('stock')
  const [start, setStart] = useState(monthStart())
  const [end, setEnd] = useState(today())
  const params = { start, end }

  const stockQ = useStockReportV1ReportsStockGet(params, { query: { enabled: tab === 'stock' } })
  const delivQ = useDeliveryReportV1ReportsDeliveryGet(params, {
    query: { enabled: tab === 'delivery' },
  })
  const expQ = useExpenseReportV1ReportsExpensesGet(params, {
    query: { enabled: tab === 'expenses' },
  })
  const depQ = useDepositReportV1ReportsDepositsGet(params, {
    query: { enabled: tab === 'deposits' },
  })

  const active = { stock: stockQ, delivery: delivQ, expenses: expQ, deposits: depQ }[tab]
  const rows: unknown[] = active.data?.status === 200 ? (active.data.data as unknown[]) : []

  const exportCsv = () => {
    if (tab === 'stock') {
      const r = rows as { code: string; label: string; bought: number; sold: number; loaded: number; returned: number }[]
      downloadCsv(`stock_${start}_${end}`, ['Code', 'Variety', 'Bought', 'Sold', 'Loaded', 'Returned'],
        r.map((x) => [x.code, x.label, x.bought, x.sold, x.loaded, x.returned]))
    } else if (tab === 'delivery') {
      const r = rows as { delivery_name: string; sold: number; loaded: number; returned: number }[]
      downloadCsv(`delivery_${start}_${end}`, ['Delivery staff', 'Sold', 'Loaded', 'Returned'],
        r.map((x) => [x.delivery_name, x.sold, x.loaded, x.returned]))
    } else if (tab === 'expenses') {
      const r = rows as { item_name: string; total: string; count: number }[]
      downloadCsv(`expenses_${start}_${end}`, ['Item', 'Total', 'Count'],
        r.map((x) => [x.item_name, x.total, x.count]))
    } else {
      const r = rows as { recipient: string; kind: string; total: string; count: number }[]
      downloadCsv(`deposits_${start}_${end}`, ['Recipient', 'Type', 'Total', 'Count'],
        r.map((x) => [x.recipient, x.kind, x.total, x.count]))
    }
  }

  const columns: Column<Record<string, unknown>>[] =
    tab === 'stock'
      ? [
          { key: 'label', header: 'Variety', render: (r) => <span>{r.label as string} <span className="text-muted num text-[11.5px]">{r.code as string}</span></span> },
          { key: 'bought', header: 'Bought', numeric: true, render: (r) => r.bought as number },
          { key: 'sold', header: 'Sold', numeric: true, render: (r) => r.sold as number },
          { key: 'loaded', header: 'Loaded', numeric: true, render: (r) => r.loaded as number },
          { key: 'returned', header: 'Returned', numeric: true, render: (r) => r.returned as number },
        ]
      : tab === 'delivery'
        ? [
            { key: 'name', header: 'Delivery staff', render: (r) => r.delivery_name as string },
            { key: 'sold', header: 'Sold', numeric: true, render: (r) => r.sold as number },
            { key: 'loaded', header: 'Loaded', numeric: true, render: (r) => r.loaded as number },
            { key: 'returned', header: 'Returned', numeric: true, render: (r) => r.returned as number },
          ]
        : tab === 'expenses'
          ? [
              { key: 'item', header: 'Expense item', render: (r) => r.item_name as string },
              { key: 'total', header: 'Total ₹', numeric: true, render: (r) => <Money value={Number(r.total)} bare /> },
              { key: 'count', header: 'Count', numeric: true, render: (r) => r.count as number },
            ]
          : [
              { key: 'recipient', header: 'Recipient', render: (r) => r.recipient as string },
              { key: 'kind', header: 'Type', render: (r) => r.kind as string },
              { key: 'total', header: 'Total ₹', numeric: true, render: (r) => <Money value={Number(r.total)} bare /> },
              { key: 'count', header: 'Count', numeric: true, render: (r) => r.count as number },
            ]

  return (
    <AppShell title="Reports" subtitle="Date-range summaries">
      <Card className="overflow-hidden">
        <CardHeader
          title="Report"
          hint="Pick a type and a date range"
          right={
            <div className="flex items-center gap-3">
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-9 w-[150px]" />
              <span className="text-muted text-[13px]">→</span>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="h-9 w-[150px]" />
              <Button variant="ghost" className="h-9" onClick={exportCsv} disabled={rows.length === 0}>
                <Download size={16} /> CSV
              </Button>
            </div>
          }
        />
        <div className="px-[18px] pt-1 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors',
                tab === t.key ? 'bg-orange text-white' : 'text-muted hover:bg-surface',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {active.isLoading ? (
          <div className="grid place-items-center py-14 text-muted">
            <Loader2 className="animate-spin text-orange" size={22} />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-14 text-center text-[13px] text-muted">No data for this range.</div>
        ) : (
          <DataTable
            columns={columns}
            data={rows as Record<string, unknown>[]}
            getRowKey={(_r, i) => i}
          />
        )}
      </Card>
    </AppShell>
  )
}
