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
import type { DeliveryBalanceEntryOut, DeliveryBalanceSummaryOut } from '@/api/generated/model'
import { AppShell } from '@/components/app/AppShell'
import { DataTable, type Column } from '@/components/app/DataTable'
import { Money } from '@/components/app/Money'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

const today = () => new Date().toISOString().slice(0, 10)

interface LedgerRow {
  entry_date: string
  charge: number
  repayment: number
  remaining: number
}

export function DeliveryBalancePage() {
  const queryClient = useQueryClient()
  const [driverId, setDriverId] = useState('')
  const [repayAmount, setRepayAmount] = useState('')
  const [repayDate, setRepayDate] = useState(today())

  const summaryQuery = useBalanceSummaryV1DeliveryBalancesSummaryGet()
  const entriesQuery = useListBalanceEntriesV1DeliveryBalancesGet(
    { delivery_id: driverId },
    { query: { enabled: !!driverId } },
  )
  const createMutation = useCreateBalanceEntryV1DeliveryBalancesPost()

  const summary: DeliveryBalanceSummaryOut[] =
    summaryQuery.data?.status === 200 ? summaryQuery.data.data : []
  const entries: DeliveryBalanceEntryOut[] = useMemo(
    () => (entriesQuery.data?.status === 200 ? entriesQuery.data.data : []),
    [entriesQuery.data],
  )
  const selected = summary.find((s) => s.delivery_id === driverId)

  // Build a running-remaining ledger, oldest first.
  const ledger: LedgerRow[] = useMemo(() => {
    const asc = [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date))
    let remaining = 0
    return asc.map((e) => {
      const charge = e.kind === 'charge' ? Number(e.amount) : 0
      const repayment = e.kind === 'repayment' ? Number(e.amount) : 0
      remaining += charge - repayment
      return { entry_date: e.entry_date, charge, repayment, remaining }
    })
  }, [entries])

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: getBalanceSummaryV1DeliveryBalancesSummaryGetQueryKey(),
    })
    await queryClient.invalidateQueries({
      queryKey: getListBalanceEntriesV1DeliveryBalancesGetQueryKey({ delivery_id: driverId }),
    })
  }

  const recordRepayment = async () => {
    if (!driverId || Number(repayAmount) <= 0) return
    const res = await createMutation.mutateAsync({
      data: {
        delivery_id: driverId,
        amount: Number(repayAmount),
        entry_date: repayDate,
        kind: 'repayment',
      },
    })
    if (res.status === 201) {
      setRepayAmount('')
      await invalidate()
    }
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
  ]

  const totalOutstanding = summary.reduce((s, r) => s + Number(r.balance), 0)

  return (
    <AppShell
      title="Delivery Balance"
      subtitle="Money delivery boys haven't handed over yet"
      topbarActions={
        <div className="text-right">
          <div className="text-[11px] text-muted">Total outstanding</div>
          <Money value={totalOutstanding} className="font-display font-extrabold text-[16px] text-ink" />
        </div>
      }
    >
      {/* All boys summary */}
      <Card>
        <CardHeader title="Balances by delivery boy" hint="Who still owes the office" />
        {summaryQuery.isLoading ? (
          <div className="grid place-items-center py-10 text-muted">
            <Loader2 className="animate-spin text-orange" size={20} />
          </div>
        ) : (
          <div className="px-[18px] pb-4 pt-1 flex flex-col">
            {summary.map((s) => (
              <button
                key={s.delivery_id}
                onClick={() => setDriverId(s.delivery_id)}
                className="flex items-center justify-between gap-3 py-2.5 border-b border-line last:border-0 text-left hover:bg-surface rounded-lg px-2 -mx-2 transition-colors"
              >
                <span className="text-[13.5px] font-medium text-ink">{s.delivery_name}</span>
                <Money
                  value={Number(s.balance)}
                  className={Number(s.balance) > 0 ? 'font-display font-bold text-bad' : 'text-muted'}
                />
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Per-boy detail */}
      <Card>
        <CardHeader
          title="Balance detail"
          hint="Pick a delivery boy to see charges and repayments"
          right={
            <Select value={driverId} onChange={(e) => setDriverId(e.target.value)} className="h-9 w-[200px]">
              <option value="">Select a delivery boy…</option>
              {summary.map((s) => (
                <option key={s.delivery_id} value={s.delivery_id}>
                  {s.delivery_name}
                </option>
              ))}
            </Select>
          }
        />
        {!driverId ? (
          <div className="py-12 text-center text-[13px] text-muted">
            <Wallet size={22} className="mx-auto mb-2" />
            Choose a delivery boy above.
          </div>
        ) : (
          <div className="px-[18px] pb-5 pt-1">
            {selected ? (
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 pb-3 mb-1">
                <div>
                  <div className="text-[11px] text-muted">Total owed</div>
                  <Money value={Number(selected.charged)} className="font-display font-bold text-ink" />
                </div>
                <div>
                  <div className="text-[11px] text-muted">Given back</div>
                  <Money value={Number(selected.repaid)} className="font-display font-bold text-ok" />
                </div>
                <div>
                  <div className="text-[11px] text-muted">Remaining balance</div>
                  <Money value={Number(selected.balance)} className="font-display font-extrabold text-[18px] text-bad" />
                </div>
              </div>
            ) : null}

            {/* Record a repayment */}
            <div className="flex flex-wrap items-end gap-3 py-3 border-y border-line mb-3">
              <div>
                <label className="block text-[12px] text-muted mb-1">Money given back ₹</label>
                <Input type="number" min={0} value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} className="h-9 w-[140px] num text-right" />
              </div>
              <div>
                <label className="block text-[12px] text-muted mb-1">On date</label>
                <Input type="date" value={repayDate} onChange={(e) => setRepayDate(e.target.value)} className="h-9 w-[150px]" />
              </div>
              <Button variant="primary" className="h-9" onClick={recordRepayment} disabled={createMutation.isPending}>
                <Plus size={16} /> Record repayment
              </Button>
            </div>

            {entriesQuery.isLoading ? (
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
    </AppShell>
  )
}
