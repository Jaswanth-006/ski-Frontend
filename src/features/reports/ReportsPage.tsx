import { ChevronRight, Download, Loader2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  useDeliveryReportV1ReportsDeliveryGet,
  useDepositReportV1ReportsDepositsGet,
  useExpenseReportV1ReportsExpensesGet,
  useStockReportV1ReportsStockGet,
} from '@/api/generated/reports/reports'
import type { DepositReportRow, StockReportRow } from '@/api/generated/model'
import { PLACE_KIND } from './DepositLedgerPage'
import { AppShell } from '@/components/app/AppShell'
import { DataTable, type Column } from '@/components/app/DataTable'
import { Money } from '@/components/app/Money'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/cn'
import { downloadCsv } from './csv'
import { todayISO } from '@/lib/date'

const today = todayISO
const monthStart = () => today().slice(0, 8) + '01'

type Tab = 'stock' | 'delivery' | 'expenses' | 'deposits'
const TABS: { key: Tab; label: string }[] = [
  { key: 'stock', label: 'Stock' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'deposits', label: 'Deposits' },
]

export function ReportsPage() {
  const [search, setSearch] = useSearchParams()
  const tabParam = search.get('tab')
  const tab: Tab = TABS.some((t) => t.key === tabParam) ? (tabParam as Tab) : 'stock'
  const start = search.get('start') ?? monthStart()
  const end = search.get('end') ?? today()
  const update = (patch: Partial<{ tab: Tab; start: string; end: string }>) =>
    setSearch({ tab, start, end, ...patch }, { replace: true })
  const setTab = (t: Tab) => update({ tab: t })
  const setStart = (v: string) => update({ start: v })
  const setEnd = (v: string) => update({ end: v })
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
      const r = rows as StockReportRow[]
      downloadCsv(
        `stock_${start}_${end}`,
        ['Cylinder', 'Full / Empty', 'Opening (A)', 'Received (B)', 'Issue (C)', 'Damaged / other', 'Closing (A+B-C)'],
        r.map((x) => [x.label, x.condition, x.opening, x.received, x.issue, x.other, x.closing]),
      )
    } else if (tab === 'delivery') {
      const r = rows as { delivery_name: string; sales: string; full_cylinders: number; empty_cylinders: number }[]
      downloadCsv(`delivery_${start}_${end}`, ['Delivery staff', 'Sales', 'Full cylinders', 'Empty cylinders'],
        r.map((x) => [x.delivery_name, x.sales, x.full_cylinders, x.empty_cylinders]))
    } else if (tab === 'expenses') {
      const r = rows as { item_name: string; total: string; count: number }[]
      downloadCsv(`expenses_${start}_${end}`, ['Item', 'Total', 'Count'],
        r.map((x) => [x.item_name, x.total, x.count]))
    } else {
      const r = rows as DepositReportRow[]
      downloadCsv(`deposits_${start}_${end}`, ['Place', 'Type', 'Money in', 'Money out', 'Count'],
        r.map((x) => [x.name, PLACE_KIND[x.kind], x.money_in, x.money_out, x.count]))
    }
  }

  const columns: Column<Record<string, unknown>>[] =
    tab === 'stock'
      ? [
          {
            key: 'label',
            header: 'Cylinder',
            render: (r) =>
              r.condition === 'full' ? (
                <span className="font-medium text-ink">
                  {r.label as string} <span className="text-[11.5px] font-semibold text-orange">Full</span>
                </span>
              ) : (
                <span className="pl-4 text-[11.5px] font-semibold text-navy">Empty</span>
              ),
          },
          { key: 'opening', header: 'Opening (A)', numeric: true, render: (r) => r.opening as number },
          {
            key: 'received',
            header: 'Received (B)',
            numeric: true,
            render: (r) => r.received as number,
          },
          {
            key: 'issue',
            header: 'Issue (C)',
            numeric: true,
            render: (r) => r.issue as number,
          },
          ...((rows as StockReportRow[]).some((x) => x.other !== 0)
            ? [
                {
                  key: 'other',
                  header: 'Damaged / other',
                  numeric: true,
                  render: (r: Record<string, unknown>) =>
                    r.other ? <span className="text-warn">{r.other as number}</span> : <span className="text-muted">—</span>,
                },
              ]
            : []),
          {
            key: 'closing',
            header: 'Closing (A+B−C)',
            numeric: true,
            render: (r) => <span className="font-display font-bold text-ink">{r.closing as number}</span>,
          },
        ]
      : tab === 'delivery'
        ? [
            {
              key: 'name',
              header: 'Delivery staff',
              render: (r) => (
                <Link
                  to={`/reports/delivery/${r.delivery_id as string}?start=${start}&end=${end}`}
                  className="group inline-flex items-center gap-1 font-medium text-navy hover:text-orange"
                >
                  {r.delivery_name as string}
                  <ChevronRight size={14} className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-orange" />
                </Link>
              ),
            },
            { key: 'sales', header: 'Sales ₹', numeric: true, render: (r) => <Money value={Number(r.sales)} bare /> },
            { key: 'full', header: 'Full cylinders', numeric: true, render: (r) => r.full_cylinders as number },
            { key: 'empty', header: 'Empty cylinders', numeric: true, render: (r) => r.empty_cylinders as number },
          ]
        : tab === 'expenses'
          ? [
              {
                key: 'item',
                header: 'Expense item',
                render: (r) => (
                  <Link
                    to={`/reports/expenses/${r.item_id as string}?start=${start}&end=${end}`}
                    className="group inline-flex items-center gap-1 font-medium text-navy hover:text-orange"
                  >
                    {r.item_name as string}
                    <ChevronRight size={14} className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-orange" />
                  </Link>
                ),
              },
              { key: 'total', header: 'Total ₹', numeric: true, render: (r) => <Money value={Number(r.total)} bare /> },
              { key: 'count', header: 'Count', numeric: true, render: (r) => r.count as number },
            ]
          : [
              {
                key: 'name',
                header: 'Place',
                render: (r) => (
                  <Link
                    to={`/reports/deposits/${r.kind as string}/${(r.ref_id as string | null) ?? 'box'}?start=${start}&end=${end}`}
                    className="group inline-flex items-center gap-1 font-medium text-navy hover:text-orange"
                  >
                    {r.name as string}
                    <ChevronRight size={14} className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-orange" />
                  </Link>
                ),
              },
              { key: 'kind', header: 'Type', render: (r) => <span className="text-muted">{PLACE_KIND[r.kind as DepositReportRow['kind']]}</span> },
              {
                key: 'in',
                header: 'Money in ₹',
                numeric: true,
                render: (r) => (Number(r.money_in) ? <Money value={Number(r.money_in)} bare className="text-ok" /> : <span className="text-muted">—</span>),
              },
              {
                key: 'out',
                header: 'Money out ₹',
                numeric: true,
                render: (r) => (Number(r.money_out) ? <Money value={Number(r.money_out)} bare className="text-bad" /> : <span className="text-muted">—</span>),
              },
              { key: 'count', header: 'Entries', numeric: true, render: (r) => r.count as number },
            ]

  return (
    <AppShell title="Reports" subtitle="Date-range summaries">
      <Card className="overflow-hidden">
        <CardHeader
          title="Report"
          hint={
            tab === 'stock'
              ? 'Full: received = ac4, issue = sales · Empty: received = from sales, issue = erv'
              : 'Pick a type and a date range'
          }
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
