import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import {
  getListAccessoriesV1AccessoriesGetQueryKey,
  useCreateAccessoryV1AccessoriesPost,
  useListAccessoriesV1AccessoriesGet,
} from '@/api/generated/accessories/accessories'
import type { AccessoryOut } from '@/api/generated/model'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function AccessoriesSection() {
  const queryClient = useQueryClient()
  const listQuery = useListAccessoriesV1AccessoriesGet()
  const createMutation = useCreateAccessoryV1AccessoriesPost()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const accessories: AccessoryOut[] = listQuery.data?.status === 200 ? listQuery.data.data : []

  const add = async () => {
    setError(null)
    if (!name.trim()) return
    const res = await createMutation.mutateAsync({ data: { name: name.trim() } })
    const status = res.status as number
    if (status === 201) {
      setName('')
      await queryClient.invalidateQueries({
        queryKey: getListAccessoriesV1AccessoriesGetQueryKey(),
      })
    } else if (status === 409) {
      setError('An accessory with this name already exists.')
    } else {
      setError('Could not add the accessory.')
    }
  }

  return (
    <Card>
      <CardHeader
        title="Accessories"
        hint="Stove, pipe, wire, regulator … — stocked and received via ac4"
        right={
          <div className="flex items-center gap-2">
            <Input
              className="h-9 w-[180px]"
              placeholder="New accessory…"
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
      ) : accessories.length === 0 ? (
        <div className="py-10 text-center text-[13px] text-muted">No accessories yet.</div>
      ) : (
        <div className="px-[18px] pb-4 pt-1 flex flex-wrap gap-2">
          {accessories.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center rounded-full bg-surface px-3 py-1.5 text-[13px] text-ink"
            >
              {a.name}
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}
