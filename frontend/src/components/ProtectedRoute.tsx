import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { ShieldX, Home } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProtectedRouteProps {
  children:      ReactNode
  requiredRole?: 'admin' | 'sales'
}

// ─── 403 Forbidden page ───────────────────────────────────────────────────────

function ForbiddenPage({ requiredRole }: { requiredRole: string }) {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-400" />
        </div>

        <p className="text-red-400/60 text-sm font-semibold tracking-widest uppercase mb-2">
          Error 403
        </p>

        <h1 className="text-3xl font-bold text-white mb-3">Access Forbidden</h1>

        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          You don&apos;t have permission to view this page.
          This area requires the{' '}
          <span className="text-white font-medium px-1.5 py-0.5 bg-slate-700 rounded-md">
            {requiredRole}
          </span>{' '}
          role.
        </p>

        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-[#1e293b] border border-slate-700 hover:border-slate-600
            text-slate-300 hover:text-white text-sm font-medium
            transition-all duration-200 hover:bg-[#273548]"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </a>
      </div>
    </div>
  )
}

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && role !== requiredRole) {
    return <ForbiddenPage requiredRole={requiredRole} />
  }

  return <>{children}</>
}
