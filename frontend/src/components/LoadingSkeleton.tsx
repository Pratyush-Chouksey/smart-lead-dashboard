// ─── Props ────────────────────────────────────────────────────────────────────

interface LoadingSkeletonProps {
  rows?:    number
  columns?: number
}

const WIDTH_CYCLE = ['w-32', 'w-48', 'w-20', 'w-24', 'w-28', 'w-16']

export default function LoadingSkeleton({ rows = 6, columns = 6 }: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-gray-100 dark:border-gray-700/50">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <td key={colIdx} className="px-5 py-4">
              <div
                className={`h-3.5 rounded-full bg-gray-200 dark:bg-gray-700/60 animate-pulse ${WIDTH_CYCLE[(rowIdx + colIdx) % WIDTH_CYCLE.length]}`}
                style={{ animationDelay: `${(rowIdx * columns + colIdx) * 40}ms` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
