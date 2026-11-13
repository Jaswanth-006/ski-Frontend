import { useQueryClient } from '@tanstack/react-query'
import { Check, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import {
  deleteCreditV1CreditsCreditIdDeletePost,
  deleteCustomerBalanceV1CustomerBalancesEntryIdDeletePost,
  deleteDeliveryBalanceV1DeliveryBalancesEntryIdDeletePost,
  deleteExpenseV1ExpensesExpenseIdDeletePost,
  deleteStockEntryV1StockEntriesEntryIdDeletePost,
  deleteTransferV1TransfersTransferIdDeletePost,
  editCreditV1CreditsCreditIdPut,
  editCustomerBalanceV1CustomerBalancesEntryIdPut,
  editDeliveryBalanceV1DeliveryBalancesEntryIdPut,
  editExpenseV1ExpensesExpenseIdPut,
  editStockEntryV1StockEntriesEntryIdPut,
  editTransferV1TransfersTransferIdPut,
  useListBalanceEntriesV1BalanceEntriesGet,
  useListStockEntriesV1StockEntriesGet,
} from '@/api/generated/corrections/corrections'
import { useListExpenseItemsV1ExpenseItemsGet } from '@/api/generated/catalog/catalog'
import { useListCreditsV1CreditsGet } from '@/api/generated/credits/credits'
import { useListExpensesV1ExpensesGet } from '@/api/generated/expenses/expenses'
import type {
  BalanceEntryOut,
  CreditOut,
  ExpenseOut,
  StockEntryOut,
  TransferOut,
} from '@/api/generated/model'
import { useListTransfersV1TransfersGet } from '@/api/generated/transfers/transfers'
import { useListUsersV1UsersGet } from '@/api/generated/users/users'
import { AppShell } from '@/components/app/AppShell'
import { DataTable, type Column } from '@/components/app/DataTable'
import { Money } from '@/components/app/Money'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/cn'
import { todayISO } from '@/lib/date'
import { InvoicesTab } from './InvoicesTab'
import { DeleteDialog, EditDialog, Field, RowActions, type ApiResult } from './shared'

type Tab = 'invoices' | 'purchase' | 'expenses' | 'deposits' | 'balance' | 'credits'
const TABS: { key: Tab; label: string }[] = [
  { key: 'invoices', label: 'Invoices' },
  { key: 'purchase', label: 'Purchase' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'deposits', label: 'Deposits' },
  { key: 'balance', label: 'Balance' },
  { key: 'credits', label: 'Credits' },
]

const n = (v: string | number | null | undefined) => Number(v ?? 0)
const dash = <span className="text-muted">—</span>
const ddmmyyyy = (iso: string) => iso.split('-').reverse().join('.')

/** One place to correct any recorded entry. Every change needs a reason and is audited. */
export function CorrectionsPage() {
  const [search, setSearch] = useSearchParams()
  const flash = (useLocation().state as { flash?: string } | null)?.flash
  const tabParam = search.get('tab')
  const tab: Tab = TABS.some((t) => t.key === tabParam) ? (tabParam as Tab) : 'invoices'
  const date = search.get('date') ?? todayISO()
  const go = (patch: Partial<{ tab: Tab; date: string }>) =>
    setSearch({ tab, date, ...patch }, { replace: true })

  return (
    <AppShell
      title="Edit entries"
      subtitle="Correct a wrong entry — every change needs a reason and goes to the audit log"
    >
      {flash ? (
        <div
          className="flex items-center gap-2 rounded-lg bg-okbg px-3 py-2 text-[13px] text-ok"
          role="status"
        >
          <Check size={15} /> {flash}
        </div>
      ) : null}
      <Card className="overflow-hidden">
        <CardHeader
          title="Entries"
          hint="Closed days can only be changed by the owner"
          right={
            tab === 'credits' ? null : (
              <Input
                type="date"
                value={date}
                onChange={(e) => go({ date: e.target.value })}
                className="h-9 w-[150px]"
              />
            )
          }
        />
        <div className="px-[18px] pt-1 pb-3 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => go({ tab: t.key })}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors',
                tab === t.key ? 'bg-orange text-white' : 'text-muted hover:bg-surface',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'invoices' ? <InvoicesTab date={date} /> : null}
        {tab === 'purchase' ? <PurchaseTab date={date} /> : null}
        {tab === 'expenses' ? <ExpensesTab date={date} /> : null}
        {tab === 'deposits' ? <DepositsTab date={date} /> : null}
        {tab === 'balance' ? <BalanceTab date={date} /> : null}
        {tab === 'credits' ? <CreditsTab /> : null}
      </Card>
    </AppShell>
  )
}

