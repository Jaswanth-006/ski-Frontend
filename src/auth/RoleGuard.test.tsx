import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RoleGuard } from './RoleGuard'
import type { AuthInfo } from './useAuth'
import { useAuthStore } from '@/state/auth'

// Controllable auth stub (the real hook hits the network via /me).
let mockAuth: AuthInfo
vi.mock('./useAuth', () => ({ useAuth: () => mockAuth }))

function renderGuarded(path: string, allow?: string[]) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>login screen</div>} />
        <Route path="/" element={<div>dashboard home</div>} />
        <Route
          path="/secret"
          element={
            <RoleGuard allow={allow}>
              <div>secret content</div>
            </RoleGuard>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

const officeUser = {
  id: '1',
  name: 'Office',
  role: 'office_admin',
  phone: '7000000001',
  is_active: true,
}

describe('RoleGuard', () => {
  beforeEach(() => useAuthStore.getState().clear())

  it('redirects to /login when not authenticated', () => {
    mockAuth = { user: null, role: null, isAuthenticated: false, isLoading: false, logout: vi.fn() }
    renderGuarded('/secret')
    expect(screen.getByText('login screen')).toBeInTheDocument()
  })

  it('redirects away when the role is not allowed', () => {
    useAuthStore.setState({ accessToken: 't', refreshToken: 'r' })
    mockAuth = {
      user: officeUser,
      role: 'office_admin',
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    }
    renderGuarded('/secret', ['super_admin'])
    expect(screen.getByText('dashboard home')).toBeInTheDocument()
    expect(screen.queryByText('secret content')).not.toBeInTheDocument()
  })

  it('renders children when the role is allowed', () => {
    useAuthStore.setState({ accessToken: 't', refreshToken: 'r' })
    mockAuth = {
      user: { ...officeUser, role: 'super_admin' },
      role: 'super_admin',
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    }
    renderGuarded('/secret', ['super_admin'])
    expect(screen.getByText('secret content')).toBeInTheDocument()
  })
})
