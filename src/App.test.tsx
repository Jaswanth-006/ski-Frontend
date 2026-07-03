import { render, screen } from '@testing-library/react'
import { App } from './App'
import { useAuthStore } from '@/state/auth'

describe('App', () => {
  beforeEach(() => useAuthStore.getState().clear())

  it('shows the login screen when not authenticated', async () => {
    render(<App />)
    expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
  })
})
