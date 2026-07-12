import { useQueryClient } from '@tanstack/react-query'
import { Check, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  getListDeliveryOtherSalesV1DeliveryOtherSalesGetQueryKey,
  useListDeliveryOtherSalesV1DeliveryOtherSalesGet,
  useSetDeliveryOtherSalesV1DeliveryOtherSalesDeliveryIdPut,
} from '@/api/generated/delivery-other-sales/delivery-other-sales'
import type { DeliveryOtherSalesOut } from '@/api/generated/model'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function OtherSalesSection() {
  const queryClient = useQueryClient()
  const listQuery = useListDeliveryOtherSalesV1DeliveryOtherSalesGet()
  const setMutation = useSetDeliveryOtherSalesV1DeliveryOtherSalesDeliveryIdPut()
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [savedId, setSavedId] = useState<string | null>(null)

  const rows: DeliveryOtherSalesOut[] = useMemo(
    () => (listQuery.data?.status === 200 ? listQuery.data.data : []),
    [listQuery.data],
  )

  // Seed inputs from server values once loaded.
  useEffect(() => {
    if (rows.length === 0) return
    setAmounts((prev) => {
      const next = { ...prev }
      for (const r of rows)
        if (next[r.delivery_id] === undefined) next[r.delivery_id] = String(r.amount_per_cylinder)
      return next
    })
  }, [rows])

  const save = async (row: DeliveryOtherSalesOut) => {
    const value = Number(amounts[row.delivery_id] ?? '') || 0
    const res = await setMutation.mutateAsync({
      deliveryId: row.delivery_id,
      data: { amount_per_cylinder: value },
    })
    if (res.status === 200) {
      setSavedId(row.delivery_id)
      await queryClient.invalidateQueries({
        queryKey: getListDeliveryOtherSalesV1DeliveryOtherSalesGetQueryKey(),
      })
      setTimeout(() => setSavedId((id) => (id === row.delivery_id ? null : id)), 1500)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Other sales per delivery boy"
        hint="Extra ₹/cylinder charged on top of the fixed price — added to each sale's total"
      />
      {listQuery.isLoading ? (
        <div className="grid place-items-center py-10 text-muted">
          <Loader2 className="animate-spin text-orange" size={20} />
        </div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center text-[13px] text-muted">
          No delivery staff yet — add one under Users.
        </div>
      ) : (
        <div className="px-[18px] pb-5 pt-1 flex flex-col">
          {rows.map((r) => (
            <div
              key={r.delivery_id}
              className="flex items-center justify-between gap-4 py-2.5 border-b border-line last:border-0"
            >
              <div className="text-[13.5px] font-medium text-ink">{r.delivery_name}</div>
              <div className="flex items-center gap-2">
                <span className="text-muted text-[12px]">₹</span>
                <Input
                  type="number"
                  min={0}
                  className="h-9 w-[110px] num text-right"
                  placeholder="0"
                  value={amounts[r.delivery_id] ?? ''}
                  onChange={(e) =>
                    setAmounts((s) => ({ ...s, [r.delivery_id]: e.target.value }))
                  }
                />
                <span className="text-muted text-[12px]">/cyl</span>
                <Button
                  variant="ghost"
                  className="h-9 px-3 text-[12px]"
                  disabled={setMutation.isPending}
                  onClick={() => save(r)}
                >
                  {savedId === r.delivery_id ? (
                    <span className="inline-flex items-center gap-1 text-ok">
                      <Check size={14} /> Saved
                    </span>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
