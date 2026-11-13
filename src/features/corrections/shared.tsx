import { Pencil, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { detailOf } from '@/lib/apiError'

/** A request result from the generated client: status + body. */
export interface ApiResult {
  status: number
  data: unknown
}

const ok = (r: ApiResult) => r.status >= 200 && r.status < 300

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-[12.5px] font-medium text-ink mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function ReasonInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label="Reason for the change *">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={280}
        placeholder="e.g. wrong amount typed"
      />
    </Field>
  )
}

/**
 * Edit dialog: the caller renders the fields; this adds the required reason, the save button
 * and the server's error message. `onSave` gets the reason and returns the API result.
 */
export function EditDialog({
  open,
  title,
  onClose,
  onSave,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  onSave: (reason: string) => Promise<ApiResult>
  children: ReactNode
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const close = () => {
    setReason('')
    setError(null)
    onClose()
  }
  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await onSave(reason.trim())
      if (ok(res)) return close()
      setError(detailOf(res.data, 'Could not save the change.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={close} title={title}>
      <div className="flex flex-col gap-3.5">
        {children}
        <ReasonInput value={reason} onChange={setReason} />
        {error ? (
          <div className="rounded-lg bg-badbg px-3 py-2 text-[12.5px] text-bad" role="alert">
            {error}
          </div>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={saving || reason.trim().length < 3}>
            {saving ? 'Saving…' : 'Save change'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/** Delete dialog: explains what goes away, asks for a reason. */
export function DeleteDialog({
  open,
  title,
  what,
  onClose,
  onDelete,
}: {
  open: boolean
  title: string
  what: ReactNode
  onClose: () => void
  onDelete: (reason: string) => Promise<ApiResult>
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const close = () => {
    setReason('')
    setError(null)
    onClose()
  }
  const confirm = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await onDelete(reason.trim())
      if (ok(res)) return close()
      setError(detailOf(res.data, 'Could not delete it.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={close} title={title}>
      <div className="flex flex-col gap-3.5">
        <p className="text-[13px] text-muted">{what} It is removed from every sheet and total; the audit log keeps a copy.</p>
        <ReasonInput value={reason} onChange={setReason} />
        {error ? (
          <div className="rounded-lg bg-badbg px-3 py-2 text-[12.5px] text-bad" role="alert">
            {error}
          </div>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={close}>
            Keep it
          </Button>
          <Button
            variant="primary"
            className="bg-bad hover:bg-bad/90 shadow-none"
            onClick={confirm}
            disabled={busy || reason.trim().length < 3}
          >
            {busy ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function RowActions({
  onEdit,
  onDelete,
  lockedNote,
}: {
  onEdit: () => void
  onDelete: () => void
  lockedNote?: ReactNode
}) {
  if (lockedNote) return <span className="text-[12px] text-muted whitespace-nowrap">{lockedNote}</span>
  return (
    <div className="flex justify-end gap-1.5">
      <Button variant="ghost" className="h-8 px-2.5 text-[12.5px]" onClick={onEdit}>
        <Pencil size={14} /> Edit
      </Button>
      <Button
        variant="ghost"
        className="h-8 px-2.5 text-[12.5px] text-bad hover:border-bad/40"
        onClick={onDelete}
      >
        <Trash2 size={14} /> Delete
      </Button>
    </div>
  )
}
