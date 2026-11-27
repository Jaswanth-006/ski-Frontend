import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { SalesEntryPage } from './SalesEntryPage'

vi.mock('@/components/app/AppShell', () => ({
  AppShell: ({ title, children }: { title: string; children: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

const prices = [
  { cylinder_type_id: 't14', code: '14.2kg', label: '14.2 kg Domestic', unit_price: '969', effective_date: '2026-11-01' },
]

const accounts = [
  { id: 'a1', bank_id: 'b1', bank_name: 'SBI', account_type: 'Current', label: null, is_active: true, opening_balance: '0', balance: '0' },
]
const vendors = [
  { id: 'v0', name: 'Pipe supplier', is_active: true, opening_balance: '0', paid: '0', total_paid: '0' },
  { id: 'v1', name: 'IOC', is_active: true, opening_balance: '0', paid: '0', total_paid: '0' },
]

describe('SalesEntryPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/v1/prices')) return new Response(JSON.stringify(prices), { status: 200 })
        if (url.includes('/v1/bank-accounts')) return new Response(JSON.stringify(accounts), { status: 200 })
        if (url.includes('/v1/vendors')) return new Response(JSON.stringify(vendors), { status: 200 })
        return new Response('[]', { status: 200 })
      }),
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('sold is the quantity less the cylinders billed online', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <SalesEntryPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    await screen.findByRole('option', { name: /14.2 kg Domestic/ })
    const picker = screen.getAllByRole('combobox').find((c) =>
      Array.from((c as HTMLSelectElement).options).some((o) => o.value === 't14'),
    )!
    fireEvent.change(picker, { target: { value: 't14' } })
    // The picker row: cylinder, quantity, Add.
    const row = within(picker.parentElement!.parentElement!)
    fireEvent.change(row.getByPlaceholderText('0'), { target: { value: '10' } })
    fireEvent.click(row.getByRole('button', { name: /add/i }))

    const sold = await screen.findByLabelText('14.2 kg Domestic sold')
    expect(sold).toHaveTextContent('10')
    fireEvent.change(screen.getByLabelText('14.2 kg Domestic online'), { target: { value: '2' } })
    expect(sold).toHaveTextContent('8')
    expect(screen.getByLabelText('14.2 kg Domestic quantity')).toHaveValue(10)

    // Online → paid to the vendor (IOC by default); UPI → into a bank account.
    await screen.findByRole('option', { name: 'IOC' })
    expect(screen.getByLabelText('Online paid to')).toHaveValue('v1')
    fireEvent.change(screen.getByLabelText('UPI amount'), { target: { value: '3000' } })
    expect(screen.getByLabelText('UPI went into')).toHaveValue('a1')
    expect(screen.getByText(/UPI goes to the bank account/)).toBeInTheDocument()
  })
})
