import { useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useListExpenseItemsV1ExpenseItemsGet } from '@/api/generated/catalog/catalog'
import {
  getListExpensesV1ExpensesGetQueryKey,
  useCreateExpenseV1ExpensesPost,
  useListExpensesV1ExpensesGet,
} from '@/api/generated/expenses/expenses'
import type { ExpenseItemOut, ExpenseOut } from '@/api/generated/model'
import { AppShell } from '@/components/app/AppShell'
import { Money } from '@/components/app/Money'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

const today = () => new Date().toISOString().slice(0, 10)

export function ExpensesPage() {
  const queryClient = useQueryClient()
  const [date, setDate] = useState(today())
  const [itemId, setItemId] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const itemsQuery = useListExpenseItemsV1ExpenseItemsGet({ active: 'true' })
  const listQuery = useListExpensesV1ExpensesGet({ date })
  const createMutation = useCreateExpenseV1ExpensesPost()

  const items: ExpenseItemOut[] =
    itemsQuery.data?.status === 200 ? itemsQuery.data.data : []
  const expenses: ExpenseOut[] = listQuery.data?.status === 200 ? listQuery.data.data : []

  const add = async () => {
    setError(null)
    if (!itemId || Number(amount) <= 0) return setError('Pick an item and a positive amount.')
    const res = await createMutation.mutateAsync({
      data: { business_date: date, item_id: itemId, amount: Number(amount), method, note: note || undefined },
    })
    if (res.status === 201) {
      await queryClient.invalidateQueries({ queryKey: getListExpensesV1ExpensesGetQueryKey({ date }) })
      setAmount('')
      setNote('')
    } else {
      setError('Could not save the expense.')
    }
  }

  return (
    <AppShell title="Expenses" subtitle="Daily outflows">
      <Card>
        <CardHeader title="Log an expense" hint="Posts to the cash ledger when paid by cash" />
        <div className="p-[18px] flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[12.5px] text-muted mb-1">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 w-[150px]" />
          </div>
          <div className="min-w-[180px]">
            <label className="block text-[12.5px] text-muted mb-1">Item</label>
            <Select value={itemId} onChange={(e) => setItemId(e.target.value)} className="h-9">
              <option value="">Select…</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-[12.5px] text-muted mb-1">Amount ₹</label>
            <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 w-[120px] num text-right" />
          </div>
          <div>
            <label className="block text-[12.5px] text-muted mb-1">Method</label>
            <Select value={method} onChange={(e) => setMethod(e.target.value)} className="h-9 w-[120px]">
              <option value="cash">Cash</option>
              <option value="digital">Digital</option>
            </Select>
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

      <Card>
        <CardHeader title="Today's expenses" hint={`${expenses.length} entries`} />
        {expenses.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-muted">No expenses logged for this date.</div>
        ) : (
          <div className="px-[18px] pb-4 pt-1 flex flex-col">
            {expenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-line last:border-0">
                <div>
                  <div className="text-[13.5px] font-medium text-ink">{e.item_name}</div>
                  <div className="text-[11.5px] text-muted">
                    {e.method}
                    {e.note ? ` · ${e.note}` : ''}
                  </div>
                </div>
                <Money value={Number(e.amount)} className="font-display font-semibold text-ink" />
              </div>
            ))}
          </div>
        )}
      </Card>
    </AppShell>
  )
}
