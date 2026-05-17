import type { ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login    from './pages/Login'
import Register from './pages/Register'
import Dashboard    from './pages/Dashboard'
import LeadDetail   from './pages/LeadDetail'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicRouteProps {
  children: ReactNode
}

// ── Public-only wrapper (bounce authenticated users to /dashboard) ─────────────
function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      {/* ── Root redirect ──────────────────────────────────────────────── */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* ── Public pages ───────────────────────────────────────────────── */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* ── Protected pages ────────────────────────────────────────────── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads/:id"
        element={
          <ProtectedRoute>
            <LeadDetail />
          </ProtectedRoute>
        }
      />

      {/* ── Catch-all ──────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
