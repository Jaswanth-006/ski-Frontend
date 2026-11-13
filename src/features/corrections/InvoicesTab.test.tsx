import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { InvoicesTab } from './InvoicesTab'


const sale = (id: string, invoice: string, status: string, reason: string | null = null) => ({
  id,
  invoice_no: invoice,
  delivery_id: 'b1',
  customer_id: null,
  party_kind: 'delivery',
  party_name: 'Bala Subramanyam V',
  business_date: '2026-11-13',
  status,
  submitted_via: 'web',
  created_at: '2026-11-13T10:00:00Z',
  lines: [
    {
      cylinder_type_id: 't1',
      code: '14.2',
      label: '14.2 kg Domestic',
      qty: 10,
      empty_qty: 9,
      damaged_qty: 1,
      unit_price: '979',
      other_sales_per_unit: '0',
      line_total: '9790',
    },
  ],
  cash_total: '5000',
  upi_total: '4000',
  online_total: '0',
  balance_total: '790',
  revenue_total: '9790',
  settled_total: '9000',
  denominations: [],
  cancelled_at: status === 'cancelled' ? '2026-11-13T11:00:00Z' : null,
  cancel_reason: reason,
})

describe('Edit entries · Invoices tab', () => {
  let calls: { url: string; method: string; body: unknown }[]

  beforeEach(() => {
    calls = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : null })
        if (url.includes('/cancel')) {
          return new Response(JSON.stringify(sale('s1', '1041', 'cancelled', 'entered twice')), { status: 200 })
        }
        return new Response(
          JSON.stringify([sale('s1', '1041', 'approved'), sale('s2', '1039', 'cancelled', 'wrong boy')]),
          { status: 200 },
        )
      }),
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('lists invoices and cancels one with a reason', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <InvoicesTab date="2026-11-13" />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('1041')).toBeInTheDocument()
    expect(screen.getByText('Cancelled · wrong boy')).toBeInTheDocument()
    // Only the active sale has actions.
    expect(screen.getAllByRole('button', { name: /cancel/i })).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    const dialog = await screen.findByRole('dialog', { name: /cancel invoice 1041/i })
    const confirm = within(dialog).getByRole('button', { name: 'Cancel sale' })
    expect(confirm).toBeDisabled() // reason required

    fireEvent.change(within(dialog).getByPlaceholderText(/entered twice/i), {
      target: { value: 'entered twice' },
    })
    fireEvent.click(confirm)

    await waitFor(() => {
      const post = calls.find((c) => c.method === 'POST')
      expect(post?.url).toContain('/v1/sales/s1/cancel')
      expect(post?.body).toEqual({ reason: 'entered twice' })
    })
  })
})
