import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
}

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
        return new Response('[]', { status: 200 })
      }),
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('shows opening + ac4 − sold, and needs the IOC invoice to record', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <PurchasePage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Opening stock table: A 100, B +50, A+B 150, C −30, left 118 with 2 written off.
    const table = await screen.findByRole('table')
    const row = within(table).getAllByRole('row')[1]
    for (const text of ['100', '+50', '150', '−30']) expect(within(row).getByText(text)).toBeInTheDocument()
    expect(within(row).getByText('-2 damaged / other')).toBeInTheDocument()

    // Recorded purchases are listed under their invoice.
    expect(await screen.findByText(/Invoice IOC-111/)).toBeInTheDocument()

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
    fireEvent.click(record)

    await waitFor(() =>
      expect(posted[0]).toMatchObject({
        invoice_no: 'IOC-222',
        cylinders: [{ cylinder_type_id: 't14', qty: 20 }],
      }),
    )
  })
})
