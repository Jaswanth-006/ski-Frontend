import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { ReportsPage } from './ReportsPage'

vi.mock('@/components/app/AppShell', () => ({
  AppShell: ({ title, children }: { title: string; children: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

const base = { cylinder_type_id: 't14', code: '14.2kg', label: '14.2 kg Domestic', other: 0 }
const stock = [
  { ...base, condition: 'full', opening: 276, received: 450, issue: 300, closing: 426 },
  { ...base, condition: 'empty', opening: 476, received: 300, issue: 100, closing: 676 },
]

describe('ReportsPage stock', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('/v1/reports/stock')
          ? new Response(JSON.stringify(stock), { status: 200 })
          : new Response('[]', { status: 200 }),
      ),
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('shows a full and an empty row per cylinder: A + B − C = closing', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(await screen.findByText('Closing (A+B−C)')).toBeInTheDocument()
    const [, fullRow, emptyRow] = screen.getAllByRole('row')
    expect(within(fullRow).getByText('Full')).toBeInTheDocument()
    expect(within(fullRow).getByText('276')).toBeInTheDocument()
    expect(within(fullRow).getByText('ac4')).toBeInTheDocument()
    expect(within(fullRow).getByText('426')).toBeInTheDocument()
    expect(within(emptyRow).getByText('Empty')).toBeInTheDocument()
    expect(within(emptyRow).getByText('erv')).toBeInTheDocument()
    expect(within(emptyRow).getByText('676')).toBeInTheDocument()
    expect(screen.queryByText('Damaged / other')).not.toBeInTheDocument()
  })
})
