import { useQueryClient } from '@tanstack/react-query'
import { Check, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  getGetPricesV1PricesGetQueryKey,
  useGetPricesV1PricesGet,
  useSetPricesBulkV1PricesBulkPut,
} from '@/api/generated/pricing/pricing'
import type { PriceOut } from '@/api/generated/model'
import { Card, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const today = () => new Date().toISOString().slice(0, 10)

/** Effective-dated pricing, embedded in the Master Catalog (owner-only). */
export function PricingSection() {
  const queryClient = useQueryClient()
  const [date, setDate] = useState(today())
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  const params = { date }
  const pricesQuery = useGetPricesV1PricesGet(params)
  const bulkMutation = useSetPricesBulkV1PricesBulkPut()

  const envelope = pricesQuery.data
  const rows: PriceOut[] = envelope && envelope.status === 200 ? envelope.data : []

  // Prefill the editable inputs whenever the resolved prices change (new date / refetch).
  useEffect(() => {
    const next: Record<string, string> = {}
    for (const row of rows) {
      next[row.cylinder_type_id] = row.unit_price != null ? String(row.unit_price) : ''
    }
    setEdits(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envelope])

  const onSave = async () => {
    setSaved(false)
    const prices = rows
      .filter((r) => edits[r.cylinder_type_id]?.trim() !== '' && edits[r.cylinder_type_id] != null)
      .map((r) => ({
        cylinder_type_id: r.cylinder_type_id,
        unit_price: Number(edits[r.cylinder_type_id]),
      }))
    if (prices.length === 0) return
    const res = await bulkMutation.mutateAsync({ data: { effective_date: date, prices } })
    const status = res.status as number
    if (status >= 200 && status < 300) {
      await queryClient.invalidateQueries({ queryKey: getGetPricesV1PricesGetQueryKey(params) })
      setSaved(true)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Pricing"
        hint="A price applies from its effective date onward; a past day always uses that day's price"
        right={
          <div className="flex items-center gap-3">
            <label className="text-[12.5px] text-muted">Effective date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setSaved(false)
              }}
              className="h-9 w-[160px]"
            />
          </div>
        }
      />

      {pricesQuery.isLoading ? (
        <div className="grid place-items-center py-14 text-muted">
          <Loader2 className="animate-spin text-orange" size={22} />
        </div>
      ) : pricesQuery.isError || (envelope && envelope.status !== 200) ? (
        <div className="py-14 text-center text-[13px] text-bad">Could not load prices.</div>
      ) : rows.length === 0 ? (
        <div className="py-14 text-center text-[13px] text-muted">
          No active cylinder varieties. Add some above first.
        </div>
      ) : (
        <div className="px-[18px] pb-5 pt-1 flex flex-col gap-2">
          {rows.map((row) => (
            <div
              key={row.cylinder_type_id}
              className="flex items-center justify-between gap-4 py-2 border-b border-line last:border-0"
            >
              <div className="min-w-0">
                <div className="text-[13.5px] font-medium text-ink">{row.label}</div>
                <div className="text-[11.5px] text-muted num">{row.code}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted text-sm">₹</span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  className="h-9 w-[140px] num text-right"
                  value={edits[row.cylinder_type_id] ?? ''}
                  onChange={(e) => {
                    setEdits((prev) => ({ ...prev, [row.cylinder_type_id]: e.target.value }))
                    setSaved(false)
                  }}
                  placeholder="—"
                />
              </div>
            </div>
          ))}

          <div className="flex items-center justify-end gap-3 mt-3">
            {saved ? (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ok">
                <Check size={15} /> Prices saved for {date}
              </span>
            ) : null}
            <Button variant="primary" onClick={onSave} disabled={bulkMutation.isPending}>
              {bulkMutation.isPending ? 'Saving…' : 'Save all prices'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
