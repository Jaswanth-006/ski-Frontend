import { useQueryClient } from '@tanstack/react-query'
import { Check, PackagePlus, PackageX, Plus, RotateCcw, X, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import {
  getStockOverviewV1StockOverviewGetQueryKey,
  useStockAc4V1StockAc4Post,
  useStockErvV1StockErvPost,
  useStockOverviewV1StockOverviewGet,
  useStockReturnV1StockReturnPost,
} from '@/api/generated/stock/stock'
import { useListAccessoriesV1AccessoriesGet } from '@/api/generated/accessories/accessories'
import type { AccessoryOut, CylinderStockRow } from '@/api/generated/model'
import { AppShell } from '@/components/app/AppShell'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/cn'

const today = () => new Date().toISOString().slice(0, 10)
const num = (v: string | undefined) => Number(v) || 0

/** A product choice in a dropdown. `id` encodes kind + condition so lines stay distinct. */
interface Product {
  id: string
  label: string
  inStock: number
  cylinderTypeId?: string
  accessoryId?: string
  condition?: 'full' | 'empty'
}

interface Line {
  product: Product
  qty: number
  note: string
}

export function PurchasePage() {
  const queryClient = useQueryClient()
  const [date, setDate] = useState(today())

  const overviewQuery = useStockOverviewV1StockOverviewGet({ date })
  const accessoriesQuery = useListAccessoriesV1AccessoriesGet()
  const ac4Mutation = useStockAc4V1StockAc4Post()
  const ervMutation = useStockErvV1StockErvPost()
  const returnMutation = useStockReturnV1StockReturnPost()

  const overview = overviewQuery.data?.status === 200 ? overviewQuery.data.data : null
  const cylinders: CylinderStockRow[] = overview?.cylinders ?? []
  const accessories: AccessoryOut[] = (
    accessoriesQuery.data?.status === 200 ? accessoriesQuery.data.data : []
  ).filter((a) => a.is_active)
  const accClosing = (id: string) =>
    overview?.accessories.find((a) => a.accessory_id === id)?.closing ?? 0

  const fullCylinders: Product[] = cylinders.map((c) => ({
    id: `full:${c.cylinder_type_id}`,
    label: `${c.label} (${c.code}) · Full`,
    inStock: c.full_closing,
    cylinderTypeId: c.cylinder_type_id,
    condition: 'full',
  }))
  const emptyCylinders: Product[] = cylinders.map((c) => ({
    id: `empty:${c.cylinder_type_id}`,
    label: `${c.label} (${c.code}) · Empty`,
    inStock: c.empty_closing,
    cylinderTypeId: c.cylinder_type_id,
    condition: 'empty',
  }))
  const accessoryProducts: Product[] = accessories.map((a) => ({
    id: `acc:${a.id}`,
    label: a.name,
    inStock: accClosing(a.id),
    accessoryId: a.id,
  }))

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getStockOverviewV1StockOverviewGetQueryKey() })

  const errorOf = (data: unknown) => {
    const detail = (data as { detail?: unknown })?.detail
    return typeof detail === 'string' ? detail : 'Could not record — check the entries.'
  }

  const recordAc4 = async (lines: Line[]) => {
    const res = await ac4Mutation.mutateAsync({
      data: {
        business_date: date,
        cylinders: lines
          .filter((l) => l.product.cylinderTypeId)
          .map((l) => ({ cylinder_type_id: l.product.cylinderTypeId!, qty: l.qty })),
        accessories: lines
          .filter((l) => l.product.accessoryId)
          .map((l) => ({ accessory_id: l.product.accessoryId!, qty: l.qty })),
      },
    })
    if (res.status !== 201) return errorOf(res.data)
    await invalidate()
    return null
  }

  const recordErv = async (lines: Line[]) => {
    const res = await ervMutation.mutateAsync({
      data: {
        business_date: date,
        lines: lines.map((l) => ({ cylinder_type_id: l.product.cylinderTypeId!, qty: l.qty })),
      },
    })
    if (res.status !== 201) return errorOf(res.data)
    await invalidate()
    return null
  }

  const recordReturn = async (lines: Line[]) => {
    const res = await returnMutation.mutateAsync({
      data: {
        business_date: date,
        lines: lines.map((l) => ({
          cylinder_type_id: l.product.cylinderTypeId ?? null,
          accessory_id: l.product.accessoryId ?? null,
          condition: l.product.condition ?? null,
          qty: l.qty,
          note: l.note.trim() || null,
        })),
      },
    })
    if (res.status !== 201) return errorOf(res.data)
    await invalidate()
    return null
  }

  return (
    <AppShell
      title="Purchase"
      subtitle="ac4 received · erv empties to plant · return damaged or lost"
      topbarActions={
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-9 w-[150px]"
        />
      }
    >
      <EntryCard
        title="ac4 · Stock received"
        hint="Full cylinders and accessories received from the plant — adds to stock"
        icon={PackagePlus}
        action="Record ac4"
        products={[...fullCylinders, ...accessoryProducts]}
        pending={ac4Mutation.isPending}
        onRecord={recordAc4}
      />
      <EntryCard
        title="erv · Empty return"
        hint="Empty cylinders sent back to the plant — reduces empty stock"
        icon={RotateCcw}
        action="Record erv"
        products={emptyCylinders}
        pending={ervMutation.isPending}
        onRecord={recordErv}
      />
      <EntryCard
        title="Return · Damaged or lost"
        hint="Cylinders or accessories that were damaged or lost — taken out of stock"
        icon={PackageX}
        action="Record return"
        products={[...fullCylinders, ...emptyCylinders, ...accessoryProducts]}
        withNote
        pending={returnMutation.isPending}
        onRecord={recordReturn}
      />
    </AppShell>
  )
}

