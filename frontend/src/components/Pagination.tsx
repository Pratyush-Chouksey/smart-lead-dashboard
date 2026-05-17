import { ChevronLeft, ChevronRight } from 'lucide-react'

// ─── Props ────────────────────────────────────────────────────────────────────

interface PaginationProps {
  currentPage:  number
  totalPages:   number
  totalCount:   number
  pageSize?:    number
  onPageChange: (page: number) => void
  className?:   string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a sparse page array with ellipsis markers ('…') */
function buildPageRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '…')[] = [1]

  if (current > 3) pages.push('…')

  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p)
  }

  if (current < total - 2) pages.push('…')
  pages.push(total)

  return pages
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize = 10,
  onPageChange,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1 && totalCount === 0) return null

  const from = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to   = Math.min(currentPage * pageSize, totalCount)
  const pages = buildPageRange(currentPage, totalPages)

  return (
    <div className={`flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-700/60 ${className}`}>
      {/* Result count */}
      <p className="text-gray-500 dark:text-gray-400 text-sm select-none">
        Showing{' '}
        <span className="text-gray-900 dark:text-white font-medium">{from}–{to}</span>
        {' '}of{' '}
        <span className="text-gray-900 dark:text-white font-medium">{totalCount}</span> results
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="p-2 rounded-lg text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700
            disabled:opacity-35 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page buttons */}
        {pages.map((page, idx) =>
          page === '…' ? (
            <span key={`ellipsis-${idx}`} className="w-8 text-center text-gray-400 dark:text-gray-600 text-sm select-none">
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                page === currentPage
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className="p-2 rounded-lg text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700
            disabled:opacity-35 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
