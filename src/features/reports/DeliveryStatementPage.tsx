import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import type { DeliveryLedgerRow } from '@/api/generated/model'
import { useDeliveryLedgerV1ReportsDeliveryDeliveryIdGet } from '@/api/generated/reports/reports'
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
const ddmmyyyy = (iso: string) => iso.split('-').reverse().join('.')

type Row = DeliveryLedgerRow

const n = (v: string | number | undefined) => Number(v ?? 0)
const isSale = (r: Row) => r.kind === 'sale'
const owed = (v: string | number | undefined) => (n(v) > 0 ? 'text-bad' : undefined)

/** Amount cell: blank on lines where the column doesn't apply. */
function Amt({ v, show }: { v: string | undefined; show: boolean }) {
  return show ? <Money value={n(v)} bare /> : null
}

export function DeliveryStatementPage() {
  const { deliveryId = '' } = useParams()
  const [search, setSearch] = useSearchParams()
  const start = search.get('start') ?? monthStart()
  const end = search.get('end') ?? today()
  const setRange = (next: { start?: string; end?: string }) =>
    setSearch({ start: next.start ?? start, end: next.end ?? end }, { replace: true })

  const q = useDeliveryLedgerV1ReportsDeliveryDeliveryIdGet(deliveryId, { start, end })
  const data = q.data?.status === 200 ? q.data.data : null
  const notFound = q.data !== undefined && q.data.status !== 200

  const rows: Row[] = data?.rows ?? []

  const columns: Column<Row>[] = [
    { key: 'date', header: 'Date', render: (r) => <span className="num">{ddmmyyyy(r.entry_date)}</span> },
    {
      key: 'invoice',
      header: 'Invoice',
      render: (r) =>
        r.kind === 'sale' ? (
          <span className="num font-medium">{r.invoice_no ?? '—'}</span>
        ) : (
          <span className="flex items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                r.kind === 'repayment' ? 'bg-okbg text-ok' : 'bg-warnbg text-warn',
              )}
            >
              {r.kind === 'repayment' ? 'Repaid' : 'Charge'}
            </span>
            {r.note ? <span className="text-muted text-[12px]">{r.note}</span> : null}
          </span>
        ),
    },
    { key: 'qty', header: 'Sold', numeric: true, render: (r) => (isSale(r) ? r.qty : null) },
    { key: 'empty', header: 'Empty', numeric: true, render: (r) => (isSale(r) ? r.empty_qty : null) },
    {
      key: 'amount',
      header: 'Amount ₹',
      numeric: true,
      render: (r) => (n(r.amount) > 0 ? <Money value={n(r.amount)} bare /> : null),
    },
    { key: 'cash', header: 'Cash ₹', numeric: true, render: (r) => <Amt v={r.cash} show={isSale(r)} /> },
    { key: 'upi', header: 'UPI ₹', numeric: true, render: (r) => <Amt v={r.upi} show={isSale(r)} /> },
    { key: 'online', header: 'Online ₹', numeric: true, render: (r) => <Amt v={r.online} show={isSale(r)} /> },
    {
      key: 'expenses',
      header: 'Route exp. ₹',
      numeric: true,
      render: (r) => (isSale(r) && n(r.expenses) ? <Money value={n(r.expenses)} bare /> : null),
    },
    {
      key: 'repaid',
      header: 'Repaid ₹',
      numeric: true,
      render: (r) => (r.kind === 'repayment' ? <Money value={n(r.repaid)} bare className="text-ok" /> : null),
    },
    {
      key: 'balance',
      header: 'Balance ₹',
      numeric: true,
      render: (r) =>
        r.kind === 'repayment' ? null : <Money value={n(r.balance)} bare className={owed(r.balance)} />,
    },
  ]

  const footer = data
    ? [
        'Total',
        '',
        data.total_qty,
        data.total_empty_qty,
        <Money key="a" value={n(data.total_amount)} bare />,
        <Money key="c" value={n(data.total_cash)} bare />,
        <Money key="u" value={n(data.total_upi)} bare />,
        <Money key="o" value={n(data.total_online)} bare />,
        <Money key="e" value={n(data.total_expenses)} bare />,
        <Money key="r" value={n(data.total_repaid)} bare />,
        <Money key="b" value={n(data.total_balance)} bare className={owed(data.total_balance)} />,
      ]
    : undefined

  const exportCsv = () => {
    if (!data) return
    const label = (r: DeliveryLedgerRow) =>
      r.kind === 'sale' ? (r.invoice_no ?? '') : `${r.kind === 'repayment' ? 'Repaid' : 'Charge'}${r.note ? ` - ${r.note}` : ''}`
    downloadCsv(
      `${data.delivery_name.replace(/\s+/g, '_')}_${start}_${end}`,
      ['Date', 'Invoice', 'Sold', 'Empty', 'Amount', 'Cash', 'UPI', 'Online', 'Route expenses', 'Repaid', 'Balance'],
      [
        ...data.rows.map((r) => [
          ddmmyyyy(r.entry_date),
          label(r),
          r.kind === 'sale' ? (r.qty ?? 0) : '',
          r.kind === 'sale' ? (r.empty_qty ?? 0) : '',
          n(r.amount) > 0 ? (r.amount ?? '') : '',
          r.kind === 'sale' ? (r.cash ?? '') : '',
          r.kind === 'sale' ? (r.upi ?? '') : '',
          r.kind === 'sale' ? (r.online ?? '') : '',
          r.kind === 'sale' ? (r.expenses ?? '') : '',
          r.kind === 'repayment' ? (r.repaid ?? '') : '',
          r.kind === 'repayment' ? '' : r.balance,
        ]),
        [
          'Total',
          '',
          data.total_qty,
          data.total_empty_qty,
          data.total_amount,
          data.total_cash,
          data.total_upi,
          data.total_online,
          data.total_expenses,
          data.total_repaid,
          data.total_balance,
        ],
      ],
    )
  }

  const tiles = data
    ? [
        { label: 'Sales amount', value: n(data.total_amount) },
        { label: 'Paid (cash + UPI)', value: n(data.total_cash) + n(data.total_upi) },
        { label: 'Online → company', value: n(data.total_online) },
        { label: 'Repaid', value: n(data.total_repaid) },
        { label: 'Balance (these dates)', value: n(data.total_balance), bad: n(data.total_balance) > 0 },
      ]
    : []

  return (
    <AppShell title={data?.delivery_name ?? 'Delivery statement'} subtitle="Delivery statement · sales, payments and balance">
      <Link
        to={`/reports?tab=delivery&start=${start}&end=${end}`}
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-orange"
      >
        <ArrowLeft size={15} /> All delivery staff
      </Link>

      <Card className="overflow-hidden">
        <CardHeader
          title={data ? `${data.delivery_name} · statement` : 'Statement'}
          hint="Every sale and repayment in the range; Balance is what was left unpaid on that sale"
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

        {tiles.length ? (
          <div className="grid grid-cols-2 gap-3 px-[18px] pb-4 pt-3 sm:grid-cols-3 lg:grid-cols-5">
            {tiles.map((t) => (
              <div key={t.label} className="rounded-[12px] border border-line bg-surface px-4 py-3">
                <div className="text-[11.5px] text-muted">{t.label}</div>
                <Money
                  value={t.value}
                  className={cn('font-display text-[18px] font-extrabold', t.bad ? 'text-bad' : 'text-ink')}
                />
              </div>
            ))}
          </div>
        ) : null}

        {q.isLoading ? (
          <div className="grid place-items-center py-14 text-muted">
            <Loader2 className="animate-spin text-orange" size={22} />
          </div>
        ) : notFound ? (
          <div className="py-14 text-center text-[13px] text-muted">Delivery person not found.</div>
        ) : data && data.rows.length === 0 ? (
          <>
            <DataTable columns={columns} data={rows} getRowKey={(_r, i) => i} footer={footer} />
            <div className="py-6 text-center text-[13px] text-muted">No sales or repayments in this range.</div>
          </>
        ) : (
          <DataTable columns={columns} data={rows} getRowKey={(_r, i) => i} footer={footer} />
        )}
      </Card>
    </AppShell>
  )
}
