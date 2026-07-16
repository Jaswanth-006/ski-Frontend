import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import {
  getListAccessoriesV1AccessoriesGetQueryKey,
  useCreateAccessoryV1AccessoriesPost,
  useDeleteAccessoryV1AccessoriesAccessoryIdDelete,
  useListAccessoriesV1AccessoriesGet,
  useUpdateAccessoryV1AccessoriesAccessoryIdPatch,
} from '@/api/generated/accessories/accessories'
import type { AccessoryOut } from '@/api/generated/model'
import { DataTable, type Column } from '@/components/app/DataTable'
import { StatusPill } from '@/components/app/StatusPill'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'

const ALL = { active_only: false }

export function AccessoriesSection() {
  const queryClient = useQueryClient()
  const listQuery = useListAccessoriesV1AccessoriesGet(ALL)
  const createMutation = useCreateAccessoryV1AccessoriesPost()
  const patchMutation = useUpdateAccessoryV1AccessoriesAccessoryIdPatch()
  const deleteMutation = useDeleteAccessoryV1AccessoriesAccessoryIdDelete()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<AccessoryOut | null>(null)

  const accessories: AccessoryOut[] = listQuery.data?.status === 200 ? listQuery.data.data : []

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListAccessoriesV1AccessoriesGetQueryKey(ALL) })

  const add = async () => {
    setError(null)
    if (!name.trim()) return
    const res = await createMutation.mutateAsync({ data: { name: name.trim() } })
    const status = res.status as number
    if (status === 201) {
      setName('')
      await invalidate()
    } else if (status === 409) {
      setError('An accessory with this name already exists.')
    } else {
      setError('Could not add the accessory.')
    }
  }

  const toggle = async (a: AccessoryOut) => {
    await patchMutation.mutateAsync({ accessoryId: a.id, data: { is_active: !a.is_active } })
    await invalidate()
  }

  const remove = async (a: AccessoryOut) => {
    if (!window.confirm(`Delete "${a.name}"? This can't be undone.`)) return
    const res = await deleteMutation.mutateAsync({ accessoryId: a.id })
    if ((res.status as number) === 409) {
      window.alert('This accessory has stock history — deactivate it instead.')
      return
    }
    await invalidate()
  }

  const columns: Column<AccessoryOut>[] = [
    { key: 'name', header: 'Name', render: (a) => a.name },
    {
      key: 'status',
      header: 'Status',
      render: (a) =>
        a.is_active ? (
          <StatusPill variant="ok" size="sm">
            Active
          </StatusPill>
        ) : (
          <span className="inline-flex items-center rounded-full bg-surface px-[9px] py-[3px] text-[10.5px] font-semibold text-muted">
            Inactive
          </span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (a) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="h-8 px-3 text-[12px]" onClick={() => setEditTarget(a)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            className="h-8 px-3 text-[12px]"
            disabled={patchMutation.isPending}
            onClick={() => toggle(a)}
          >
            {a.is_active ? 'Deactivate' : 'Reactivate'}
          </Button>
          <Button
            variant="ghost"
            className="h-8 px-3 text-[12px] text-bad hover:bg-badbg"
            disabled={deleteMutation.isPending}
            onClick={() => remove(a)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

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
        <DataTable columns={columns} data={accessories} getRowKey={(a) => a.id} />
      )}

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Rename accessory">
        {editTarget ? (
          <EditAccessoryForm
            target={editTarget}
            onDone={async () => {
              await invalidate()
              setEditTarget(null)
            }}
          />
        ) : null}
      </Modal>
    </Card>
  )
}

function EditAccessoryForm({ target, onDone }: { target: AccessoryOut; onDone: () => void }) {
  const patchMutation = useUpdateAccessoryV1AccessoriesAccessoryIdPatch()
  const [name, setName] = useState(target.name)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    if (!name.trim()) return
    const res = await patchMutation.mutateAsync({ accessoryId: target.id, data: { name: name.trim() } })
    const status = res.status as number
    if (status === 200) onDone()
    else if (status === 409) setError('An accessory with this name already exists.')
    else setError('Could not save the change.')
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-[13px] font-medium text-ink mb-1.5">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      {error ? (
        <div className="text-[12.5px] text-bad bg-badbg rounded-lg px-3 py-2">{error}</div>
      ) : null}
      <Button className="w-full" onClick={submit} disabled={patchMutation.isPending}>
        {patchMutation.isPending ? 'Saving…' : 'Save'}
      </Button>
    </div>
  )
}
