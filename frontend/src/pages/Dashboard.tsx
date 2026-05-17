import { useState, useCallback, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Plus, Download, ChevronLeft, ChevronRight,
  Pencil, Trash2, LogOut, BarChart3, Users, TrendingUp, AlertCircle, Sun, Moon,
} from 'lucide-react'
import { getLeads, deleteLead, exportLeadsCSV } from '../api/leads'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../hooks/useDarkMode'
import { useDebounce } from '../hooks/useDebounce'
import LeadModal from '../components/LeadModal'
import type { Lead, LeadStatus, LeadSource, FilterParams } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Lost']
const SOURCES:  LeadSource[] = ['Website', 'Instagram', 'Referral']
const PAGE_LIMIT = 10

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<LeadStatus, string> = {
  New:       'bg-sky-500/15 text-sky-500 dark:text-sky-400 ring-1 ring-sky-500/30',
  Contacted: 'bg-amber-500/15 text-amber-500 dark:text-amber-400 ring-1 ring-amber-500/30',
  Qualified: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 ring-1 ring-emerald-500/30',
  Lost:      'bg-red-500/15 text-red-500 dark:text-red-400 ring-1 ring-red-500/30',
}

function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  )
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700/60">
      {[40, 56, 24, 24, 28, 20].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className={`h-3.5 bg-gray-200 dark:bg-gray-700/60 rounded-full w-${w} animate-pulse`} />
        </td>
      ))}
    </tr>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <tr>
      <td colSpan={6} className="py-20 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Users className="w-8 h-8 text-gray-400 dark:text-gray-600" />
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            {hasFilters ? 'No leads match your filters' : 'No leads yet'}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            {hasFilters ? 'Try adjusting your search or filters.' : 'Add your first lead to get started.'}
          </p>
        </div>
      </td>
    </tr>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number | string; icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-5 flex items-center gap-4 transition-colors duration-200">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{label}</p>
        <p className="text-gray-900 dark:text-white text-2xl font-bold leading-tight">{value}</p>
      </div>
    </div>
  )
}

// ─── Select helper ────────────────────────────────────────────────────────────

