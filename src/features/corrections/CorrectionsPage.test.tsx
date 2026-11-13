import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CorrectionsPage } from './CorrectionsPage'

vi.mock('@/components/app/AppShell', () => ({
  AppShell: ({ title, children }: { title: string; children: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

const expense = (id: string, amount: string, note: string | null) => ({
  id,
  business_date: '2026-11-13',
  item_id: 'fuel',
  item_name: 'Fuel',
  amount,
  method: 'cash',
  note,
  delivery_id: null,
  delivery_name: null,
  created_at: '2026-11-13T10:00:00Z',
})

describe('CorrectionsPage · expenses', () => {
  let calls: { url: string; method: string; body: unknown }[]
  let editStatus: number

  beforeEach(() => {
    calls = []
    editStatus = 204
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const method = init?.method ?? 'GET'
        calls.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : null })
        if (method === 'PUT') {
          return editStatus === 204
            ? new Response(null, { status: 204 })
            : new Response(JSON.stringify({ detail: '2026-11-13 is closed — only the owner can change it' }), {
                status: editStatus,
              })
        }
        if (url.includes('/v1/expense-items')) {
          return new Response(JSON.stringify([{ id: 'fuel', name: 'Fuel', is_active: true }]), { status: 200 })
        }
        if (url.includes('/v1/expenses')) {
          return new Response(
            JSON.stringify([expense('e1', '300', null), expense('e2', '1000', 'route · invoice 1045')]),
            { status: 200 },
          )
        }
        return new Response('[]', { status: 200 })
      }),
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  const renderPage = () =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/corrections?tab=expenses&date=2026-11-13']}>
          <Routes>
            <Route path="/corrections" element={<CorrectionsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

  it('edits an expense with a reason; a sale route expense points to its invoice', async () => {
    renderPage()
    expect(await screen.findByText('Part of invoice 1045 — edit the invoice')).toBeInTheDocument()
    // Only the standalone expense can be edited here.
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit expense' })
    const save = within(dialog).getByRole('button', { name: 'Save change' })
    expect(save).toBeDisabled() // reason required

    fireEvent.change(within(dialog).getByDisplayValue('300'), { target: { value: '250' } })
    fireEvent.change(within(dialog).getByPlaceholderText(/wrong amount/i), { target: { value: 'typo' } })
    fireEvent.click(save)

    await waitFor(() => {
      const put = calls.find((c) => c.method === 'PUT')
      expect(put?.url).toContain('/v1/expenses/e1')
      expect(put?.body).toMatchObject({ reason: 'typo', amount: 250, item_id: 'fuel', method: 'cash' })
    })
  })

  it("shows the server's reason when a change is refused", async () => {
    editStatus = 409
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit expense' })
    fireEvent.change(within(dialog).getByPlaceholderText(/wrong amount/i), { target: { value: 'late fix' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save change' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('only the owner can change it')
  })
})
