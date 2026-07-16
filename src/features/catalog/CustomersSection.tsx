import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import {
  getListCustomersV1CustomersGetQueryKey,
  useCreateCustomerV1CustomersPost,
  useListCustomersV1CustomersGet,
  useUpdateCustomerV1CustomersCustomerIdPatch,
} from '@/api/generated/customers/customers'
import type { CustomerOut } from '@/api/generated/model'
import { StatusPill } from '@/components/app/StatusPill'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const ALL = { active_only: false }

export function CustomersSection() {
  const queryClient = useQueryClient()
  const listQuery = useListCustomersV1CustomersGet(ALL)
  const createMutation = useCreateCustomerV1CustomersPost()
  const patchMutation = useUpdateCustomerV1CustomersCustomerIdPatch()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const customers: CustomerOut[] = listQuery.data?.status === 200 ? listQuery.data.data : []

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListCustomersV1CustomersGetQueryKey(ALL) })

  const add = async () => {
    setError(null)
    if (!name.trim()) return
    const res = await createMutation.mutateAsync({ data: { name: name.trim() } })
    const status = res.status as number
    if (status === 201) {
      setName('')
      await invalidate()
    } else if (status === 409) {
      setError('A customer with this name already exists.')
    } else {
      setError('Could not add the customer.')
    }
  }

  const toggle = async (c: CustomerOut) => {
    await patchMutation.mutateAsync({ customerId: c.id, data: { is_active: !c.is_active } })
    await invalidate()
  }

  return (
    <Card>
      <CardHeader
        title="Customers"
        hint="Corporate buyers who take directly from the warehouse (no delivery boy)"
        right={
          <div className="flex items-center gap-2">
            <Input
              className="h-9 w-[180px]"
              placeholder="New customer…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') add()
              }}
            />
            <Button variant="primary" className="h-9" onClick={add} disabled={createMutation.isPending}>
              <Plus size={16} /> Add
            </Button>
          </div>
        }
      />
      {error ? (
        <div className="mx-[18px] mb-2 text-[12.5px] text-bad bg-badbg rounded-lg px-3 py-2">{error}</div>
      ) : null}
      {listQuery.isLoading ? (
        <div className="grid place-items-center py-10 text-muted">
          <Loader2 className="animate-spin text-orange" size={20} />
        </div>
      ) : customers.length === 0 ? (
        <div className="py-10 text-center text-[13px] text-muted">No customers yet.</div>
      ) : (
        <div className="px-[18px] pb-4 pt-1 flex flex-col">
          {customers.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-line last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-[13.5px] font-medium text-ink">{c.name}</span>
                {c.is_active ? (
                  <StatusPill variant="ok" size="sm">
                    Active
                  </StatusPill>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-surface px-[9px] py-[3px] text-[10.5px] font-semibold text-muted">
                    Inactive
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                className="h-8 px-3 text-[12px]"
                disabled={patchMutation.isPending}
                onClick={() => toggle(c)}
              >
                {c.is_active ? 'Deactivate' : 'Reactivate'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
