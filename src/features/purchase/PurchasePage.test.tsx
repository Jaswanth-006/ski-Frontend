import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { PurchasePage } from './PurchasePage'

vi.mock('@/components/app/AppShell', () => ({
  AppShell: ({ title, children }: { title: string; children: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

const overview = {
  business_date: '2026-11-26',
  cylinders: [
    {
      cylinder_type_id: 't14',
      code: '14.2',
      label: '14.2 kg Domestic',
      full_opening: 100,
      full_received: 50,
      full_sold: 30,
      full_closing: 118, // 2 written off as damaged
      empty_opening: 0,
      empty_closing: 30,
      empty_returned_by_customers: 30,
      empty_sent_to_plant: 0,
    },
  ],
  accessories: [],
}

const ac4Entry = {
  entry_id: 'e1',
  kind: 'ac4',
  business_date: '2026-11-26',
  invoice_no: 'IOC-111',
  lines: [{ cylinder_type_id: 't14', qty: 50, label: '14.2 kg Domestic', condition: 'full' }],
  created_at: '2026-11-26T04:00:00Z',
  created_by_name: 'Office',
  payment_amount: '8500',
  payment_label: 'Cashier box → IOC',
}

const vendors = [
  { id: 'v0', name: 'Pipe supplier', is_active: true, opening_balance: '0', paid: '0', total_paid: '0' },
  { id: 'v1', name: 'IOC', is_active: true, opening_balance: '0', paid: '0', total_paid: '0' },
]

describe('PurchasePage', () => {
  let posted: unknown[]

  beforeEach(() => {
    posted = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (init?.method === 'POST') {
          posted.push(JSON.parse(String(init.body)))
          return new Response(JSON.stringify(overview), { status: 201 })
        }
        if (url.includes('/v1/stock/overview')) return new Response(JSON.stringify(overview), { status: 200 })
        if (url.includes('/v1/stock/entries')) return new Response(JSON.stringify([ac4Entry]), { status: 200 })
        if (url.includes('/v1/vendors')) return new Response(JSON.stringify(vendors), { status: 200 })
        return new Response('[]', { status: 200 })
      }),
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('shows opening stock in the dropdown, needs the invoice, and records the payment', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <PurchasePage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // The ac4 dropdown shows each product's opening stock (A).
    expect(
      await screen.findByRole('option', { name: '14.2 kg Domestic — opening stock 100 · received today 50' }),
    ).toBeInTheDocument()

    // Recorded purchases are listed under their invoice, with what was paid.
    expect(await screen.findByText(/Invoice IOC-111/)).toBeInTheDocument()
    expect(screen.getByText(/Paid ₹8,500 · Cashier box → IOC/)).toBeInTheDocument()

    // Add a line; Record stays off until the invoice is typed.
    const [product] = screen.getAllByRole('combobox')
    fireEvent.change(product, { target: { value: 'full:t14' } })
    fireEvent.change(screen.getAllByPlaceholderText('0')[0], { target: { value: '20' } })
    fireEvent.click(screen.getAllByRole('button', { name: /add/i })[0])
    const record = screen.getByRole('button', { name: /record ac4/i })
    expect(record).toBeDisabled()
    expect(screen.getByText('Enter the IOC invoice number first')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('e.g. 9012345678'), { target: { value: ' IOC-222 ' } })
    expect(record).toBeEnabled()

    // Pay IOC (picked by default) from the cashier box.
    await screen.findByRole('option', { name: 'IOC' })
    fireEvent.change(screen.getByLabelText('Amount paid'), { target: { value: '12000' } })
    expect(screen.getByText('Record ac4 will also record ₹12,000 from Cashier box to IOC.')).toBeInTheDocument()
    fireEvent.click(record)

    await waitFor(() =>
      expect(posted[0]).toMatchObject({
        invoice_no: 'IOC-222',
        cylinders: [{ cylinder_type_id: 't14', qty: 20 }],
        payment: { amount: 12000, vendor_id: 'v1', source_kind: 'cashier_box', method: 'cash' },
      }),
    )
  })
})
