import { useEffect, useId, useState } from 'react'
import { X } from 'lucide-react'
import { appFieldClass } from '../../lib/formFieldClasses'

type AssignTicketHolderModalProps = {
  open: boolean
  ticketCount: number
  onClose: () => void
  onAssign: (holderName: string) => void
}

export default function AssignTicketHolderModal({
  open,
  ticketCount,
  onClose,
  onAssign,
}: AssignTicketHolderModalProps) {
  const titleId = useId()
  const nameId = useId()
  const [holderName, setHolderName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setHolderName('')
      setError(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  function handleSubmit() {
    const trimmed = holderName.trim()
    if (!trimmed) {
      setError('Enter a name for the ticket holder.')
      return
    }
    onAssign(trimmed)
    onClose()
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[var(--z-modal)] bg-black/45 backdrop-blur-sm"
        aria-label="Close assign holder"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed left-1/2 top-1/2 z-[calc(var(--z-modal)+1)] w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[14px] border border-app-subtle bg-app-elevated p-5 shadow-float"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-tagline">Assign holder</p>
            <h2 id={titleId} className="font-display text-lg font-extrabold text-brown">
              Name on {ticketCount} ticket{ticketCount === 1 ? '' : 's'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brown-muted transition hover:bg-cream-dark hover:text-brown"
            aria-label="Close"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <p className="text-sm text-brown-muted">
          This is the name shown at the door and on each ticket QR.
        </p>

        <label className="mt-4 block" htmlFor={nameId}>
          <span className="text-xs font-bold uppercase tracking-wide text-brown-muted">
            Ticket holder name
          </span>
          <input
            id={nameId}
            type="text"
            value={holderName}
            onChange={(event) => {
              setHolderName(event.target.value)
              setError(null)
            }}
            placeholder="Full name"
            className={`${appFieldClass} mt-1.5 w-full`}
            autoFocus
          />
        </label>

        {error && (
          <p className="mt-3 rounded-[12px] border border-maroon/25 bg-maroon/5 px-3 py-2 text-sm font-semibold text-maroon">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          className="mt-5 flex w-full items-center justify-center rounded-[14px] bg-orange px-4 py-3 text-sm font-bold text-white transition hover:bg-orange/90"
        >
          Save holder name
        </button>
      </div>
    </>
  )
}
