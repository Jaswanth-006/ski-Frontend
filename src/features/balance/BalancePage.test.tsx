import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { BalancePage } from './BalancePage'

vi.mock('@/components/app/AppShell', () => ({
  AppShell: ({ title, children }: { title: string; children: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

const summary = [{ delivery_id: 'd1', delivery_name: 'Ramu', charged: '1000', repaid: '0', balance: '1000' }]
const accounts = [
  { id: 'a1', bank_id: 'b1', bank_name: 'SBI', account_type: 'Current', label: null, is_active: true, opening_balance: '0', balance: '0' },
]

describe('BalancePage', () => {
  let posted: unknown[]
  beforeEach(() => {
    posted = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (init?.method === 'POST') {
          posted.push(JSON.parse(String(init.body)))
          return new Response(JSON.stringify({}), { status: 201 })
        }
        if (url.includes('/v1/delivery-balances/summary')) return new Response(JSON.stringify(summary), { status: 200 })
        if (url.includes('/v1/bank-accounts')) return new Response(JSON.stringify(accounts), { status: 200 })
        return new Response('[]', { status: 200 })
      }),
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('sends a UPI repayment on to the chosen bank account', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <BalancePage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    await screen.findByRole('option', { name: 'Ramu' })
    const picker = screen
      .getAllByRole('combobox')
      .find((c) => Array.from((c as HTMLSelectElement).options).some((o) => o.value === 'd1'))!
    fireEvent.change(picker, { target: { value: 'd1' } })

    const paidBy = await screen.findByDisplayValue('Cash')
    fireEvent.change(paidBy, { target: { value: 'upi' } })
    await screen.findByRole('option', { name: 'SBI · Current' })
    expect(screen.getByLabelText('UPI went into')).toHaveValue('a1')

    fireEvent.change(screen.getByLabelText('Money given back'), { target: { value: '400' } })
    fireEvent.click(screen.getByRole('button', { name: /record repayment/i }))
    await waitFor(() => expect(posted).toHaveLength(1))
    expect(posted[0]).toMatchObject({ delivery_id: 'd1', amount: 400, method: 'upi', upi_account_id: 'a1' })
  })
})
