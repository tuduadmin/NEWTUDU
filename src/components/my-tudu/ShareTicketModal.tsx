import { useEffect, useId, useState } from 'react'
import { Mail, Printer, Send, UserPlus, X } from 'lucide-react'
import { findUserByEmail, getCurrentUser } from '../../lib/auth'
import { appFieldClass } from '../../lib/formFieldClasses'
import {
  buildTicketShareEmailUrl,
  getTicketPaperUrl,
  sendTicketToRecipient,
} from '../../lib/shareTicket'
import type { EnrichedUserTicket } from '../../lib/userTickets'

type ShareTicketModalProps = {
  open: boolean
  ticket: EnrichedUserTicket
  onClose: () => void
  onSent: (recipientEmail: string) => void
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export default function ShareTicketModal({
  open,
  ticket,
  onClose,
  onSent,
}: ShareTicketModalProps) {
  const titleId = useId()
  const emailId = useId()
  const [recipientEmail, setRecipientEmail] = useState('')
  const [holderName, setHolderName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const trimmedEmail = recipientEmail.trim().toLowerCase()
  const hasTuduAccount = trimmedEmail ? Boolean(findUserByEmail(trimmedEmail)) : false
  const canSend = isValidEmail(trimmedEmail)

  useEffect(() => {
    if (!open) {
      setRecipientEmail('')
      setHolderName('')
      setMessage('')
      setError(null)
      setSending(false)
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

  function handleSend() {
    const user = getCurrentUser()
    if (!user) {
      setError('Sign in to send tickets.')
      return
    }
    if (!canSend) {
      setError('Enter a valid email address.')
      return
    }

    setSending(true)
    setError(null)
    const result = sendTicketToRecipient({
      ticketId: ticket.id,
      fromEmail: user.email,
      toEmail: trimmedEmail,
      holderName: holderName.trim() || undefined,
      message: message.trim() || undefined,
    })
    setSending(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    onSent(result.recipientEmail)
    onClose()
  }

  function handleOpenEmail() {
    const user = getCurrentUser()
    if (!user || !canSend) return
    const url = buildTicketShareEmailUrl({
      ticket,
      fromEmail: user.email,
      toEmail: trimmedEmail,
      message: message.trim() || undefined,
    })
    window.location.href = url
  }

  function handlePrintPaper() {
    window.open(getTicketPaperUrl(ticket.id), '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[var(--z-modal)] bg-black/45 backdrop-blur-sm"
        aria-label="Close share ticket"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed left-1/2 top-1/2 z-[calc(var(--z-modal)+1)] max-h-[min(90vh,720px)] w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[14px] border border-app-subtle bg-app-elevated p-5 shadow-float"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-tagline">Share ticket</p>
            <h2 id={titleId} className="font-display text-lg font-extrabold text-brown">
              Send to someone else
            </h2>
            <p className="mt-1 text-sm text-brown-muted">{ticket.eventTitle}</p>
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

        <p className="text-sm leading-relaxed text-brown-muted">
          This moves the ticket out of your wallet and into theirs — or saves it under their email
          for when they sign up. They always get a paper ticket link they can print.
        </p>

        <label className="mt-4 block" htmlFor={emailId}>
          <span className="text-xs font-bold uppercase tracking-wide text-brown-muted">
            Recipient email
          </span>
          <input
            id={emailId}
            type="email"
            value={recipientEmail}
            onChange={(event) => {
              setRecipientEmail(event.target.value)
              setError(null)
            }}
            placeholder="friend@example.com"
            className={`${appFieldClass} mt-1.5 w-full`}
            autoComplete="email"
          />
        </label>

        {trimmedEmail && isValidEmail(trimmedEmail) && (
          <p
            className={`mt-2 flex items-center gap-2 rounded-[12px] px-3 py-2 text-xs font-semibold ${
              hasTuduAccount
                ? 'bg-teal-500/10 text-teal-700'
                : 'bg-orange/10 text-orange'
            }`}
          >
            {hasTuduAccount ? (
              <>
                <UserPlus size={14} aria-hidden />
                They have a TUDU account — ticket goes to My TUDU + notification.
              </>
            ) : (
              <>
                <Printer size={14} aria-hidden />
                Not on TUDU yet — they get a paper ticket link by email. Sign up with this email
                later to save it in wallet.
              </>
            )}
          </p>
        )}

        <label className="mt-3 block">
          <span className="text-xs font-bold uppercase tracking-wide text-brown-muted">
            Ticket holder name (optional)
          </span>
          <input
            type="text"
            value={holderName}
            onChange={(event) => setHolderName(event.target.value)}
            placeholder="Name on the ticket at the door"
            className={`${appFieldClass} mt-1.5 w-full`}
          />
        </label>

        <label className="mt-3 block">
          <span className="text-xs font-bold uppercase tracking-wide text-brown-muted">
            Personal note (optional)
          </span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={2}
            placeholder="See you there!"
            className={`${appFieldClass} mt-1.5 w-full resize-none`}
          />
        </label>

        {error && (
          <p className="mt-3 rounded-[12px] border border-maroon/25 bg-maroon/5 px-3 py-2 text-sm font-semibold text-maroon">
            {error}
          </p>
        )}

        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend || sending}
            className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-orange px-4 py-3 text-sm font-bold text-white transition hover:bg-orange/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={16} aria-hidden />
            {sending ? 'Sending…' : 'Send ticket'}
          </button>
          <button
            type="button"
            onClick={handleOpenEmail}
            disabled={!canSend}
            className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-app-subtle bg-app-elevated px-4 py-3 text-sm font-bold text-brown transition hover:border-orange/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Mail size={16} aria-hidden />
            Open in email app
          </button>
          <button
            type="button"
            onClick={handlePrintPaper}
            className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-orange/35 px-4 py-3 text-sm font-bold text-brown transition hover:border-orange/50"
          >
            <Printer size={16} aria-hidden />
            Preview paper ticket
          </button>
        </div>
      </div>
    </>
  )
}
