import { useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import {
  getListBankAccountsV1BankAccountsGetQueryKey,
  getListBanksV1BanksGetQueryKey,
  getListVendorsV1VendorsGetQueryKey,
  useCreateBankAccountV1BankAccountsPost,
  useCreateBankV1BanksPost,
  useCreateVendorV1VendorsPost,
  useListBankAccountsV1BankAccountsGet,
  useListBanksV1BanksGet,
  useListVendorsV1VendorsGet,
  useUpdateBankAccountV1BankAccountsAccountIdPatch,
  useUpdateBankV1BanksBankIdPatch,
  useUpdateVendorV1VendorsVendorIdPatch,
} from '@/api/generated/banking/banking'
import type { BankAccountOut, BankOut, VendorOut } from '@/api/generated/model'
import { AppShell } from '@/components/app/AppShell'
import { DataTable, type Column } from '@/components/app/DataTable'
import { StatusPill } from '@/components/app/StatusPill'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'

const ALL = { active: 'all' as const }

function ActivePill({ active }: { active: boolean }) {
  return active ? (
    <StatusPill variant="ok" size="sm">
      Active
    </StatusPill>
  ) : (
    <span className="inline-flex items-center rounded-full bg-surface px-[9px] py-[3px] text-[10.5px] font-semibold text-muted">
      Inactive
    </span>
  )
}

export function BankingPage() {
  return (
    <AppShell title="Banking" subtitle="Banks, accounts & vendors (accounting only)">
      <BanksSection />
      <BankAccountsSection />
      <VendorsSection />
    </AppShell>
  )
}

/* ----------------------------- Banks ----------------------------- */
function BanksSection() {
  const qc = useQueryClient()
  const listQuery = useListBanksV1BanksGet(ALL)
  const createMutation = useCreateBankV1BanksPost()
  const patchMutation = useUpdateBankV1BanksBankIdPatch()
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<BankOut | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const banks: BankOut[] = listQuery.data?.status === 200 ? listQuery.data.data : []
  const invalidate = () => qc.invalidateQueries({ queryKey: getListBanksV1BanksGetQueryKey(ALL) })

  const submit = async () => {
    setError(null)
    if (!name.trim()) return setError('Enter a bank name.')
    const res = editing
      ? await patchMutation.mutateAsync({ bankId: editing.id, data: { name } })
      : await createMutation.mutateAsync({ data: { name } })
    const status = res.status as number
    if (status === 200 || status === 201) {
      await invalidate()
      setAddOpen(false)
      setEditing(null)
      setName('')
    } else if (status === 409) setError('A bank with this name already exists.')
    else setError('Could not save.')
  }

  const toggle = async (b: BankOut) => {
    await patchMutation.mutateAsync({ bankId: b.id, data: { is_active: !b.is_active } })
    await invalidate()
  }

  const columns: Column<BankOut>[] = [
    { key: 'name', header: 'Bank', render: (b) => b.name },
    { key: 'status', header: 'Status', render: (b) => <ActivePill active={b.is_active} /> },
    {
      key: 'actions',
      header: '',
      render: (b) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="h-8 px-3 text-[12px]" onClick={() => { setEditing(b); setName(b.name); setError(null) }}>
            Edit
          </Button>
          <Button variant="ghost" className="h-8 px-3 text-[12px]" onClick={() => toggle(b)}>
            {b.is_active ? 'Deactivate' : 'Reactivate'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader
        title="Banks"
        hint="SBI, HDFC, …"
        right={
          <Button variant="primary" className="h-9" onClick={() => { setAddOpen(true); setName(''); setError(null) }}>
            <Plus size={16} /> Add bank
          </Button>
        }
      />
      {banks.length === 0 ? (
        <div className="py-12 text-center text-[13px] text-muted">No banks yet.</div>
      ) : (
        <DataTable columns={columns} data={banks} getRowKey={(b) => b.id} />
      )}
      <Modal open={addOpen || editing !== null} onClose={() => { setAddOpen(false); setEditing(null) }} title={editing ? 'Edit bank' : 'Add bank'}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">Name</label>
            <Input value={name} placeholder="SBI" onChange={(e) => setName(e.target.value)} />
          </div>
          {error ? <div className="text-[12.5px] text-bad bg-badbg rounded-lg px-3 py-2">{error}</div> : null}
          <Button className="w-full" onClick={submit} disabled={createMutation.isPending || patchMutation.isPending}>
            {editing ? 'Save' : 'Add bank'}
          </Button>
        </div>
      </Modal>
    </Card>
  )
}

/* -------------------------- Bank accounts -------------------------- */
function BankAccountsSection() {
  const qc = useQueryClient()
  const listQuery = useListBankAccountsV1BankAccountsGet(ALL)
  const banksQuery = useListBanksV1BanksGet({ active: 'true' })
  const createMutation = useCreateBankAccountV1BankAccountsPost()
  const patchMutation = useUpdateBankAccountV1BankAccountsAccountIdPatch()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BankAccountOut | null>(null)
  const [bankId, setBankId] = useState('')
  const [accountType, setAccountType] = useState('')
  const [label, setLabel] = useState('')
  const [error, setError] = useState<string | null>(null)

  const accounts: BankAccountOut[] = listQuery.data?.status === 200 ? listQuery.data.data : []
  const banks: BankOut[] = banksQuery.data?.status === 200 ? banksQuery.data.data : []
  const invalidate = () => qc.invalidateQueries({ queryKey: getListBankAccountsV1BankAccountsGetQueryKey(ALL) })

  const startAdd = () => { setEditing(null); setBankId(''); setAccountType(''); setLabel(''); setError(null); setOpen(true) }
  const startEdit = (a: BankAccountOut) => { setEditing(a); setBankId(a.bank_id); setAccountType(a.account_type); setLabel(a.label ?? ''); setError(null); setOpen(true) }

  const submit = async () => {
    setError(null)
    if (!accountType.trim()) return setError('Enter an account type.')
    if (!editing && !bankId) return setError('Pick a bank.')
    const res = editing
      ? await patchMutation.mutateAsync({ accountId: editing.id, data: { account_type: accountType, label: label || undefined } })
      : await createMutation.mutateAsync({ data: { bank_id: bankId, account_type: accountType, label: label || undefined } })
    if (res.status === 200 || res.status === 201) {
      await invalidate()
      setOpen(false)
    } else setError('Could not save.')
  }

  const toggle = async (a: BankAccountOut) => {
    await patchMutation.mutateAsync({ accountId: a.id, data: { is_active: !a.is_active } })
    await invalidate()
  }

  const columns: Column<BankAccountOut>[] = [
    { key: 'bank', header: 'Bank', render: (a) => a.bank_name },
    { key: 'type', header: 'Account type', render: (a) => a.account_type },
    { key: 'label', header: 'Label', render: (a) => a.label ?? <span className="text-muted">—</span> },
    { key: 'status', header: 'Status', render: (a) => <ActivePill active={a.is_active} /> },
    {
      key: 'actions',
      header: '',
      render: (a) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="h-8 px-3 text-[12px]" onClick={() => startEdit(a)}>Edit</Button>
          <Button variant="ghost" className="h-8 px-3 text-[12px]" onClick={() => toggle(a)}>
            {a.is_active ? 'Deactivate' : 'Reactivate'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader
        title="Bank accounts"
        hint="Each account carries its own balance (deposits)"
        right={<Button variant="primary" className="h-9" onClick={startAdd}><Plus size={16} /> Add account</Button>}
      />
      {accounts.length === 0 ? (
        <div className="py-12 text-center text-[13px] text-muted">No accounts yet.</div>
      ) : (
        <DataTable columns={columns} data={accounts} getRowKey={(a) => a.id} />
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit account' : 'Add account'}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">Bank</label>
            <Select value={bankId} onChange={(e) => setBankId(e.target.value)} disabled={editing !== null}>
              <option value="">Select…</option>
              {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">Account type</label>
            <Input value={accountType} placeholder="Savings / Current / Personal" onChange={(e) => setAccountType(e.target.value)} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">Label (optional)</label>
            <Input value={label} placeholder="Main / last 4 digits" onChange={(e) => setLabel(e.target.value)} />
          </div>
          {error ? <div className="text-[12.5px] text-bad bg-badbg rounded-lg px-3 py-2">{error}</div> : null}
          <Button className="w-full" onClick={submit} disabled={createMutation.isPending || patchMutation.isPending}>
            {editing ? 'Save' : 'Add account'}
          </Button>
        </div>
      </Modal>
    </Card>
  )
}

/* ----------------------------- Vendors ----------------------------- */
function VendorsSection() {
  const qc = useQueryClient()
  const listQuery = useListVendorsV1VendorsGet(ALL)
  const createMutation = useCreateVendorV1VendorsPost()
  const patchMutation = useUpdateVendorV1VendorsVendorIdPatch()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<VendorOut | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const vendors: VendorOut[] = listQuery.data?.status === 200 ? listQuery.data.data : []
  const invalidate = () => qc.invalidateQueries({ queryKey: getListVendorsV1VendorsGetQueryKey(ALL) })

  const submit = async () => {
    setError(null)
    if (!name.trim()) return setError('Enter a vendor name.')
    const res = editing
      ? await patchMutation.mutateAsync({ vendorId: editing.id, data: { name } })
      : await createMutation.mutateAsync({ data: { name } })
    const status = res.status as number
    if (status === 200 || status === 201) {
      await invalidate()
      setOpen(false)
      setEditing(null)
      setName('')
    } else if (status === 409) setError('A vendor with this name already exists.')
    else setError('Could not save.')
  }

  const toggle = async (v: VendorOut) => {
    await patchMutation.mutateAsync({ vendorId: v.id, data: { is_active: !v.is_active } })
    await invalidate()
  }

  const columns: Column<VendorOut>[] = [
    { key: 'name', header: 'Vendor', render: (v) => v.name },
    { key: 'status', header: 'Status', render: (v) => <ActivePill active={v.is_active} /> },
    {
      key: 'actions',
      header: '',
      render: (v) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="h-8 px-3 text-[12px]" onClick={() => { setEditing(v); setName(v.name); setError(null); setOpen(true) }}>Edit</Button>
          <Button variant="ghost" className="h-8 px-3 text-[12px]" onClick={() => toggle(v)}>
            {v.is_active ? 'Deactivate' : 'Reactivate'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader
        title="Vendors"
        hint="IOC, pipe supplier, … — who you pay"
        right={<Button variant="primary" className="h-9" onClick={() => { setEditing(null); setName(''); setError(null); setOpen(true) }}><Plus size={16} /> Add vendor</Button>}
      />
      {vendors.length === 0 ? (
        <div className="py-12 text-center text-[13px] text-muted">No vendors yet.</div>
      ) : (
        <DataTable columns={columns} data={vendors} getRowKey={(v) => v.id} />
      )}
      <Modal open={open} onClose={() => { setOpen(false); setEditing(null) }} title={editing ? 'Edit vendor' : 'Add vendor'}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">Name</label>
            <Input value={name} placeholder="IOC" onChange={(e) => setName(e.target.value)} />
          </div>
          {error ? <div className="text-[12.5px] text-bad bg-badbg rounded-lg px-3 py-2">{error}</div> : null}
          <Button className="w-full" onClick={submit} disabled={createMutation.isPending || patchMutation.isPending}>
            {editing ? 'Save' : 'Add vendor'}
          </Button>
        </div>
      </Modal>
    </Card>
  )
}
