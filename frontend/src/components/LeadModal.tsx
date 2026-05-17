import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { createLead, updateLead } from '../api/leads'
import type { Lead, LeadStatus, LeadSource } from '../types'

// ─── Schema ───────────────────────────────────────────────────────────────────

const leadSchema = z.object({
  name:   z.string().min(1, 'Name is required').max(150),
  email:  z.string().min(1, 'Email is required').email('Enter a valid email'),
  source: z.enum(['Website', 'Instagram', 'Referral'], { required_error: 'Source is required' }),
  status: z.enum(['New', 'Contacted', 'Qualified', 'Lost']).optional(),
})

type LeadFormData = z.infer<typeof leadSchema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface LeadModalProps {
  isOpen:    boolean
  onClose:   () => void
  editLead?: Lead | null
}

// ─── Field component ──────────────────────────────────────────────────────────

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

// ─── Shared input / select classes ────────────────────────────────────────────

const inputCls = (hasError?: boolean): string =>
  `w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border text-gray-900 dark:text-white text-sm outline-none transition-all
  placeholder-gray-400 dark:placeholder-gray-500
  focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500
  ${hasError ? 'border-red-500/70' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}`

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeadModal({ isOpen, onClose, editLead }: LeadModalProps) {
  const queryClient = useQueryClient()
  const isEditing   = !!editLead

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>({ resolver: zodResolver(leadSchema) })

  // Pre-fill form when editing
  useEffect(() => {
    if (editLead) {
      reset({
        name:   editLead.name,
        email:  editLead.email,
        source: editLead.source as LeadSource,
        status: editLead.status as LeadStatus,
      })
    } else {
      reset({ name: '', email: '', source: undefined, status: undefined })
    }
  }, [editLead, reset, isOpen])

  // ── Mutations ───────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (data: LeadFormData) =>
      isEditing ? updateLead(editLead!._id, data) : createLead(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] })
      onClose()
    },
  })

  const onSubmit = (data: LeadFormData): void => { mutation.mutate(data) }

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/50 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700/50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Lead' : 'Add New Lead'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              {isEditing ? 'Update lead information below.' : 'Fill in the details to create a new lead.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="px-6 py-5 space-y-4">
          {/* Server error */}
          {mutation.isError && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {mutation.error instanceof Error ? mutation.error.message : 'Something went wrong'}
            </div>
          )}

          <Field label="Full name" id="lead-name" error={errors.name?.message}>
            <input
              id="lead-name"
              type="text"
              placeholder="Jane Smith"
              {...register('name')}
              className={inputCls(!!errors.name)}
            />
          </Field>

          <Field label="Email address" id="lead-email" error={errors.email?.message}>
            <input
              id="lead-email"
              type="email"
              placeholder="jane@company.com"
              {...register('email')}
              className={inputCls(!!errors.email)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Source" id="lead-source" error={errors.source?.message}>
              <select
                id="lead-source"
                {...register('source')}
                defaultValue=""
                className={`${inputCls(!!errors.source)} appearance-none cursor-pointer`}
              >
                <option value="" disabled>Select…</option>
                {(['Website', 'Instagram', 'Referral'] as LeadSource[]).map((s) => (
                  <option key={s} value={s} className="bg-white dark:bg-gray-800">{s}</option>
                ))}
              </select>
            </Field>

            <Field label="Status" id="lead-status" error={errors.status?.message}>
              <select
                id="lead-status"
                {...register('status')}
                defaultValue=""
                className={`${inputCls(!!errors.status)} appearance-none cursor-pointer`}
              >
                <option value="" className="bg-white dark:bg-gray-800">Default (New)</option>
                {(['New', 'Contacted', 'Qualified', 'Lost'] as LeadStatus[]).map((s) => (
                  <option key={s} value={s} className="bg-white dark:bg-gray-800">{s}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-500 text-sm font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500
                text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20
                disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{isEditing ? 'Saving…' : 'Creating…'}</>
              ) : (
                isEditing ? 'Save changes' : 'Create lead'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
