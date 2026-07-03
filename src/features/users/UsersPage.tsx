import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  getListUsersV1UsersGetQueryKey,
  useCreateUserV1UsersPost,
  useListUsersV1UsersGet,
  useUpdateUserV1UsersUserIdPatch,
} from '@/api/generated/users/users'
import type { UserOut } from '@/api/generated/model'
import { AppShell } from '@/components/app/AppShell'
import { DataTable, type Column } from '@/components/app/DataTable'
import { StatusPill } from '@/components/app/StatusPill'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/cn'

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Owner',
  office_admin: 'Office',
  delivery: 'Delivery',
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold',
        role === 'super_admin' && 'bg-orange-50 text-orange-600',
        role === 'office_admin' && 'bg-[#EEF2FB] text-navy',
        role === 'delivery' && 'bg-surface text-muted',
      )}
    >
      {ROLE_LABEL[role] ?? role}
    </span>
  )
}

export function UsersPage() {
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)

  const usersQuery = useListUsersV1UsersGet()
  const patchMutation = useUpdateUserV1UsersUserIdPatch()

  const envelope = usersQuery.data
  const users: UserOut[] = envelope && envelope.status === 200 ? envelope.data : []

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListUsersV1UsersGetQueryKey() })

  const toggleActive = async (user: UserOut) => {
    await patchMutation.mutateAsync({ userId: user.id, data: { is_active: !user.is_active } })
    await invalidate()
  }

  const columns: Column<UserOut>[] = [
    { key: 'name', header: 'Name', render: (u) => <span className="font-medium">{u.name}</span> },
    { key: 'phone', header: 'Phone', render: (u) => <span className="num">{u.phone}</span> },
    { key: 'role', header: 'Role', render: (u) => <RoleBadge role={u.role} /> },
    {
      key: 'status',
      header: 'Status',
      render: (u) =>
        u.is_active ? (
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
      render: (u) => (
        <Button
          variant="ghost"
          className="h-8 px-3 text-[12px]"
          disabled={patchMutation.isPending}
          onClick={() => toggleActive(u)}
        >
          {u.is_active ? 'Deactivate' : 'Reactivate'}
        </Button>
      ),
    },
  ]

  return (
    <AppShell title="Users" subtitle="Staff and delivery accounts">
      <Card>
        <CardHeader
          title="All users"
          hint={`${users.length} total`}
          right={
            <Button variant="primary" className="h-9" onClick={() => setAddOpen(true)}>
              <Plus size={16} />
              Add user
            </Button>
          }
        />

        {usersQuery.isLoading ? (
          <div className="grid place-items-center py-14 text-muted">
            <Loader2 className="animate-spin text-orange" size={22} />
          </div>
        ) : usersQuery.isError || (envelope && envelope.status !== 200) ? (
          <div className="py-14 text-center text-[13px] text-bad">
            Could not load users. Try again.
          </div>
        ) : users.length === 0 ? (
          <div className="py-14 text-center text-[13px] text-muted">
            No users yet — add your first staff or delivery account.
          </div>
        ) : (
          <DataTable columns={columns} data={users} getRowKey={(u) => u.id} />
        )}
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add user">
        <AddUserForm
          onDone={async () => {
            await invalidate()
            setAddOpen(false)
          }}
        />
      </Modal>
    </AppShell>
  )
}

const addSchema = z.object({
  name: z.string().min(1, 'Enter a name'),
  phone: z.string().min(3, 'Enter a phone number'),
  role: z.enum(['super_admin', 'office_admin', 'delivery']),
  password: z.string().min(8, 'At least 8 characters'),
})
type AddForm = z.infer<typeof addSchema>

function AddUserForm({ onDone }: { onDone: () => void }) {
  const createMutation = useCreateUserV1UsersPost()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddForm>({
    resolver: zodResolver(addSchema),
    defaultValues: { role: 'delivery' },
  })

  const onSubmit = async (values: AddForm) => {
    setFormError(null)
    try {
      const res = await createMutation.mutateAsync({ data: values })
      const status = res.status as number // 409 (duplicate phone) isn't in the typed union
      if (status === 201) {
        onDone()
      } else if (status === 409) {
        setFormError('A user with this phone already exists.')
      } else {
        setFormError('Please check the fields and try again.')
      }
    } catch {
      setFormError('Could not reach the server.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Field label="Name" error={errors.name?.message}>
        <Input placeholder="Murugan R." {...register('name')} />
      </Field>
      <Field label="Phone" error={errors.phone?.message}>
        <Input inputMode="tel" placeholder="9000000001" {...register('phone')} />
      </Field>
      <Field label="Role" error={errors.role?.message}>
        <Select {...register('role')}>
          <option value="delivery">Delivery</option>
          <option value="office_admin">Office admin</option>
          <option value="super_admin">Owner (super admin)</option>
        </Select>
      </Field>
      <Field label="Temporary password" error={errors.password?.message}>
        <Input type="password" placeholder="At least 8 characters" {...register('password')} />
      </Field>

      {formError ? (
        <div className="text-[12.5px] text-bad bg-badbg rounded-lg px-3 py-2" role="alert">
          {formError}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating…' : 'Create user'}
      </Button>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-ink mb-1.5">{label}</label>
      {children}
      {error ? <p className="text-[12px] text-bad mt-1">{error}</p> : null}
    </div>
  )
}
