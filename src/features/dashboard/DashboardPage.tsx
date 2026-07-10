import {
  ArrowRight,
  Banknote,
  CreditCard,
  Download,
  Flame,
  Smartphone,
  TrendingUp,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  useCollectionsV1AnalyticsCollectionsGet,
  useCylinderMovementV1AnalyticsCylinderMovementGet,
  useEodV1AnalyticsEodGet,
} from '@/api/generated/analytics/analytics'
import { useGetDaySheetV1DaySheetOnDateGet } from '@/api/generated/day-sheet/day-sheet'
import type { DaySheetRow } from '@/api/generated/model'
import { useAuth } from '@/auth/useAuth'
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
import { useAuthStore } from '@/state/auth'
import { CollectionsChart } from './CollectionsChart'

const isoToday = () => new Date().toISOString().slice(0, 10)

// Deterministic avatar tint per delivery driver.
const AVATAR_COLORS = ['#10295C', '#2E6F4E', '#7A4FB0', '#C0552A', '#B03A5B', '#2A6F8E']
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
const colorFor = (id: string) => {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const columns: Column<DaySheetRow>[] = [
  { key: 'name', header: 'Delivery staff', render: (r) => r.delivery_name },
  { key: 'cylinders', header: 'Cylinders', numeric: true, render: (r) => r.cylinders },
  { key: 'cash', header: 'Cash ₹', numeric: true, render: (r) => <Money value={Number(r.cash)} bare /> },
  { key: 'upi', header: 'UPI ₹', numeric: true, render: (r) => <Money value={Number(r.upi)} bare /> },
  { key: 'total', header: 'Total ₹', numeric: true, render: (r) => <Money value={Number(r.total)} bare /> },
]

export function DashboardPage() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const date = isoToday()
  const prettyDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const eodQuery = useEodV1AnalyticsEodGet()
  const trendQuery = useCollectionsV1AnalyticsCollectionsGet({ days: 7 })
  const movementQuery = useCylinderMovementV1AnalyticsCylinderMovementGet()
  const daySheetQuery = useGetDaySheetV1DaySheetOnDateGet(date)

  const eod = eodQuery.data?.status === 200 ? eodQuery.data.data : null
  const trend = trendQuery.data?.status === 200 ? trendQuery.data.data.points : []
  const movement = movementQuery.data?.status === 200 ? movementQuery.data.data.rows : []
  const sheet = daySheetQuery.data?.status === 200 ? daySheetQuery.data.data : null
  const rows: DaySheetRow[] = sheet?.rows ?? []

  const grossCash = Number(eod?.gross_cash ?? 0)
  const upi = Number(eod?.upi_total ?? 0)
  const netProfit = eod?.net_profit != null ? Number(eod.net_profit) : null

  // Collections chart points: one per day, weekday label, last point = today.
  const chartPoints = trend.map((p, i) => ({
    label:
      i === trend.length - 1
        ? 'Today'
        : new Date(`${p.business_date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short' }),
    total: Number(p.total),
    today: i === trend.length - 1,
  }))

  // Cash reconciliation from the day sheet's counted denominations vs expected cash.
  const counted = (sheet?.denomination_totals ?? []).reduce(
    (sum, d) => sum + d.note_value * d.note_count,
    0,
  )
  const variance = counted - grossCash
  const reconciled = variance === 0

  const totals = {
    cylinders: rows.reduce((a, r) => a + r.cylinders, 0),
    cash: rows.reduce((a, r) => a + Number(r.cash), 0),
    upi: rows.reduce((a, r) => a + Number(r.upi), 0),
    total: rows.reduce((a, r) => a + Number(r.total), 0),
  }

  const exportXlsx = async () => {
    const base = import.meta.env.VITE_API_BASE_URL ?? ''
    const token = useAuthStore.getState().accessToken
    const res = await fetch(`${base}/v1/day-sheet/${date}/export.xlsx`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) return
    const url = URL.createObjectURL(await res.blob())
    const a = document.createElement('a')
    a.href = url
    a.download = `day-sheet-${date}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppShell
      title="Dashboard"
      subtitle={`${prettyDate} · End-of-day overview`}
      topbarActions={
        <>
          <StatusPill variant={sheet?.is_closed ? 'ok' : 'open'} dot>
            {sheet?.is_closed ? 'Day closed' : 'Day open'}
          </StatusPill>
          <Button variant="ghost" onClick={exportXlsx}>
            <Download size={16} />
            Export
          </Button>
          <Button variant="primary" onClick={() => navigate('/day-sheet')}>
            <ArrowRight size={16} />
            {sheet?.is_closed ? 'View day' : 'Close day'}
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
            value={eod?.cylinders_sold ?? 0}
            sub={<span>today</span>}
          />
          <KpiCard
            icon={<CreditCard size={17} />}
            label="Gross collection"
            value={grossCash + upi}
            prefix="₹"
            sub={<span>cash + UPI</span>}
          />
          <KpiCard
            icon={<Banknote size={17} />}
            label="Cash in hand"
            value={grossCash}
            prefix="₹"
            sub={
              <StatusPill variant="ok" size="sm">
                Cash sales
              </StatusPill>
            }
          />
          <KpiCard
            icon={<Smartphone size={17} />}
            label="UPI / digital"
            value={upi}
            prefix="₹"
            sub={<span>digital collection</span>}
          />
          <KpiCard
            icon={<TrendingUp size={17} />}
            label="Net profit (today)"
            value={netProfit ?? 0}
            prefix="₹"
            owner
            canViewValue={role === 'super_admin'}
            sub={
              <span>
                after&nbsp;<Money value={Number(eod?.expenses_total ?? 0)} />&nbsp;expenses
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
                <CollectionsChart points={chartPoints} />
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
                {movement.length === 0 ? (
                  <p className="text-[13px] text-muted py-3">No stock movement recorded today.</p>
                ) : (
                  movement.map((g) => {
                    const denom = g.loaded > 0 ? g.loaded : g.sold + g.left
                    const value = denom > 0 ? Math.round((g.sold / denom) * 100) : 0
                    return (
                      <Gauge
                        key={g.code}
                        name={g.label}
                        value={value}
                        figure={
                          <span>
                            <b className="text-ink font-display font-bold">{g.sold}</b> sold ·{' '}
                            {g.left} left
                          </span>
                        }
                      />
                    )
                  })
                )}
              </div>
            </Card>
          </Reveal>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-5 min-w-0">
          <Reveal delay={0.1}>
            <ReconcilePanel
              status={reconciled ? 'ok' : 'warn'}
              title={reconciled ? 'Cash tallied' : 'Cash mismatch'}
              subtitle={
                reconciled
                  ? 'Counted matches expected to the rupee'
                  : 'Counted cash differs from expected'
              }
              rows={[
                { label: 'Expected (cash sales)', value: <Money value={grossCash} /> },
                { label: 'Counted (denominations)', value: <Money value={counted} /> },
                {
                  label: 'Variance',
                  value: <Money value={variance} />,
                  good: reconciled,
                },
                {
                  label: 'Cashier closing',
                  value: <Money value={Number(sheet?.cashier_closing ?? 0)} />,
                  good: true,
                },
              ]}
            />
          </Reveal>

          <Reveal delay={0.14}>
            <Card>
              <CardHeader
                title="Delivery staff · today"
                hint={`${rows.length} active`}
              />
              <div className="px-2 pb-2.5 pt-1">
                {rows.length === 0 ? (
                  <p className="text-[13px] text-muted px-2.5 py-3">
                    No sales entered for today yet.
                  </p>
                ) : (
                  rows.map((d) => (
                    <div
                      key={d.delivery_id}
                      className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-surface transition-colors"
                    >
                      <div
                        className="h-[34px] w-[34px] rounded-full grid place-items-center font-display font-bold text-[13px] text-white shrink-0"
                        style={{ background: colorFor(d.delivery_id) }}
                      >
                        {initialsOf(d.delivery_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <b className="text-[13.5px] text-ink block">{d.delivery_name}</b>
                        <span className="text-[11.5px] text-muted">{d.cylinders} cylinders</span>
                      </div>
                      <Money
                        value={Number(d.total)}
                        className="font-display font-bold text-sm text-ink"
                      />
                    </div>
                  ))
                )}
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
              <Button variant="ghost" onClick={() => navigate('/day-sheet')}>
                View full day sheet
                <ArrowRight size={15} />
              </Button>
            }
          />
          {rows.length === 0 ? (
            <p className="text-[13px] text-muted px-[18px] pb-[18px]">
              No sales entered for today yet.
            </p>
          ) : (
            <DataTable
              columns={columns}
              data={rows}
              getRowKey={(r) => r.delivery_id}
              footer={[
                'Total',
                totals.cylinders,
                <Money key="cash" value={totals.cash} bare />,
                <Money key="upi" value={totals.upi} bare />,
                <Money key="total" value={totals.total} bare />,
              ]}
            />
          )}
        </Card>
      </Reveal>
    </AppShell>
  )
}
