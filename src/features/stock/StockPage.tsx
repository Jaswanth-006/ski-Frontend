import { useQueryClient } from '@tanstack/react-query'
import { Check, PackagePlus, Plus, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import {
  getStockOverviewV1StockOverviewGetQueryKey,
  useStockAc4V1StockAc4Post,
  useStockErvV1StockErvPost,
  useStockOverviewV1StockOverviewGet,
} from '@/api/generated/stock/stock'
import {
  getListAccessoriesV1AccessoriesGetQueryKey,
  useCreateAccessoryV1AccessoriesPost,
  useListAccessoriesV1AccessoriesGet,
} from '@/api/generated/accessories/accessories'
import type { AccessoryOut, CylinderStockRow } from '@/api/generated/model'
import { AppShell } from '@/components/app/AppShell'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/auth/useAuth'
import { cn } from '@/lib/cn'

const today = () => new Date().toISOString().slice(0, 10)
const num = (v: string | undefined) => Number(v) || 0

export function StockPage() {
  const queryClient = useQueryClient()
  const { role } = useAuth()
  const isOwner = role === 'super_admin'
  const [date, setDate] = useState(today())

  const overviewQuery = useStockOverviewV1StockOverviewGet({ date })
  const accessoriesQuery = useListAccessoriesV1AccessoriesGet()
  const ac4Mutation = useStockAc4V1StockAc4Post()
  const ervMutation = useStockErvV1StockErvPost()

  const overview = overviewQuery.data?.status === 200 ? overviewQuery.data.data : null
  const cylinders: CylinderStockRow[] = overview?.cylinders ?? []
  const accessories: AccessoryOut[] =
    accessoriesQuery.data?.status === 200 ? accessoriesQuery.data.data : []
  const accessoryStock = overview?.accessories ?? []
  const accClosing = (id: string) =>
    accessoryStock.find((a) => a.accessory_id === id)?.closing ?? 0

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getStockOverviewV1StockOverviewGetQueryKey() })
    queryClient.invalidateQueries({ queryKey: getListAccessoriesV1AccessoriesGetQueryKey() })
  }

  // ac4 — stock received
  const [ac4Cyl, setAc4Cyl] = useState<Record<string, string>>({})
  const [ac4Acc, setAc4Acc] = useState<Record<string, string>>({})
  const [ac4Done, setAc4Done] = useState(false)
  const recordAc4 = async () => {
    setAc4Done(false)
    const cyl = cylinders
      .filter((c) => num(ac4Cyl[c.cylinder_type_id]) > 0)
      .map((c) => ({ cylinder_type_id: c.cylinder_type_id, qty: num(ac4Cyl[c.cylinder_type_id]) }))
    const acc = accessories
      .filter((a) => num(ac4Acc[a.id]) > 0)
      .map((a) => ({ accessory_id: a.id, qty: num(ac4Acc[a.id]) }))
    if (cyl.length === 0 && acc.length === 0) return
    const res = await ac4Mutation.mutateAsync({
      data: { business_date: date, cylinders: cyl, accessories: acc },
    })
    if (res.status === 201) {
      await invalidate()
      setAc4Cyl({})
      setAc4Acc({})
      setAc4Done(true)
    }
  }

  // erv — empty return
  const [erv, setErv] = useState<Record<string, string>>({})
  const [ervDone, setErvDone] = useState(false)
  const recordErv = async () => {
    setErvDone(false)
    const lines = cylinders
      .filter((c) => num(erv[c.cylinder_type_id]) > 0)
      .map((c) => ({ cylinder_type_id: c.cylinder_type_id, qty: num(erv[c.cylinder_type_id]) }))
    if (lines.length === 0) return
    const res = await ervMutation.mutateAsync({ data: { business_date: date, lines } })
    if (res.status === 201) {
      await invalidate()
      setErv({})
      setErvDone(true)
    }
  }

  return (
    <AppShell
      title="Stock"
      subtitle="ac4 received · erv returned · opening → closing"
      topbarActions={
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-9 w-[150px]"
        />
      }
    >
      {/* Opening → closing overview */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Stock overview"
          hint={`Full & empty cylinders on ${date} · today's closing carries to tomorrow`}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[720px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-[.04em] text-muted">
                <th className="text-left font-semibold px-[18px] py-2">Variety</th>
                <th className="text-right font-semibold px-2">Full open</th>
                <th className="text-right font-semibold px-2">+ ac4</th>
                <th className="text-right font-semibold px-2">− sold</th>
                <th className="text-right font-semibold px-2 text-ink">Full close</th>
                <th className="text-right font-semibold px-2 pl-5">Empty open</th>
                <th className="text-right font-semibold px-2">+ cust.</th>
                <th className="text-right font-semibold px-2">− erv</th>
                <th className="text-right font-semibold px-[18px] text-ink">Empty close</th>
              </tr>
            </thead>
            <tbody>
              {cylinders.map((c) => (
                <tr key={c.cylinder_type_id} className="border-t border-line num">
                  <td className="px-[18px] py-2.5 text-left">
                    <div className="text-ink font-medium">{c.label}</div>
                    <div className="text-[11px] text-muted">{c.code}</div>
                  </td>
                  <td className="text-right px-2 text-muted">{c.full_opening}</td>
                  <td className="text-right px-2 text-ok">{c.full_received || ''}</td>
                  <td className="text-right px-2 text-muted">{c.full_sold || ''}</td>
                  <td className="text-right px-2 font-display font-bold text-ink">{c.full_closing}</td>
                  <td className="text-right px-2 pl-5 text-muted">{c.empty_opening}</td>
                  <td className="text-right px-2 text-ok">{c.empty_returned_by_customers || ''}</td>
                  <td className="text-right px-2 text-muted">{c.empty_sent_to_plant || ''}</td>
                  <td className="text-right px-[18px] font-display font-bold text-ink">
                    {c.empty_closing}
                  </td>
                </tr>
              ))}
              {cylinders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-[18px] py-6 text-center text-muted">
                    No cylinder types yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {accessoryStock.length > 0 ? (
          <div className="border-t border-line px-[18px] py-3 flex flex-wrap gap-x-6 gap-y-1.5">
            <span className="text-[11px] uppercase tracking-[.04em] text-muted font-semibold self-center">
              Accessories
            </span>
            {accessoryStock.map((a) => (
              <span key={a.accessory_id} className="text-[13px] text-ink num">
                {a.name}: <b className="font-display">{a.closing}</b>
              </span>
            ))}
          </div>
        ) : null}
      </Card>

      {/* ac4 — stock received */}
      <Card>
        <CardHeader
          title="ac4 · Stock received"
          hint="Full cylinders and accessories received from the plant — adds to stock"
          right={
            <div className="flex items-center gap-3">
              {ac4Done ? (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ok">
                  <Check size={15} /> Recorded
                </span>
              ) : null}
              <Button
                variant="primary"
                className="h-9"
                onClick={recordAc4}
                disabled={ac4Mutation.isPending}
              >
                <PackagePlus size={16} />
                {ac4Mutation.isPending ? 'Recording…' : 'Record ac4'}
              </Button>
            </div>
          }
        />
        <div className="px-[18px] pb-5 pt-1 flex flex-col gap-2">
          <div className="text-[11px] uppercase tracking-[.05em] text-muted font-semibold pt-1">
            Full cylinders
          </div>
          {cylinders.map((c) => (
            <StockLineInput
              key={c.cylinder_type_id}
              label={c.label}
              code={c.code}
              closing={`full in stock: ${c.full_closing}`}
              value={ac4Cyl[c.cylinder_type_id]}
              onChange={(v) => {
                setAc4Cyl((p) => ({ ...p, [c.cylinder_type_id]: v }))
                setAc4Done(false)
              }}
            />
          ))}
          <div className="text-[11px] uppercase tracking-[.05em] text-muted font-semibold pt-3 flex items-center justify-between">
            Accessories
            {isOwner ? <AddAccessory onCreated={invalidate} /> : null}
          </div>
          {accessories.length === 0 ? (
            <p className="text-[12.5px] text-muted py-1">
              No accessories yet{isOwner ? ' — add one above.' : '.'}
            </p>
          ) : (
            accessories.map((a) => (
              <StockLineInput
                key={a.id}
                label={a.name}
                closing={`in stock: ${accClosing(a.id)}`}
                value={ac4Acc[a.id]}
                onChange={(v) => {
                  setAc4Acc((p) => ({ ...p, [a.id]: v }))
                  setAc4Done(false)
                }}
              />
            ))
          )}
        </div>
      </Card>

      {/* erv — empty return */}
      <Card>
        <CardHeader
          title="erv · Empty return"
          hint="Empty cylinders sent back to the plant — reduces empty stock"
          right={
            <div className="flex items-center gap-3">
              {ervDone ? (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ok">
                  <Check size={15} /> Recorded
                </span>
              ) : null}
              <Button
                variant="primary"
                className="h-9"
                onClick={recordErv}
                disabled={ervMutation.isPending}
              >
                <RotateCcw size={16} />
                {ervMutation.isPending ? 'Recording…' : 'Record erv'}
              </Button>
            </div>
          }
        />
        <div className="px-[18px] pb-5 pt-1 flex flex-col gap-2">
          {cylinders.map((c) => (
            <StockLineInput
              key={c.cylinder_type_id}
              label={c.label}
              code={c.code}
              closing={`empty in stock: ${c.empty_closing}`}
              value={erv[c.cylinder_type_id]}
              onChange={(v) => {
                setErv((p) => ({ ...p, [c.cylinder_type_id]: v }))
                setErvDone(false)
              }}
            />
          ))}
        </div>
      </Card>
    </AppShell>
  )
}

function StockLineInput({
  label,
  code,
  closing,
  value,
  onChange,
}: {
  label: string
  code?: string
  closing: string
  value: string | undefined
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-line last:border-0">
      <div>
        <div className="text-[13.5px] font-medium text-ink">{label}</div>
        <div className={cn('text-[11.5px] text-muted num')}>
          {code ? `${code} · ` : ''}
          {closing}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted text-[12px]">qty</span>
        <Input
          type="number"
          min={0}
          className="h-9 w-[110px] num text-right"
          placeholder="0"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

function AddAccessory({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('')
  const create = useCreateAccessoryV1AccessoriesPost()
  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const res = await create.mutateAsync({ data: { name: trimmed } })
    if (res.status === 201) {
      setName('')
      onCreated()
    }
  }
  return (
    <span className="flex items-center gap-1.5 normal-case">
      <Input
        className="h-8 w-[150px] text-[12.5px]"
        placeholder="New accessory…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
        }}
      />
      <Button variant="ghost" className="h-8 px-2.5" onClick={submit} disabled={create.isPending}>
        <Plus size={15} />
      </Button>
    </span>
  )
}
