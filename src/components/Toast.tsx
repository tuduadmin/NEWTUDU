import { useEffect } from 'react'

type ToastProps = {
  message: string
  onDismiss: () => void
  duration?: number
  dark?: boolean
}

export default function Toast({ message, onDismiss, duration = 3000, dark = false }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, duration)
    return () => window.clearTimeout(timer)
  }, [onDismiss, duration])

  return (
    <div
      role="status"
      className={`fixed bottom-24 left-1/2 z-50 flex max-w-sm -translate-x-1/2 items-center gap-3 rounded-tudu px-4 py-3 text-sm shadow-lg ${
        dark
          ? 'bg-app-dark-elevated text-white ring-1 ring-white/10'
          : 'bg-brown text-white'
      }`}
    >
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="text-white/70 hover:text-white"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
