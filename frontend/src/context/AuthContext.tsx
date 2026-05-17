import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import type { User } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user:            User | null
  token:           string | null
  role:            'admin' | 'sales' | null
  isAuthenticated: boolean
  login:           (token: string, user: User) => void
  logout:          () => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEYS = { TOKEN: 'sld_token', USER: 'sld_user' } as const

function readFromStorage(): { token: string | null; user: User | null } {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    const raw   = localStorage.getItem(STORAGE_KEYS.USER)
    const user  = raw ? (JSON.parse(raw) as User) : null
    return { token, user }
  } catch {
    return { token: null, user: null }
  }
}

function writeToStorage(token: string, user: User): void {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token)
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
}

function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEYS.TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER)
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  // ── Rehydrate from localStorage on mount ────────────────────────────────
  const initial = readFromStorage()
  const [token, setToken] = useState<string | null>(initial.token)
  const [user,  setUser]  = useState<User | null>(initial.user)

  // Guard: if one half of the pair is missing, clear both
  useEffect(() => {
    if (!token || !user) {
      clearStorage()
      setToken(null)
      setUser(null)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ───────────────────────────────────────────────────────────────
  const login = useCallback((newToken: string, newUser: User) => {
    writeToStorage(newToken, newUser)
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    clearStorage()
    setToken(null)
    setUser(null)
  }, [])

  // ── Derived values (memoised to prevent unnecessary re-renders) ───────────
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      role:            user?.role ?? null,
      isAuthenticated: !!token && !!user,
      login,
      logout,
    }),
    [user, token, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
