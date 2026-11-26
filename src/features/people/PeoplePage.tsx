import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Plus, Send } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  getListPeopleV1PeopleGetQueryKey,
  useCreatePersonV1PeoplePost,
  useListPeopleV1PeopleGet,
  useUpdatePersonV1PeoplePersonIdPatch,
} from '@/api/generated/banking/banking'
import { useBalanceSummaryV1DeliveryBalancesSummaryGet } from '@/api/generated/delivery-balances/delivery-balances'
import type { DeliveryBalanceSummaryOut, PersonOut } from '@/api/generated/model'
import { useAuth } from '@/auth/useAuth'
import { AppShell } from '@/components/app/AppShell'
import { DataTable, type Column } from '@/components/app/DataTable'
import { Money } from '@/components/app/Money'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { detailOf } from '@/lib/apiError'
import { cn } from '@/lib/cn'

type Kind = 'debtor' | 'creditor'

const COPY: Record<
  Kind,
  { title: string; hint: string; opening: string; out: string; in: string; balance: string; total: string }
> = {
  debtor: {
    title: 'Debtors',
    hint: 'People we gave money to — they owe us',
    opening: 'Already owed us',
    out: 'Given',
    in: 'Paid back',
    balance: 'They owe us',
    total: 'Debtors owe us',
  },
  creditor: {
    title: 'Creditors',
    hint: 'People who gave the company money — we owe them',
    opening: 'We already owed',
    out: 'Paid back',
    in: 'Received',
    balance: 'We owe them',
    total: 'We owe creditors',
  },
}

