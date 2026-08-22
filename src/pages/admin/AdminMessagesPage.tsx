import { useEffect, useMemo, useState } from 'react'
import { Archive, ArchiveRestore, Inbox, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import AdminGeoFilterBar from '../../components/admin/AdminGeoFilterBar'
import {
  AdminBadge,
  AdminButton,
  AdminConfirmDialog,
  AdminDrawer,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminRowMenu,
  AdminSelect,
  AdminTable,
} from '../../components/admin/AdminUI'
import DeliveryChannelBadges from '../../components/admin/DeliveryChannelBadges'
import { getAccount, getOrganizations, getOrganizationOwnerEmail, getTierBadgeTone, getTierLabel, isAccountSuspended, type UserTier } from '../../lib/account'
import {
  archiveMessage,
  archiveThreads,
  buildBatchLabel,
  deleteMessage,
  deleteThreads,
  getInboxCounts,
  getRecipientDeliveryHints,
  getThreads,
  getUsersMatchingGeoFilters,
  markThreadRead,
  permanentlyDeleteThreads,
  resolveAdminMessageRecipientEmail,
  restoreMessage,
  restoreThreads,
  sendAdminMessage,
  sendBatchMessage,
  POKE_TEMPLATES,
  type BatchMessageRecipient,
  type DeliveryChannel,
  type InboxFilter,
  type MessageThread,
} from '../../lib/adminMessages'
import { formatRelativeTime } from '../../lib/adminAnalytics'
import {
  DEFAULT_MODERATION_TEMPLATES,
  getModerationTemplates,
  saveModerationTemplates,
  type ModerationTemplates,
} from '../../lib/adminModeration'
import { hasActiveGeoFilters, type AnalyticsFilters } from '../../lib/analyticsGeo'
import { formatCityLabel } from '../../lib/location'
import { getAllUsers, PLATFORM_ADMIN } from '../../lib/auth'

const ALL_CHANNELS: DeliveryChannel[] = ['email', 'sms', 'in_app']

const CHANNEL_OPTIONS: { id: DeliveryChannel; label: string; hint: string }[] = [
  { id: 'email', label: 'Email', hint: "To user's account email" },
  { id: 'sms', label: 'SMS', hint: 'To verified phone only' },
  { id: 'in_app', label: 'In-app notification', hint: "User's Notifications tab" },
]

const COMPOSE_MODES: { id: ComposeMode; label: string }[] = [
  { id: 'single', label: 'Single user' },
  { id: 'batch', label: 'Batch / Broadcast' },
]

const INBOX_FILTERS: { id: InboxFilter; label: string; icon: typeof Inbox }[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'archived', label: 'Archived', icon: Archive },
  { id: 'trash', label: 'Trash', icon: Trash2 },
]

const EMPTY_GEO_FILTERS: AnalyticsFilters = {
  country: 'all',
  province: 'all',
  city: 'all',
}

type ComposeMode = 'single' | 'batch'

function defaultChannels(): DeliveryChannel[] {
  return [...ALL_CHANNELS]
}

function DeliveryChannelPicker({
  channels,
  onChange,
  recipientEmail,
  batchSmsWarning,
}: {
  channels: DeliveryChannel[]
  onChange: (next: DeliveryChannel[]) => void
  recipientEmail?: string
  batchSmsWarning?: { unverified: number; noPhone: number }
}) {
  const hints = recipientEmail ? getRecipientDeliveryHints(recipientEmail) : null

  function toggle(channel: DeliveryChannel) {
    if (channels.includes(channel)) {
      onChange(channels.filter((c) => c !== channel))
    } else {
      onChange([...channels, channel])
    }
  }

  return (
    <div className="space-y-2">
      <p className="admin-label">Send via</p>
      {CHANNEL_OPTIONS.map((opt) => {
        const checked = channels.includes(opt.id)
        const smsBlocked =
          opt.id === 'sms' &&
          hints &&
          (!hints.phone || !hints.phoneVerified)
        return (
          <label
            key={opt.id}
            className="flex cursor-pointer items-start gap-2 rounded-[var(--admin-radius)] border border-[var(--admin-border)] px-2 py-1.5 hover:bg-white/[0.02]"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(opt.id)}
              className="mt-0.5"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-[var(--admin-text)]">
                {opt.label}
              </span>
              <span className="block text-[10px] text-[var(--admin-text-dim)]">{opt.hint}</span>
              {opt.id === 'sms' && smsBlocked && checked && (
                <span className="mt-1 block text-[10px] text-amber-300">
                  Warning:{' '}
                  {!hints?.phone
                    ? 'No phone on account — SMS will fail.'
                    : 'Phone not verified — SMS will fail.'}
                </span>
              )}
              {opt.id === 'sms' && batchSmsWarning && checked && (
                <span className="mt-1 block text-[10px] text-amber-300">
                  Batch: {batchSmsWarning.unverified + batchSmsWarning.noPhone} recipient
                  {(batchSmsWarning.unverified + batchSmsWarning.noPhone) === 1 ? '' : 's'} may fail SMS
                  ({batchSmsWarning.noPhone} no phone, {batchSmsWarning.unverified} unverified).
                </span>
              )}
            </span>
          </label>
        )
      })}
      {channels.length === 0 && (
        <p className="text-[10px] text-amber-300">
          Select at least one channel, or the message is saved to the admin thread only.
        </p>
      )}
    </div>
  )
}

