import { useEffect, useState } from 'react'
import { AdminButton } from './AdminUI'
import {
  applyOrgRejectTemplate,
  getOrgOwnerDisplayName,
  getOrgRejectTemplate,
  orgRejectMessageToTemplate,
  saveOrgRejectTemplate,
} from '../../lib/adminOrganizations'
import type { Organization } from '../../lib/account'

export type OrgRejectPayload = {
  rejectionReason: string
  rejectionMessage: string
  sendInApp: boolean
  sendEmail: boolean
}

type AdminOrgRejectDialogProps = {
  org: Organization | null
  open: boolean
  onConfirm: (payload: OrgRejectPayload) => void
  onCancel: () => void
}

export default function AdminOrgRejectDialog({
  org,
  open,
  onConfirm,
  onCancel,
}: AdminOrgRejectDialogProps) {
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [sendInApp, setSendInApp] = useState(true)
  const [sendEmail, setSendEmail] = useState(false)

  const ownerEmail = org?.createdBy
  const ownerName = ownerEmail ? getOrgOwnerDisplayName(ownerEmail) : 'there'

  useEffect(() => {
    if (!open || !org) return
    const template = getOrgRejectTemplate()
    setReason('')
    setMessage(applyOrgRejectTemplate(template, org.name, ''))
    setSendInApp(true)
    setSendEmail(false)
  }, [open, org?.id, org?.name])

  useEffect(() => {
    if (!open || !org) return
    const template = getOrgRejectTemplate()
    setMessage(applyOrgRejectTemplate(template, org.name, reason))
  }, [reason, open, org?.name])

  if (!open || !org) return null

  const canNotify = Boolean(ownerEmail)
  const willNotify = canNotify && (sendInApp || sendEmail)
  const canSubmit = Boolean(reason.trim()) && Boolean(message.trim())

  function handleConfirm() {
    if (!org) return
    const trimmedReason = reason.trim()
    const trimmedMessage = message.trim()
    if (!trimmedReason || !trimmedMessage) return

    const template = orgRejectMessageToTemplate(trimmedMessage, org.name, trimmedReason)
    saveOrgRejectTemplate(template)

    onConfirm({
      rejectionReason: trimmedReason,
      rejectionMessage: trimmedMessage,
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
        aria-labelledby="org-reject-title"
      >
        <div className="border-b border-[var(--admin-border)] px-4 py-3">
          <h2 id="org-reject-title" className="text-sm font-semibold text-[var(--admin-text)]">
            Reject organization
          </h2>
          <p className="mt-0.5 text-[10px] text-[var(--admin-text-dim)]">
            {canNotify
              ? `Notify ${ownerName} (${ownerEmail}) why ${org.name} was not approved.`
              : 'No owner email on file — rejection will be saved without notification.'}
          </p>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div>
            <label htmlFor="org-reject-reason" className="admin-label">
              Reason for rejection <span className="text-[var(--admin-danger)]">*</span>
            </label>
            <textarea
              id="org-reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="admin-input mt-1 w-full resize-y text-xs leading-relaxed"
              placeholder="e.g. incomplete business verification, missing backup admin…"
            />
          </div>

          <div>
            <label htmlFor="org-reject-message" className="admin-label">
              Message to organization owner
            </label>
            <textarea
              id="org-reject-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              disabled={!canNotify}
              className="admin-input mt-1 w-full resize-y text-xs leading-relaxed"
              placeholder="Rejection message…"
            />
            <p className="mt-1 text-[10px] text-[var(--admin-text-dim)]">
              Default template uses {'{orgName}'} and {'{reason}'} — saved to localStorage as your
              next default.
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
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--admin-border)] px-4 py-3">
          <AdminButton variant="ghost" onClick={onCancel}>
            Cancel
          </AdminButton>
          <AdminButton
            variant="danger"
            onClick={handleConfirm}
            disabled={!canSubmit}
          >
            {willNotify ? 'Reject & notify' : 'Reject'}
          </AdminButton>
        </div>
      </div>
    </>
  )
}
