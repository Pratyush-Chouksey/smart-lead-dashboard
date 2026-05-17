import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient'
import { AuthProvider } from './context/AuthContext'
import { DarkModeProvider } from './context/DarkModeContext'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App'
import './index.css'

// ── Apply dark/light class before first paint to prevent FOUC ─────────────────
// Runs synchronously before React renders — DarkModeProvider will then take over.
const storedTheme = localStorage.getItem('sld_theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
if (storedTheme === 'dark' || (storedTheme === null && prefersDark)) {
  document.documentElement.classList.add('dark')
}


// ─── Root render ──────────────────────────────────────────────────────────────

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found in index.html')

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <DarkModeProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </DarkModeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