/** Debtors (owe us) and creditors (we owe), each with an opening balance. */
export function PeoplePage() {
  const [search, setSearch] = useSearchParams()
  const kind: Kind = search.get('kind') === 'creditor' ? 'creditor' : 'debtor'
  const copy = COPY[kind]
  const { role } = useAuth()
  const isOwner = role === 'super_admin'
  const navigate = useNavigate()
  const qc = useQueryClient()

  const listQuery = useListPeopleV1PeopleGet({ active: 'all' })
  const all: PersonOut[] = listQuery.data?.status === 200 ? listQuery.data.data : []
  const people = all.filter((p) => p.kind === kind)
  const owed = people.filter((p) => p.is_active).reduce((t, p) => t + Number(p.balance), 0)

  const createMutation = useCreatePersonV1PeoplePost()
  const patchMutation = useUpdatePersonV1PeoplePersonIdPatch()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PersonOut | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [opening, setOpening] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: getListPeopleV1PeopleGetQueryKey() })

  const startAdd = () => {
    setEditing(null)
    setName('')
    setPhone('')
    setOpening('')
    setNote('')
    setError(null)
    setOpen(true)
  }
  const startEdit = (p: PersonOut) => {
    setEditing(p)
    setName(p.name)
    setPhone(p.phone ?? '')
    setOpening(String(Number(p.opening_balance)))
    setNote(p.note ?? '')
    setError(null)
    setOpen(true)
  }

  const submit = async () => {
    setError(null)
    if (!name.trim()) return setError('Enter a name.')
    const openingValue = opening.trim() === '' ? 0 : Number(opening)
    if (!(openingValue >= 0)) return setError('Opening balance cannot be negative.')
    const res = editing
      ? await patchMutation.mutateAsync({
          personId: editing.id,
          data: {
            name: name.trim(),
            phone,
            note,
            ...(isOwner ? { opening_balance: openingValue } : {}),
          },
        })
      : await createMutation.mutateAsync({
          data: {
            name: name.trim(),
            kind,
            phone: phone || undefined,
            note: note || undefined,
            opening_balance: openingValue,
          },
        })
    const status = res.status as number
    if (status === 200 || status === 201) {
      await invalidate()
      setOpen(false)
    } else setError(detailOf(res.data, 'Could not save.'))
  }

  const toggle = async (p: PersonOut) => {
    await patchMutation.mutateAsync({ personId: p.id, data: { is_active: !p.is_active } })
    await invalidate()
  }

  const columns: Column<PersonOut>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (p) => (
        <div className={cn(!p.is_active && 'opacity-60')}>
          <div className="font-medium text-ink">{p.name}</div>
          <div className="text-[11.5px] text-muted">
            {[p.phone, p.note, p.is_active ? null : 'inactive'].filter(Boolean).join(' · ') || '—'}
          </div>
        </div>
      ),
    },
    { key: 'opening', header: `${copy.opening} ₹`, numeric: true, render: (p) => <Money value={Number(p.opening_balance)} bare /> },
    {
      key: 'out',
      header: `${copy.out} ₹`,
      numeric: true,
      render: (p) => <Money value={Number(p.given)} bare className={Number(p.given) ? '' : 'text-muted'} />,
    },
    {
      key: 'in',
      header: `${copy.in} ₹`,
      numeric: true,
      render: (p) => <Money value={Number(p.received)} bare className={Number(p.received) ? '' : 'text-muted'} />,
    },
    {
      key: 'balance',
      header: `${copy.balance} ₹`,
      numeric: true,
      render: (p) => (
        <Money
          value={Number(p.balance)}
          bare
          className={cn('font-display font-bold', Number(p.balance) > 0 ? (kind === 'debtor' ? 'text-bad' : 'text-warn') : 'text-ok')}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="h-8 px-3 text-[12px]" onClick={() => startEdit(p)}>
            Edit
          </Button>
          <Button variant="ghost" className="h-8 px-3 text-[12px]" onClick={() => toggle(p)}>
            {p.is_active ? 'Deactivate' : 'Reactivate'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AppShell
      title="Debtors / Creditors"
      subtitle="Who owes us, and whom we owe"
      topbarActions={
        <div className="text-right">
          <div className="text-[11px] text-muted">{copy.total}</div>
          <Money value={owed} className="font-display font-extrabold text-[16px] text-ink" />
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        {(['debtor', 'creditor'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setSearch({ kind: k })}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors',
              kind === k ? 'bg-orange text-white' : 'text-muted hover:bg-surface',
            )}
          >
            {COPY[k].title}
          </button>
        ))}
        <Button variant="ghost" className="h-8 px-3 text-[12px] ml-auto" onClick={() => navigate('/deposits')}>
          <Send size={14} /> Record money given / received
        </Button>
      </div>

      <Card>
        <CardHeader
          title={copy.title}
          hint={copy.hint}
          right={
            <Button variant="primary" className="h-9" onClick={startAdd}>
              <Plus size={16} /> Add {kind}
            </Button>
          }
        />
        {listQuery.isLoading ? (
          <div className="py-12 text-center text-[13px] text-muted">Loading…</div>
        ) : people.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-muted">No {copy.title.toLowerCase()} yet.</div>
        ) : (
          <DataTable columns={columns} data={people} getRowKey={(p) => p.id} />
        )}
      </Card>

      {kind === 'debtor' ? <BoysOwing /> : null}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${kind}` : `Add ${kind}`}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">Name</label>
            <Input value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">Phone (optional)</label>
            <Input value={phone} maxLength={20} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">Opening balance ₹ — {copy.opening.toLowerCase()}</label>
            <Input
              type="number"
              min={0}
              value={opening}
              placeholder="0"
              disabled={editing !== null && !isOwner}
              onChange={(e) => setOpening(e.target.value)}
              className="num text-right"
            />
            {editing !== null && !isOwner ? (
              <p className="text-[11.5px] text-muted mt-1">Only the owner can change an opening balance.</p>
            ) : null}
          </div>
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">Note (optional)</label>
            <Input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
          </div>
          {error ? <div className="text-[12.5px] text-bad bg-badbg rounded-lg px-3 py-2">{error}</div> : null}
          <Button className="w-full" onClick={submit} disabled={createMutation.isPending || patchMutation.isPending}>
            {editing ? 'Save' : `Add ${kind}`}
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}

/** Delivery boys with an unpaid balance also owe us — managed on the Balance page. */
function BoysOwing() {
  const navigate = useNavigate()
  const q = useBalanceSummaryV1DeliveryBalancesSummaryGet()
  const boys: DeliveryBalanceSummaryOut[] = (q.data?.status === 200 ? q.data.data : []).filter(
    (b) => Number(b.balance) > 0,
  )
  if (boys.length === 0) return null
  return (
    <Card>
      <CardHeader
        title="Delivery boys who owe us"
        hint="From unpaid sale settlements"
        right={
          <Button variant="ghost" className="h-8 px-3 text-[12px]" onClick={() => navigate('/balance')}>
            Manage <ArrowRight size={14} />
          </Button>
        }
      />
      <div className="px-[18px] pb-4 pt-1 flex flex-col">
        {boys.map((b) => (
          <div key={b.delivery_id} className="flex items-center justify-between gap-3 py-2.5 border-b border-line last:border-0">
            <span className="text-[13.5px] font-medium text-ink">{b.delivery_name}</span>
            <Money value={Number(b.balance)} className="font-display font-bold text-bad" />
          </div>
        ))}
      </div>
    </Card>
  )
}
