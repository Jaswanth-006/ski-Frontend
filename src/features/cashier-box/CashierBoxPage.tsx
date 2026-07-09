import { Loader2, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useGetCashierBoxV1CashierBoxOnDateGet } from '@/api/generated/cashier-box/cashier-box'
import { AppShell } from '@/components/app/AppShell'
import { Money } from '@/components/app/Money'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const today = () => new Date().toISOString().slice(0, 10)

function Line({ label, value, sign }: { label: string; value: number; sign?: '+' | '−' }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-line last:border-0">
      <span className="text-[13px] text-muted">
        {sign ? <span className="text-muted mr-1">{sign}</span> : null}
        {label}
      </span>
      <Money value={value} className="font-display font-semibold text-ink" />
    </div>
  )
}

export function CashierBoxPage() {
  const [date, setDate] = useState(today())
  const query = useGetCashierBoxV1CashierBoxOnDateGet(date)
  const box = query.data?.status === 200 ? query.data.data : null

  return (
    <AppShell title="Cashier Box" subtitle="Cash in hand — carries over until you deposit it">
      <Card className="max-w-xl">
        <CardHeader
          title="Cash in hand"
          hint="Opening carries from the previous day"
          right={
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 w-[150px]"
            />
          }
        />
        {query.isLoading ? (
          <div className="grid place-items-center py-14 text-muted">
            <Loader2 className="animate-spin text-orange" size={22} />
          </div>
        ) : box ? (
          <div className="px-[18px] pb-4 pt-1">
            <Line label="Opening balance" value={Number(box.opening)} />
            <Line label="Collected (cash + UPI)" value={Number(box.collected)} sign="+" />
            <Line label="Expenses" value={Number(box.expenses)} sign="−" />
            <Line label="Deposited out" value={Number(box.deposited)} sign="−" />
            <div className="flex items-center justify-between pt-3.5 mt-1.5 border-t-2 border-line">
              <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-ink">
                <Wallet size={16} className="text-orange" /> Closing balance
              </span>
              <Money
                value={Number(box.closing)}
                className="font-display font-extrabold text-[20px] text-ink"
              />
            </div>
          </div>
        ) : (
          <div className="py-14 text-center text-[13px] text-bad">Could not load the cashier box.</div>
        )}
      </Card>
    </AppShell>
  )
}
