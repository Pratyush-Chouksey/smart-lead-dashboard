import { type ReactNode } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Column<T> {
  key:        keyof T | string
  header:     string
  sortable?:  boolean
  width?:     string
  render?:    (row: T) => ReactNode
}

export type SortDirection = 'asc' | 'desc' | null

interface TableProps<T> {
  columns:       Column<T>[]
  data:          T[]
  keyExtractor:  (row: T) => string
  sortKey?:      string | null
  sortDir?:      SortDirection
  onSort?:       (key: string) => void
  className?:    string
  children?:     ReactNode  // slot for tbody overrides (e.g. loading/empty state)
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir: SortDirection }) {
  if (!active) return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-600" />
  return dir === 'asc'
    ? <ChevronUp   className="w-3.5 h-3.5 text-indigo-400" />
    : <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Table<T>({
  columns, data, keyExtractor,
  sortKey, sortDir, onSort,
  className = '', children,
}: TableProps<T>) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        {/* Head */}
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-700/80 bg-gray-50 dark:bg-gray-800/50">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={col.width ? { width: col.width } : undefined}
                className={`px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider
                  ${col.sortable && onSort ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors' : ''}`}
                onClick={() => col.sortable && onSort?.(String(col.key))}
              >
                <span className="flex items-center gap-1.5">
                  {col.header}
                  {col.sortable && (
                    <SortIcon
                      active={sortKey === String(col.key)}
                      dir={sortKey === String(col.key) ? (sortDir ?? null) : null}
                    />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/40">
          {children ?? data.map((row) => (
            <tr key={keyExtractor(row)} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
              {columns.map((col) => (
                <td key={String(col.key)} className="px-5 py-4 text-gray-600 dark:text-gray-300">
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[String(col.key)] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
