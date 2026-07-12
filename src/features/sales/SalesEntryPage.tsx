import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { createSaleV1SalesPost } from '@/api/generated/sales/sales'
import { useGetPricesV1PricesGet } from '@/api/generated/pricing/pricing'
import { useListDeliveryOtherSalesV1DeliveryOtherSalesGet } from '@/api/generated/delivery-other-sales/delivery-other-sales'
import { useListUsersV1UsersGet } from '@/api/generated/users/users'
import type { PriceOut, UserOut } from '@/api/generated/model'
import { AppShell } from '@/components/app/AppShell'
import { Money } from '@/components/app/Money'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/cn'

const NOTES = [500, 200, 100, 50, 20, 10]
const today = () => new Date().toISOString().slice(0, 10)
const num = (v: string | undefined) => Number(v ?? '') || 0

export function SalesEntryPage() {
  const queryClient = useQueryClient()
  const [date, setDate] = useState(today())
  const [driverId, setDriverId] = useState('')
  const [qty, setQty] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<number, string>>({})
  const [upi, setUpi] = useState('')
  const [online, setOnline] = useState('')
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const pricesQuery = useGetPricesV1PricesGet({ date })
  const driversQuery = useListUsersV1UsersGet({ role: 'delivery', active: true })
  const otherSalesQuery = useListDeliveryOtherSalesV1DeliveryOtherSalesGet()

  const otherSales =
    otherSalesQuery.data?.status === 200 ? otherSalesQuery.data.data : []
  const boyExtra = Number(
    otherSales.find((o) => o.delivery_id === driverId)?.amount_per_cylinder ?? 0,
  )

  const priceEnvelope = pricesQuery.data
  const priced: PriceOut[] = (
    priceEnvelope && priceEnvelope.status === 200 ? priceEnvelope.data : []
  ).filter((p) => p.unit_price != null)

  const driverEnvelope = driversQuery.data
  const drivers: UserOut[] = driverEnvelope && driverEnvelope.status === 200 ? driverEnvelope.data : []

  const revenue = useMemo(
    () =>
      priced.reduce(
        (sum, p) => sum + num(qty[p.cylinder_type_id]) * (Number(p.unit_price) + boyExtra),
        0,
      ),
    [priced, qty, boyExtra],
  )
  const cashTotal = useMemo(
    () => NOTES.reduce((sum, n) => sum + n * num(notes[n]), 0),
    [notes],
  )
  const settled = cashTotal + num(upi) // what the delivery boy hands in
  const collected = settled + num(online) // full sale = cash + upi + online
  const cylindersSold = priced.reduce((s, p) => s + num(qty[p.cylinder_type_id]), 0)
  const reconciled = revenue > 0 && Math.abs(collected - revenue) < 0.005
  const difference = collected - revenue

  const createSale = useMutation({
    mutationFn: (body: object) =>
      createSaleV1SalesPost(body as never, {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      }),
  })

  const submit = async () => {
    setResult(null)
    const lines = priced
      .filter((p) => num(qty[p.cylinder_type_id]) > 0)
      .map((p) => ({ cylinder_type_id: p.cylinder_type_id, qty: num(qty[p.cylinder_type_id]) }))
    if (!driverId) return setResult({ ok: false, message: 'Select a delivery person.' })
    if (lines.length === 0) return setResult({ ok: false, message: 'Enter at least one cylinder.' })

    const denominations = NOTES.filter((n) => num(notes[n]) > 0).map((n) => ({
      note_value: n,
      note_count: num(notes[n]),
    }))

    const res = await createSale.mutateAsync({
      delivery_id: driverId,
      business_date: date,
      lines,
      denominations,
      upi_total: num(upi),
      online_total: num(online),
    })
    const status = res.status as number
    if (status === 201) {
      setResult({ ok: true, message: 'Sale moved to the day sheet.' })
      setQty({})
      setNotes({})
      setUpi('')
      setOnline('')
      await queryClient.invalidateQueries()
    } else {
      const detail = (res.data as { detail?: unknown })?.detail
      const flags =
        detail && typeof detail === 'object' && 'flags' in detail
          ? (detail as { flags: string[] }).flags.join('; ')
          : typeof detail === 'string'
            ? detail
            : 'Could not post the sale.'
      setResult({ ok: false, message: flags })
    }
  }

  return (
    <AppShell title="Sales Entry" subtitle="Enter a delivery person's sale and move it to the day sheet">
      {/* Driver + date */}
      <Card>
        <div className="p-[18px] flex flex-wrap items-end gap-5">
          <div className="min-w-[220px]">
            <label className="block text-[13px] font-medium text-ink mb-1.5">Delivery person</label>
            <Select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              <option value="">Select…</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
            {drivers.length === 0 ? (
              <p className="text-[11.5px] text-muted mt-1">No delivery staff — add one under Users.</p>
            ) : null}
          </div>
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">Business date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-[160px]" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
        {/* Cylinders */}
        <Card>
          <CardHeader title="Cylinders sold" hint="Auto-priced for the business date" />
          {pricesQuery.isLoading ? (
            <div className="grid place-items-center py-10 text-muted">
              <Loader2 className="animate-spin text-orange" size={20} />
            </div>
          ) : priced.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-muted">
              No prices set for this date. Set them under Master Catalog → Pricing first.
            </div>
          ) : (
            <div className="px-[18px] pb-4 pt-1 flex flex-col">
              {priced.map((p) => {
                const lineTotal = num(qty[p.cylinder_type_id]) * (Number(p.unit_price) + boyExtra)
                return (
                  <div key={p.cylinder_type_id} className="flex items-center justify-between gap-3 py-2.5 border-b border-line last:border-0">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium text-ink">{p.label}</div>
                      <div className="text-[11.5px] text-muted num">
                        {p.code} · <Money value={Number(p.unit_price)} />/unit
                        {boyExtra > 0 ? (
                          <span className="text-orange"> + <Money value={boyExtra} /> other</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={0}
                        className="h-9 w-[90px] num text-right"
                        placeholder="0"
                        value={qty[p.cylinder_type_id] ?? ''}
                        onChange={(e) => setQty((s) => ({ ...s, [p.cylinder_type_id]: e.target.value }))}
                      />
                      <Money value={lineTotal} className="w-[90px] text-right font-display font-semibold text-ink" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Cash + UPI */}
        <Card>
          <CardHeader title="Cash collected" hint="Count the denominations" />
          <div className="px-[18px] pb-4 pt-1 flex flex-col gap-1.5">
            {NOTES.map((n) => (
              <div key={n} className="flex items-center justify-between gap-3 py-1.5">
                <span className="num text-[13px] text-ink w-12">₹{n}</span>
                <span className="text-muted text-[12px]">×</span>
                <Input
                  type="number"
                  min={0}
                  className="h-9 w-[90px] num text-right"
                  placeholder="0"
                  value={notes[n] ?? ''}
                  onChange={(e) => setNotes((s) => ({ ...s, [n]: e.target.value }))}
                />
                <Money value={n * num(notes[n])} className="w-[90px] text-right num text-muted" />
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-line pt-2 mt-1">
              <span className="text-[13px] font-medium text-ink">Cash total</span>
              <Money value={cashTotal} className="font-display font-bold text-ink" />
            </div>
            <div className="flex items-center justify-between gap-3 mt-2">
              <label className="text-[13px] font-medium text-ink">UPI / digital</label>
              <Input
                type="number"
                min={0}
                className="h-9 w-[120px] num text-right"
                placeholder="0"
                value={upi}
                onChange={(e) => setUpi(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-3 mt-1">
              <label className="text-[13px] font-medium text-ink">
                Online <span className="text-[11px] text-muted font-normal">→ company</span>
              </label>
              <Input
                type="number"
                min={0}
                className="h-9 w-[120px] num text-right"
                placeholder="0"
                value={online}
                onChange={(e) => setOnline(e.target.value)}
              />
            </div>
            <p className="text-[11px] text-muted mt-1">
              Online goes straight to the company — the delivery boy only settles cash + UPI.
            </p>
          </div>
        </Card>
      </div>

      {/* Reconciliation + submit */}
      <Card className={cn('bg-flame')}>
        <div className="p-[18px] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-8 flex-wrap">
            <div>
              <div className="text-[11.5px] text-muted">Revenue (sold)</div>
              <Money value={revenue} className="font-display font-extrabold text-[18px] text-ink" />
            </div>
            <div>
              <div className="text-[11.5px] text-muted">Settled by boy (cash + UPI)</div>
              <Money value={settled} className="font-display font-extrabold text-[18px] text-ink" />
            </div>
            <div>
              <div className="text-[11.5px] text-muted">Online → company</div>
              <Money value={num(online)} className="font-display font-extrabold text-[18px] text-ink" />
            </div>
            <div>
              <div className="text-[11.5px] text-muted">Status</div>
              {revenue === 0 ? (
                <span className="text-[13px] text-muted">—</span>
              ) : reconciled ? (
                <span className="inline-flex items-center gap-1.5 text-ok font-bold text-[13px]">
                  <Check size={15} /> Reconciled
                </span>
              ) : (
                <span className="text-bad font-bold text-[13px]">
                  Off by <Money value={Math.abs(difference)} /> {difference > 0 ? '(over)' : '(short)'}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="primary"
            onClick={submit}
            disabled={createSale.isPending || !reconciled || cylindersSold === 0}
          >
            {createSale.isPending ? 'Posting…' : 'Move to Day Sheet'}
            <ArrowRight size={16} />
          </Button>
        </div>
        {result ? (
          <div
            className={cn(
              'mx-[18px] mb-[18px] text-[12.5px] rounded-lg px-3 py-2',
              result.ok ? 'text-ok bg-okbg' : 'text-bad bg-badbg',
            )}
            role="status"
          >
            {result.message}
          </div>
        ) : null}
      </Card>
    </AppShell>
  )
}
