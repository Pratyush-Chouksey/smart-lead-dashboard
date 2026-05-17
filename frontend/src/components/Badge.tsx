import type { LeadStatus } from '../types'

// ─── Config ───────────────────────────────────────────────────────────────────

const STYLES: Record<LeadStatus, string> = {
  New:       'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30',
  Contacted: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  Qualified: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  Lost:      'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
}

const DOTS: Record<LeadStatus, string> = {
  New:       'bg-sky-400',
  Contacted: 'bg-amber-400',
  Qualified: 'bg-emerald-400',
  Lost:      'bg-red-400',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  status: LeadStatus
  /** Show a pulsing dot indicator alongside the label */
  withDot?: boolean
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Badge({ status, withDot = false, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${STYLES[status]} ${className}`}
    >
      {withDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${DOTS[status]}`} />
      )}
      {status}
    </span>
  )
}
