import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, PackagePlus } from 'lucide-react'
import { useState } from 'react'
import {
  adjustInventoryV1InventoryCylinderTypeIdPatch,
  getGetInventoryV1InventoryGetQueryKey,
  useGetInventoryV1InventoryGet,
  useStockIntakeV1StockIntakePost,
} from '@/api/generated/stock/stock'
import type { InventoryOut } from '@/api/generated/model'
import { AppShell } from '@/components/app/AppShell'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/cn'

const LOW_STOCK_THRESHOLD = 10

function StockBadge({ quantity }: { quantity: number }) {
  if (quantity === 0)
    return (
      <span className="inline-flex items-center rounded-full bg-badbg px-[9px] py-[3px] text-[10.5px] font-semibold text-bad">
        Out of stock
      </span>
    )
  if (quantity < LOW_STOCK_THRESHOLD)
    return (
      <span className="inline-flex items-center rounded-full bg-warnbg px-[9px] py-[3px] text-[10.5px] font-semibold text-warn">
        Low
      </span>
    )
  return null
}

export function StockPage() {
  const queryClient = useQueryClient()
  const inventoryQuery = useGetInventoryV1InventoryGet()
  const intakeMutation = useStockIntakeV1StockIntakePost()
  const [adds, setAdds] = useState<Record<string, string>>({})
  const [intakeDone, setIntakeDone] = useState(false)
  const [correctTarget, setCorrectTarget] = useState<InventoryOut | null>(null)

  const envelope = inventoryQuery.data
  const rows: InventoryOut[] = envelope && envelope.status === 200 ? envelope.data : []

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getGetInventoryV1InventoryGetQueryKey() })

  const recordIntake = async () => {
    setIntakeDone(false)
    const lines = rows
      .filter((r) => Number(adds[r.cylinder_type_id]) > 0)
      .map((r) => ({ cylinder_type_id: r.cylinder_type_id, qty: Number(adds[r.cylinder_type_id]) }))
    if (lines.length === 0) return
    const res = await intakeMutation.mutateAsync({ data: { lines } })
    if (res.status === 200) {
      await invalidate()
      setAdds({})
      setIntakeDone(true)
    }
  }

  return (
    <AppShell title="Stock Intake" subtitle="Morning stock & live inventory">
      {/* Record intake */}
      <Card>
        <CardHeader
          title="Record morning intake"
          hint="Add today's delivered quantities — each appends an immutable ledger entry"
          right={
            <div className="flex items-center gap-3">
              {intakeDone ? (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ok">
                  <Check size={15} /> Recorded
                </span>
              ) : null}
              <Button variant="primary" className="h-9" onClick={recordIntake} disabled={intakeMutation.isPending}>
                <PackagePlus size={16} />
                {intakeMutation.isPending ? 'Recording…' : 'Record intake'}
              </Button>
            </div>
          }
        />
        <div className="px-[18px] pb-5 pt-1 flex flex-col gap-2">
          {rows.map((r) => (
            <div key={r.cylinder_type_id} className="flex items-center justify-between gap-4 py-2 border-b border-line last:border-0">
              <div>
                <div className="text-[13.5px] font-medium text-ink">{r.label}</div>
                <div className="text-[11.5px] text-muted num">{r.code} · in stock: {r.quantity}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted text-[12px]">add</span>
                <Input
                  type="number"
                  min={0}
                  className="h-9 w-[110px] num text-right"
                  placeholder="0"
                  value={adds[r.cylinder_type_id] ?? ''}
                  onChange={(e) => {
                    setAdds((p) => ({ ...p, [r.cylinder_type_id]: e.target.value }))
                    setIntakeDone(false)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Live inventory */}
      <Card>
        <CardHeader title="Live inventory" hint="Current counts · low varieties are flagged" />
        {inventoryQuery.isLoading ? (
          <div className="grid place-items-center py-12 text-muted">
            <Loader2 className="animate-spin text-orange" size={22} />
          </div>
        ) : (
          <div className="px-[18px] pb-4 pt-1 flex flex-col">
            {rows.map((r) => (
              <div key={r.cylinder_type_id} className="flex items-center justify-between gap-4 py-2.5 border-b border-line last:border-0">
                <div className="flex items-center gap-3">
                  <span className={cn('num font-display font-bold text-[15px] w-12 text-right', r.quantity < LOW_STOCK_THRESHOLD ? 'text-warn' : 'text-ink')}>
                    {r.quantity}
                  </span>
                  <div>
                    <div className="text-[13.5px] font-medium text-ink">{r.label}</div>
                    <div className="text-[11.5px] text-muted num">{r.code}</div>
                  </div>
                  <StockBadge quantity={r.quantity} />
                </div>
                <Button variant="ghost" className="h-8 px-3 text-[12px]" onClick={() => setCorrectTarget(r)}>
                  Correct
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={correctTarget !== null} onClose={() => setCorrectTarget(null)} title="Correct count">
        {correctTarget ? (
          <CorrectForm
            target={correctTarget}
            onDone={async () => {
              await invalidate()
              setCorrectTarget(null)
            }}
            onConflict={invalidate}
          />
        ) : null}
      </Modal>
    </AppShell>
  )
}

function CorrectForm({
  target,
  onDone,
  onConflict,
}: {
  target: InventoryOut
  onDone: () => void
  onConflict: () => Promise<unknown>
}) {
  const [qty, setQty] = useState(String(target.quantity))
  const [error, setError] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn: () =>
      adjustInventoryV1InventoryCylinderTypeIdPatch(
        target.cylinder_type_id,
        { quantity: Number(qty) },
        { headers: { 'If-Match': String(target.version) } },
      ),
  })

  const submit = async () => {
    setError(null)
    const res = await mutation.mutateAsync()
    const status = res.status as number // 409/404 aren't in the typed union
    if (status === 200) {
      onDone()
    } else if (status === 409) {
      setError('This inventory was changed elsewhere. It has been refreshed — reopen and retry.')
      await onConflict()
    } else {
      setError('Could not save the correction.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-[13px] font-medium text-ink mb-1.5">
          New quantity for <span className="num">{target.code}</span>{' '}
          <span className="text-muted">(current: {target.quantity}, v{target.version})</span>
        </label>
        <Input type="number" min={0} className="num" value={qty} onChange={(e) => setQty(e.target.value)} />
      </div>
      {error ? (
        <div className="text-[12.5px] text-bad bg-badbg rounded-lg px-3 py-2" role="alert">
          {error}
        </div>
      ) : null}
      <Button variant="primary" className="w-full" onClick={submit} disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving…' : 'Save correction'}
      </Button>
    </div>
  )
}
