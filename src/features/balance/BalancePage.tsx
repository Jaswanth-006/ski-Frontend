import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  getBalanceSummaryV1DeliveryBalancesSummaryGetQueryKey,
  getListBalanceEntriesV1DeliveryBalancesGetQueryKey,
  useBalanceSummaryV1DeliveryBalancesSummaryGet,
  useCreateBalanceEntryV1DeliveryBalancesPost,
  useListBalanceEntriesV1DeliveryBalancesGet,
} from '@/api/generated/delivery-balances/delivery-balances'
import {
  getCustomerBalanceSummaryV1CustomerBalancesSummaryGetQueryKey,
  getListCustomerBalanceEntriesV1CustomerBalancesGetQueryKey,
  useCreateCustomerBalanceEntryV1CustomerBalancesPost,
  useCustomerBalanceSummaryV1CustomerBalancesSummaryGet,
  useListCustomerBalanceEntriesV1CustomerBalancesGet,
} from '@/api/generated/customer-balances/customer-balances'
import { AppShell } from '@/components/app/AppShell'
import { DataTable, type Column } from '@/components/app/DataTable'
import { Money } from '@/components/app/Money'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/cn'

const today = () => new Date().toISOString().slice(0, 10)

type Tab = 'delivery' | 'customer'
const TABS: { key: Tab; label: string }[] = [
  { key: 'delivery', label: 'Delivery boys' },
  { key: 'customer', label: 'Customers' },
]

/** One party's balance, normalised from either the delivery or the customer summary. */
interface PartyBalance {
  id: string
  name: string
  charged: number
  repaid: number
  balance: number
}

interface Entry {
  entry_date: string
  kind: string
  amount: string
  note?: string | null
}

interface LedgerRow {
  entry_date: string
  charge: number
  repayment: number
  remaining: number
  note: string
}

export function BalancePage() {
  const [tab, setTab] = useState<Tab>('delivery')
  return (
    <AppShell title="Balance" subtitle="Money delivery boys and customers still owe">
      <div className="flex gap-2">
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
      {tab === 'delivery' ? <DeliveryBalances /> : <CustomerBalances />}
    </AppShell>
  )
}

function DeliveryBalances() {
  const queryClient = useQueryClient()
  const [partyId, setPartyId] = useState('')
  const summaryQuery = useBalanceSummaryV1DeliveryBalancesSummaryGet()
  const entriesQuery = useListBalanceEntriesV1DeliveryBalancesGet(
    { delivery_id: partyId },
    { query: { enabled: !!partyId } },
  )
  const create = useCreateBalanceEntryV1DeliveryBalancesPost()

  const summary: PartyBalance[] = (summaryQuery.data?.status === 200 ? summaryQuery.data.data : []).map(
    (s) => ({
      id: s.delivery_id,
      name: s.delivery_name,
      charged: Number(s.charged),
      repaid: Number(s.repaid),
      balance: Number(s.balance),
    }),
  )

  return (
    <BalancePanel
      partyLabel="delivery boy"
      summary={summary}
      summaryLoading={summaryQuery.isLoading}
      partyId={partyId}
      onSelect={setPartyId}
      entries={entriesQuery.data?.status === 200 ? entriesQuery.data.data : []}
      entriesLoading={entriesQuery.isLoading}
      pending={create.isPending}
      onRepay={async (amount, date) => {
        const res = await create.mutateAsync({
          data: { delivery_id: partyId, amount, entry_date: date, kind: 'repayment' },
        })
        if (res.status !== 201) return false
        await queryClient.invalidateQueries({
          queryKey: getBalanceSummaryV1DeliveryBalancesSummaryGetQueryKey(),
        })
        await queryClient.invalidateQueries({
          queryKey: getListBalanceEntriesV1DeliveryBalancesGetQueryKey({ delivery_id: partyId }),
        })
        return true
      }}
    />
  )
}

function CustomerBalances() {
  const queryClient = useQueryClient()
  const [partyId, setPartyId] = useState('')
  const summaryQuery = useCustomerBalanceSummaryV1CustomerBalancesSummaryGet()
  const entriesQuery = useListCustomerBalanceEntriesV1CustomerBalancesGet(
    { customer_id: partyId },
    { query: { enabled: !!partyId } },
  )
  const create = useCreateCustomerBalanceEntryV1CustomerBalancesPost()

  const summary: PartyBalance[] = (summaryQuery.data?.status === 200 ? summaryQuery.data.data : []).map(
    (s) => ({
      id: s.customer_id,
      name: s.customer_name,
      charged: Number(s.charged),
      repaid: Number(s.repaid),
      balance: Number(s.balance),
    }),
  )

  return (
    <BalancePanel
      partyLabel="customer"
      summary={summary}
      summaryLoading={summaryQuery.isLoading}
      partyId={partyId}
      onSelect={setPartyId}
      entries={entriesQuery.data?.status === 200 ? entriesQuery.data.data : []}
      entriesLoading={entriesQuery.isLoading}
      pending={create.isPending}
      onRepay={async (amount, date) => {
        const res = await create.mutateAsync({
          data: { customer_id: partyId, amount, entry_date: date, kind: 'repayment' },
        })
        if (res.status !== 201) return false
        await queryClient.invalidateQueries({
          queryKey: getCustomerBalanceSummaryV1CustomerBalancesSummaryGetQueryKey(),
        })
        await queryClient.invalidateQueries({
          queryKey: getListCustomerBalanceEntriesV1CustomerBalancesGetQueryKey({ customer_id: partyId }),
        })
        return true
      }}
    />
  )
}

