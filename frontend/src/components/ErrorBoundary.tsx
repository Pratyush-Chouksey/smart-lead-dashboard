import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

// ─── Props & State ────────────────────────────────────────────────────────────

interface Props {
  children:  ReactNode
  /** Optional fallback to render instead of the default error UI */
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface State {
  hasError: boolean
  error:    Error | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught error:', error)
    console.error('[ErrorBoundary] Component stack:', info.componentStack)
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children
    }

    if (this.props.fallback) {
      return this.props.fallback(this.state.error, this.reset)
    }

    const { error } = this.state

    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'var(--bg-base)' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative text-center max-w-lg w-full">
          <div className="w-20 h-20 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-orange-400" />
          </div>

          <p className="text-orange-400/70 text-sm font-semibold tracking-widest uppercase mb-2">
            Unexpected Error
          </p>

          <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text)' }}>
            Something went wrong
          </h1>

          <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
            The application encountered an unrecoverable error.
          </p>

          <details className="text-left mb-8 mt-4">
            <summary
              className="text-xs cursor-pointer select-none mb-2"
              style={{ color: 'var(--text-subtle)' }}
            >
              Technical details
            </summary>
            <pre
              className="text-xs p-3 rounded-xl overflow-auto max-h-40 border"
              style={{
                background: 'var(--bg-surface-2)',
                color: 'var(--text-muted)',
                borderColor: 'var(--border)',
              }}
            >
              {error.message}
              {error.stack ? `\n\n${error.stack}` : ''}
            </pre>
          </details>

          <div className="flex gap-3 justify-center">
            <button
              onClick={this.reset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all"
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--text-muted)',
                borderColor: 'var(--border)',
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
            <a
              href="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
                bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500
                transition-all shadow-lg shadow-indigo-500/20"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }
}
