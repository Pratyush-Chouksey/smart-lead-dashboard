import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, ShieldCheck, Loader2, AlertCircle, BarChart3 } from 'lucide-react'
import { registerUser } from '../api/auth'
import { useAuth } from '../context/AuthContext'

// ─── Schema ───────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  role: z.enum(['admin', 'sales'], { required_error: 'Please select a role' }),
})

type RegisterFormData = z.infer<typeof registerSchema>

// ─── Password strength indicator ─────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase',     pass: /[A-Z]/.test(password) },
    { label: 'Number',        pass: /[0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.pass).length

  const barColor =
    score === 0 ? 'bg-gray-300 dark:bg-gray-700' :
    score === 1 ? 'bg-red-500'   :
    score === 2 ? 'bg-amber-500' :
                  'bg-emerald-500'

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? barColor : 'bg-gray-200 dark:bg-gray-700'}`}
          />
        ))}
      </div>
      <div className="flex gap-3">
        {checks.map(({ label, pass }) => (
          <span key={label} className={`text-xs transition-colors ${pass ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
            {pass ? '✓' : '·'} {label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Register() {
  const navigate  = useNavigate()
  const { login } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const passwordValue = watch('password', '')

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null)
    try {
      const { token, user } = await registerUser(data)
      login(token, user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    }
  }

  const inputCls = (hasError?: boolean) =>
    `w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none transition-all
    focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500
    ${hasError ? 'border-red-500/70' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}`

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-200">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Smart Leads</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-2xl shadow-black/10 dark:shadow-black/40 transition-colors duration-200">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Get started</h2>

          {/* Server error */}
          {serverError && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-5 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Smith"
                  {...register('name')}
                  className={inputCls(!!errors.name)}
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  {...register('email')}
                  className={inputCls(!!errors.email)}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={inputCls(!!errors.password)}
                />
              </div>
              {/* Password strength */}
              {passwordValue && <PasswordStrength password={passwordValue} />}
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{errors.password.message}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Role
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <select
                  id="role"
                  {...register('role')}
                  defaultValue=""
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border text-sm outline-none transition-all appearance-none cursor-pointer
                    focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500
                    ${errors.role
                      ? 'border-red-500/70 text-red-400'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-900 dark:text-white'}`}
                >
                  <option value="" disabled className="text-gray-400 dark:text-gray-500">Select a role…</option>
                  <option value="sales" className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">Sales</option>
                  <option value="admin" className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">Admin</option>
                </select>
                {/* Custom chevron */}
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {errors.role && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{errors.role.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500
                text-white font-semibold text-sm transition-all duration-200
                shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40
                disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none
                flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
              ) : (
                'Create account'
              )}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
