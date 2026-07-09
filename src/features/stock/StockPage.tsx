import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, PackagePlus, Truck } from 'lucide-react'
import { useState } from 'react'
import {
  adjustInventoryV1InventoryCylinderTypeIdPatch,
  getGetInventoryV1InventoryGetQueryKey,
  useGetInventoryV1InventoryGet,
  useStockIntakeV1StockIntakePost,
  useUpsertStockLoadV1StockLoadsPost,
} from '@/api/generated/stock/stock'
import { useListUsersV1UsersGet } from '@/api/generated/users/users'
import type { InventoryOut, UserOut } from '@/api/generated/model'
import { AppShell } from '@/components/app/AppShell'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/cn'

const LOW_STOCK_THRESHOLD = 10
const today = () => new Date().toISOString().slice(0, 10)

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

      <DriverLoadsSection types={rows} />

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

function DriverLoadsSection({ types }: { types: InventoryOut[] }) {
  const [date, setDate] = useState(today())
  const [driverId, setDriverId] = useState('')
  const [loads, setLoads] = useState<Record<string, { loaded: string; returned: string }>>({})
  const [done, setDone] = useState(false)
  const driversQuery = useListUsersV1UsersGet({ role: 'delivery', active: true })
  const upsert = useUpsertStockLoadV1StockLoadsPost()

  const drivers: UserOut[] = driversQuery.data?.status === 200 ? driversQuery.data.data : []
  const set = (id: string, field: 'loaded' | 'returned', value: string) =>
    setLoads((p) => ({ ...p, [id]: { ...(p[id] ?? { loaded: '', returned: '' }), [field]: value } }))

  const save = async () => {
    setDone(false)
    if (!driverId) return
    for (const t of types) {
      const v = loads[t.cylinder_type_id]
      const loaded = Number(v?.loaded) || 0
      const returned = Number(v?.returned) || 0
      if (loaded > 0 || returned > 0) {
        await upsert.mutateAsync({
          data: {
            business_date: date,
            delivery_id: driverId,
            cylinder_type_id: t.cylinder_type_id,
            loaded_qty: loaded,
            returned_qty: returned,
          },
        })
      }
    }
    setLoads({})
    setDone(true)
  }

  return (
    <Card>
      <CardHeader
        title="Driver loads"
        hint="How many cylinders each driver loaded out and brought back"
        right={
          <div className="flex items-center gap-3">
            {done ? (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ok">
                <Check size={15} /> Saved
              </span>
            ) : null}
            <Button variant="primary" className="h-9" onClick={save} disabled={upsert.isPending || !driverId}>
              <Truck size={16} /> Save loads
            </Button>
          </div>
        }
      />
      <div className="px-[18px] pb-5 pt-1 flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[12.5px] text-muted mb-1">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 w-[150px]" />
          </div>
          <div className="min-w-[200px]">
            <label className="block text-[12.5px] text-muted mb-1">Delivery person</label>
            <Select value={driverId} onChange={(e) => setDriverId(e.target.value)} className="h-9">
              <option value="">Select…</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
        </div>
        {driverId ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[.05em] text-muted font-semibold">
              <span className="flex-1">Variety</span>
              <span className="w-[100px] text-right">Loaded</span>
              <span className="w-[100px] text-right">Returned</span>
            </div>
            {types.map((t) => (
              <div key={t.cylinder_type_id} className="flex items-center gap-3 py-1.5 border-b border-line last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium text-ink">{t.label}</div>
                  <div className="text-[11.5px] text-muted num">{t.code}</div>
                </div>
                <Input
                  type="number" min={0} placeholder="0"
                  className="h-9 w-[100px] num text-right"
                  value={loads[t.cylinder_type_id]?.loaded ?? ''}
                  onChange={(e) => set(t.cylinder_type_id, 'loaded', e.target.value)}
                />
                <Input
                  type="number" min={0} placeholder="0"
                  className="h-9 w-[100px] num text-right"
                  value={loads[t.cylinder_type_id]?.returned ?? ''}
                  onChange={(e) => set(t.cylinder_type_id, 'returned', e.target.value)}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12.5px] text-muted">Pick a delivery person to record loads.</p>
        )}
      </div>
    </Card>
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