/** Summary list + per-party ledger + repayment form, shared by both tabs. */
function BalancePanel({
  partyLabel,
  summary,
  summaryLoading,
  partyId,
  onSelect,
  entries,
  entriesLoading,
  pending,
  onRepay,
}: {
  partyLabel: string
  summary: PartyBalance[]
  summaryLoading: boolean
  partyId: string
  onSelect: (id: string) => void
  entries: Entry[]
  entriesLoading: boolean
  pending: boolean
  onRepay: (amount: number, date: string) => Promise<boolean>
}) {
  const [repayAmount, setRepayAmount] = useState('')
  const [repayDate, setRepayDate] = useState(today())
  const selected = summary.find((s) => s.id === partyId)
  const totalOutstanding = summary.reduce((s, r) => s + r.balance, 0)

  // Running-remaining ledger, oldest first.
  const ledger: LedgerRow[] = useMemo(() => {
    const asc = [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date))
    let remaining = 0
    return asc.map((e) => {
      const charge = e.kind === 'charge' ? Number(e.amount) : 0
      const repayment = e.kind === 'repayment' ? Number(e.amount) : 0
      remaining += charge - repayment
      return { entry_date: e.entry_date, charge, repayment, remaining, note: e.note ?? '' }
    })
  }, [entries])

  const recordRepayment = async () => {
    if (!partyId || Number(repayAmount) <= 0) return
    if (await onRepay(Number(repayAmount), repayDate)) setRepayAmount('')
  }

  const columns: Column<LedgerRow>[] = [
    { key: 'date', header: 'Date', render: (r) => r.entry_date },
    {
      key: 'charge',
      header: 'Owed ₹',
      numeric: true,
      render: (r) => (r.charge ? <Money value={r.charge} bare /> : <span className="text-muted">—</span>),
    },
    {
      key: 'repay',
      header: 'Given back ₹',
      numeric: true,
      render: (r) =>
        r.repayment ? <Money value={r.repayment} bare className="text-ok" /> : <span className="text-muted">—</span>,
    },
    { key: 'rem', header: 'Remaining ₹', numeric: true, render: (r) => <Money value={r.remaining} bare /> },
    { key: 'note', header: 'Note', render: (r) => <span className="text-muted">{r.note || '—'}</span> },
  ]

  return (
    <>
      <Card>
        <CardHeader
          title={`Balances by ${partyLabel}`}
          hint="Who still owes the office"
          right={
            <div className="text-right">
              <div className="text-[11px] text-muted">Total outstanding</div>
              <Money value={totalOutstanding} className="font-display font-extrabold text-[16px] text-ink" />
            </div>
          }
        />
        {summaryLoading ? (
          <div className="grid place-items-center py-10 text-muted">
            <Loader2 className="animate-spin text-orange" size={20} />
          </div>
        ) : summary.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-muted">No active {partyLabel}s yet.</p>
        ) : (
          <div className="px-[18px] pb-4 pt-1 flex flex-col">
            {summary.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                className="flex items-center justify-between gap-3 py-2.5 border-b border-line last:border-0 text-left hover:bg-surface rounded-lg px-2 -mx-2 transition-colors"
              >
                <span className="text-[13.5px] font-medium text-ink">{s.name}</span>
                <Money
                  value={s.balance}
                  className={s.balance > 0 ? 'font-display font-bold text-bad' : 'text-muted'}
                />
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Balance detail"
          hint={`Pick a ${partyLabel} to see charges and repayments`}
          right={
            <Select value={partyId} onChange={(e) => onSelect(e.target.value)} className="h-9 w-[200px]">
              <option value="">Select a {partyLabel}…</option>
              {summary.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          }
        />
        {!partyId ? (
          <div className="py-12 text-center text-[13px] text-muted">
            <Wallet size={22} className="mx-auto mb-2" />
            Choose a {partyLabel} above.
          </div>
        ) : (
          <div className="px-[18px] pb-5 pt-1">
            {selected ? (
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 pb-3 mb-1">
                <div>
                  <div className="text-[11px] text-muted">Total owed</div>
                  <Money value={selected.charged} className="font-display font-bold text-ink" />
                </div>
                <div>
                  <div className="text-[11px] text-muted">Given back</div>
                  <Money value={selected.repaid} className="font-display font-bold text-ok" />
                </div>
                <div>
                  <div className="text-[11px] text-muted">Remaining balance</div>
                  <Money value={selected.balance} className="font-display font-extrabold text-[18px] text-bad" />
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-end gap-3 py-3 border-y border-line mb-3">
              <div>
                <label className="block text-[12px] text-muted mb-1">Money given back ₹</label>
                <Input
                  type="number"
                  min={0}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="h-9 w-[140px] num text-right"
                />
              </div>
              <div>
                <label className="block text-[12px] text-muted mb-1">On date</label>
                <Input type="date" value={repayDate} onChange={(e) => setRepayDate(e.target.value)} className="h-9 w-[150px]" />
              </div>
              <Button variant="primary" className="h-9" onClick={recordRepayment} disabled={pending}>
                <Plus size={16} /> Record repayment
              </Button>
            </div>

            {entriesLoading ? (
              <div className="grid place-items-center py-8 text-muted">
                <Loader2 className="animate-spin text-orange" size={20} />
              </div>
            ) : ledger.length === 0 ? (
              <p className="text-[13px] text-muted py-4 text-center">No balance entries yet.</p>
            ) : (
              <DataTable columns={columns} data={[...ledger].reverse()} getRowKey={(_r, i) => i} />
            )}
          </div>
        )}
      </Card>
    </>
  )
}
