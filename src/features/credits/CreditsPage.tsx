import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, HandCoins, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBalanceSummaryV1DeliveryBalancesSummaryGet } from '@/api/generated/delivery-balances/delivery-balances'
import type { DeliveryBalanceSummaryOut } from '@/api/generated/model'
import {
  getListCreditsV1CreditsGetQueryKey,
  useCreateCreditV1CreditsPost,
  useListCreditsV1CreditsGet,
  useSettleCreditV1CreditsCreditIdSettlePost,
} from '@/api/generated/credits/credits'
import type { CreditOut } from '@/api/generated/model'
import { AppShell } from '@/components/app/AppShell'
import { Money } from '@/components/app/Money'
import { StatusPill } from '@/components/app/StatusPill'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const today = () => new Date().toISOString().slice(0, 10)

export function CreditsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const balanceQuery = useBalanceSummaryV1DeliveryBalancesSummaryGet()
  const boyBalances: DeliveryBalanceSummaryOut[] = (
    balanceQuery.data?.status === 200 ? balanceQuery.data.data : []
  ).filter((b) => Number(b.balance) > 0)
  const [person, setPerson] = useState('')
  const [amount, setAmount] = useState('')
  const [givenDate, setGivenDate] = useState(today())
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const listQuery = useListCreditsV1CreditsGet()
  const createMutation = useCreateCreditV1CreditsPost()
  const settleMutation = useSettleCreditV1CreditsCreditIdSettlePost()

  const credits: CreditOut[] = listQuery.data?.status === 200 ? listQuery.data.data : []
  const open = credits.filter((c) => !c.is_settled)
  const settled = credits.filter((c) => c.is_settled)
  const outstanding = open.reduce((sum, c) => sum + Number(c.amount), 0)

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListCreditsV1CreditsGetQueryKey() })

  const add = async () => {
    setError(null)
    if (!person.trim() || Number(amount) <= 0)
      return setError('Enter a person and a positive amount.')
    const res = await createMutation.mutateAsync({
      data: {
        person_name: person.trim(),
        amount: Number(amount),
        given_date: givenDate,
        note: note || undefined,
      },
    })
    if (res.status === 201) {
      await invalidate()
      setPerson('')
      setAmount('')
      setNote('')
    } else {
      setError('Could not save the credit.')
    }
  }

  const setSettled = async (c: CreditOut, settledValue: boolean) => {
    const res = await settleMutation.mutateAsync({
      creditId: c.id,
      params: { settled: settledValue },
    })
    if (res.status === 200) await invalidate()
  }

  return (
    <AppShell
      title="Credit"
      subtitle="Money you've given out — track who still owes you"
      topbarActions={
        <div className="text-right">
          <div className="text-[11px] text-muted">Outstanding</div>
          <Money value={outstanding} className="font-display font-extrabold text-[16px] text-ink" />
        </div>
      }
    >
      <Card>
        <CardHeader title="Give credit" hint="Record money handed to a person" />
        <div className="p-[18px] flex flex-wrap items-end gap-3">
          <div className="min-w-[180px] flex-1">
            <label className="block text-[12.5px] text-muted mb-1">Person</label>
            <Input value={person} onChange={(e) => setPerson(e.target.value)} className="h-9" placeholder="Name" />
          </div>
          <div>
            <label className="block text-[12.5px] text-muted mb-1">Amount ₹</label>
            <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 w-[120px] num text-right" />
          </div>
          <div>
            <label className="block text-[12.5px] text-muted mb-1">Given on</label>
            <Input type="date" value={givenDate} onChange={(e) => setGivenDate(e.target.value)} className="h-9 w-[150px]" />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[12.5px] text-muted mb-1">Note (optional)</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} className="h-9" />
          </div>
          <Button variant="primary" className="h-9" onClick={add} disabled={createMutation.isPending}>
            <Plus size={16} />
            Add
          </Button>
        </div>
        {error ? (
          <div className="mx-[18px] mb-[18px] text-[12.5px] text-bad bg-badbg rounded-lg px-3 py-2">{error}</div>
        ) : null}
      </Card>

      {boyBalances.length > 0 ? (
        <Card>
          <CardHeader
            title="Delivery boys who owe us"
            hint="From unpaid sale settlements"
            right={
              <Button variant="ghost" className="h-8 px-3 text-[12px]" onClick={() => navigate('/delivery-balance')}>
                Manage <ArrowRight size={14} />
              </Button>
            }
          />
          <div className="px-[18px] pb-4 pt-1 flex flex-col">
            {boyBalances.map((b) => (
              <div key={b.delivery_id} className="flex items-center justify-between gap-3 py-2.5 border-b border-line last:border-0">
                <span className="text-[13.5px] font-medium text-ink">{b.delivery_name}</span>
                <Money value={Number(b.balance)} className="font-display font-bold text-bad" />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Outstanding" hint={`${open.length} unpaid`} />
        {open.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-muted">
            <HandCoins size={22} className="mx-auto mb-2 text-muted" />
            Nothing outstanding.
          </div>
        ) : (
          <div className="px-[18px] pb-4 pt-1 flex flex-col">
            {open.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-line last:border-0">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium text-ink">{c.person_name}</div>
                  <div className="text-[11.5px] text-muted num">
                    given {c.given_date}
                    {c.note ? ` · ${c.note}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Money value={Number(c.amount)} className="font-display font-bold text-ink" />
                  <Button
                    variant="ghost"
                    className="h-8 px-3 text-[12px]"
                    disabled={settleMutation.isPending}
                    onClick={() => setSettled(c, true)}
                  >
                    <Check size={14} /> Mark settled
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {settled.length > 0 ? (
        <Card>
          <CardHeader title="Settled" hint={`${settled.length} repaid`} />
          <div className="px-[18px] pb-4 pt-1 flex flex-col">
            {settled.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-line last:border-0">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium text-ink">{c.person_name}</div>
                  <div className="text-[11.5px] text-muted num">
                    given {c.given_date}
                    {c.settled_date ? ` · settled ${c.settled_date}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Money value={Number(c.amount)} className="num text-muted" />
                  <StatusPill variant="ok" size="sm">
                    Settled
                  </StatusPill>
                  <Button
                    variant="ghost"
                    className="h-8 px-3 text-[12px]"
                    disabled={settleMutation.isPending}
                    onClick={() => setSettled(c, false)}
                  >
                    Reopen
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </AppShell>
  )
}