/**
 * Dropdown line entry: pick a product, type a quantity, Add — repeat — then Record saves all
 * lines at once. `onRecord` resolves to an error message, or null on success.
 */
function EntryCard({
  title,
  hint,
  icon: Icon,
  action,
  products,
  withNote = false,
  pending,
  onRecord,
}: {
  title: string
  hint: string
  icon: LucideIcon
  action: string
  products: Product[]
  withNote?: boolean
  pending: boolean
  onRecord: (lines: Line[]) => Promise<string | null>
}) {
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)

  const selected = products.find((p) => p.id === productId)
  const canAdd = !!selected && num(qty) > 0

  const addLine = () => {
    if (!selected || num(qty) <= 0) return
    const trimmed = note.trim()
    setLines((ls) => {
      // Same product (and same reason) adds up instead of making a duplicate line.
      const i = ls.findIndex((l) => l.product.id === selected.id && l.note === trimmed)
      if (i === -1) return [...ls, { product: selected, qty: num(qty), note: trimmed }]
      return ls.map((l, j) => (j === i ? { ...l, qty: l.qty + num(qty) } : l))
    })
    setProductId('')
    setQty('')
    setNote('')
    setStatus(null)
  }

  const record = async () => {
    if (lines.length === 0) return
    const error = await onRecord(lines)
    if (error) return setStatus({ ok: false, message: error })
    setLines([])
    setStatus({ ok: true, message: 'Recorded' })
  }

  const totalQty = lines.reduce((s, l) => s + l.qty, 0)

  return (
    <Card>
      <CardHeader title={title} hint={hint} />
      <div className="px-[18px] pb-5 pt-3 flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[12px] font-medium text-muted mb-1">Product</label>
            <Select value={productId} onChange={(e) => setProductId(e.target.value)} className="h-9">
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} — in stock {p.inStock}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-muted mb-1">Quantity</label>
            <Input
              type="number"
              min={1}
              className="h-9 w-[110px] num text-right"
              placeholder="0"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addLine()
              }}
            />
          </div>
          {withNote ? (
            <div className="min-w-[180px] flex-1 sm:flex-none">
              <label className="block text-[12px] font-medium text-muted mb-1">Reason</label>
              <Input
                className="h-9 w-full sm:w-[200px]"
                placeholder="Damaged / lost…"
                maxLength={200}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addLine()
                }}
              />
            </div>
          ) : null}
          <Button variant="ghost" className="h-9 px-3" onClick={addLine} disabled={!canAdd}>
            <Plus size={15} /> Add
          </Button>
        </div>

        {lines.length === 0 ? (
          <p className="text-[12.5px] text-muted py-1">
            {products.length === 0
              ? 'No products yet — add cylinder types or accessories under Master Catalog.'
              : 'No lines yet. Pick a product, enter the quantity and click Add.'}
          </p>
        ) : (
          <div className="rounded-lg border border-line">
            {lines.map((l, i) => (
              <div
                key={`${l.product.id}|${l.note}`}
                className="flex items-center justify-between gap-3 px-3 py-2 border-b border-line last:border-0"
              >
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium text-ink truncate">{l.product.label}</div>
                  {l.note ? <div className="text-[11.5px] text-muted truncate">{l.note}</div> : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="num font-display font-bold text-ink">{l.qty}</span>
                  <Button
                    variant="ghost"
                    className="h-8 px-2"
                    aria-label={`Remove ${l.product.label}`}
                    onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                  >
                    <X size={15} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="text-[12.5px]">
            {status ? (
              <span
                className={cn('inline-flex items-center gap-1.5', status.ok ? 'text-ok' : 'text-bad')}
                role="status"
              >
                {status.ok ? <Check size={15} /> : null}
                {status.message}
              </span>
            ) : lines.length > 0 ? (
              <span className="text-muted num">
                {lines.length} line{lines.length === 1 ? '' : 's'} · {totalQty} total
              </span>
            ) : null}
          </div>
          <Button
            variant="primary"
            className="h-9"
            onClick={record}
            disabled={pending || lines.length === 0}
          >
            <Icon size={16} />
            {pending ? 'Recording…' : action}
          </Button>
        </div>
      </div>
    </Card>
  )
}
