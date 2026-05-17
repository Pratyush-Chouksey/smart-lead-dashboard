import { BarChart3, LogOut, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../hooks/useDarkMode'

interface NavbarProps {
  className?: string
}

export default function Navbar({ className = '' }: NavbarProps) {
  const { user, role, logout } = useAuth()
  const { isDark, toggle }     = useDarkMode()

  return (
    <header
      className={`sticky top-0 z-30 backdrop-blur-sm border-b transition-colors duration-200
        bg-white/90 dark:bg-gray-900/90 border-gray-200 dark:border-gray-800/60
        ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow shadow-indigo-500/30">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-gray-900 dark:text-white">
            Smart Leads
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user && (
            <div className="hidden sm:flex items-center gap-2.5">
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-semibold shrink-0">
                {user.name?.[0]?.toUpperCase()}
              </div>
              {/* Name + email */}
              <div className="leading-tight">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
              {/* Role badge */}
              <span
                className="px-2 py-0.5 rounded-md text-xs font-medium capitalize border bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
              >
                {role}
              </span>
            </div>
          )}

          {/* ── Dark / Light toggle ─────────────────────────────────── */}
          <button
            onClick={toggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            {/* Sun (shown in dark mode — clicking switches to light) */}
            <Sun
              className={`w-4 h-4 absolute transition-all duration-300 ${
                isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
              }`}
            />
            {/* Moon (shown in light mode — clicking switches to dark) */}
            <Moon
              className={`w-4 h-4 absolute transition-all duration-300 ${
                !isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
              }`}
            />
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            aria-label="Log out"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
