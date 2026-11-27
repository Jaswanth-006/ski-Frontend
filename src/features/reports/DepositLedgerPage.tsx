import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import type { DepositLedgerRow, DepositReportRowKind } from '@/api/generated/model'
import { useDepositLedgerV1ReportsDepositsKindRefGet } from '@/api/generated/reports/reports'
import { AppShell } from '@/components/app/AppShell'
import { DataTable, type Column } from '@/components/app/DataTable'
import { Money } from '@/components/app/Money'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/cn'
import { todayISO } from '@/lib/date'
import { downloadCsv } from './csv'

// eslint-disable-next-line react-refresh/only-export-components
export const PLACE_KIND: Record<DepositReportRowKind, string> = {
  cashier_box: 'Cashier box',
  bank_account: 'Bank account',
  vendor: 'Vendor',
  person: 'Person',
}

const today = todayISO
const monthStart = () => today().slice(0, 8) + '01'
const ddmmyyyy = (iso: string) => iso.split('-').reverse().join('.')
const n = (v: string | number | undefined | null) => Number(v ?? 0)
const METHOD: Record<string, string> = { cash: 'Cash', upi: 'UPI', transfer: 'Transfer' }
const KINDS = Object.keys(PLACE_KIND) as DepositReportRowKind[]

/** Every deposit into / out of one place: when, how much, from where to where. */
export function DepositLedgerPage() {
  const { kind: kindParam = '', ref = 'box' } = useParams()
  const kind = (KINDS.includes(kindParam as DepositReportRowKind) ? kindParam : 'cashier_box') as DepositReportRowKind
  const [search, setSearch] = useSearchParams()
  const start = search.get('start') ?? monthStart()
  const end = search.get('end') ?? today()
  const setRange = (next: { start?: string; end?: string }) =>
    setSearch({ start: next.start ?? start, end: next.end ?? end }, { replace: true })

  const q = useDepositLedgerV1ReportsDepositsKindRefGet(kind, ref, { start, end })
  const data = q.data?.status === 200 ? q.data.data : null
  const notFound = q.data !== undefined && q.data.status !== 200
  const rows: DepositLedgerRow[] = data?.rows ?? []
  const isBank = data?.opening != null

  const columns: Column<DepositLedgerRow>[] = [
    { key: 'date', header: 'Date', render: (r) => <span className="num">{ddmmyyyy(r.business_date)}</span> },
    {
      key: 'move',
      header: 'From → To',
      render: (r) => (
        <div>
          <div className="text-ink">
            <span className={cn(r.direction === 'out' && 'font-semibold')}>{r.from_label}</span>
            <span className="text-muted"> → </span>
            <span className={cn(r.direction === 'in' && 'font-semibold')}>{r.to_label}</span>
          </div>
          {r.note ? <div className="text-[11.5px] text-muted">{r.note}</div> : null}
        </div>
      ),
    },
    { key: 'method', header: 'Method', render: (r) => METHOD[r.method] ?? r.method },
    {
      key: 'in',
      header: 'In ₹',
      numeric: true,
      render: (r) => (r.direction === 'in' ? <Money value={n(r.amount)} bare className="text-ok" /> : null),
    },
    {
      key: 'out',
      header: 'Out ₹',
      numeric: true,
      render: (r) => (r.direction === 'out' ? <Money value={n(r.amount)} bare className="text-bad" /> : null),
    },
    ...(isBank
      ? [
          {
            key: 'balance',
            header: 'Balance ₹',
            numeric: true,
            render: (r: DepositLedgerRow) => (
              <Money value={n(r.balance)} bare className={cn('font-semibold', n(r.balance) < 0 ? 'text-bad' : 'text-ink')} />
            ),
          },
        ]
      : []),
  ]

  const footer = data
    ? [
        'Total',
        `${rows.length} entr${rows.length === 1 ? 'y' : 'ies'}`,
        '',
        <Money key="i" value={n(data.total_in)} bare />,
        <Money key="o" value={n(data.total_out)} bare />,
        ...(isBank ? [<Money key="c" value={n(data.closing)} bare />] : []),
      ]
    : undefined

  const exportCsv = () => {
    if (!data) return
    downloadCsv(
      `${data.name.replace(/[^\w]+/g, '_')}_${start}_${end}`,
      ['Date', 'From', 'To', 'Method', 'Note', 'In', 'Out', ...(isBank ? ['Balance'] : [])],
      [
        ...(isBank ? [['Opening', '', '', '', '', '', '', data.opening ?? '']] : []),
        ...rows.map((r) => [
          ddmmyyyy(r.business_date),
          r.from_label,
          r.to_label,
          METHOD[r.method] ?? r.method,
          r.note ?? '',
          r.direction === 'in' ? r.amount : '',
          r.direction === 'out' ? r.amount : '',
          ...(isBank ? [r.balance ?? ''] : []),
        ]),
        ['Total', '', '', '', '', data.total_in, data.total_out, ...(isBank ? [data.closing ?? ''] : [])],
      ],
    )
  }

  const tiles = data
    ? [
        ...(isBank ? [{ label: 'Opening balance', value: n(data.opening) }] : []),
        { label: 'Money in', value: n(data.total_in), tone: 'text-ok' },
        { label: 'Money out', value: n(data.total_out), tone: 'text-bad' },
        ...(isBank ? [{ label: 'Closing balance', value: n(data.closing) }] : []),
      ]
    : []

  return (
    <AppShell title={data?.name ?? 'Deposits'} subtitle={`${PLACE_KIND[kind]} · every deposit in and out`}>
      <Link
        to={`/reports?tab=deposits&start=${start}&end=${end}`}
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-orange"
      >
        <ArrowLeft size={15} /> All deposits
      </Link>

      <Card className="overflow-hidden">
        <CardHeader
          title={data ? `${data.name} · statement` : 'Statement'}
          hint="When, how much, from where to where"
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

        {kind === 'cashier_box' ? (
          <p className="px-[18px] pt-2 text-[12.5px] text-muted">
            Only deposits are listed here — sales, repayments and expenses are on the{' '}
            <Link to="/cashier-box" className="font-medium text-navy hover:text-orange">
              Cashier Box
            </Link>{' '}
            page.
          </p>
        ) : null}
        {tiles.length ? (
          <div className="grid grid-cols-2 gap-3 px-[18px] pb-4 pt-3 lg:grid-cols-4">
            {tiles.map((t) => (
              <div key={t.label} className="rounded-[12px] border border-line bg-surface px-4 py-3">
                <div className="text-[11.5px] text-muted">{t.label}</div>
                <Money value={t.value} className={cn('font-display text-[18px] font-extrabold', t.tone ?? 'text-ink')} />
              </div>
            ))}
          </div>
        ) : null}

        {q.isLoading ? (
          <div className="grid place-items-center py-14 text-muted">
            <Loader2 className="animate-spin text-orange" size={22} />
          </div>
        ) : notFound ? (
          <div className="py-14 text-center text-[13px] text-muted">Not found.</div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-muted">No deposits in this range.</div>
        ) : (
          <DataTable columns={columns} data={rows} getRowKey={(r) => `${r.id}-${r.direction}`} footer={footer} />
        )}
      </Card>
    </AppShell>
  )
}
