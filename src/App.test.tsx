import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  it('renders the dashboard shell', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument()
  })

  it('shows the signature reconciliation panel', () => {
    render(<App />)
    expect(screen.getByText('Cash tallied')).toBeInTheDocument()
  })
})
