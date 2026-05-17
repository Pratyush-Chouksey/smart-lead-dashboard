import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

// ─── Props ────────────────────────────────────────────────────────────────────

interface ModalProps {
  isOpen:        boolean
  onClose:       () => void
  title:         string
  description?:  string
  children:      ReactNode
  /** Max width class, e.g. 'max-w-md' (default) or 'max-w-lg' */
  size?:         'sm' | 'md' | 'lg'
}

const SIZE_CLS = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

// ─── Component ────────────────────────────────────────────────────────────────

export default function Modal({
  isOpen, onClose, title, description, children, size = 'md',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // ── ESC key ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // ── Scroll lock ───────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // ── Focus trap on open ────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  return (
    // Backdrop
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative w-full ${SIZE_CLS[size]} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl
          shadow-2xl shadow-black/10 dark:shadow-black/50 outline-none
          animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700/50">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            {description && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="ml-4 p-2 rounded-lg text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
