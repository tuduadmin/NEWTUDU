import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { AdminBadge, AdminButton } from './AdminUI'
import {
  clearEventModeration,
  EVENT_MODERATION_STATUS_LABELS,
  getAdminEventModerationHubUrl,
  getAdminEventRegistryUrl,
  getEventModeration,
  setEventModerationStatus,
  type EventModerationStatus,
} from '../../lib/adminEventModeration'

type AdminEventModerationPanelProps = {
  targetEventId: string
  eventTitle?: string
  hostEventId?: string
  linkedFeedbackId?: string
  compact?: boolean
  onChanged?: () => void
}

export default function AdminEventModerationPanel({
  targetEventId,
  eventTitle,
  hostEventId,
  linkedFeedbackId,
  compact = false,
  onChanged,
}: AdminEventModerationPanelProps) {
  const [refresh, setRefresh] = useState(0)
  const [reason, setReason] = useState('')

  const moderation = useMemo(() => {
    void refresh
    return getEventModeration(targetEventId)
  }, [targetEventId, refresh])

  const registryUrl = getAdminEventRegistryUrl({ targetEventId, hostEventId })
  const moderationHubUrl = getAdminEventModerationHubUrl({
    targetEventId,
    hostEventId,
    status: moderation?.status,
  })

  function reload() {
    setRefresh((n) => n + 1)
    onChanged?.()
  }

  function applyStatus(status: EventModerationStatus) {
    setEventModerationStatus({
      targetEventId,
      eventTitle,
      hostEventId,
      status,
      reason: reason.trim() || undefined,
      linkedFeedbackId,
    })
    reload()
  }

  function handleClear() {
    if (!window.confirm('Clear moderation status for this event?')) return
    clearEventModeration(targetEventId)
    setReason('')
    reload()
  }

  const statusTone =
    moderation?.status === 'blocked'
      ? 'rose'
      : moderation?.status === 'suspended'
        ? 'amber'
        : moderation?.status === 'flagged'
          ? 'cyan'
          : 'neutral'

  return (
    <div className={`admin-panel space-y-3 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0 text-[var(--admin-accent)]" aria-hidden />
            <p className="admin-label mb-0">Event moderation</p>
          </div>
          {!compact && (
            <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
              Flag for review, suspend, or block — suspended/blocked events are removed from Discover.
            </p>
          )}
        </div>
        {moderation ? (
          <AdminBadge tone={statusTone}>{moderation.status}</AdminBadge>
        ) : (
          <AdminBadge tone="emerald">Active</AdminBadge>
        )}
      </div>

      {moderation && (
        <div className="rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-white/[0.02] px-3 py-2 text-xs text-[var(--admin-text-muted)]">
          <p className="font-medium text-[var(--admin-text)]">
            {EVENT_MODERATION_STATUS_LABELS[moderation.status]}
          </p>
          {moderation.reason && <p className="mt-1">{moderation.reason}</p>}
          <p className="mt-1 text-[var(--admin-text-dim)]">
            Updated {new Date(moderation.updatedAt).toLocaleString()}
            {moderation.updatedBy ? ` · ${moderation.updatedBy}` : ''}
          </p>
        </div>
      )}

      <div>
        <label className="admin-label" htmlFor={`event-mod-reason-${targetEventId}`}>
          Moderation note (optional)
        </label>
        <textarea
          id={`event-mod-reason-${targetEventId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Why this action is being taken…"
          className="admin-input mt-1 min-h-[64px] w-full resize-y"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <AdminButton variant="secondary" onClick={() => applyStatus('flagged')}>
          Flag for review
        </AdminButton>
        <AdminButton variant="secondary" onClick={() => applyStatus('suspended')}>
          Suspend
        </AdminButton>
        <AdminButton variant="danger" onClick={() => applyStatus('blocked')}>
          Block
        </AdminButton>
        {moderation && (
          <AdminButton variant="ghost" onClick={handleClear}>
            Clear status
          </AdminButton>
        )}
      </div>

      {(registryUrl || !hostEventId) && (
        <Link
          to={moderationHubUrl}
          className="inline-flex text-xs font-semibold text-[var(--admin-accent)] no-underline hover:underline"
        >
          {registryUrl
            ? 'Open full event card in Events registry →'
            : 'Open in Events moderation queue →'}
        </Link>
      )}
    </div>
  )
}
