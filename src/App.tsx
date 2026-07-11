import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { AppRoutes } from '@/app/routes'
import { Providers } from '@/app/providers'

export function App() {
  return (
    <Providers>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <Analytics />
    </Providers>
  )
}
