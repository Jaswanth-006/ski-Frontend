import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  getListCylinderTypesV1CylinderTypesGetQueryKey,
  useCreateCylinderTypeV1CylinderTypesPost,
  useListCylinderTypesV1CylinderTypesGet,
  useUpdateCylinderTypeV1CylinderTypesTypeIdPatch,
} from '@/api/generated/catalog/catalog'
import type { CylinderTypeOut } from '@/api/generated/model'
import { AppShell } from '@/components/app/AppShell'
import { DataTable, type Column } from '@/components/app/DataTable'
import { StatusPill } from '@/components/app/StatusPill'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { ExpenseItemsSection } from './ExpenseItemsSection'
import { PricingSection } from './PricingSection'

const ALL_PARAMS = { active: 'all' as const }

export function CatalogPage() {
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<CylinderTypeOut | null>(null)

  const listQuery = useListCylinderTypesV1CylinderTypesGet(ALL_PARAMS)
  const patchMutation = useUpdateCylinderTypeV1CylinderTypesTypeIdPatch()

  const envelope = listQuery.data
  const types: CylinderTypeOut[] = envelope && envelope.status === 200 ? envelope.data : []

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: getListCylinderTypesV1CylinderTypesGetQueryKey(ALL_PARAMS),
    })

  const toggleActive = async (row: CylinderTypeOut) => {
    await patchMutation.mutateAsync({ typeId: row.id, data: { is_active: !row.is_active } })
    await invalidate()
  }

  const columns: Column<CylinderTypeOut>[] = [
    { key: 'code', header: 'Code', render: (t) => <span className="num font-medium">{t.code}</span> },
    { key: 'label', header: 'Label', render: (t) => t.label },
    {
      key: 'status',
      header: 'Status',
      render: (t) =>
        t.is_active ? (
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
      render: (t) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="h-8 px-3 text-[12px]" onClick={() => setRenameTarget(t)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            className="h-8 px-3 text-[12px]"
            disabled={patchMutation.isPending}
            onClick={() => toggleActive(t)}
          >
            {t.is_active ? 'Deactivate' : 'Reactivate'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AppShell title="Master Catalog" subtitle="Cylinder varieties, pricing & expense items">
      <Card>
        <CardHeader
          title="Cylinder varieties"
          hint="Feeds the sales dropdown · deactivated varieties are hidden but history is kept"
          right={
            <Button variant="primary" className="h-9" onClick={() => setAddOpen(true)}>
              <Plus size={16} />
              Add variety
            </Button>
          }
        />

        {listQuery.isLoading ? (
          <div className="grid place-items-center py-14 text-muted">
            <Loader2 className="animate-spin text-orange" size={22} />
          </div>
        ) : listQuery.isError || (envelope && envelope.status !== 200) ? (
          <div className="py-14 text-center text-[13px] text-bad">Could not load the catalog.</div>
        ) : types.length === 0 ? (
          <div className="py-14 text-center text-[13px] text-muted">No varieties yet.</div>
        ) : (
          <DataTable columns={columns} data={types} getRowKey={(t) => t.id} />
        )}
      </Card>

      <PricingSection />

      <ExpenseItemsSection />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add cylinder variety">
        <AddVarietyForm
          onDone={async () => {
            await invalidate()
            setAddOpen(false)
          }}
        />
      </Modal>

      <Modal
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        title="Edit variety"
      >
        {renameTarget ? (
          <EditForm
            target={renameTarget}
            onDone={async () => {
              await invalidate()
              setRenameTarget(null)
            }}
          />
        ) : null}
      </Modal>
    </AppShell>
  )
}

const addSchema = z.object({
  code: z.string().min(1, 'Enter a code (e.g. 14.2kg)'),
  label: z.string().min(1, 'Enter a label'),
})
type AddForm = z.infer<typeof addSchema>

function AddVarietyForm({ onDone }: { onDone: () => void }) {
  const createMutation = useCreateCylinderTypeV1CylinderTypesPost()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddForm>({ resolver: zodResolver(addSchema) })

  const onSubmit = async (values: AddForm) => {
    setFormError(null)
    try {
      const res = await createMutation.mutateAsync({ data: values })
      const status = res.status as number // 409 (duplicate code) isn't in the typed union
      if (status === 201) onDone()
      else if (status === 409) setFormError('A variety with this code already exists.')
      else setFormError('Please check the fields and try again.')
    } catch {
      setFormError('Could not reach the server.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div>
        <label className="block text-[13px] font-medium text-ink mb-1.5">Code</label>
        <Input placeholder="14.2kg" {...register('code')} />
        {errors.code ? <p className="text-[12px] text-bad mt-1">{errors.code.message}</p> : null}
      </div>
      <div>
        <label className="block text-[13px] font-medium text-ink mb-1.5">Label</label>
        <Input placeholder="14.2 kg Domestic" {...register('label')} />
        {errors.label ? <p className="text-[12px] text-bad mt-1">{errors.label.message}</p> : null}
      </div>
      {formError ? (
        <div className="text-[12.5px] text-bad bg-badbg rounded-lg px-3 py-2" role="alert">
          {formError}
        </div>
      ) : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Adding…' : 'Add variety'}
      </Button>
    </form>
  )
}

const editSchema = z.object({
  code: z.string().min(1, 'Enter a code (e.g. 14.2kg)'),
  label: z.string().min(1, 'Enter a label'),
})
type EditFormValues = z.infer<typeof editSchema>

function EditForm({ target, onDone }: { target: CylinderTypeOut; onDone: () => void }) {
  const patchMutation = useUpdateCylinderTypeV1CylinderTypesTypeIdPatch()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { code: target.code, label: target.label },
  })

  const onSubmit = async (values: EditFormValues) => {
    setFormError(null)
    try {
      const res = await patchMutation.mutateAsync({
        typeId: target.id,
        data: { code: values.code, label: values.label },
      })
      const status = res.status as number
      if (status === 200) onDone()
      else if (status === 409) setFormError('A variety with this code already exists.')
      else setFormError('Please check the fields and try again.')
    } catch {
      setFormError('Could not reach the server.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div>
        <label className="block text-[13px] font-medium text-ink mb-1.5">Code</label>
        <Input placeholder="14.2kg" {...register('code')} />
        {errors.code ? <p className="text-[12px] text-bad mt-1">{errors.code.message}</p> : null}
      </div>
      <div>
        <label className="block text-[13px] font-medium text-ink mb-1.5">Label</label>
        <Input placeholder="14.2 kg Domestic" {...register('label')} />
        {errors.label ? <p className="text-[12px] text-bad mt-1">{errors.label.message}</p> : null}
      </div>
      {formError ? (
        <div className="text-[12.5px] text-bad bg-badbg rounded-lg px-3 py-2" role="alert">
          {formError}
        </div>
      ) : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Save'}
      </Button>
    </form>
  )
}
