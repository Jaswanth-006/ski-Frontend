import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { DepositLedgerPage } from './DepositLedgerPage'

vi.mock('@/components/app/AppShell', () => ({
  AppShell: ({ title, children }: { title: string; children: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

const ledger = {
  kind: 'bank_account',
  ref_id: 'a1',
  name: 'SBI · Current',
  start: '2026-11-01',
  end: '2026-11-27',
  opening: '5000',
  total_in: '2000',
  total_out: '500',
  closing: '6500',
  rows: [
    {
      id: 't1',
      business_date: '2026-11-10',
      from_label: 'Cashier box',
      to_label: 'SBI · Current',
      direction: 'in',
      amount: '2000',
      method: 'cash',
      note: null,
      balance: '7000',
      created_at: '2026-11-10T06:00:00Z',
    },
    {
      id: 't2',
      business_date: '2026-11-12',
      from_label: 'SBI · Current',
      to_label: 'Indian Oil Corporation Ltd',
      direction: 'out',
      amount: '500',
      method: 'transfer',
      note: 'ac4 invoice 901',
      balance: '6500',
      created_at: '2026-11-12T06:00:00Z',
    },
  ],
}

describe('DepositLedgerPage', () => {
  let requested = ''
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        requested = url
        return new Response(JSON.stringify(ledger), { status: 200 })
      }),
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it("shows a bank account's deposits: from → to, in / out and the running balance", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/reports/deposits/bank_account/a1?start=2026-11-01&end=2026-11-27']}>
          <Routes>
            <Route path="/reports/deposits/:kind/:ref" element={<DepositLedgerPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(await screen.findByText('SBI · Current · statement')).toBeInTheDocument()
    expect(requested).toContain('/v1/reports/deposits/bank_account/a1')
    expect(screen.getByText('Opening balance')).toBeInTheDocument()
    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('Cashier box')).toBeInTheDocument()
    expect(within(rows[1]).getByText('7,000')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Indian Oil Corporation Ltd')).toBeInTheDocument()
    expect(within(rows[2]).getByText('ac4 invoice 901')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Transfer')).toBeInTheDocument()
  })
})
