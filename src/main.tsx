import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Fonts (DESIGN_SYSTEM §3): Archivo for display/numbers, Inter for body/UI.
import '@fontsource/archivo/600.css'
import '@fontsource/archivo/700.css'
import '@fontsource/archivo/800.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'

import { App } from './App'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
