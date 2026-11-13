import { useQueryClient } from '@tanstack/react-query'
import { Ban, Loader2, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  useCancelSaleV1SalesSaleIdCancelPost,
  useListSalesV1SalesGet,
} from '@/api/generated/sales/sales'
import type { SaleOut } from '@/api/generated/model'
import { DataTable, type Column } from '@/components/app/DataTable'
import { Money } from '@/components/app/Money'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/cn'

const n = (v: string | number | null | undefined) => Number(v ?? 0)
const sum = (s: SaleOut, k: 'qty' | 'empty_qty' | 'damaged_qty') =>
  s.lines.reduce((t, l) => t + l[k], 0)

/** The Edit entries "Invoices" tab: one day's sales, with Edit and Cancel. */
export function InvoicesTab({ date }: { date: string }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const listQuery = useListSalesV1SalesGet({ date })
  const sales: SaleOut[] = listQuery.data?.status === 200 ? listQuery.data.data : []
  const active = sales.filter((s) => s.status === 'approved')
  const cancelledCount = sales.length - active.length

  const [cancelling, setCancelling] = useState<SaleOut | null>(null)

  const dash = <span className="text-muted">—</span>
  const amount = (v: string, show = true) => (show && n(v) ? <Money value={n(v)} bare /> : dash)
  const isLive = (s: SaleOut) => s.status === 'approved'

  const columns: Column<SaleOut>[] = [
    {
      key: 'invoice',
      header: 'Invoice',
      render: (s) => (
        <div className={cn(!isLive(s) && 'opacity-60')}>
          <span className={cn('num font-semibold', !isLive(s) && 'line-through')}>
            {s.invoice_no ?? '—'}
          </span>
          {!isLive(s) ? (
            <div className="text-[11.5px] text-bad whitespace-nowrap">Cancelled · {s.cancel_reason}</div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'party',
      header: 'Party',
      render: (s) => (
        <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap', !isLive(s) && 'opacity-60')}>
          {s.party_name}
          {s.party_kind === 'customer' ? (
            <span className="rounded-full bg-surface px-[7px] py-[2px] text-[10px] font-semibold text-muted">
              Customer
            </span>
          ) : null}
        </span>
      ),
    },
    { key: 'sold', header: 'Sold', numeric: true, render: (s) => sum(s, 'qty') },
    { key: 'empty', header: 'Empty', numeric: true, render: (s) => sum(s, 'empty_qty') || dash },
    { key: 'ret', header: 'Return', numeric: true, render: (s) => sum(s, 'damaged_qty') || dash },
    { key: 'amount', header: 'Amount ₹', numeric: true, render: (s) => amount(s.revenue_total) },
    { key: 'upi', header: 'UPI ₹', numeric: true, render: (s) => amount(s.upi_total) },
    { key: 'cash', header: 'Cash ₹', numeric: true, render: (s) => amount(s.cash_total) },
    { key: 'online', header: 'Online ₹', numeric: true, render: (s) => amount(s.online_total) },
    {
      key: 'balance',
      header: 'Balance ₹',
      numeric: true,
      render: (s) =>
        n(s.balance_total) ? (
          <Money value={n(s.balance_total)} bare className={isLive(s) ? 'text-bad' : undefined} />
        ) : (
          dash
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (s) =>
        isLive(s) ? (
          <div className="flex justify-end gap-1.5">
            <Button
              variant="ghost"
              className="h-8 w-8 px-0"
              aria-label={`Edit invoice ${s.invoice_no ?? ''}`}
              title="Edit"
              onClick={() => navigate(`/sales/new?edit=${s.id}`)}
            >
              <Pencil size={14} />
            </Button>
            <Button
              variant="ghost"
              className="h-8 w-8 px-0 text-bad hover:border-bad/40"
              aria-label={`Cancel invoice ${s.invoice_no ?? ''}`}
              title="Cancel"
              onClick={() => setCancelling(s)}
            >
              <Ban size={14} />
            </Button>
          </div>
        ) : null,
    },
  ]

  const total = (k: 'revenue_total' | 'upi_total' | 'cash_total' | 'online_total' | 'balance_total') =>
    active.reduce((t, s) => t + n(s[k]), 0)
  const totalQty = (k: 'qty' | 'empty_qty' | 'damaged_qty') =>
    active.reduce((t, s) => t + sum(s, k), 0)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 px-[18px] pb-3">
        <span className="text-[12.5px] text-muted">
          {sales.length
            ? `${active.length} active${cancelledCount ? ` · ${cancelledCount} cancelled` : ''}`
            : ''}
        </span>
        <Link
          to="/sales/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-orange px-3.5 text-[13px] font-semibold text-white shadow-primary hover:bg-orange-600"
        >
          <Plus size={15} /> New sale
        </Link>
      </div>
        {listQuery.isLoading ? (
          <div className="grid place-items-center py-14 text-muted">
            <Loader2 className="animate-spin text-orange" size={22} />
          </div>
        ) : sales.length === 0 ? (
          <div className="py-14 text-center text-[13px] text-muted">No sales on this date.</div>
        ) : (
          <DataTable
            columns={columns}
            data={sales}
            getRowKey={(s) => s.id}
            footer={[
              'Total',
              '',
              totalQty('qty'),
              totalQty('empty_qty'),
              totalQty('damaged_qty'),
              <Money key="a" value={total('revenue_total')} bare />,
              <Money key="u" value={total('upi_total')} bare />,
              <Money key="c" value={total('cash_total')} bare />,
              <Money key="o" value={total('online_total')} bare />,
              <Money key="b" value={total('balance_total')} bare />,
              '',
            ]}
          />
        )}

      <CancelSaleModal
        sale={cancelling}
        onClose={() => setCancelling(null)}
        onDone={async () => {
          setCancelling(null)
          await queryClient.invalidateQueries()
        }}
      />
    </>
  )
}

function CancelSaleModal({
  sale,
  onClose,
  onDone,
}: {
  sale: SaleOut | null
  onClose: () => void
  onDone: () => Promise<void>
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const cancel = useCancelSaleV1SalesSaleIdCancelPost()

  const close = () => {
    setReason('')
    setError(null)
    onClose()
  }

  const confirm = async () => {
    if (!sale) return
    setError(null)
    const res = await cancel.mutateAsync({ saleId: sale.id, data: { reason: reason.trim() } })
    if (res.status === 200) {
      setReason('')
      await onDone()
      return
    }
    const detail = (res.data as { detail?: unknown })?.detail
    setError(typeof detail === 'string' ? detail : 'Could not cancel the sale.')
  }

  return (
    <Modal open={!!sale} onClose={close} title={`Cancel invoice ${sale?.invoice_no ?? ''}`}>
      {sale ? (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-muted">
            {sale.party_name} · <Money value={n(sale.revenue_total)} /> ·{' '}
            {sum(sale, 'qty')} cylinders. Cancelling puts the cylinders back in stock and removes
            its payments and unpaid balance from every sheet. This can't be undone — to correct it
            instead, use Edit.
          </p>
          <div>
            <label className="block text-[12.5px] font-medium text-ink mb-1.5">
              Reason <span className="text-bad">*</span>
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={280}
              placeholder="e.g. entered twice"
              autoFocus
            />
          </div>
          {error ? (
            <div className="rounded-lg bg-badbg px-3 py-2 text-[12.5px] text-bad" role="alert">
              {error}
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>
              Keep sale
            </Button>
            <Button
              variant="primary"
              className="bg-bad hover:bg-bad/90 shadow-none"
              onClick={confirm}
              disabled={cancel.isPending || reason.trim().length < 3}
            >
              {cancel.isPending ? 'Cancelling…' : 'Cancel sale'}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