function RecipientStatusBadge({ recipient }: { recipient: BatchMessageRecipient }) {
  if (recipient.suspended) {
    return <AdminBadge tone="amber">Suspended</AdminBadge>
  }
  if (recipient.verificationStatus === 'phone_verified') {
    return <AdminBadge tone="emerald">Verified</AdminBadge>
  }
  return <AdminBadge tone="neutral">Unverified</AdminBadge>
}

function BatchRecipientTable({
  recipients,
  selectedEmails,
  onToggle,
  onToggleAll,
}: {
  recipients: BatchMessageRecipient[]
  selectedEmails: Set<string>
  onToggle: (email: string) => void
  onToggleAll: (checked: boolean) => void
}) {
  const allSelected =
    recipients.length > 0 && recipients.every((r) => selectedEmails.has(r.email))
  const someSelected = recipients.some((r) => selectedEmails.has(r.email))

  return (
    <div>
      {recipients.length > 0 && (
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <label className="flex items-center gap-2 text-xs text-[var(--admin-text-muted)]">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected && !allSelected
              }}
              onChange={(e) => onToggleAll(e.target.checked)}
            />
            Select all in region
          </label>
          <span className="text-[10px] text-[var(--admin-text-dim)]">
            {selectedEmails.size} of {recipients.length} selected
          </span>
        </div>
      )}
      <AdminTable
        columns={['', 'User', 'Tier', 'City', 'Province', 'Verification']}
      >
        {recipients.length === 0 ? (
          <tr>
            <td colSpan={6} className="text-xs text-[var(--admin-text-dim)]">
              No users match filters.
            </td>
          </tr>
        ) : (
          recipients.map((r) => (
            <tr key={r.email}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedEmails.has(r.email)}
                  onChange={() => onToggle(r.email)}
                  aria-label={`Select ${r.email}`}
                />
              </td>
              <td>
                <p className="font-medium text-[var(--admin-text)]">
                  {r.firstName} {r.lastName}
                </p>
                <p className="text-[11px] text-[var(--admin-text-dim)]">{r.email}</p>
              </td>
              <td>
                <AdminBadge tone={r.tier === '—' ? 'neutral' : getTierBadgeTone(r.tier as UserTier)}>
                  {r.tier === '—' ? '—' : getTierLabel(r.tier as UserTier)}
                </AdminBadge>
              </td>
              <td className="text-[var(--admin-text-muted)]">{formatCityLabel(r.city)}</td>
              <td className="text-xs text-[var(--admin-text-muted)]">{r.province}</td>
              <td>
                <RecipientStatusBadge recipient={r} />
              </td>
            </tr>
          ))
        )}
      </AdminTable>
    </div>
  )
}

