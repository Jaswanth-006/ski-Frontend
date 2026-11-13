import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { DeliveryStatementPage } from './DeliveryStatementPage'

vi.mock('@/components/app/AppShell', () => ({
  AppShell: ({ title, children }: { title: string; children: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

const ledger = {
  delivery_id: 'b1',
  delivery_name: 'Bala Subramanyam V',
  start: '2026-09-01',
  end: '2026-09-30',
  opening_balance: '500.00',
  rows: [
    {
      entry_date: '2026-09-02',
      kind: 'sale',
      invoice_no: 'SK000100',
      note: null,
      qty: 10,
      empty_qty: 9,
      amount: '30000.00',
      cash: '8000.00',
      upi: '2000.00',
      online: '0.00',
      repaid: '0',
      balance: '20500.00',
    },
    {
      entry_date: '2026-09-10',
      kind: 'repayment',
      invoice_no: null,
      note: 'paid at office',
      qty: 0,
      empty_qty: 0,
      amount: '0',
      cash: '0',
      upi: '0',
      online: '0',
      repaid: '5000.00',
      balance: '15500.00',
    },
  ],
  total_qty: 10,
  total_empty_qty: 9,
  total_amount: '30000.00',
  total_cash: '8000.00',
  total_upi: '2000.00',
  total_online: '0.00',
  total_repaid: '5000.00',
  closing_balance: '15500.00',
}

describe('DeliveryStatementPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        expect(url).toContain('/v1/reports/delivery/b1?start=2026-09-01&end=2026-09-30')
        return new Response(JSON.stringify(ledger), { status: 200 })
      }),
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('lists sales and repayments with the running balance and totals', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/reports/delivery/b1?start=2026-09-01&end=2026-09-30']}>
          <Routes>
            <Route path="/reports/delivery/:deliveryId" element={<DeliveryStatementPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'Bala Subramanyam V' })).toBeInTheDocument()
    const rows = screen.getAllByRole('row')
    // header, brought forward, sale, repayment, totals
    expect(rows).toHaveLength(5)
    expect(within(rows[1]).getByText('Balance brought forward')).toBeInTheDocument()
    expect(within(rows[2]).getByText('02.09.2026')).toBeInTheDocument()
    expect(within(rows[2]).getByText('SK000100')).toBeInTheDocument()
    expect(within(rows[2]).getByText('30,000')).toBeInTheDocument()
    expect(within(rows[2]).getByText('20,500')).toBeInTheDocument()
    expect(within(rows[3]).getByText('Repaid')).toBeInTheDocument()
    expect(within(rows[3]).getByText('paid at office')).toBeInTheDocument()
    expect(within(rows[4]).getByText('Total')).toBeInTheDocument()
    expect(within(rows[4]).getByText('15,500')).toBeInTheDocument()
  })
})
