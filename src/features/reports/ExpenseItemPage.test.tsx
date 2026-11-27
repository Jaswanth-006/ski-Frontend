import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ExpenseItemPage } from './ExpenseItemPage'

vi.mock('@/components/app/AppShell', () => ({
  AppShell: ({ title, children }: { title: string; children: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

const ledger = {
  item_id: 'i1',
  item_name: 'Unloading',
  start: '2026-11-01',
  end: '2026-11-27',
  total: '3000',
  count: 2,
  rows: [
    {
      id: 'e2',
      business_date: '2026-11-20',
      amount: '1800',
      method: 'cash',
      note: 'lorry 2',
      delivery_name: 'Ramu',
      invoice_no: null,
      entered_by: 'Office',
      created_at: '2026-11-20T06:00:00Z',
    },
    {
      id: 'e1',
      business_date: '2026-11-05',
      amount: '1200',
      method: 'upi',
      note: null,
      delivery_name: null,
      invoice_no: null,
      entered_by: 'Owner',
      created_at: '2026-11-05T06:00:00Z',
    },
  ],
}

describe('ExpenseItemPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(ledger), { status: 200 })),
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('lists each entry with its day, who and how much', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/reports/expenses/i1?start=2026-11-01&end=2026-11-27']}>
          <Routes>
            <Route path="/reports/expenses/:itemId" element={<ExpenseItemPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(await screen.findByText('Unloading · entries')).toBeInTheDocument()
    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('20.11.2026')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Ramu')).toBeInTheDocument()
    expect(within(rows[1]).getByText('entered by Office')).toBeInTheDocument()
    expect(within(rows[1]).getByText('1,800')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Owner')).toBeInTheDocument()
    expect(within(rows[2]).getByText('UPI')).toBeInTheDocument()
    expect(screen.getByText('2 entries')).toBeInTheDocument()
  })
})
