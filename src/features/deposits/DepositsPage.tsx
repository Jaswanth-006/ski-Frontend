import { useQueryClient } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { useState } from 'react'
import {
  useListBankAccountsV1BankAccountsGet,
  useListVendorsV1VendorsGet,
} from '@/api/generated/banking/banking'
import {
  getListTransfersV1TransfersGetQueryKey,
  useCreateTransferV1TransfersPost,
  useListTransfersV1TransfersGet,
} from '@/api/generated/transfers/transfers'
import type { BankAccountOut, TransferOut, VendorOut } from '@/api/generated/model'
import { AppShell } from '@/components/app/AppShell'
import { Money } from '@/components/app/Money'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

const today = () => new Date().toISOString().slice(0, 10)
const acctLabel = (a: BankAccountOut) =>
  `${a.bank_name} · ${a.account_type}${a.label ? ` (${a.label})` : ''}`

export function DepositsPage() {
  const qc = useQueryClient()
  const [date, setDate] = useState(today())
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('box') // 'box' | account id
  const [destKind, setDestKind] = useState<'vendor' | 'person' | 'bank_account'>('vendor')
  const [destVendor, setDestVendor] = useState('')
  const [destAccount, setDestAccount] = useState('')
  const [destPerson, setDestPerson] = useState('')
  const [method, setMethod] = useState('cash')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const accountsQuery = useListBankAccountsV1BankAccountsGet({ active: 'true' })
  const vendorsQuery = useListVendorsV1VendorsGet({ active: 'true' })
  const listQuery = useListTransfersV1TransfersGet()
  const createMutation = useCreateTransferV1TransfersPost()

  const accounts: BankAccountOut[] =
    accountsQuery.data?.status === 200 ? accountsQuery.data.data : []
  const vendors: VendorOut[] = vendorsQuery.data?.status === 200 ? vendorsQuery.data.data : []
  const transfers: TransferOut[] = listQuery.data?.status === 200 ? listQuery.data.data : []

  // Warn if a bank-account source lacks the balance for this deposit.
  const sourceBalance = source === 'box' ? null : accounts.find((a) => a.id === source)?.balance
  const insufficient =
    sourceBalance != null && Number(amount) > 0 && Number(amount) > Number(sourceBalance)

  const submit = async () => {
    setError(null)
    setOk(false)
    if (!(Number(amount) > 0)) return setError('Enter a positive amount.')
    const body: Record<string, unknown> = {
      business_date: date,
      amount: Number(amount),
      method,
      note: note || undefined,
      source_kind: source === 'box' ? 'cashier_box' : 'bank_account',
      source_bank_account_id: source === 'box' ? undefined : source,
      dest_kind: destKind,
    }
    if (destKind === 'vendor') {
      if (!destVendor) return setError('Pick a vendor.')
      body.dest_vendor_id = destVendor
    } else if (destKind === 'bank_account') {
      if (!destAccount) return setError('Pick a destination account.')
      if (destAccount === source) return setError('Source and destination must differ.')
      body.dest_bank_account_id = destAccount
    } else {
      if (!destPerson.trim()) return setError('Enter a person name.')
      body.dest_person_name = destPerson
    }
    const res = await createMutation.mutateAsync({ data: body as never })
    if (res.status === 201) {
      await qc.invalidateQueries({ queryKey: getListTransfersV1TransfersGetQueryKey() })
      await accountsQuery.refetch()
      setAmount('')
      setNote('')
      setOk(true)
    } else {
      setError('Could not record the deposit.')
    }
  }

  return (
    <AppShell title="Deposits" subtitle="Move money out of the cashier box or between accounts">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-5 items-start">
        <Card>
          <CardHeader title="New deposit" hint="Pick a source and a destination" />
          <div className="p-[18px] flex flex-col gap-3.5">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[12.5px] text-muted mb-1">Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
              </div>
              <div className="flex-1">
                <label className="block text-[12.5px] text-muted mb-1">Amount ₹</label>
                <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 num text-right" />
              </div>
            </div>

            <div>
              <label className="block text-[12.5px] text-muted mb-1">From (source)</label>
              <Select value={source} onChange={(e) => setSource(e.target.value)} className="h-9">
                <option value="box">Cashier box (day-sheet money)</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {acctLabel(a)} — ₹{Number(a.balance).toLocaleString('en-IN')}
                  </option>
                ))}
              </Select>
              {insufficient ? (
                <p className="text-[11.5px] text-bad mt-1">
                  Warning: amount exceeds this account's balance (allowed — accounting only).
                </p>
              ) : null}
            </div>

            <div className="flex gap-3">
              <div className="w-[140px]">
                <label className="block text-[12.5px] text-muted mb-1">To (type)</label>
                <Select
                  value={destKind}
                  onChange={(e) => setDestKind(e.target.value as typeof destKind)}
                  className="h-9"
                >
                  <option value="vendor">Vendor</option>
                  <option value="person">Person</option>
                  <option value="bank_account">Own account</option>
                </Select>
              </div>
              <div className="flex-1">
                <label className="block text-[12.5px] text-muted mb-1">Destination</label>
                {destKind === 'vendor' ? (
                  <Select value={destVendor} onChange={(e) => setDestVendor(e.target.value)} className="h-9">
                    <option value="">Select vendor…</option>
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </Select>
                ) : destKind === 'bank_account' ? (
                  <Select value={destAccount} onChange={(e) => setDestAccount(e.target.value)} className="h-9">
                    <option value="">Select account…</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{acctLabel(a)}</option>)}
                  </Select>
                ) : (
                  <Input value={destPerson} placeholder="Person name" onChange={(e) => setDestPerson(e.target.value)} className="h-9" />
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-[140px]">
                <label className="block text-[12.5px] text-muted mb-1">Method</label>
                <Select value={method} onChange={(e) => setMethod(e.target.value)} className="h-9">
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="transfer">Transfer</option>
                </Select>
              </div>
              <div className="flex-1">
                <label className="block text-[12.5px] text-muted mb-1">Note (optional)</label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} className="h-9" />
              </div>
            </div>

            {error ? <div className="text-[12.5px] text-bad bg-badbg rounded-lg px-3 py-2">{error}</div> : null}
            {ok ? <div className="text-[12.5px] text-ok bg-okbg rounded-lg px-3 py-2">Deposit recorded.</div> : null}
            <Button variant="primary" className="h-9" onClick={submit} disabled={createMutation.isPending}>
              <Send size={16} /> Record deposit
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent deposits" hint={`${transfers.length} records`} />
          {transfers.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-muted">No deposits yet.</div>
          ) : (
            <div className="px-[18px] pb-4 pt-1 flex flex-col">
              {transfers.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-line last:border-0">
                  <div className="min-w-0">
                    <div className="text-[13.5px] text-ink">
                      {t.source_label} <span className="text-muted">→</span> {t.dest_label}
                    </div>
                    <div className="text-[11.5px] text-muted">
                      {t.business_date} · {t.method}
                      {t.note ? ` · ${t.note}` : ''}
                    </div>
                  </div>
                  <Money value={Number(t.amount)} className="font-display font-semibold text-ink" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  )
}