function FilterSelect({
  value, onChange, children,
}: {
  value: string
  onChange: (v: string) => void
  children: ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 px-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600
        text-gray-700 dark:text-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500
        transition-all cursor-pointer appearance-none pr-8"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
    >
      {children}
    </select>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  currentPage, totalPages, totalCount, onPageChange,
}: { currentPage: number; totalPages: number; totalCount: number; onPageChange: (p: number) => void }) {
  const from = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_LIMIT + 1
  const to   = Math.min(currentPage * PAGE_LIMIT, totalCount)

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)

  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-700/60">
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        Showing <span className="text-gray-900 dark:text-white font-medium">{from}–{to}</span> of{' '}
        <span className="text-gray-900 dark:text-white font-medium">{totalCount}</span> results
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.reduce<ReactNode[]>((acc, page, idx, arr) => {
          if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
            acc.push(<span key={`ellipsis-${page}`} className="px-1 text-gray-400 dark:text-gray-600 text-sm">…</span>)
          }
          acc.push(
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                page === currentPage
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {page}
            </button>
          )
          return acc
        }, [])}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, role, logout } = useAuth()
  const { isDark, toggle }     = useDarkMode()
  const queryClient = useQueryClient()

  // ── Filter state ──────────────────────────────────────────────────────────
  const [searchRaw, setSearchRaw] = useState('')
  const [status,    setStatus]    = useState<LeadStatus | ''>('')
  const [source,    setSource]    = useState<LeadSource | ''>('')
  const [sort,      setSort]      = useState<'latest' | 'oldest'>('latest')
  const [page,      setPage]      = useState(1)

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState<Lead | null>(null)

  const search = useDebounce(searchRaw, 500)

  const setFilter = useCallback(
    <T,>(setter: (v: T) => void) =>
      (v: string) => { setter(v as T); setPage(1) },
    []
  )

  const filters: FilterParams = {
    ...(search && { search }),
    ...(status && { status }),
    ...(source && { source }),
    sort,
    page,
    limit: PAGE_LIMIT,
  }

  const hasFilters = !!(search || status || source)

  // ── Query ─────────────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ['leads', filters],
    queryFn:  () => getLeads(filters),
  })

  const leads      = data?.leads      ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = data?.totalPages ?? 1

  // ── Delete mutation ───────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: deleteLead,
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      deleteMutation.mutate(id)
    }
  }

  // ── Export ────────────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false)
  const handleExport = async () => {
    setExporting(true)
    try {
      await exportLeadsCSV({ status: status || undefined, source: source || undefined, search: search || undefined })
    } finally {
      setExporting(false)
    }
  }

  // ── Open modal helpers ────────────────────────────────────────────────────
  const openAdd = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (lead: Lead) => { setEditTarget(lead); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditTarget(null) }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800/60 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow shadow-indigo-500/30">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-900 dark:text-white font-semibold text-sm hidden sm:block">Smart Leads</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400 text-xs font-semibold">
                {user?.name?.[0]?.toUpperCase()}
              </span>
              <span className="text-gray-700 dark:text-gray-300">{user?.name}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs capitalize border border-gray-200 dark:border-gray-700">
                {role}
              </span>
            </span>

            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="relative w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              <Sun className={`w-4 h-4 absolute transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
              <Moon className={`w-4 h-4 absolute transition-all duration-300 ${!isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`} />
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 text-sm transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* ── Page heading ────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {role === 'admin' ? 'Manage all leads across your team.' : 'View and manage your assigned leads.'}
          </p>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Leads"    value={totalCount} icon={Users}      color="bg-indigo-500/15 text-indigo-500 dark:text-indigo-400" />
          <StatCard label="Qualified"      value={leads.filter((l) => l.status === 'Qualified').length} icon={TrendingUp} color="bg-emerald-500/15 text-emerald-500 dark:text-emerald-400" />
          <StatCard label="New This Page"  value={leads.filter((l) => l.status === 'New').length}       icon={BarChart3}  color="bg-sky-500/15 text-sky-500 dark:text-sky-400" />
        </div>

        {/* ── Filter bar ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={searchRaw}
              onChange={(e) => { setSearchRaw(e.target.value); setPage(1) }}
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600
                text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none transition-all
                focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500"
            />
          </div>

          {/* Status filter */}
          <FilterSelect value={status} onChange={setFilter(setStatus)}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </FilterSelect>

          {/* Source filter */}
          <FilterSelect value={source} onChange={setFilter(setSource)}>
            <option value="">All Sources</option>
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </FilterSelect>

          {/* Sort */}
          <FilterSelect value={sort} onChange={(v) => { setSort(v as 'latest' | 'oldest'); setPage(1) }}>
            <option value="latest">Latest first</option>
            <option value="oldest">Oldest first</option>
          </FilterSelect>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="h-10 px-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600
              text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white
              text-sm flex items-center gap-2 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>

          {/* Add lead */}
          <button
            onClick={openAdd}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600
              hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold
              flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>

        {/* ── Table card ──────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-2xl overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/20 transition-colors duration-200">
          {/* Error state */}
          {isError && (
            <div className="flex items-center gap-3 px-5 py-4 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-b border-red-100 dark:border-red-500/20 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Failed to load leads. Please refresh the page.
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700/80 bg-gray-50 dark:bg-gray-800/50">
                  {['Name', 'Email', 'Status', 'Source', 'Created At', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/40">
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                  : leads.length === 0
                    ? <EmptyState hasFilters={hasFilters} />
                    : leads.map((lead) => (
                        <tr key={lead._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                          <td className="px-5 py-4">
                            <Link
                              to={`/leads/${lead._id}`}
                              className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                              {lead.name}
                            </Link>
                          </td>
                          <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{lead.email}</td>
                          <td className="px-5 py-4">
                            <StatusBadge status={lead.status} />
                          </td>
                          <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{lead.source}</td>
                          <td className="px-5 py-4 text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {new Date(lead.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Edit — any role */}
                              <button
                                onClick={() => openEdit(lead)}
                                title="Edit lead"
                                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              {/* Delete — admin only */}
                              {role === 'admin' && (
                                <button
                                  onClick={() => handleDelete(lead._id)}
                                  disabled={deleteMutation.isPending}
                                  title="Delete lead"
                                  className="p-1.5 rounded-lg text-gray-400 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && totalCount > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalCount={totalCount}
              onPageChange={setPage}
            />
          )}
        </div>
      </main>

      {/* ── Modal ───────────────────────────────────────────────────────── */}
      <LeadModal isOpen={modalOpen} onClose={closeModal} editLead={editTarget} />
    </div>
  )
}
