import { Component, type CSSProperties, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

const errorShellStyle: CSSProperties = {
  boxSizing: 'border-box',
  margin: 0,
  minHeight: '100svh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem',
  fontFamily: 'system-ui, sans-serif',
  background: '#faf6ef',
  color: '#3d2c29',
  textAlign: 'center',
}

const errorDetailStyle: CSSProperties = {
  marginTop: '0.75rem',
  fontSize: '0.8rem',
  fontFamily: 'ui-monospace, monospace',
  wordBreak: 'break-word',
  maxWidth: '32rem',
  opacity: 0.85,
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[TUDU] Render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={errorShellStyle} role="alert">
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', maxWidth: '24rem', lineHeight: 1.5 }}>
            Try clearing site data for this URL, then refresh. Your project files are still here.
          </p>
          <p style={errorDetailStyle}>{this.state.error.message}</p>
          <button
            type="button"
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1.25rem',
              borderRadius: '14px',
              border: 'none',
              background: '#f68e5d',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={() => {
              try {
                localStorage.clear()
              } catch {
                /* ignore */
              }
              window.location.href = '/'
            }}
          >
            Clear data &amp; reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