export default function AdminMessagesPage({
  embedded = false,
  panel,
}: {
  embedded?: boolean
  panel?: 'send' | 'threads'
}) {
  const [params, setParams] = useSearchParams()
  const [refresh, setRefresh] = useState(0)
  const [composeOpen, setComposeOpen] = useState(false)
  const [infoExpanded, setInfoExpanded] = useState(false)
  const [composeMode, setComposeMode] = useState<ComposeMode>('single')
  const [composeTo, setComposeTo] = useState(params.get('to') ?? '')
  const [composeOrgHint, setComposeOrgHint] = useState<string | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [composeChannels, setComposeChannels] = useState<DeliveryChannel[]>(defaultChannels)
  const [batchChannels, setBatchChannels] = useState<DeliveryChannel[]>(defaultChannels)
  const [replyChannels, setReplyChannels] = useState<DeliveryChannel[]>(defaultChannels)
  const [geoFilters, setGeoFilters] = useState<AnalyticsFilters>(EMPTY_GEO_FILTERS)
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set())
  const [batchStatus, setBatchStatus] = useState<string | null>(null)
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('inbox')
  const [selectedThreadIds, setSelectedThreadIds] = useState<Set<string>>(new Set())
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    kind: 'delete' | 'permanent'
    threadIds: string[]
  } | null>(null)
  const [moderationExpanded, setModerationExpanded] = useState(
    () => typeof window !== 'undefined' && window.location.hash === '#moderation-templates',
  )
  const [moderationTemplates, setModerationTemplates] = useState<ModerationTemplates>(() =>
    getModerationTemplates(),
  )
  const [moderationSaved, setModerationSaved] = useState(false)

  const inboxCounts = useMemo(() => getInboxCounts(), [refresh])
  const threads = useMemo(() => getThreads(inboxFilter), [refresh, inboxFilter])
  const activeThreadId = params.get('thread')
  const activeThread = threads.find((t) => t.threadId === activeThreadId) ?? null

  const userOptions = useMemo(
    () =>
      getAllUsers().filter(
        (u) => u.email.toLowerCase() !== PLATFORM_ADMIN.email.toLowerCase(),
      ),
    [],
  )

  const orgRecipientOptions = useMemo(
    () =>
      getOrganizations()
        .map((org) => ({
          orgId: org.id,
          name: org.name,
          ownerEmail: getOrganizationOwnerEmail(org).toLowerCase(),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [refresh],
  )

  const filteredUserOptions = useMemo(() => {
    if (!userSearch.trim()) return userOptions
    const q = userSearch.toLowerCase()
    return userOptions.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q),
    )
  }, [userOptions, userSearch])

  const composeRecipientEmail = useMemo(
    () => resolveAdminMessageRecipientEmail(composeTo).email,
    [composeTo],
  )

  const matchedRecipients = useMemo(
    () => getUsersMatchingGeoFilters(geoFilters),
    [geoFilters, refresh],
  )

  const batchLabel = useMemo(() => buildBatchLabel(geoFilters), [geoFilters])

  const manualAddOptions = useMemo(
    () =>
      userOptions.filter(
        (u) => !matchedRecipients.some((r) => r.email.toLowerCase() === u.email.toLowerCase()),
      ),
    [userOptions, matchedRecipients],
  )

  const selectedRecipients = useMemo(() => {
    const byEmail = new Map(matchedRecipients.map((r) => [r.email.toLowerCase(), r]))
    for (const email of selectedEmails) {
      if (!byEmail.has(email.toLowerCase())) {
        const user = userOptions.find((u) => u.email.toLowerCase() === email.toLowerCase())
        const account = user ? getAccount(user.email) : null
        if (user) {
          byEmail.set(email.toLowerCase(), {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            city: account?.homeCity ?? '—',
            province: account?.province ?? account?.homeRegion ?? '—',
            tier: account?.tier ?? '—',
            verificationStatus: account?.verificationStatus ?? 'unverified',
            suspended: account ? isAccountSuspended(account) : false,
          })
        }
      }
    }
    return [...selectedEmails]
      .map((email) => byEmail.get(email.toLowerCase()))
      .filter((r): r is BatchMessageRecipient => Boolean(r))
  }, [selectedEmails, matchedRecipients, userOptions])

  const batchSmsWarning = useMemo(() => {
    let unverified = 0
    let noPhone = 0
    for (const email of selectedEmails) {
      const hints = getRecipientDeliveryHints(email)
      if (!hints.phone) noPhone += 1
      else if (!hints.phoneVerified) unverified += 1
    }
    return { unverified, noPhone }
  }, [selectedEmails])

  const suspendedCount = selectedRecipients.filter((r) => r.suspended).length

  useEffect(() => {
    if (composeMode !== 'batch') return
    if (hasActiveGeoFilters(geoFilters)) {
      setSelectedEmails(new Set(matchedRecipients.map((r) => r.email)))
    }
  }, [composeMode, geoFilters, matchedRecipients])

  const showSendExtras = !embedded || panel === 'send'
  const showThreadInbox = !embedded || panel === 'threads'
  const sendOnlyLayout = embedded && panel === 'send'

  useEffect(() => {
    const to = params.get('to')
    if (to) {
      const resolved = resolveAdminMessageRecipientEmail(to)
      setComposeMode('single')
      setComposeTo(resolved.routedFromOrg && resolved.orgId ? resolved.orgId : resolved.email)
      setComposeOrgHint(
        resolved.routedFromOrg && resolved.orgName
          ? `Messaging ${resolved.orgName} — delivered to owner ${resolved.email}`
          : null,
      )
      if (!sendOnlyLayout) {
        setComposeOpen(true)
      }
    } else if (params.get('compose') === '1' && !sendOnlyLayout) {
      setComposeOpen(true)
    }
  }, [params, sendOnlyLayout])

  useEffect(() => {
    setSelectedThreadIds(new Set())
  }, [inboxFilter])

  useEffect(() => {
    if (!activeThreadId) return
    if (!threads.some((t) => t.threadId === activeThreadId)) {
      params.delete('thread')
      setParams(params)
    }
  }, [activeThreadId, threads, params, setParams])

  function showStatus(message: string) {
    setStatusMessage(message)
    window.setTimeout(() => setStatusMessage(null), 3200)
  }

  function reload() {
    setRefresh((r) => r + 1)
  }

  function clearThreadSelection() {
    setSelectedThreadIds(new Set())
  }

  function toggleThreadSelection(threadId: string) {
    setSelectedThreadIds((prev) => {
      const next = new Set(prev)
      if (next.has(threadId)) next.delete(threadId)
      else next.add(threadId)
      return next
    })
  }

  function toggleAllThreads(checked: boolean) {
    if (checked) {
      setSelectedThreadIds(new Set(threads.map((t) => t.threadId)))
    } else {
      clearThreadSelection()
    }
  }

  function closeActiveThread() {
    params.delete('thread')
    setParams(params)
  }

  function handleArchiveThreads(threadIds: string[]) {
    const count = archiveThreads(threadIds)
    if (count === 0) return
    if (activeThreadId && threadIds.includes(activeThreadId)) closeActiveThread()
    clearThreadSelection()
    showStatus(`Archived ${count} thread${count === 1 ? '' : 's'}`)
    reload()
  }

  function handleDeleteThreads(threadIds: string[]) {
    const count = deleteThreads(threadIds)
    if (count === 0) return
    if (activeThreadId && threadIds.includes(activeThreadId)) closeActiveThread()
    clearThreadSelection()
    showStatus(`Moved ${count} thread${count === 1 ? '' : 's'} to trash`)
    reload()
  }

  function handleRestoreThreads(threadIds: string[]) {
    const count = restoreThreads(threadIds)
    if (count === 0) return
    if (activeThreadId && threadIds.includes(activeThreadId)) closeActiveThread()
    clearThreadSelection()
    showStatus(`Restored ${count} thread${count === 1 ? '' : 's'} to inbox`)
    reload()
  }

  function handlePermanentDeleteThreads(threadIds: string[]) {
    const count = permanentlyDeleteThreads(threadIds)
    if (count === 0) return
    if (activeThreadId && threadIds.includes(activeThreadId)) closeActiveThread()
    clearThreadSelection()
    setConfirmDialog(null)
    showStatus(`Permanently deleted ${count} thread${count === 1 ? '' : 's'}`)
    reload()
  }

  function confirmDeleteThreads(threadIds: string[], kind: 'delete' | 'permanent') {
    if (threadIds.length === 0) return
    setConfirmDialog({ kind, threadIds })
  }

  function selectThread(thread: MessageThread) {
    markThreadRead(thread.threadId)
    params.set('thread', thread.threadId)
    setParams(params)
    reload()
  }

  function openCompose(mode?: ComposeMode) {
    if (mode) setComposeMode(mode)
    if (!sendOnlyLayout) {
      setComposeOpen(true)
    }
  }

  function closeCompose() {
    setComposeOpen(false)
    if (params.get('to') || params.get('compose')) {
      params.delete('to')
      params.delete('compose')
      setParams(params)
    }
  }

  function toggleRecipient(email: string) {
    setSelectedEmails((prev) => {
      const next = new Set(prev)
      if (next.has(email)) next.delete(email)
      else next.add(email)
      return next
    })
  }

  function toggleAllRecipients(checked: boolean) {
    if (checked) {
      setSelectedEmails(new Set(matchedRecipients.map((r) => r.email)))
    } else {
      setSelectedEmails(new Set())
    }
  }

  function handleManualAdd(email: string) {
    if (!email) return
    setSelectedEmails((prev) => new Set(prev).add(email))
  }

  function handleCompose(e: React.FormEvent) {
    e.preventDefault()
    if (!composeTo || !subject.trim() || !body.trim()) return
    const resolved = resolveAdminMessageRecipientEmail(composeTo)
    sendAdminMessage({
      toEmail: composeTo,
      subject,
      body,
      deliveryChannels: composeChannels,
      notificationMeta: resolved.orgId ? { orgId: resolved.orgId } : undefined,
    })
    setSubject('')
    setBody('')
    setComposeOrgHint(null)
    setComposeOpen(false)
    reload()
  }

  function handleBatchSend(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !body.trim() || selectedEmails.size === 0) return

    const regionText = hasActiveGeoFilters(geoFilters) ? batchLabel : 'selected recipients'
    const confirmMsg = `Send to ${selectedEmails.size} user${selectedEmails.size === 1 ? '' : 's'} in ${regionText}?`
    if (!window.confirm(confirmMsg)) return

    const summary = sendBatchMessage({
      userEmails: [...selectedEmails],
      subject,
      body,
      deliveryChannels: batchChannels,
      batchLabel,
    })

    setBatchStatus(
      `Sent to ${summary.sent} users` +
        (summary.suspendedIncluded > 0
          ? ` (${summary.suspendedIncluded} suspended included)`
          : '') +
        (summary.smsFailed > 0 ? ` · ${summary.smsFailed} SMS failed` : ''),
    )
    setSubject('')
    setBody('')
    setComposeOpen(false)
    reload()
  }

  function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!activeThread || !replyBody.trim()) return
    sendAdminMessage({
      toEmail: activeThread.participantEmail,
      subject: activeThread.subject.startsWith('Re:')
        ? activeThread.subject
        : `Re: ${activeThread.subject}`,
      body: replyBody,
      deliveryChannels: replyChannels,
    })
    setReplyBody('')
    reload()
  }

  function applyTemplate(t: (typeof POKE_TEMPLATES)[number]) {
    setSubject(t.subject)
    setBody(t.body)
    openCompose()
  }

  function renderComposeFooter() {
    return composeMode === 'single' ? (
      <AdminButton
        type="submit"
        form="compose-single-form"
        variant="primary"
        disabled={!composeTo || !subject.trim() || !body.trim()}
      >
        Send
      </AdminButton>
    ) : (
      <AdminButton
        type="submit"
        form="compose-batch-form"
        variant="primary"
        disabled={batchSendDisabled}
      >
        Send to batch ({selectedEmails.size})
      </AdminButton>
    )
  }

  function renderComposeContent() {
    return (
      <>
        <nav className="mb-4 flex flex-wrap gap-1 border-b border-[var(--admin-border)]">
          {COMPOSE_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setComposeMode(mode.id)}
              className={`relative px-3 py-2 text-xs font-medium transition ${
                composeMode === mode.id
                  ? 'border-b-2 border-[var(--admin-accent)] text-[var(--admin-accent)]'
                  : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </nav>

        {composeMode === 'single' ? (
          <form id="compose-single-form" onSubmit={handleCompose} className="space-y-3">
            <div>
              <p className="admin-label mb-1">Recipient</p>
              <AdminInput
                placeholder="Search name or email…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="mb-2"
              />
              <AdminSelect
                value={composeTo}
                onChange={(e) => {
                  const next = e.target.value
                  setComposeTo(next)
                  const resolved = resolveAdminMessageRecipientEmail(next)
                  setComposeOrgHint(
                    resolved.routedFromOrg && resolved.orgName
                      ? `Messaging ${resolved.orgName} — delivered to owner ${resolved.email}`
                      : null,
                  )
                }}
                required
              >
                <option value="">Select recipient…</option>
                <optgroup label="Users">
                  {filteredUserOptions.map((u) => (
                    <option key={u.email} value={u.email}>
                      {u.firstName} {u.lastName} ({u.email})
                    </option>
                  ))}
                </optgroup>
                {orgRecipientOptions.length > 0 && (
                  <optgroup label="Organizations (owner inbox)">
                    {orgRecipientOptions.map((org) => (
                      <option key={org.orgId} value={org.orgId}>
                        {org.name} — {org.ownerEmail}
                      </option>
                    ))}
                  </optgroup>
                )}
              </AdminSelect>
              {composeOrgHint && (
                <p className="mt-2 text-[11px] text-[var(--admin-text-muted)]">{composeOrgHint}</p>
              )}
            </div>
            <AdminInput
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
            <textarea
              className="admin-input min-h-[120px] resize-y"
              placeholder="Message body…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
            <DeliveryChannelPicker
              channels={composeChannels}
              onChange={setComposeChannels}
              recipientEmail={composeRecipientEmail}
            />
            <div>
              <p className="admin-label mb-1">Quick templates</p>
              <div className="flex flex-wrap gap-1">
                {POKE_TEMPLATES.map((t) => (
                  <AdminButton
                    key={t.id}
                    variant="secondary"
                    className="text-[11px]"
                    type="button"
                    onClick={() => {
                      setSubject(t.subject)
                      setBody(t.body)
                    }}
                  >
                    {t.label}
                  </AdminButton>
                ))}
              </div>
            </div>
          </form>
        ) : (
          <form id="compose-batch-form" onSubmit={handleBatchSend} className="space-y-3">
            <AdminGeoFilterBar filters={geoFilters} onChange={setGeoFilters} />

            <div className="flex flex-wrap items-center gap-2">
              <AdminBadge tone="cyan">
                {selectedEmails.size} recipient{selectedEmails.size === 1 ? '' : 's'}
              </AdminBadge>
              {hasActiveGeoFilters(geoFilters) && (
                <span className="text-[10px] text-[var(--admin-text-dim)]">{batchLabel}</span>
              )}
            </div>

            {hasActiveGeoFilters(geoFilters) && matchedRecipients.length === 0 && (
              <p className="text-xs text-amber-300">No users match filters.</p>
            )}

            {suspendedCount > 0 && (
              <p className="text-[10px] text-[var(--admin-warning)]">
                {suspendedCount} suspended user{suspendedCount === 1 ? '' : 's'} included — they
                can still receive messages.
              </p>
            )}

            <div className="max-h-[280px] overflow-auto">
              <BatchRecipientTable
                recipients={matchedRecipients}
                selectedEmails={selectedEmails}
                onToggle={toggleRecipient}
                onToggleAll={toggleAllRecipients}
              />
            </div>

            <AdminSelect
              value=""
              onChange={(e) => {
                handleManualAdd(e.target.value)
                e.target.value = ''
              }}
            >
              <option value="">Add user manually…</option>
              {manualAddOptions.map((u) => (
                <option key={u.email} value={u.email}>
                  {u.firstName} {u.lastName} ({u.email})
                </option>
              ))}
            </AdminSelect>

            <AdminInput
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
            <textarea
              className="admin-input min-h-[100px] resize-y"
              placeholder="Message body…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
            <DeliveryChannelPicker
              channels={batchChannels}
              onChange={setBatchChannels}
              batchSmsWarning={
                batchChannels.includes('sms') ? batchSmsWarning : undefined
              }
            />
            {batchStatus && (
              <p className="text-[10px] text-[var(--admin-success)]">{batchStatus}</p>
            )}
          </form>
        )}
      </>
    )
  }

  function handleSaveModerationTemplates() {
    saveModerationTemplates(moderationTemplates)
    setModerationSaved(true)
    window.setTimeout(() => setModerationSaved(false), 2400)
  }

  function resetModerationTemplates() {
    setModerationTemplates({ ...DEFAULT_MODERATION_TEMPLATES })
  }

  const batchSendDisabled =
    selectedEmails.size === 0 || !subject.trim() || !body.trim()

  const allThreadsSelected =
    threads.length > 0 && threads.every((t) => selectedThreadIds.has(t.threadId))
  const someThreadsSelected = threads.some((t) => selectedThreadIds.has(t.threadId))
  const bulkThreadIds = [...selectedThreadIds]

  function threadRowMenuItems(thread: MessageThread) {
    if (inboxFilter === 'inbox') {
      return [
        { label: 'Archive', onClick: () => handleArchiveThreads([thread.threadId]) },
        { label: 'Delete', onClick: () => confirmDeleteThreads([thread.threadId], 'delete'), danger: true },
      ]
    }
    if (inboxFilter === 'archived') {
      return [
        { label: 'Restore to inbox', onClick: () => handleRestoreThreads([thread.threadId]) },
        { label: 'Delete', onClick: () => confirmDeleteThreads([thread.threadId], 'delete'), danger: true },
      ]
    }
    return [
      { label: 'Restore to inbox', onClick: () => handleRestoreThreads([thread.threadId]) },
      {
        label: 'Delete permanently',
        onClick: () => confirmDeleteThreads([thread.threadId], 'permanent'),
        danger: true,
      },
    ]
  }

  function handleMessageArchive(messageId: string) {
    if (!archiveMessage(messageId)) return
    showStatus('Message archived')
    reload()
  }

  function handleMessageDelete(messageId: string) {
    if (!deleteMessage(messageId)) return
    showStatus('Message moved to trash')
    reload()
  }

  function handleMessageRestore(messageId: string) {
    if (!restoreMessage(messageId)) return
    showStatus('Message restored to inbox')
    reload()
  }

  return (
    <div className={embedded ? undefined : 'mx-auto max-w-6xl'}>
      {!embedded && (
        <AdminPageHeader
          title="Messaging"
          subtitle="Admin inbox and outreach — compose opens in a side panel so the inbox stays full width."
          actions={
            <AdminButton variant="primary" onClick={() => openCompose()}>
              Compose
            </AdminButton>
          }
        />
      )}

      {statusMessage && (
        <p className="mb-3 rounded-[var(--admin-radius)] border border-[var(--admin-success)]/30 bg-[var(--admin-success)]/10 px-3 py-2 text-xs text-[var(--admin-success)]">
          {statusMessage}
        </p>
      )}

      {showSendExtras && (
      <AdminPanel className="mb-4 border-l-2 border-l-[var(--admin-accent)] bg-[var(--admin-accent-muted)]/40">
        <button
          type="button"
          onClick={() => setInfoExpanded((v) => !v)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <p className="admin-label text-[var(--admin-accent)]">
            How messaging works today
          </p>
          <span className="text-[10px] text-[var(--admin-text-dim)]">
            {infoExpanded ? 'Hide' : 'Show details'}
          </span>
        </button>
        {infoExpanded && (
          <>
            <p className="mt-2 text-xs leading-relaxed text-[var(--admin-text-muted)]">
              Compose and replies are saved to{' '}
              <code className="text-[var(--admin-text-muted)]">tudu-admin-messages</code> in this browser.
              Choose <strong className="font-semibold text-[var(--admin-text)]">Send via</strong> channels
              on each message — in-app delivery writes to{' '}
              <code className="text-[var(--admin-text-muted)]">tudu-user-notifications</code>; email and
              SMS are stubbed (console + activity log) until Phase 2.
            </p>
            <ul className="mt-2 space-y-1 text-xs text-[var(--admin-text-muted)]">
              <li>
                <span className="text-[var(--admin-accent)]">Email (Phase 2)</span> — Resend from{' '}
                <code>noreply@tudu.ca</code> / <code>support@tudu.ca</code>
              </li>
              <li>
                <span className="text-[var(--admin-accent)]">SMS (Phase 2)</span> — Twilio for verified
                phone; Phase 1 marks failed if unverified
              </li>
              <li>
                <span className="text-[var(--admin-accent)]">In-app</span> — My Tudu → Notifications
                tab; bell badge shows unread count
              </li>
              <li>
                <span className="text-[var(--admin-accent)]">Batch / Broadcast</span> — filter by region,
                preview recipients, send to many users at once (individual threads per user)
              </li>
            </ul>
          </>
        )}
      </AdminPanel>
      )}

      {showSendExtras && (
      <div id="moderation-templates">
        <AdminPanel className="mb-4">
          <button
            type="button"
            onClick={() => setModerationExpanded((v) => !v)}
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <p className="admin-label">Moderation templates</p>
            <span className="text-[10px] text-[var(--admin-text-dim)]">
              {moderationExpanded ? 'Hide' : 'Show'}
            </span>
          </button>
          {moderationExpanded && (
            <div className="mt-3 space-y-4">
              <p className="text-xs text-[var(--admin-text-muted)]">
                Automated messages sent when an admin suspends or bans a user from Control Room →
                People. Placeholders:{' '}
                <code className="text-[var(--admin-text-muted)]">{'{{name}}'}</code>,{' '}
                <code className="text-[var(--admin-text-muted)]">{'{{email}}'}</code>,{' '}
                <code className="text-[var(--admin-text-muted)]">{'{{duration}}'}</code>,{' '}
                <code className="text-[var(--admin-text-muted)]">{'{{until}}'}</code>.
              </p>
              <label className="block">
                <span className="admin-label">Suspend — Terms of Service violation</span>
                <textarea
                  className="admin-input mt-1 min-h-[88px] resize-y text-xs"
                  value={moderationTemplates.suspendTermsViolation}
                  onChange={(e) =>
                    setModerationTemplates((prev) => ({
                      ...prev,
                      suspendTermsViolation: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="block">
                <span className="admin-label">Ban — account termination</span>
                <textarea
                  className="admin-input mt-1 min-h-[88px] resize-y text-xs"
                  value={moderationTemplates.banTermination}
                  onChange={(e) =>
                    setModerationTemplates((prev) => ({
                      ...prev,
                      banTermination: e.target.value,
                    }))
                  }
                />
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <AdminButton variant="primary" onClick={handleSaveModerationTemplates}>
                  Save templates
                </AdminButton>
                <AdminButton variant="secondary" onClick={resetModerationTemplates}>
                  Reset defaults
                </AdminButton>
                {moderationSaved && (
                  <span className="text-xs text-[var(--admin-success)]">Saved</span>
                )}
              </div>
            </div>
          )}
        </AdminPanel>
      </div>
      )}

      <div
        className={`grid min-h-[calc(100vh-12rem)] gap-4 ${
          showThreadInbox && !sendOnlyLayout
            ? 'lg:grid-cols-[minmax(240px,320px)_1fr]'
            : 'grid-cols-1'
        }`}
      >
        {showThreadInbox && (
        <AdminPanel className="flex flex-col !p-0">
          <div className="border-b border-[var(--admin-border)] px-3 py-2">
            <p className="admin-label">Inbox</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {INBOX_FILTERS.map((filter) => {
                const Icon = filter.icon
                const count = inboxCounts[filter.id]
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setInboxFilter(filter.id)}
                    className={`inline-flex items-center gap-1 rounded-[var(--admin-radius)] px-2 py-1 text-[10px] font-medium transition ${
                      inboxFilter === filter.id
                        ? 'bg-[var(--admin-accent-muted)] text-[var(--admin-accent)]'
                        : 'text-[var(--admin-text-muted)] hover:bg-white/[0.03] hover:text-[var(--admin-text)]'
                    }`}
                  >
                    <Icon size={12} />
                    {filter.label}
                    {count > 0 && (
                      <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px]">
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {threads.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-[var(--admin-border)] px-3 py-2">
              <label className="flex items-center gap-2 text-[10px] text-[var(--admin-text-muted)]">
                <input
                  type="checkbox"
                  checked={allThreadsSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someThreadsSelected && !allThreadsSelected
                  }}
                  onChange={(e) => toggleAllThreads(e.target.checked)}
                />
                Select all
              </label>
              {selectedThreadIds.size > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-[var(--admin-text-dim)]">
                    {selectedThreadIds.size} selected
                  </span>
                  {inboxFilter === 'inbox' && (
                    <>
                      <AdminButton
                        variant="secondary"
                        className="text-[10px] px-2 py-1"
                        onClick={() => handleArchiveThreads(bulkThreadIds)}
                      >
                        Archive
                      </AdminButton>
                      <AdminButton
                        variant="secondary"
                        className="text-[10px] px-2 py-1"
                        onClick={() => confirmDeleteThreads(bulkThreadIds, 'delete')}
                      >
                        Delete
                      </AdminButton>
                    </>
                  )}
                  {inboxFilter === 'archived' && (
                    <>
                      <AdminButton
                        variant="secondary"
                        className="text-[10px] px-2 py-1"
                        onClick={() => handleRestoreThreads(bulkThreadIds)}
                      >
                        Restore
                      </AdminButton>
                      <AdminButton
                        variant="secondary"
                        className="text-[10px] px-2 py-1"
                        onClick={() => confirmDeleteThreads(bulkThreadIds, 'delete')}
                      >
                        Delete
                      </AdminButton>
                    </>
                  )}
                  {inboxFilter === 'trash' && (
                    <>
                      <AdminButton
                        variant="secondary"
                        className="text-[10px] px-2 py-1"
                        onClick={() => handleRestoreThreads(bulkThreadIds)}
                      >
                        Restore
                      </AdminButton>
                      <AdminButton
                        variant="secondary"
                        className="text-[10px] px-2 py-1"
                        onClick={() => confirmDeleteThreads(bulkThreadIds, 'permanent')}
                      >
                        Delete forever
                      </AdminButton>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="border-b border-[var(--admin-border)] px-3 py-1.5">
            <p className="text-[10px] text-[var(--admin-text-dim)]">
              {threads.length} thread{threads.length === 1 ? '' : 's'}
            </p>
          </div>
          <ul className="flex-1 space-y-0.5 overflow-auto p-2">
            {threads.length === 0 && (
              <li className="px-2 py-4 text-xs text-[var(--admin-text-dim)]">
                {inboxFilter === 'inbox' && 'No messages yet. Click Compose to send your first message.'}
                {inboxFilter === 'archived' && 'No archived threads.'}
                {inboxFilter === 'trash' && 'Trash is empty.'}
              </li>
            )}
            {threads.map((thread) => (
              <li key={thread.threadId}>
                <div
                  className={`flex items-start gap-1 rounded-[var(--admin-radius)] border transition ${
                    activeThreadId === thread.threadId
                      ? 'border-[var(--admin-accent)] bg-[var(--admin-accent-muted)]'
                      : 'border-transparent hover:bg-white/[0.03]'
                  }`}
                >
                  <label className="flex shrink-0 items-center px-2 py-3">
                    <input
                      type="checkbox"
                      checked={selectedThreadIds.has(thread.threadId)}
                      onChange={() => toggleThreadSelection(thread.threadId)}
                      aria-label={`Select thread with ${thread.participantEmail}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => selectThread(thread)}
                    className="min-w-0 flex-1 py-2.5 pr-1 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium">
                        {thread.participantEmail}
                      </span>
                      {thread.unreadCount > 0 && (
                        <span className="admin-badge admin-badge-cyan shrink-0">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-[var(--admin-text-muted)]">
                      {thread.subject}
                    </p>
                    <p className="text-[10px] text-[var(--admin-text-dim)]">
                      {formatRelativeTime(thread.lastTimestamp)}
                    </p>
                  </button>
                  <div className="shrink-0 py-2 pr-1">
                    <AdminRowMenu items={threadRowMenuItems(thread)} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </AdminPanel>
        )}

        {(showThreadInbox || sendOnlyLayout) && (
        <AdminPanel className="flex min-h-[480px] flex-col">
          {!activeThread ? (
            sendOnlyLayout ? (
              <div className="flex flex-1 flex-col overflow-auto py-1">
                <p className="mb-3 text-sm font-semibold">Compose message</p>
                {renderComposeContent()}
                <div className="mt-4 flex justify-end border-t border-[var(--admin-border)] pt-3">
                  {renderComposeFooter()}
                </div>
              </div>
            ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-[var(--admin-text-dim)]">
                Select a thread from the inbox or compose a new message.
              </p>
              <AdminButton variant="primary" onClick={() => openCompose()}>
                Compose message
              </AdminButton>
              <div className="mt-4 flex flex-wrap justify-center gap-1">
                {POKE_TEMPLATES.map((t) => (
                  <AdminButton
                    key={t.id}
                    variant="secondary"
                    className="text-[11px]"
                    onClick={() => applyTemplate(t)}
                  >
                    {t.label}
                  </AdminButton>
                ))}
              </div>
            </div>
            )
          ) : (
            <div className="flex h-full flex-col">
              <div className="border-b border-[var(--admin-border)] pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{activeThread.subject}</p>
                    <p className="text-xs text-[var(--admin-text-muted)]">
                      with {activeThread.participantEmail}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1">
                    {inboxFilter === 'inbox' && (
                      <>
                        <AdminButton
                          variant="secondary"
                          className="text-[10px] px-2 py-1"
                          onClick={() => handleArchiveThreads([activeThread.threadId])}
                        >
                          <Archive size={12} className="mr-1 inline" />
                          Archive
                        </AdminButton>
                        <AdminButton
                          variant="secondary"
                          className="text-[10px] px-2 py-1"
                          onClick={() => confirmDeleteThreads([activeThread.threadId], 'delete')}
                        >
                          <Trash2 size={12} className="mr-1 inline" />
                          Delete
                        </AdminButton>
                      </>
                    )}
                    {inboxFilter === 'archived' && (
                      <>
                        <AdminButton
                          variant="secondary"
                          className="text-[10px] px-2 py-1"
                          onClick={() => handleRestoreThreads([activeThread.threadId])}
                        >
                          <ArchiveRestore size={12} className="mr-1 inline" />
                          Restore
                        </AdminButton>
                        <AdminButton
                          variant="secondary"
                          className="text-[10px] px-2 py-1"
                          onClick={() => confirmDeleteThreads([activeThread.threadId], 'delete')}
                        >
                          Delete
                        </AdminButton>
                      </>
                    )}
                    {inboxFilter === 'trash' && (
                      <>
                        <AdminButton
                          variant="secondary"
                          className="text-[10px] px-2 py-1"
                          onClick={() => handleRestoreThreads([activeThread.threadId])}
                        >
                          Restore
                        </AdminButton>
                        <AdminButton
                          variant="secondary"
                          className="text-[10px] px-2 py-1"
                          onClick={() =>
                            confirmDeleteThreads([activeThread.threadId], 'permanent')
                          }
                        >
                          Delete forever
                        </AdminButton>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-auto py-3">
                {activeThread.messages.map((msg) => {
                  const isDeleted = msg.deleted === true
                  const isArchived = msg.archived === true && !isDeleted
                  return (
                  <div
                    key={msg.id}
                    className={`group relative max-w-[85%] rounded-[var(--admin-radius)] border px-3 py-2 text-xs ${
                      msg.direction === 'outbound'
                        ? 'ml-auto border-[var(--admin-accent)]/30 bg-[var(--admin-accent-muted)]'
                        : 'border-[var(--admin-border)] bg-[var(--admin-bg)]'
                    } ${isDeleted ? 'opacity-60' : ''}`}
                  >
                    {(isArchived || isDeleted) && (
                      <p className="mb-1 text-[10px] text-[var(--admin-text-dim)]">
                        {isDeleted ? 'In trash' : 'Archived'}
                      </p>
                    )}
                    {msg.batchLabel && (
                      <p className="mb-1 text-[10px] text-[var(--admin-accent)]">
                        Batch: {msg.batchLabel}
                      </p>
                    )}
                    {msg.ticketNumber && (
                      <p className="mb-1 font-mono text-[10px] font-semibold text-[var(--admin-accent)]">
                        {msg.ticketNumber}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.body}</p>
                    <DeliveryChannelBadges message={msg} />
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="text-[10px] text-[var(--admin-text-dim)]">
                        {new Date(msg.timestamp).toLocaleString()}
                      </p>
                      <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                        {!isDeleted && !isArchived && inboxFilter === 'inbox' && (
                          <>
                            <button
                              type="button"
                              className="rounded px-1.5 py-0.5 text-[10px] text-[var(--admin-text-muted)] hover:bg-white/5 hover:text-[var(--admin-text)]"
                              onClick={() => handleMessageArchive(msg.id)}
                            >
                              Archive
                            </button>
                            <button
                              type="button"
                              className="rounded px-1.5 py-0.5 text-[10px] text-[var(--admin-danger)] hover:bg-white/5"
                              onClick={() => handleMessageDelete(msg.id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {(isDeleted || isArchived) && (
                          <button
                            type="button"
                            className="rounded px-1.5 py-0.5 text-[10px] text-[var(--admin-accent)] hover:bg-white/5"
                            onClick={() => handleMessageRestore(msg.id)}
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
              {inboxFilter === 'inbox' && (
              <form onSubmit={handleReply} className="border-t border-[var(--admin-border)] pt-3">
                <textarea
                  className="admin-input mb-2 min-h-[72px] resize-y"
                  placeholder="Reply…"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                />
                <DeliveryChannelPicker
                  channels={replyChannels}
                  onChange={setReplyChannels}
                  recipientEmail={activeThread.participantEmail}
                />
                <AdminButton type="submit" variant="primary" className="mt-2">
                  Reply
                </AdminButton>
              </form>
              )}
            </div>
          )}
        </AdminPanel>
        )}
      </div>

      <AdminConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.kind === 'permanent' ? 'Delete permanently' : 'Move to trash'}
        message={
          confirmDialog?.kind === 'permanent'
            ? `Permanently delete ${confirmDialog.threadIds.length} thread${confirmDialog.threadIds.length === 1 ? '' : 's'}? This cannot be undone.`
            : `Move ${confirmDialog?.threadIds.length ?? 0} thread${confirmDialog?.threadIds.length === 1 ? '' : 's'} to trash?`
        }
        confirmLabel={confirmDialog?.kind === 'permanent' ? 'Delete forever' : 'Move to trash'}
        onConfirm={() => {
          if (!confirmDialog) return
          if (confirmDialog.kind === 'permanent') {
            handlePermanentDeleteThreads(confirmDialog.threadIds)
          } else {
            handleDeleteThreads(confirmDialog.threadIds)
            setConfirmDialog(null)
          }
        }}
        onCancel={() => setConfirmDialog(null)}
      />

      <AdminDrawer
        open={composeOpen && !sendOnlyLayout}
        title="Compose message"
        onClose={closeCompose}
        xwide={composeMode === 'batch'}
        footer={renderComposeFooter()}
      >
        {renderComposeContent()}
      </AdminDrawer>
    </div>
  )
}