function Listing<T>({
  loading,
  rows,
  columns,
  rowKey,
  empty,
}: {
  loading: boolean
  rows: T[]
  columns: Column<T>[]
  rowKey: (r: T) => string
  empty: string
}) {
  if (loading)
    return (
      <div className="grid place-items-center py-14 text-muted">
        <Loader2 className="animate-spin text-orange" size={22} />
      </div>
    )
  if (rows.length === 0) return <div className="py-14 text-center text-[13px] text-muted">{empty}</div>
  return <DataTable columns={columns} data={rows} getRowKey={(r) => rowKey(r)} />
}

/** After any change every sheet and total may move, so refetch everything. */
function useRefresh() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries()
}

function asResult(p: Promise<{ status: number; data: unknown }>): Promise<ApiResult> {
  return p
}

// ------------------------------------------------------------------ purchase

const KIND_LABEL: Record<string, string> = {
  ac4: 'ac4 · received',
  erv: 'erv · empties to plant',
  return: 'Return · damaged / lost',
  intake: 'Intake',
}

function lineText(l: StockEntryOut['lines'][number]) {
  return `${l.label}${l.condition ? ` (${l.condition})` : ''} × ${l.qty}`
}

function PurchaseTab({ date }: { date: string }) {
  const refresh = useRefresh()
  const q = useListStockEntriesV1StockEntriesGet({ date })
  const rows: StockEntryOut[] = q.data?.status === 200 ? q.data.data : []
  const [editing, setEditing] = useState<StockEntryOut | null>(null)
  const [deleting, setDeleting] = useState<StockEntryOut | null>(null)

  const columns: Column<StockEntryOut>[] = [
    {
      key: 'kind',
      header: 'Entry',
      render: (e) => <span className="font-medium whitespace-nowrap">{KIND_LABEL[e.kind] ?? e.kind}</span>,
    },
    {
      key: 'lines',
      header: 'Lines',
      render: (e) => (
        <div className="flex flex-col">
          {e.lines.map((l, i) => (
            <span key={i} className="num">
              {lineText(l)}
              {l.note ? <span className="text-muted"> · {l.note}</span> : null}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'by',
      header: 'Recorded',
      render: (e) => (
        <span className="text-muted text-[12px] whitespace-nowrap">
          {e.created_by_name ?? '—'} ·{' '}
          {new Date(e.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (e) => <RowActions onEdit={() => setEditing(e)} onDelete={() => setDeleting(e)} />,
    },
  ]

  return (
    <>
      <Listing
        loading={q.isLoading}
        rows={rows}
        columns={columns}
        rowKey={(e) => e.entry_id}
        empty="No purchase entries on this date."
      />
      {editing ? (
        <PurchaseEdit
          key={editing.entry_id}
          entry={editing}
          onClose={() => setEditing(null)}
          onDone={refresh}
        />
      ) : null}
      <DeleteDialog
        open={!!deleting}
        title="Delete purchase entry"
        what={deleting ? `${KIND_LABEL[deleting.kind]}: ${deleting.lines.map(lineText).join(', ')}.` : ''}
        onClose={() => setDeleting(null)}
        onDelete={async (reason) => {
          const res = await asResult(
            deleteStockEntryV1StockEntriesEntryIdDeletePost(deleting!.entry_id, { reason }),
          )
          if (res.status === 204) await refresh()
          return res
        }}
      />
    </>
  )
}

function PurchaseEdit({
  entry,
  onClose,
  onDone,
}: {
  entry: StockEntryOut
  onClose: () => void
  onDone: () => Promise<unknown>
}) {
  const [date, setDate] = useState(entry.business_date)
  const [qty, setQty] = useState(entry.lines.map((l) => String(l.qty)))
  const [notes, setNotes] = useState(entry.lines.map((l) => l.note ?? ''))

  return (
    <EditDialog
      open
      title={`Edit ${KIND_LABEL[entry.kind] ?? entry.kind}`}
      onClose={onClose}
      onSave={async (reason) => {
        const lines = entry.lines
          .map((l, i) => ({
            cylinder_type_id: l.cylinder_type_id ?? null,
            accessory_id: l.accessory_id ?? null,
            condition: l.condition ?? null,
            qty: Number(qty[i]) || 0,
            note: notes[i].trim() || null,
          }))
          .filter((l) => l.qty > 0)
        if (lines.length === 0)
          return { status: 400, data: { detail: 'Every line is 0 — use Delete instead.' } }
        const res = await asResult(
          editStockEntryV1StockEntriesEntryIdPut(entry.entry_id, {
            reason,
            business_date: date,
            lines,
          } as never),
        )
        if (res.status === 200) await onDone()
        return res
      }}
    >
      <Field label="Date">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      {entry.lines.map((l, i) => (
        <div key={i} className="grid grid-cols-[1fr_90px] gap-2 items-end">
          <Field label={`${l.label}${l.condition ? ` (${l.condition})` : ''}`}>
            <Input
              value={notes[i]}
              placeholder="Note"
              onChange={(e) => setNotes((ns) => ns.map((x, j) => (j === i ? e.target.value : x)))}
            />
          </Field>
          <Field label="Qty">
            <Input
              type="number"
              min={0}
              className="num text-right"
              value={qty[i]}
              onChange={(e) => setQty((qs) => qs.map((x, j) => (j === i ? e.target.value : x)))}
            />
          </Field>
        </div>
      ))}
      <p className="text-[11.5px] text-muted">Set a line to 0 to remove it.</p>
    </EditDialog>
  )
}

// ------------------------------------------------------------------ expenses

const routeInvoice = (e: ExpenseOut) => {
  const m = /^route · invoice (.+)$/.exec(e.note ?? '')
  return m ? m[1] : null
}

function ExpensesTab({ date }: { date: string }) {
  const refresh = useRefresh()
  const q = useListExpensesV1ExpensesGet({ date })
  const rows: ExpenseOut[] = q.data?.status === 200 ? q.data.data : []
  const [editing, setEditing] = useState<ExpenseOut | null>(null)
  const [deleting, setDeleting] = useState<ExpenseOut | null>(null)

  const columns: Column<ExpenseOut>[] = [
    { key: 'item', header: 'Item', render: (e) => <span className="font-medium">{e.item_name}</span> },
    { key: 'amount', header: 'Amount ₹', numeric: true, render: (e) => <Money value={n(e.amount)} bare /> },
    { key: 'method', header: 'Paid by', render: (e) => <span className="capitalize">{e.method}</span> },
    { key: 'boy', header: 'Delivery person', render: (e) => e.delivery_name ?? dash },
    { key: 'note', header: 'Note', render: (e) => <span className="text-muted">{e.note || '—'}</span> },
    {
      key: 'actions',
      header: '',
      render: (e) => {
        const inv = routeInvoice(e)
        return (
          <RowActions
            onEdit={() => setEditing(e)}
            onDelete={() => setDeleting(e)}
            lockedNote={inv ? `Part of invoice ${inv} — edit the invoice` : undefined}
          />
        )
      },
    },
  ]

  return (
    <>
      <Listing loading={q.isLoading} rows={rows} columns={columns} rowKey={(e) => e.id} empty="No expenses on this date." />
      {editing ? (
        <ExpenseEditDialog key={editing.id} expense={editing} onClose={() => setEditing(null)} onDone={refresh} />
      ) : null}
      <DeleteDialog
        open={!!deleting}
        title="Delete expense"
        what={deleting ? `${deleting.item_name} · ₹${n(deleting.amount)}.` : ''}
        onClose={() => setDeleting(null)}
        onDelete={async (reason) => {
          const res = await asResult(deleteExpenseV1ExpensesExpenseIdDeletePost(deleting!.id, { reason }))
          if (res.status === 204) await refresh()
          return res
        }}
      />
    </>
  )
}

function ExpenseEditDialog({
  expense,
  onClose,
  onDone,
}: {
  expense: ExpenseOut
  onClose: () => void
  onDone: () => Promise<unknown>
}) {
  const itemsQ = useListExpenseItemsV1ExpenseItemsGet({ active: 'all' })
  const driversQ = useListUsersV1UsersGet({ role: 'delivery' })
  const items = itemsQ.data?.status === 200 ? itemsQ.data.data : []
  const drivers = driversQ.data?.status === 200 ? driversQ.data.data : []
  const [date, setDate] = useState(expense.business_date)
  const [itemId, setItemId] = useState(expense.item_id)
  const [amount, setAmount] = useState(String(n(expense.amount)))
  const [method, setMethod] = useState(expense.method)
  const [deliveryId, setDeliveryId] = useState(expense.delivery_id ?? '')
  const [note, setNote] = useState(expense.note ?? '')

  return (
    <EditDialog
      open
      title="Edit expense"
      onClose={onClose}
      onSave={async (reason) => {
        const res = await asResult(
          editExpenseV1ExpensesExpenseIdPut(expense.id, {
            reason,
            business_date: date,
            item_id: itemId,
            amount: Number(amount),
            method,
            note: note.trim() || null,
            delivery_id: deliveryId || null,
          } as never),
        )
        if (res.status === 204) await onDone()
        return res
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Amount ₹">
          <Input type="number" min={0} className="num text-right" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Item">
          <Select value={itemId} onChange={(e) => setItemId(e.target.value)}>
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Paid by">
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="digital">Digital</option>
          </Select>
        </Field>
      </div>
      <Field label="Delivery person (optional)">
        <Select value={deliveryId} onChange={(e) => setDeliveryId(e.target.value)}>
          <option value="">—</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Note">
        <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      </Field>
    </EditDialog>
  )
}

// ------------------------------------------------------------------ deposits

function DepositsTab({ date }: { date: string }) {
  const refresh = useRefresh()
  const q = useListTransfersV1TransfersGet({ start: date, end: date })
  const rows: TransferOut[] = q.data?.status === 200 ? q.data.data : []
  const [editing, setEditing] = useState<TransferOut | null>(null)
  const [deleting, setDeleting] = useState<TransferOut | null>(null)

  const columns: Column<TransferOut>[] = [
    {
      key: 'route',
      header: 'From → to',
      render: (t) => (
        <span className="whitespace-nowrap">
          {t.source_label} <span className="text-muted">→</span> {t.dest_label}
        </span>
      ),
    },
    { key: 'amount', header: 'Amount ₹', numeric: true, render: (t) => <Money value={n(t.amount)} bare /> },
    { key: 'method', header: 'Method', render: (t) => <span className="capitalize">{t.method}</span> },
    { key: 'note', header: 'Note', render: (t) => <span className="text-muted">{t.note || '—'}</span> },
    {
      key: 'actions',
      header: '',
      render: (t) => <RowActions onEdit={() => setEditing(t)} onDelete={() => setDeleting(t)} />,
    },
  ]

  return (
    <>
      <Listing loading={q.isLoading} rows={rows} columns={columns} rowKey={(t) => t.id} empty="No deposits on this date." />
      {editing ? (
        <TransferEditDialog key={editing.id} transfer={editing} onClose={() => setEditing(null)} onDone={refresh} />
      ) : null}
      <DeleteDialog
        open={!!deleting}
        title="Delete deposit"
        what={deleting ? `${deleting.source_label} → ${deleting.dest_label} · ₹${n(deleting.amount)}.` : ''}
        onClose={() => setDeleting(null)}
        onDelete={async (reason) => {
          const res = await asResult(deleteTransferV1TransfersTransferIdDeletePost(deleting!.id, { reason }))
          if (res.status === 204) await refresh()
          return res
        }}
      />
    </>
  )
}

function TransferEditDialog({
  transfer,
  onClose,
  onDone,
}: {
  transfer: TransferOut
  onClose: () => void
  onDone: () => Promise<unknown>
}) {
  const [date, setDate] = useState(transfer.business_date)
  const [amount, setAmount] = useState(String(n(transfer.amount)))
  const [method, setMethod] = useState(transfer.method)
  const [note, setNote] = useState(transfer.note ?? '')

  return (
    <EditDialog
      open
      title={`Edit deposit · ${transfer.source_label} → ${transfer.dest_label}`}
      onClose={onClose}
      onSave={async (reason) => {
        const res = await asResult(
          editTransferV1TransfersTransferIdPut(transfer.id, {
            reason,
            business_date: date,
            amount: Number(amount),
            method,
            note: note.trim() || null,
          }),
        )
        if (res.status === 204) await onDone()
        return res
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Amount ₹">
          <Input type="number" min={0} className="num text-right" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
      </div>
      <Field label="Method">
        <Input value={method} onChange={(e) => setMethod(e.target.value)} maxLength={40} />
      </Field>
      <Field label="Note">
        <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      </Field>
      <p className="text-[11.5px] text-muted">To change where the money went, delete this and record it again.</p>
    </EditDialog>
  )
}

// ------------------------------------------------------------------ balance entries

function BalanceTab({ date }: { date: string }) {
  const refresh = useRefresh()
  const q = useListBalanceEntriesV1BalanceEntriesGet({ date })
  const rows: BalanceEntryOut[] = q.data?.status === 200 ? q.data.data : []
  const [editing, setEditing] = useState<BalanceEntryOut | null>(null)
  const [deleting, setDeleting] = useState<BalanceEntryOut | null>(null)

  const columns: Column<BalanceEntryOut>[] = [
    {
      key: 'party',
      header: 'Party',
      render: (b) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          {b.party_name}
          {b.party_kind === 'customer' ? (
            <span className="rounded-full bg-surface px-[7px] py-[2px] text-[10px] font-semibold text-muted">
              Customer
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'kind',
      header: 'Type',
      render: (b) => (
        <span className={cn('font-medium', b.kind === 'repayment' ? 'text-ok' : 'text-bad')}>
          {b.kind === 'repayment' ? `Repaid · ${(b.method ?? 'cash').toUpperCase()}` : 'Owes'}
        </span>
      ),
    },
    { key: 'amount', header: 'Amount ₹', numeric: true, render: (b) => <Money value={n(b.amount)} bare /> },
    { key: 'note', header: 'Note', render: (b) => <span className="text-muted">{b.note || '—'}</span> },
    {
      key: 'actions',
      header: '',
      render: (b) => (
        <RowActions
          onEdit={() => setEditing(b)}
          onDelete={() => setDeleting(b)}
          lockedNote={b.invoice_no ? `From invoice ${b.invoice_no} — edit the invoice` : undefined}
        />
      ),
    },
  ]

  const call = (b: BalanceEntryOut) =>
    b.party_kind === 'delivery'
      ? {
          edit: editDeliveryBalanceV1DeliveryBalancesEntryIdPut,
          del: deleteDeliveryBalanceV1DeliveryBalancesEntryIdDeletePost,
        }
      : {
          edit: editCustomerBalanceV1CustomerBalancesEntryIdPut,
          del: deleteCustomerBalanceV1CustomerBalancesEntryIdDeletePost,
        }

  return (
    <>
      <Listing
        loading={q.isLoading}
        rows={rows}
        columns={columns}
        rowKey={(b) => b.id}
        empty="No balance entries on this date."
      />
      {editing ? (
        <BalanceEditDialog
          key={editing.id}
          entry={editing}
          onClose={() => setEditing(null)}
          onSave={async (body) => {
            const res = await asResult(call(editing).edit(editing.id, body as never))
            if (res.status === 204) await refresh()
            return res
          }}
        />
      ) : null}
      <DeleteDialog
        open={!!deleting}
        title="Delete balance entry"
        what={deleting ? `${deleting.party_name} · ${deleting.kind} · ₹${n(deleting.amount)}.` : ''}
        onClose={() => setDeleting(null)}
        onDelete={async (reason) => {
          const res = await asResult(call(deleting!).del(deleting!.id, { reason }))
          if (res.status === 204) await refresh()
          return res
        }}
      />
    </>
  )
}

function BalanceEditDialog({
  entry,
  onClose,
  onSave,
}: {
  entry: BalanceEntryOut
  onClose: () => void
  onSave: (body: object) => Promise<ApiResult>
}) {
  const [date, setDate] = useState(entry.entry_date)
  const [amount, setAmount] = useState(String(n(entry.amount)))
  const [method, setMethod] = useState(entry.method ?? 'cash')
  const [note, setNote] = useState(entry.note ?? '')
  const repayment = entry.kind === 'repayment'

  return (
    <EditDialog
      open
      title={`Edit ${repayment ? 'repayment' : 'charge'} · ${entry.party_name}`}
      onClose={onClose}
      onSave={(reason) =>
        onSave({
          reason,
          entry_date: date,
          amount: Number(amount),
          method: repayment ? method : null,
          note: note.trim() || null,
        })
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Amount ₹">
          <Input type="number" min={0} className="num text-right" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
      </div>
      {repayment ? (
        <Field label="Paid by">
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
          </Select>
        </Field>
      ) : null}
      <Field label="Note">
        <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} />
      </Field>
    </EditDialog>
  )
}

// ------------------------------------------------------------------ credits

function CreditsTab() {
  const refresh = useRefresh()
  const q = useListCreditsV1CreditsGet()
  const rows: CreditOut[] = q.data?.status === 200 ? q.data.data : []
  const [editing, setEditing] = useState<CreditOut | null>(null)
  const [deleting, setDeleting] = useState<CreditOut | null>(null)

  const columns: Column<CreditOut>[] = [
    { key: 'person', header: 'Person', render: (c) => <span className="font-medium">{c.person_name}</span> },
    { key: 'amount', header: 'Amount ₹', numeric: true, render: (c) => <Money value={n(c.amount)} bare /> },
    { key: 'given', header: 'Given on', render: (c) => <span className="num">{ddmmyyyy(c.given_date)}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (c) =>
        c.is_settled ? <span className="text-ok font-medium">Settled</span> : <span className="text-bad font-medium">Open</span>,
    },
    { key: 'note', header: 'Note', render: (c) => <span className="text-muted">{c.note || '—'}</span> },
    {
      key: 'actions',
      header: '',
      render: (c) => <RowActions onEdit={() => setEditing(c)} onDelete={() => setDeleting(c)} />,
    },
  ]

  return (
    <>
      <Listing loading={q.isLoading} rows={rows} columns={columns} rowKey={(c) => c.id} empty="No credits yet." />
      {editing ? <CreditEditDialog key={editing.id} credit={editing} onClose={() => setEditing(null)} onDone={refresh} /> : null}
      <DeleteDialog
        open={!!deleting}
        title="Delete credit"
        what={deleting ? `${deleting.person_name} · ₹${n(deleting.amount)}.` : ''}
        onClose={() => setDeleting(null)}
        onDelete={async (reason) => {
          const res = await asResult(deleteCreditV1CreditsCreditIdDeletePost(deleting!.id, { reason }))
          if (res.status === 204) await refresh()
          return res
        }}
      />
    </>
  )
}

function CreditEditDialog({
  credit,
  onClose,
  onDone,
}: {
  credit: CreditOut
  onClose: () => void
  onDone: () => Promise<unknown>
}) {
  const [person, setPerson] = useState(credit.person_name)
  const [amount, setAmount] = useState(String(n(credit.amount)))
  const [given, setGiven] = useState(credit.given_date)
  const [note, setNote] = useState(credit.note ?? '')

  return (
    <EditDialog
      open
      title="Edit credit"
      onClose={onClose}
      onSave={async (reason) => {
        const res = await asResult(
          editCreditV1CreditsCreditIdPut(credit.id, {
            reason,
            person_name: person.trim(),
            amount: Number(amount),
            given_date: given,
            note: note.trim() || null,
          }),
        )
        if (res.status === 204) await onDone()
        return res
      }}
    >
      <Field label="Person">
        <Input value={person} onChange={(e) => setPerson(e.target.value)} maxLength={120} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount ₹">
          <Input type="number" min={0} className="num text-right" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Given on">
          <Input type="date" value={given} onChange={(e) => setGiven(e.target.value)} />
        </Field>
      </div>
      <Field label="Note">
        <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} />
      </Field>
    </EditDialog>
  )
}

