import {
  ArrowRight,
  ArrowUp,
  Banknote,
  CreditCard,
  Download,
  Flame,
  Smartphone,
  TrendingUp,
} from 'lucide-react'
import { AppShell } from '@/components/app/AppShell'
import { Card, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/app/DataTable'
import { Gauge } from '@/components/app/Gauge'
import { KpiCard } from '@/components/app/KpiCard'
import { Money } from '@/components/app/Money'
import { ReconcilePanel } from '@/components/app/ReconcilePanel'
import { Reveal } from '@/components/app/Reveal'
import { StatusPill } from '@/components/app/StatusPill'
import { CollectionsChart } from './CollectionsChart'

// Placeholder data — wired to the API in later phases.
const GAUGES = [
  { name: '14.2 kg', sub: 'Domestic', sold: 268, left: 52, value: 84 },
  { name: '19 kg', sub: 'Commercial', sold: 52, left: 28, value: 65 },
  { name: '5 kg', sub: 'Domestic', sold: 18, left: 22, value: 45 },
  { name: '47.5 kg', sub: 'Commercial', sold: 9, left: 6, value: 60 },
]

interface DeliveryRow {
  initials: string
  color: string
  name: string
  cylinders: number
  cash: number
  upi: number
  total: number
  status: 'settled' | 'counting'
}

const DELIVERY: DeliveryRow[] = [
  { initials: 'MR', color: '#10295C', name: 'Murugan R.', cylinders: 96, cash: 64200, upi: 20000, total: 84200, status: 'settled' },
  { initials: 'SK', color: '#2E6F4E', name: 'Senthil K.', cylinders: 89, cash: 61600, upi: 18000, total: 79600, status: 'settled' },
  { initials: 'RP', color: '#7A4FB0', name: 'Ravi P.', cylinders: 74, cash: 52400, upi: 13700, total: 66100, status: 'counting' },
  { initials: 'KS', color: '#C0552A', name: 'Karthik S.', cylinders: 88, cash: 60400, upi: 18100, total: 78500, status: 'settled' },
]

const totals = DELIVERY.reduce(
  (acc, r) => ({
    cylinders: acc.cylinders + r.cylinders,
    cash: acc.cash + r.cash,
    upi: acc.upi + r.upi,
    total: acc.total + r.total,
  }),
  { cylinders: 0, cash: 0, upi: 0, total: 0 },
)

const columns: Column<DeliveryRow>[] = [
  { key: 'name', header: 'Delivery staff', render: (r) => r.name },
  { key: 'cylinders', header: 'Cylinders', numeric: true, render: (r) => r.cylinders },
  { key: 'cash', header: 'Cash ₹', numeric: true, render: (r) => <Money value={r.cash} bare /> },
  { key: 'upi', header: 'UPI ₹', numeric: true, render: (r) => <Money value={r.upi} bare /> },
  { key: 'total', header: 'Total ₹', numeric: true, render: (r) => <Money value={r.total} bare /> },
]

export function DashboardPage() {
  return (
    <AppShell
      title="Dashboard"
      subtitle="Monday, 30 June 2026 · End-of-day overview"
      notificationCount={3}
      topbarActions={
        <>
          <StatusPill variant="open" dot>
            Day open
          </StatusPill>
          <Button variant="ghost">
            <Download size={16} />
            Export
          </Button>
          <Button variant="primary">
            <ArrowRight size={16} />
            Close day
          </Button>
        </>
      }
    >
      {/* KPI ROW */}
      <Reveal delay={0.02}>
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <KpiCard
            icon={<Flame size={17} />}
            label="Cylinders sold"
            value={347}
            sub={
              <span>
                of <b className="text-ink">455</b>&nbsp;loaded today
              </span>
            }
            progress={76}
          />
          <KpiCard
            icon={<CreditCard size={17} />}
            label="Gross collection"
            value={342180}
            prefix="₹"
            sub={
              <span className="flex items-center gap-1.5">
                <span className="text-ok font-bold inline-flex items-center gap-0.5">
                  <ArrowUp size={12} strokeWidth={3} />
                  12%
                </span>
                vs yesterday
              </span>
            }
          />
          <KpiCard
            icon={<Banknote size={17} />}
            label="Cash in hand"
            value={258400}
            prefix="₹"
            sub={
              <StatusPill variant="ok" size="sm">
                Denominations verified
              </StatusPill>
            }
          />
          <KpiCard
            icon={<Smartphone size={17} />}
            label="UPI / digital"
            value={83780}
            prefix="₹"
            sub={
              <span>
                <b className="text-ink">24%</b>&nbsp;of collection
              </span>
            }
          />
          <KpiCard
            icon={<TrendingUp size={17} />}
            label="Net profit (today)"
            value={335940}
            prefix="₹"
            owner
            sub={
              <span>
                after <b className="text-ink">₹6,240</b>&nbsp;expenses
              </span>
            }
          />
        </section>
      </Reveal>

      {/* MAIN GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.65fr_1fr] gap-5 items-start">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-5 min-w-0">
          <Reveal delay={0.08}>
            <Card>
              <CardHeader
                title="Collections"
                hint="Daily total · last 7 days"
                right={
                  <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
                    <i className="inline-block w-[9px] h-[9px] rounded-sm bg-orange" />
                    Total collection
                  </span>
                }
              />
              <div className="px-3 pb-3.5 pt-1.5">
                <CollectionsChart />
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.12}>
            <Card>
              <CardHeader
                title="Cylinder movement"
                hint="Sold against morning load"
                right={<span className="text-[11.5px] text-muted">Remaining in stock</span>}
              />
              <div className="px-[18px] pb-[18px] pt-1.5 flex flex-col gap-[15px]">
                {GAUGES.map((g) => (
                  <Gauge
                    key={g.name}
                    name={g.name}
                    sub={g.sub}
                    value={g.value}
                    figure={
                      <span>
                        <b className="text-ink font-display font-bold">{g.sold}</b> sold · {g.left} left
                      </span>
                    }
                  />
                ))}
              </div>
            </Card>
          </Reveal>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-5 min-w-0">
          <Reveal delay={0.1}>
            <ReconcilePanel
              status="ok"
              title="Cash tallied"
              subtitle="Counted matches expected to the rupee"
              rows={[
                { label: 'Expected (sales − UPI)', value: <Money value={258400} /> },
                { label: 'Counted (denominations)', value: <Money value={258400} /> },
                { label: 'Variance', value: <Money value={0} />, good: true },
                { label: 'Open mismatches', value: 'None', good: true },
              ]}
            />
          </Reveal>

          <Reveal delay={0.14}>
            <Card>
              <CardHeader title="Delivery staff · today" hint="4 active" />
              <div className="px-2 pb-2.5 pt-1">
                {DELIVERY.map((d) => (
                  <div key={d.initials} className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-surface transition-colors">
                    <div
                      className="h-[34px] w-[34px] rounded-full grid place-items-center font-display font-bold text-[13px] text-white shrink-0"
                      style={{ background: d.color }}
                    >
                      {d.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <b className="text-[13.5px] text-ink block">{d.name}</b>
                      <span className="text-[11.5px] text-muted">{d.cylinders} cylinders</span>
                    </div>
                    <Money value={d.total} className="font-display font-bold text-sm text-ink" />
                    <StatusPill variant={d.status === 'settled' ? 'ok' : 'warn'} size="sm">
                      {d.status === 'settled' ? 'Settled' : 'Counting'}
                    </StatusPill>
                  </div>
                ))}
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* DAY SHEET PREVIEW */}
      <Reveal delay={0.16}>
        <Card className="overflow-hidden">
          <CardHeader
            title="Day sheet preview"
            hint="Today's consolidated register"
            className="pb-3.5"
            right={
              <Button variant="ghost">
                View full day sheet
                <ArrowRight size={15} />
              </Button>
            }
          />
          <DataTable
            columns={columns}
            data={DELIVERY}
            getRowKey={(r) => r.initials}
            footer={[
              'Total',
              totals.cylinders,
              <Money key="cash" value={totals.cash} bare />,
              <Money key="upi" value={totals.upi} bare />,
              <Money key="total" value={totals.total} bare />,
            ]}
          />
        </Card>
      </Reveal>
    </AppShell>
  )
}
