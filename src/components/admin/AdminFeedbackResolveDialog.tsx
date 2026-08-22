import { useEffect, useState } from 'react'
import { AdminButton } from './AdminUI'
import {
  applyFeedbackResolveTemplate,
  feedbackMessageToTemplate,
  getFeedbackResolveTemplate,
  getReporterDisplayName,
  saveFeedbackResolveTemplate,
  type FeedbackReport,
} from '../../lib/adminFeedback'

export type FeedbackResolvePayload = {
  resolutionMessage: string
  sendInApp: boolean
  sendEmail: boolean
}

type AdminFeedbackResolveDialogProps = {
  item: FeedbackReport | null
  open: boolean
  onConfirm: (payload: FeedbackResolvePayload) => void
  onCancel: () => void
}

export default function AdminFeedbackResolveDialog({
  item,
  open,
  onConfirm,
  onCancel,
}: AdminFeedbackResolveDialogProps) {
  const [message, setMessage] = useState('')
  const [sendInApp, setSendInApp] = useState(true)
  const [sendEmail, setSendEmail] = useState(false)

  const reporterEmail = item?.reporterEmail
  const reporterName = reporterEmail ? getReporterDisplayName(reporterEmail) : 'there'

  useEffect(() => {
    if (!open || !item) return
    const template = getFeedbackResolveTemplate()
    setMessage(applyFeedbackResolveTemplate(template, reporterName))
    setSendInApp(true)
    setSendEmail(false)
  }, [open, item?.id, reporterName])

  if (!open || !item) return null

  const canNotify = Boolean(reporterEmail)
  const willNotify = canNotify && (sendInApp || sendEmail)

  function handleConfirm() {
    const trimmed = message.trim()
    if (willNotify && !trimmed) return

    if (canNotify && trimmed) {
      const template = feedbackMessageToTemplate(trimmed, reporterName)
      saveFeedbackResolveTemplate(template)
    }

    onConfirm({
      resolutionMessage: trimmed,
      sendInApp: canNotify && sendInApp,
      sendEmail: canNotify && sendEmail,
    })
  }

  return (
    <>
      <div className="admin-drawer-backdrop" onClick={onCancel} aria-hidden />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-xl"
        role="dialog"
        aria-modal
        aria-labelledby="feedback-resolve-title"
      >
        <div className="border-b border-[var(--admin-border)] px-4 py-3">
          <h2 id="feedback-resolve-title" className="text-sm font-semibold text-[var(--admin-text)]">
            Resolve {item.ticketNumber}
          </h2>
          <p className="mt-0.5 text-[10px] text-[var(--admin-text-dim)]">
            {item.type === 'report' ? 'Report' : 'Feedback'} ·{' '}
            {reporterEmail
              ? `Notify ${reporterEmail} or close the ticket without sending a message.`
              : 'No reporter email on file — ticket will be resolved without notification.'}
          </p>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div>
            <label htmlFor="feedback-resolve-message" className="admin-label">
              Message to reporter
            </label>
            <textarea
              id="feedback-resolve-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              disabled={!canNotify}
              className="admin-input mt-1 w-full resize-y text-xs leading-relaxed"
              placeholder="Thank-you message…"
            />
            <p className="mt-1 text-[10px] text-[var(--admin-text-dim)]">
              Use {'{name}'} in the saved default template — it is replaced with the reporter&apos;s
              first name when you open this dialog.
            </p>
          </div>

          {canNotify && (
            <div className="space-y-2">
              <p className="admin-label">Delivery</p>
              <label className="flex cursor-pointer items-start gap-2 rounded-[var(--admin-radius)] border border-[var(--admin-border)] px-2 py-1.5 hover:bg-white/[0.02]">
                <input
                  type="checkbox"
                  checked={sendInApp}
                  onChange={(e) => setSendInApp(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-[var(--admin-text)]">
                    Send in-app notification
                  </span>
                  <span className="block text-[10px] text-[var(--admin-text-dim)]">
                    Appears in My Tudu → Notifications; bell badge updates
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 rounded-[var(--admin-radius)] border border-[var(--admin-border)] px-2 py-1.5 hover:bg-white/[0.02]">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-[var(--admin-text)]">
                    Send email
                  </span>
                  <span className="block text-[10px] text-[var(--admin-text-dim)]">
                    Phase 1 email stub (console + activity log)
                  </span>
                </span>
              </label>
              {!sendInApp && !sendEmail && (
                <p className="text-[10px] text-[var(--admin-text-dim)]">
                  Ticket will be marked resolved without notifying the reporter.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--admin-border)] px-4 py-3">
          <AdminButton variant="ghost" onClick={onCancel}>
            Cancel
          </AdminButton>
          <AdminButton
            variant="primary"
            onClick={handleConfirm}
            disabled={willNotify && !message.trim()}
          >
            {willNotify ? 'Resolve & notify' : 'Resolve'}
          </AdminButton>
        </div>
      </div>
    </>
  )
}
