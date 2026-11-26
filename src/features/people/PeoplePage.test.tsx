import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { PeoplePage } from './PeoplePage'

vi.mock('@/components/app/AppShell', () => ({
  AppShell: ({ title, children, topbarActions }: { title: string; children: ReactNode; topbarActions?: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {topbarActions}
      {children}
    </div>
  ),
}))
vi.mock('@/auth/useAuth', () => ({ useAuth: () => ({ role: 'office_admin' }) }))

const person = (over: Record<string, unknown>) => ({
  id: 'p',
  name: 'X',
  kind: 'debtor',
  phone: null,
  note: null,
  is_active: true,
  opening_balance: '0',
  given: '0',
  received: '0',
  balance: '0',
  created_at: '2026-11-26T04:00:00Z',
  ...over,
})

const people = [
  person({ id: 'd1', name: 'Ravi', opening_balance: '2000', given: '1000', received: '500', balance: '2500' }),
  person({ id: 'c1', name: 'Suresh', kind: 'creditor', opening_balance: '5000', balance: '5000' }),
]

describe('PeoplePage', () => {
  let posted: unknown[]

  beforeEach(() => {
    posted = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (init?.method === 'POST') {
          posted.push(JSON.parse(String(init.body)))
          return new Response(JSON.stringify(people[0]), { status: 201 })
        }
        if (url.includes('/v1/people')) return new Response(JSON.stringify(people), { status: 200 })
        return new Response('[]', { status: 200 })
      }),
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('lists debtors with their balance and adds one with an opening balance', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <PeoplePage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Ravi')).toBeInTheDocument()
    expect(screen.queryByText('Suresh')).not.toBeInTheDocument() // creditor tab only
    expect(screen.getByText('Debtors owe us')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /add debtor/i }))
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'Kumar' } })
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '750' } })
    fireEvent.click(screen.getAllByRole('button', { name: /add debtor/i }).at(-1)!)

    await waitFor(() => expect(posted).toHaveLength(1))
    expect(posted[0]).toMatchObject({ name: 'Kumar', kind: 'debtor', opening_balance: 750 })
  })

  it('shows creditors on their tab', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/people?kind=creditor']}>
          <PeoplePage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(await screen.findByText('Suresh')).toBeInTheDocument()
    expect(screen.getByText('We owe creditors')).toBeInTheDocument()
  })
})
