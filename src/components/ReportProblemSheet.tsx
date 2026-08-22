import { useEffect, useState } from 'react'
import { Flag, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import GradientButton from './GradientButton'
import { addFeedbackReport, checkFeedbackReportLimit } from '../lib/adminFeedback'
import { isSafetyReportReason } from '../lib/supportTicketIds'
import { getCurrentUser } from '../lib/auth'
import { captureDeviceInfo } from '../lib/deviceInfo'
import { appFieldClassNoIcon, appTextareaClass } from '../lib/formFieldClasses'

const REPORT_REASONS = [
  'Safety concern',
  'Unsafe venue',
  'Harassment',
  'Spam / misleading',
  'Inappropriate content',
  'Wrong venue or date',
  'Scam or fraud',
  'Other',
] as const

const FEEDBACK_REASONS = [
  'Bug or something broken',
  'General feedback',
  'Feature request',
  'Host tools',
  'Other',
] as const

export type ReportProblemKind = 'report' | 'feedback'

export type ReportEventContext = {
  targetEventId?: string
  eventTitle?: string
  hostEmail?: string
  hostAccountId?: string
}

type ReportProblemSheetProps = {
  open: boolean
  onClose: () => void
  kind: ReportProblemKind
  title: string
  subtitle?: string
  eventContext?: ReportEventContext
  onSubmitted?: () => void
}

export default function ReportProblemSheet({
  open,
  onClose,
  kind,
  title,
  subtitle,
  eventContext,
  onSubmitted,
}: ReportProblemSheetProps) {
  const user = getCurrentUser()
  const reasons = kind === 'report' ? REPORT_REASONS : FEEDBACK_REASONS

  const [reason, setReason] = useState<string>(reasons[0])
  const [message, setMessage] = useState('')
  const [contactEmail, setContactEmail] = useState(user?.email ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submittedTicketNumber, setSubmittedTicketNumber] = useState<string | null>(null)
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)

  const reporterEmail = (user?.email ?? contactEmail.trim()) || undefined

  useEffect(() => {
    if (!open) return
    setReason(reasons[0])
    setMessage('')
    setContactEmail(user?.email ?? '')
    setError(null)
    setSubmitted(false)
    setSubmittedTicketNumber(null)
    setBlockedMessage(null)
  }, [open, kind, user?.email, reasons])

  useEffect(() => {
    if (!open || submitted || !reporterEmail) {
      setBlockedMessage(null)
      return
    }
    const limit = checkFeedbackReportLimit({
      type: kind,
      reporterEmail,
      targetEventId: eventContext?.targetEventId,
    })
    setBlockedMessage(limit.allowed ? null : limit.message)
  }, [open, submitted, kind, reporterEmail, eventContext?.targetEventId])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = message.trim()
    if (trimmed.length < 8) {
      setError('Please add a few details (at least 8 characters) so we can help.')
      return
    }

    if (!reporterEmail) {
      setError('Add your email so we can follow up, or sign in to your account.')
      return
    }

    const result = addFeedbackReport({
      type: kind,
      reason,
      message: trimmed,
      reporterEmail,
      targetEventId: eventContext?.targetEventId,
      eventTitle: eventContext?.eventTitle,
      hostEmail: eventContext?.hostEmail,
      hostAccountId: eventContext?.hostAccountId,
      deviceInfo: captureDeviceInfo(),
    })

    if (!result.ok) {
      setError(result.error)
      setBlockedMessage(result.error)
      return
    }

    setSubmitted(true)
    setSubmittedTicketNumber(result.report.ticketNumber)
    onSubmitted?.()
  }

  if (submitted) {
    return (
      <>
        <button
          type="button"
          className="fixed inset-0 z-[var(--z-modal)] bg-black/60 backdrop-blur-sm"
          aria-label="Close"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-problem-thanks-title"
          className="fixed inset-0 z-[calc(var(--z-modal)+1)] flex items-center justify-center p-6"
        >
          <div className="w-full max-w-sm rounded-[var(--radius-ui)] border border-app-subtle bg-cream px-6 py-8 text-center shadow-float">
            <p id="report-problem-thanks-title" className="font-display text-xl font-bold text-brown">
              Thanks — we got it
            </p>
            <p className="mt-3 text-sm leading-relaxed text-brown-muted">
              Your {kind === 'report' ? 'report' : 'message'} is in our Support inbox.
              {submittedTicketNumber && (
                <>
                  {' '}
                  {kind === 'report' && isSafetyReportReason(reason) ? 'Safety' : 'Reference'}:{' '}
                  <span className="font-semibold text-brown">{submittedTicketNumber}</span>.
                </>
              )}{' '}
              We&apos;ll review it and can reply in My Tudu notifications if you&apos;re signed in.
            </p>
            <GradientButton type="button" className="mt-8 w-full py-3 text-sm font-semibold" onClick={onClose}>
              Done
            </GradientButton>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        className="app-column-fixed fixed top-[calc(var(--app-header-h)+env(safe-area-inset-top))] bottom-[calc(var(--app-bottom-nav-h)+env(safe-area-inset-bottom))] z-[var(--z-modal)] bg-black/60 backdrop-blur-sm"
        aria-label="Close report form"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-problem-sheet-title"
        className="app-column-fixed animate-slide-up-panel fixed bottom-[calc(var(--app-bottom-nav-h)+env(safe-area-inset-bottom))] z-[calc(var(--z-modal)+1)] flex max-h-[min(90svh,640px)] flex-col overflow-hidden rounded-t-[var(--radius-2xl)] bg-cream shadow-float"
      >
        <div className="shrink-0 border-b border-brown/10 px-5 pb-4 pt-4">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brown/15" aria-hidden />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Flag size={18} className="shrink-0 text-maroon" aria-hidden />
                <h2
                  id="report-problem-sheet-title"
                  className="font-display text-lg font-extrabold text-brown"
                >
                  {title}
                </h2>
              </div>
              {subtitle && (
                <p className="mt-1.5 text-sm leading-relaxed text-brown-muted">{subtitle}</p>
              )}
              {eventContext?.eventTitle && (
                <p className="mt-3 truncate rounded-[var(--radius-ui)] bg-app-elevated px-4 py-2.5 text-sm font-semibold text-brown">
                  {eventContext.eventTitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream-dark text-brown-muted transition hover:text-brown"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-brown-muted">
                  What&apos;s going on?
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={`${appFieldClassNoIcon} mt-2.5`}
                >
                  {reasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-brown-muted">
                  Details
                </label>
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    setError(null)
                  }}
                  rows={6}
                  placeholder={
                    kind === 'report'
                      ? 'Tell us what seems wrong or unsafe about this event…'
                      : 'What’s working, what’s broken, or what you wish TUDU did…'
                  }
                  className={`${appTextareaClass} mt-2.5 min-h-[140px] resize-y`}
                  autoFocus
                />
              </div>

              {!user && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-brown-muted">
                    Your email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => {
                      setContactEmail(e.target.value)
                      setError(null)
                    }}
                    placeholder="you@example.com"
                    className={`${appFieldClassNoIcon} mt-2.5`}
                    autoComplete="email"
                  />
                  <p className="mt-2 text-xs leading-relaxed text-brown-muted">
                    Or{' '}
                    <Link to="/signin" className="font-semibold text-orange no-underline hover:underline">
                      sign in
                    </Link>{' '}
                    so we can reach you in the app.
                  </p>
                </div>
              )}

              {blockedMessage && !error && (
                <p className="rounded-[var(--radius-ui)] border border-brown/15 bg-brown/5 px-4 py-3 text-sm leading-relaxed text-brown">
                  {blockedMessage}
                </p>
              )}

              {error && (
                <p className="rounded-[var(--radius-ui)] border border-maroon/25 bg-maroon/5 px-4 py-3 text-sm leading-relaxed font-semibold text-maroon">
                  {error}
                </p>
              )}

              <p className="text-xs leading-relaxed text-brown-muted">
                Reports go to the TUDU team — not the event host. Misuse may result in account action
                per our{' '}
                <Link to="/terms" className="text-orange no-underline hover:underline">
                  Terms
                </Link>
                .
              </p>

              <GradientButton
                type="submit"
                fullWidth
                className="py-3 text-sm font-semibold"
                disabled={!message.trim() || Boolean(blockedMessage)}
              >
                Submit {kind === 'report' ? 'report' : 'feedback'}
              </GradientButton>
            </form>
        </div>
      </div>
    </>
  )
}
