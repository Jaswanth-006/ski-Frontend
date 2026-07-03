import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { z } from 'zod'
import {
  getListExpenseItemsV1ExpenseItemsGetQueryKey,
  useCreateExpenseItemV1ExpenseItemsPost,
  useListExpenseItemsV1ExpenseItemsGet,
  useUpdateExpenseItemV1ExpenseItemsItemIdPatch,
} from '@/api/generated/catalog/catalog'
import type { ExpenseItemOut } from '@/api/generated/model'
import { DataTable, type Column } from '@/components/app/DataTable'
import { StatusPill } from '@/components/app/StatusPill'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'

const ALL_PARAMS = { active: 'all' as const }

export function ExpenseItemsSection() {
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ExpenseItemOut | null>(null)

  const listQuery = useListExpenseItemsV1ExpenseItemsGet(ALL_PARAMS)
  const patchMutation = useUpdateExpenseItemV1ExpenseItemsItemIdPatch()

  const envelope = listQuery.data
  const items: ExpenseItemOut[] = envelope && envelope.status === 200 ? envelope.data : []

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: getListExpenseItemsV1ExpenseItemsGetQueryKey(ALL_PARAMS),
    })

  const toggleActive = async (row: ExpenseItemOut) => {
    await patchMutation.mutateAsync({ itemId: row.id, data: { is_active: !row.is_active } })
    await invalidate()
  }

  const columns: Column<ExpenseItemOut>[] = [
    { key: 'name', header: 'Name', render: (i) => <span className="font-medium">{i.name}</span> },
    {
      key: 'category',
      header: 'Category',
      render: (i) => i.category ?? <span className="text-muted">—</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (i) =>
        i.is_active ? (
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
      render: (i) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="h-8 px-3 text-[12px]" onClick={() => setEditTarget(i)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            className="h-8 px-3 text-[12px]"
            disabled={patchMutation.isPending}
            onClick={() => toggleActive(i)}
          >
            {i.is_active ? 'Deactivate' : 'Reactivate'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader
        title="Expense items"
        hint="Feeds the expense dropdown · deactivated items are hidden but history is kept"
        right={
          <Button variant="primary" className="h-9" onClick={() => setAddOpen(true)}>
            <Plus size={16} />
            Add item
          </Button>
        }
      />

      {listQuery.isLoading ? (
        <div className="grid place-items-center py-14 text-muted">
          <Loader2 className="animate-spin text-orange" size={22} />
        </div>
      ) : listQuery.isError || (envelope && envelope.status !== 200) ? (
        <div className="py-14 text-center text-[13px] text-bad">Could not load expense items.</div>
      ) : items.length === 0 ? (
        <div className="py-14 text-center text-[13px] text-muted">
          No expense items yet — add ones like &ldquo;Petrol&rdquo; or &ldquo;A4 sheets&rdquo;.
        </div>
      ) : (
        <DataTable columns={columns} data={items} getRowKey={(i) => i.id} />
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add expense item">
        <AddItemForm
          onDone={async () => {
            await invalidate()
            setAddOpen(false)
          }}
        />
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit expense item">
        {editTarget ? (
          <EditItemForm
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

const schema = z.object({
  name: z.string().min(1, 'Enter a name'),
  category: z.string().optional(),
})
type ItemFormValues = z.infer<typeof schema>

function ItemFields({
  register,
  errors,
}: {
  register: UseFormRegister<ItemFormValues>
  errors: FieldErrors<ItemFormValues>
}) {
  return (
    <>
      <div>
        <label className="block text-[13px] font-medium text-ink mb-1.5">Name</label>
        <Input placeholder="Petrol" {...register('name')} />
        {errors.name ? <p className="text-[12px] text-bad mt-1">{errors.name.message}</p> : null}
      </div>
      <div>
        <label className="block text-[13px] font-medium text-ink mb-1.5">Category (optional)</label>
        <Input placeholder="Fuel" {...register('category')} />
      </div>
    </>
  )
}

function AddItemForm({ onDone }: { onDone: () => void }) {
  const createMutation = useCreateExpenseItemV1ExpenseItemsPost()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({ resolver: zodResolver(schema) })

  const submit = async (values: ItemFormValues) => {
    setFormError(null)
    try {
      const res = await createMutation.mutateAsync({
        data: { name: values.name, category: values.category || undefined },
      })
      const status = res.status as number // 409 (duplicate name) isn't in the typed union
      if (status === 201) onDone()
      else if (status === 409) setFormError('An expense item with this name already exists.')
      else setFormError('Please check the fields and try again.')
    } catch {
      setFormError('Could not reach the server.')
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      <ItemFields register={register} errors={errors} />
      {formError ? (
        <div className="text-[12.5px] text-bad bg-badbg rounded-lg px-3 py-2" role="alert">
          {formError}
        </div>
      ) : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Adding…' : 'Add item'}
      </Button>
    </form>
  )
}

function EditItemForm({ target, onDone }: { target: ExpenseItemOut; onDone: () => void }) {
  const patchMutation = useUpdateExpenseItemV1ExpenseItemsItemIdPatch()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: target.name, category: target.category ?? undefined },
  })

  const submit = async (values: ItemFormValues) => {
    await patchMutation.mutateAsync({
      itemId: target.id,
      data: { name: values.name, category: values.category || undefined },
    })
    onDone()
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      <ItemFields register={register} errors={errors} />
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Save'}
      </Button>
    </form>
  )
}
