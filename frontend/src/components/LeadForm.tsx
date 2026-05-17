import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertCircle } from 'lucide-react'
import type { LeadStatus, LeadSource } from '../types'

// ─── Schema ───────────────────────────────────────────────────────────────────

export const leadFormSchema = z.object({
  name:   z.string().min(1, 'Name is required').max(150, 'Max 150 characters'),
  email:  z.string().min(1, 'Email is required').email('Enter a valid email'),
  source: z.enum(['Website', 'Instagram', 'Referral'], { required_error: 'Source is required' }),
  status: z.enum(['New', 'Contacted', 'Qualified', 'Lost']).optional(),
})

export type LeadFormValues = z.infer<typeof leadFormSchema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface LeadFormProps {
  defaultValues?: Partial<LeadFormValues>
  onSubmit:       (data: LeadFormValues) => void | Promise<void>
  isLoading?:     boolean
  serverError?:   string | null
  submitLabel?:   string
  onCancel?:      () => void
}

// ─── Shared input class builder ───────────────────────────────────────────────

const inputCls = (hasError?: boolean): string =>
  `w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border text-gray-900 dark:text-white text-sm outline-none transition-all
  placeholder-gray-400 dark:placeholder-gray-500
  focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500
  ${hasError ? 'border-red-500/70' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}`

// ─── Field wrapper ────────────────────────────────────────────────────────────

interface FieldProps {
  label:    string
  id:       string
  error?:   string
  children: ReactNode
}

function Field({ label, id, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />{error}
        </p>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeadForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  serverError,
  submitLabel = 'Save',
  onCancel,
}: LeadFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues,
  })

  // Sync new defaultValues (e.g. when switching edit targets)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reset(defaultValues) }, [JSON.stringify(defaultValues)])

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Server error */}
      {serverError && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {serverError}
        </div>
      )}

      {/* Name */}
      <Field label="Full name" id="lf-name" error={errors.name?.message}>
        <input
          id="lf-name"
          type="text"
          placeholder="Jane Smith"
          {...register('name')}
          className={inputCls(!!errors.name)}
        />
      </Field>

      {/* Email */}
      <Field label="Email address" id="lf-email" error={errors.email?.message}>
        <input
          id="lf-email"
          type="email"
          placeholder="jane@company.com"
          {...register('email')}
          className={inputCls(!!errors.email)}
        />
      </Field>

      {/* Source + Status */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Source" id="lf-source" error={errors.source?.message}>
          <select
            id="lf-source"
            {...register('source')}
            className={`${inputCls(!!errors.source)} appearance-none cursor-pointer`}
          >
            <option value="">Select…</option>
            {(['Website', 'Instagram', 'Referral'] as LeadSource[]).map((s) => (
              <option key={s} value={s} className="bg-white dark:bg-gray-800">{s}</option>
            ))}
          </select>
        </Field>

        <Field label="Status" id="lf-status" error={errors.status?.message}>
          <select
            id="lf-status"
            {...register('status')}
            className={`${inputCls(!!errors.status)} appearance-none cursor-pointer`}
          >
            <option value="" className="bg-white dark:bg-gray-800">Default (New)</option>
            {(['New', 'Contacted', 'Qualified', 'Lost'] as LeadStatus[]).map((s) => (
              <option key={s} value={s} className="bg-white dark:bg-gray-800">{s}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Actions */}
      <div className={`flex gap-3 pt-2 ${onCancel ? '' : 'justify-end'}`}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white
              hover:border-gray-300 dark:hover:border-gray-500 text-sm font-medium transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className={`${onCancel ? 'flex-1' : 'px-6'} py-2.5 rounded-xl
            bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500
            text-white text-sm font-semibold transition-all
            shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30
            disabled:opacity-60 disabled:cursor-not-allowed
            flex items-center justify-center gap-2`}
        >
          {isLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
            : submitLabel}
        </button>
      </div>
    </form>
  )
}
