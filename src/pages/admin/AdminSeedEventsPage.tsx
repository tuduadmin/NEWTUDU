import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  AdminBadge,
  AdminButton,
  AdminDrawer,
  AdminFilterBar,
  AdminManageButton,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminTable,
} from '../../components/admin/AdminUI'
import { SeedApprovalBadge, seedApprovalMenuItems } from '../../components/admin/SeedApprovalBadge'
import SharePublishModal from '../../components/SharePublishModal'
import {
  archiveSeedEventToDraft,
  deleteAdminSeedEvent,
  getSeedEventsInQueue,
  sendSeedEventReminder,
  submitSeedEventForReview,
  resolveSeedEventHostEmail,
  SEED_DRAFT_DELETE_DAY_OPTIONS,
  type SeedDraftDeleteDays,
} from '../../lib/adminSeed'
import {
  approveSeedEvent,
  getAcceptedSeedEvents,
  getHostAccount,
  getHostEventById,
  getSeedQueueStage,
  isSeedEventInDiscoverDeck,
  rejectSeedEvent,
  type HostEventStatus,
} from '../../lib/account'
import type { DeliveryChannel } from '../../lib/userNotifications'

type SeedFilter = 'queue' | 'draft' | 'pending_review' | 'rejected' | 'accepted'

type AdminSeedEventsPageProps = {
  embedded?: boolean
}

