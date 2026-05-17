import { type ReactNode } from 'react'
import { Users, SearchX } from 'lucide-react'

interface EmptyStateProps {
  title?:       string
  description?: string
  hasFilters?:  boolean
  action?:      ReactNode
  colSpan?:     number
}

export default function EmptyState({
  title,
  description,
  hasFilters = false,
  action,
  colSpan = 6,
}: EmptyStateProps) {
  const defaultTitle = hasFilters ? 'No results found' : 'No leads yet'
  const defaultDesc  = hasFilters
    ? 'Try adjusting your search or clearing some filters.'
    : 'Add your first lead to get started.'

  return (
    <tr>
      <td colSpan={colSpan} className="py-20">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center">
            {hasFilters
              ? <SearchX className="w-8 h-8 text-slate-600" />
              : <Users   className="w-8 h-8 text-slate-600" />}
          </div>
          <div>
            <p className="text-slate-200 font-semibold text-base">{title ?? defaultTitle}</p>
            <p className="text-slate-500 text-sm mt-1 max-w-xs">{description ?? defaultDesc}</p>
          </div>
          {action && <div className="mt-2">{action}</div>}
        </div>
      </td>
    </tr>
  )
}
