import { useState, type ElementType, type ReactNode } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Pencil, Mail, Globe, User,
  Calendar, Clock, Tag, AlertTriangle, BarChart3,
} from 'lucide-react'
import { getLeadById } from '../api/leads'
import LeadModal from '../components/LeadModal'
import type { Lead, LeadStatus } from '../types'

// ─── Status styles ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<LeadStatus, { badge: string; glow: string }> = {
  New:       { badge: 'bg-sky-500/15 text-sky-500 dark:text-sky-400 ring-1 ring-sky-500/30',       glow: 'bg-sky-500/10' },
  Contacted: { badge: 'bg-amber-500/15 text-amber-500 dark:text-amber-400 ring-1 ring-amber-500/30', glow: 'bg-amber-500/10' },
  Qualified: { badge: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 ring-1 ring-emerald-500/30', glow: 'bg-emerald-500/10' },
  Lost:      { badge: 'bg-red-500/15 text-red-500 dark:text-red-400 ring-1 ring-red-500/30',       glow: 'bg-red-500/10' },
}

// ─── Detail field ─────────────────────────────────────────────────────────────

function DetailField({
  icon: Icon, label, children,
}: {
  icon: ElementType; label: string; children: ReactNode
}) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 dark:border-gray-700/60 last:border-0">
      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
        <div className="text-gray-900 dark:text-white text-sm font-medium break-words">{children}</div>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-8 space-y-6 animate-pulse transition-colors duration-200">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-gray-700/60" />
        <div className="space-y-2">
          <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700/60 rounded-full" />
          <div className="h-3.5 w-32 bg-gray-100 dark:bg-gray-700/40 rounded-full" />
        </div>
      </div>
      {/* Fields */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-700/40 pb-4">
          <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700/60" />
          <div className="space-y-1.5">
            <div className="h-2.5 w-16 bg-gray-100 dark:bg-gray-700/40 rounded-full" />
            <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700/60 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-500/20 rounded-2xl p-12 flex flex-col items-center gap-4 text-center transition-colors duration-200">
      <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
      </div>
      <div>
        <p className="text-gray-900 dark:text-white font-semibold text-lg">Failed to load lead</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{message}</p>
      </div>
      <Link
        to="/dashboard"
        className="mt-2 px-5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600
          text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-all"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  })
}

function getCreatedByName(lead: Lead): string {
  if (typeof lead.createdBy === 'object' && lead.createdBy !== null) {
    return (lead.createdBy as { name: string }).name
  }
  return String(lead.createdBy)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeadDetail() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)

  const { data: lead, isLoading, isError, error } = useQuery({
    queryKey: ['lead', id],
    queryFn:  () => getLeadById(id!),
    enabled:  !!id,
  })

  const statusStyle = lead ? STATUS_STYLES[lead.status] : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800/60 transition-colors duration-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow shadow-indigo-500/30">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="text-gray-900 dark:text-white font-semibold text-sm">Smart Leads</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* ── Back + actions bar ──────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium
              px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all -ml-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {!isLoading && !isError && lead && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600
                hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold
                shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Pencil className="w-4 h-4" />
              Edit Lead
            </button>
          )}
        </div>

        {/* ── Content ─────────────────────────────────────────────────── */}
        {isLoading && <SkeletonCard />}

        {isError && (
          <ErrorCard
            message={error instanceof Error ? error.message : 'An unexpected error occurred.'}
          />
        )}

        {!isLoading && !isError && lead && (
          <>
            {/* ── Hero card ──────────────────────────────────────────── */}
            <div className={`relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 transition-colors duration-200`}>
              {/* Status colour wash at top */}
              <div className={`absolute inset-x-0 top-0 h-1 ${statusStyle?.glow.replace('/10', '/60')}`} />
              <div className={`absolute inset-x-0 top-0 h-24 opacity-30 ${statusStyle?.glow}`} />

              {/* Header */}
              <div className="relative px-8 pt-8 pb-6 flex flex-col sm:flex-row sm:items-center gap-5">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/30 shrink-0">
                  {lead.name[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{lead.name}</h1>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyle?.badge}`}>
                      {lead.status}
                    </span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{lead.email}</p>
                </div>

                {/* Source pill */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm self-start shrink-0">
                  <Globe className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                  {lead.source}
                </div>
              </div>

              {/* Detail fields */}
              <div className="px-8 pb-6">
                <DetailField icon={Mail} label="Email address">
                  <a href={`mailto:${lead.email}`} className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">
                    {lead.email}
                  </a>
                </DetailField>

                <DetailField icon={Tag} label="Status">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyle?.badge}`}>
                    {lead.status}
                  </span>
                </DetailField>

                <DetailField icon={Globe} label="Lead source">
                  {lead.source}
                </DetailField>

                <DetailField icon={User} label="Created by">
                  {getCreatedByName(lead)}
                </DetailField>

                <DetailField icon={Calendar} label="Created on">
                  {formatDate(lead.createdAt)}
                </DetailField>

                <DetailField icon={Clock} label="Last updated">
                  {formatDate(lead.updatedAt)} at {formatTime(lead.updatedAt)}
                </DetailField>
              </div>
            </div>

            {/* ── Lead ID reference ──────────────────────────────────── */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/40 rounded-xl">
              <span className="text-gray-400 dark:text-gray-500 text-xs">Lead ID</span>
              <code className="text-gray-600 dark:text-gray-300 text-xs font-mono">{lead._id}</code>
            </div>
          </>
        )}
      </main>

      {/* ── Edit modal ──────────────────────────────────────────────────── */}
      <LeadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editLead={lead ?? null}
      />
    </div>
  )
}