export default function AdminSeedEventsPage({ embedded = false }: AdminSeedEventsPageProps) {
  const [refresh, setRefresh] = useState(0)
  const [seedFilter, setSeedFilter] = useState<SeedFilter>('queue')
  const [shareEventId, setShareEventId] = useState<string | null>(null)
  const [sharePublishedJustNow, setSharePublishedJustNow] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reminderSms, setReminderSms] = useState(true)
  const [reminderInApp, setReminderInApp] = useState(true)
  const [deleteAfterDays, setDeleteAfterDays] = useState<SeedDraftDeleteDays>(30)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const events = useMemo(() => {
    void refresh
    let list =
      seedFilter === 'accepted'
        ? getAcceptedSeedEvents()
        : getSeedEventsInQueue()

    if (seedFilter === 'draft') {
      list = list.filter((e) => getSeedQueueStage(e) === 'draft')
    } else if (seedFilter === 'pending_review') {
      list = list.filter((e) => getSeedQueueStage(e) === 'pending_review')
    } else if (seedFilter === 'rejected') {
      list = list.filter((e) => getSeedQueueStage(e) === 'rejected')
    }

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [seedFilter, refresh])

  function reload() {
    setRefresh((r) => r + 1)
  }

  function handleSendReminder(eventId: string) {
    const channels: DeliveryChannel[] = []
    if (reminderSms) channels.push('sms')
    if (reminderInApp) channels.push('in_app')
    const result = sendSeedEventReminder(eventId, channels)
    if (!result.ok) {
      setActionMessage(result.error ?? 'Could not send reminder.')
      return
    }
    setActionMessage(
      `Reminder #${result.event?.seedReminderCount ?? 1} sent via ${channels.join(' + ')}.`,
    )
    reload()
  }

  function handleArchiveToDraft(eventId: string) {
    if (
      !window.confirm(
        `Move this seed to the draft archive and auto-delete in ${deleteAfterDays} days if still unaccepted?`,
      )
    ) {
      return
    }
    const result = archiveSeedEventToDraft(eventId, deleteAfterDays)
    if (!result.ok) {
      setActionMessage(result.error ?? 'Could not archive seed.')
      return
    }
    setActionMessage(`Moved to draft archive — scheduled deletion in ${deleteAfterDays} days.`)
    reload()
    setSelectedId(null)
  }

  function handleSubmitForReview(eventId: string) {
    const result = submitSeedEventForReview(eventId)
    if (!result.ok) {
      setActionMessage(result.error ?? 'Could not send for review.')
      return
    }
    setActionMessage('Sent to host for review.')
    reload()
    setSelectedId(null)
  }

  function handleDelete(eventId: string, title: string) {
    if (!window.confirm(`Permanently delete "${title}"? This cannot be undone.`)) return
    const result = deleteAdminSeedEvent(eventId)
    if (!result.ok) {
      setActionMessage(result.error ?? 'Could not delete event.')
      return
    }
    setActionMessage('Event deleted.')
    reload()
    setSelectedId(null)
  }

  function handleApprove(eventId: string) {
    const result = approveSeedEvent(eventId)
    reload()
    if (result.ok && result.event && isSeedEventInDiscoverDeck(result.event)) {
      setSharePublishedJustNow(true)
      setShareEventId(eventId)
    }
  }

  function openShare(eventId: string) {
    setSharePublishedJustNow(false)
    setShareEventId(eventId)
  }

  const selected = selectedId ? getHostEventById(selectedId) : null
  const selectedStage = selected ? getSeedQueueStage(selected) : null

  return (
    <div className={embedded ? undefined : 'mx-auto max-w-6xl'}>
      {!embedded && (
        <AdminPageHeader
          title="Seed Events"
          subtitle="Platform-created events awaiting host review — accepted seeds move to Events registry."
          actions={
            <Link to="/admin/seed-events/create" className="admin-btn admin-btn-primary no-underline">
              <Plus size={16} />
              Add seed event
            </Link>
          }
        />
      )}

      <AdminPanel className="mb-4 space-y-3">
        <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
          <strong>Flow:</strong> Admin creates seed →{' '}
          <strong className="text-[var(--admin-text)]">Draft</strong> or{' '}
          <strong className="text-[var(--admin-text)]">Pending review</strong> → host approves in{' '}
          <strong className="text-[var(--admin-text)]">Event Manager</strong> →{' '}
          <strong className="text-[var(--admin-text)]">Accepted</strong>. If the host does not respond,
          send SMS/in-app reminders, then move to{' '}
          <Link
            to="/admin/content?view=draft-archive"
            className="text-[var(--admin-accent)] no-underline hover:underline"
          >
            Draft archive
          </Link>{' '}
          with a deletion period.
        </p>
        <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
          This tab only lists seeds still in the pipeline. Once accepted, they leave this queue and appear under{' '}
          <Link to="/admin/content" className="text-[var(--admin-accent)] no-underline hover:underline">
            Events registry
          </Link>
          .
        </p>
      </AdminPanel>

      <AdminFilterBar>
        <AdminSelect
          value={seedFilter}
          onChange={(e) => setSeedFilter(e.target.value as SeedFilter)}
        >
          <option value="queue">In queue (not accepted)</option>
          <option value="draft">Draft</option>
          <option value="pending_review">Pending host review</option>
          <option value="rejected">Declined</option>
          <option value="accepted">Accepted (archive)</option>
        </AdminSelect>
      </AdminFilterBar>

      {events.length === 0 ? (
        <AdminPanel className="py-12 text-center">
          <p className="text-sm text-[var(--admin-text-dim)]">
            {seedFilter === 'queue'
              ? 'No seeds in the queue — all caught up.'
              : seedFilter === 'accepted'
                ? 'No accepted seeds yet.'
                : `No ${seedFilter.replace('_', ' ')} seeds.`}
          </p>
          {seedFilter === 'queue' && (
            <Link
              to="/admin/seed-events/create"
              className="admin-btn admin-btn-primary mt-4 inline-flex no-underline"
            >
              Create seed event
            </Link>
          )}
        </AdminPanel>
      ) : (
        <AdminTable columns={['Title', 'Owner', 'Stage', 'Event status', 'Posted', 'Discover', '']}>
          {events.map((event) => {
            const org = event.hostAccountId ? getHostAccount(event.hostAccountId) : null
            const owner = org?.name ?? event.displayName ?? event.createdBy
            const stage = getSeedQueueStage(event)
            return (
              <tr key={event.id}>
                <td>
                  <p className="font-medium">{event.title}</p>
                </td>
                <td className="text-xs text-[var(--admin-text-muted)]">{owner}</td>
                <td>
                  <SeedApprovalBadge event={event} />
                </td>
                <td>
                  <StatusBadge status={event.status} />
                </td>
                <td className="admin-tabular text-[var(--admin-text-muted)]">
                  {new Date(event.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td>
                  {isSeedEventInDiscoverDeck(event) ? (
                    <Link
                      to="/discover"
                      className="text-xs text-[var(--admin-accent)] no-underline hover:underline"
                    >
                      Live in deck →
                    </Link>
                  ) : stage === 'pending_review' ? (
                    <span className="text-xs text-amber-400">Awaiting host</span>
                  ) : stage === 'draft' ? (
                    <span className="text-xs text-[var(--admin-text-dim)]">Not sent yet</span>
                  ) : stage === 'rejected' ? (
                    <span className="text-xs text-rose-400">Declined</span>
                  ) : stage === 'accepted' ? (
                    <span className="text-xs text-[var(--admin-text-muted)]">In registry</span>
                  ) : (
                    <span className="text-[var(--admin-text-dim)]">—</span>
                  )}
                </td>
                <td className="text-right">
                  <AdminManageButton onClick={() => setSelectedId(event.id)} />
                </td>
              </tr>
            )
          })}
        </AdminTable>
      )}

      <AdminDrawer
        open={!!selected}
        title={selected?.title ?? 'Manage seed event'}
        onClose={() => {
          setSelectedId(null)
          setActionMessage(null)
        }}
        centered
        wide
        footer={
          selected && (
            <div className="flex flex-wrap gap-3">
              {isSeedEventInDiscoverDeck(selected) && (
                <AdminButton variant="secondary" onClick={() => openShare(selected.id)}>
                  Share
                </AdminButton>
              )}
              {selectedStage === 'accepted' && (
                <Link
                  to={`/admin/content?eventId=${encodeURIComponent(selected.id)}`}
                  className="admin-btn admin-btn-secondary no-underline"
                  onClick={() => setSelectedId(null)}
                >
                  Open in registry
                </Link>
              )}
              <AdminButton variant="secondary" onClick={() => setSelectedId(null)}>
                Close
              </AdminButton>
              <AdminButton
                variant="danger"
                onClick={() => handleDelete(selected.id, selected.title)}
              >
                Delete event
              </AdminButton>
            </div>
          )
        }
      >
        {selected && (
          <div className="space-y-6 text-sm">
            <section className="space-y-2">
              <p className="admin-label">Overview</p>
              <p className="font-medium">{selected.title}</p>
              <p className="text-xs text-[var(--admin-text-muted)]">
                {selected.hostAccountId
                  ? getHostAccount(selected.hostAccountId)?.name
                  : selected.displayName ?? selected.createdBy}
              </p>
            </section>

            <section className="flex flex-wrap gap-2">
              <SeedApprovalBadge event={selected} />
              <StatusBadge status={selected.status} />
            </section>

            <section className="space-y-2">
              <p className="admin-label">Queue stage</p>
              <p className="text-xs capitalize text-[var(--admin-text-muted)]">
                {selectedStage?.replace('_', ' ') ?? '—'}
              </p>
              {selected.seedReminderCount ? (
                <p className="text-xs text-[var(--admin-text-dim)]">
                  Reminders sent: {selected.seedReminderCount}
                  {selected.seedLastReminderAt
                    ? ` · last ${new Date(selected.seedLastReminderAt).toLocaleString()}`
                    : ''}
                </p>
              ) : null}
            </section>

            {selectedStage === 'pending_review' && (
              <section className="space-y-3 rounded-[var(--admin-radius)] border border-[var(--admin-border-subtle)] p-3">
                <p className="admin-label">Send reminder</p>
                <p className="text-xs text-[var(--admin-text-muted)]">
                  Host has not accepted yet — nudge via SMS and/or in-app message to{' '}
                  {resolveSeedEventHostEmail(selected)}.
                </p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={reminderSms}
                      onChange={(e) => setReminderSms(e.target.checked)}
                      className="h-4 w-4 accent-[var(--admin-accent)]"
                    />
                    SMS text
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={reminderInApp}
                      onChange={(e) => setReminderInApp(e.target.checked)}
                      className="h-4 w-4 accent-[var(--admin-accent)]"
                    />
                    In-app messaging
                  </label>
                </div>
                <AdminButton
                  variant="secondary"
                  onClick={() => handleSendReminder(selected.id)}
                  disabled={!reminderSms && !reminderInApp}
                >
                  Send reminder
                </AdminButton>
              </section>
            )}

            {(selectedStage === 'pending_review' || selectedStage === 'rejected') && (
              <section className="space-y-3 rounded-[var(--admin-radius)] border border-[var(--admin-border-subtle)] p-3">
                <p className="admin-label">Draft archive</p>
                <p className="text-xs text-[var(--admin-text-muted)]">
                  If the host still does not accept, move to{' '}
                  <Link
                    to="/admin/content?view=draft-archive"
                    className="text-[var(--admin-accent)] no-underline hover:underline"
                  >
                    Draft archive
                  </Link>{' '}
                  and set a deletion period.
                </p>
                <label className="block text-xs">
                  <span className="admin-label">Delete after</span>
                  <AdminSelect
                    className="mt-1"
                    value={String(deleteAfterDays)}
                    onChange={(e) => setDeleteAfterDays(Number(e.target.value) as SeedDraftDeleteDays)}
                  >
                    {SEED_DRAFT_DELETE_DAY_OPTIONS.map((days) => (
                      <option key={days} value={days}>
                        {days} days
                      </option>
                    ))}
                  </AdminSelect>
                </label>
                <AdminButton variant="danger" onClick={() => handleArchiveToDraft(selected.id)}>
                  Move to draft archive
                </AdminButton>
              </section>
            )}

            {actionMessage && (
              <p className="text-xs text-[var(--admin-accent)]">{actionMessage}</p>
            )}

            <section className="flex flex-wrap gap-3">
              {seedApprovalMenuItems(
                selected,
                () => {
                  handleApprove(selected.id)
                  setSelectedId(null)
                },
                () => {
                  if (window.confirm('Decline this seed event?')) {
                    rejectSeedEvent(selected.id)
                    reload()
                    setSelectedId(null)
                  }
                },
                () => handleSubmitForReview(selected.id),
              ).map((item) => (
                <AdminButton
                  key={item.label}
                  variant={item.danger ? 'danger' : 'secondary'}
                  onClick={item.onClick}
                >
                  {item.label}
                </AdminButton>
              ))}
            </section>
          </div>
        )}
      </AdminDrawer>

      <SharePublishModal
        open={!!shareEventId}
        event={shareEventId ? (getHostEventById(shareEventId) ?? null) : null}
        onClose={() => {
          setShareEventId(null)
          setSharePublishedJustNow(false)
        }}
        variant="admin"
        publishedJustNow={sharePublishedJustNow}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: HostEventStatus }) {
  const tone =
    status === 'live'
      ? 'emerald'
      : status === 'upcoming'
        ? 'cyan'
        : status === 'draft'
          ? 'neutral'
          : 'amber'
  return <AdminBadge tone={tone}>{status}</AdminBadge>
}
