import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import type { ReactNode } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DarkModeContextValue {
  isDark: boolean
  toggle: () => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const DarkModeContext = createContext<DarkModeContextValue | null>(null)

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sld_theme'
const DARK_CLASS  = 'dark'

function getInitialTheme(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null) return stored === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(dark: boolean): void {
  if (dark) {
    document.documentElement.classList.add(DARK_CLASS)
  } else {
    document.documentElement.classList.remove(DARK_CLASS)
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface DarkModeProviderProps {
  children: ReactNode
}

export function DarkModeProvider({ children }: DarkModeProviderProps) {
  // Lazy initialiser: read preference synchronously (no side-effect TS warning)
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme)

  // Keep <html> class and localStorage in sync whenever isDark changes
  useEffect(() => {
    applyTheme(isDark)
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light')
  }, [isDark])

  // Mirror OS preference changes only when no explicit preference is stored
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent): void => {
      if (localStorage.getItem(STORAGE_KEY) === null) {
        setIsDark(e.matches)
      }
    }
    mq.addEventListener('change', handler)
    return (): void => { mq.removeEventListener('change', handler) }
  }, [])

  const toggle = useCallback((): void => {
    setIsDark((prev) => !prev)
  }, [])

  const value = useMemo<DarkModeContextValue>(
    () => ({ isDark, toggle }),
    [isDark, toggle]
  )

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDarkMode(): DarkModeContextValue {
  const ctx = useContext(DarkModeContext)
  if (!ctx) throw new Error('useDarkMode must be used within <DarkModeProvider>')
  return ctx
}
