import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AdminBadge,
  AdminButton,
  AdminDrawer,
  AdminManageButton,
  AdminPageHeader,
  AdminPanel,
  AdminTable,
} from '../../components/admin/AdminUI'
import { SeedApprovalBadge } from '../../components/admin/SeedApprovalBadge'
import {
  deleteAdminSeedEvent,
  getSeedDraftArchiveEvents,
  processExpiredSeedDraftDeletions,
  restoreSeedEventFromDraftArchive,
  resolveSeedEventHostEmail,
} from '../../lib/adminSeed'
import { getHostAccount, getHostEventById, type HostEventStatus } from '../../lib/account'

type AdminSeedDraftArchivePageProps = {
  embedded?: boolean
}

export default function AdminSeedDraftArchivePage({ embedded = false }: AdminSeedDraftArchivePageProps) {
  const [refresh, setRefresh] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  useEffect(() => {
    processExpiredSeedDraftDeletions()
  }, [refresh])

  const events = useMemo(() => {
    void refresh
    return getSeedDraftArchiveEvents()
  }, [refresh])

  function reload() {
    setRefresh((r) => r + 1)
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

  function handleRestore(eventId: string) {
    const result = restoreSeedEventFromDraftArchive(eventId)
    if (!result.ok) {
      setActionMessage(result.error ?? 'Could not restore seed.')
      return
    }
    setActionMessage('Seed sent back to host for review.')
    reload()
    setSelectedId(null)
  }

  const selected = selectedId ? getHostEventById(selectedId) : null

  return (
    <div className={embedded ? undefined : 'mx-auto max-w-6xl'}>
      {!embedded && (
        <AdminPageHeader
          title="Seed draft archive"
          subtitle="Unaccepted platform seeds on a deletion timer — restore or delete manually."
          actions={
            <Link
              to="/admin/content?view=seed-events"
              className="admin-btn admin-btn-secondary no-underline"
            >
              Back to seed events
            </Link>
          }
        />
      )}

      <AdminPanel className="mb-4 space-y-2">
        <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
          Seeds land here after reminders when the host has not accepted. Each entry auto-deletes on
          its scheduled date unless you restore it or delete it first.
        </p>
        {!embedded && (
          <p className="text-xs text-[var(--admin-text-dim)]">
            {events.length} archived seed{events.length === 1 ? '' : 's'}
          </p>
        )}
      </AdminPanel>

      {events.length === 0 ? (
        <AdminPanel className="py-12 text-center">
          <p className="text-sm text-[var(--admin-text-dim)]">Draft archive is empty.</p>
          <Link
            to="/admin/content?view=seed-events"
            className="admin-btn admin-btn-secondary mt-4 inline-flex no-underline"
          >
            Seed events queue
          </Link>
        </AdminPanel>
      ) : (
        <AdminTable columns={['Title', 'Owner', 'Archived', 'Auto-delete', 'Reminders', '']}>
          {events.map((event) => {
            const org = event.hostAccountId ? getHostAccount(event.hostAccountId) : null
            const owner = org?.name ?? event.displayName ?? event.createdBy
            return (
              <tr key={event.id}>
                <td>
                  <p className="font-medium">{event.title}</p>
                </td>
                <td className="text-xs text-[var(--admin-text-muted)]">{owner}</td>
                <td className="admin-tabular text-xs text-[var(--admin-text-muted)]">
                  {event.seedDraftArchivedAt
                    ? new Date(event.seedDraftArchivedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </td>
                <td className="admin-tabular text-xs text-amber-400">
                  {event.seedScheduledDeleteAt
                    ? new Date(event.seedScheduledDeleteAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                  {event.seedDeleteAfterDays ? (
                    <span className="ml-1 text-[var(--admin-text-dim)]">
                      ({event.seedDeleteAfterDays}d)
                    </span>
                  ) : null}
                </td>
                <td className="text-xs text-[var(--admin-text-muted)]">
                  {event.seedReminderCount ?? 0}
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
        title={selected?.title ?? 'Archived seed'}
        onClose={() => {
          setSelectedId(null)
          setActionMessage(null)
        }}
        centered
        wide
        footer={
          selected && (
            <div className="flex flex-wrap gap-3">
              <AdminButton variant="secondary" onClick={() => handleRestore(selected.id)}>
                Send to host again
              </AdminButton>
              <AdminButton variant="danger" onClick={() => handleDelete(selected.id, selected.title)}>
                Delete event
              </AdminButton>
              <AdminButton variant="secondary" onClick={() => setSelectedId(null)}>
                Close
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
                Host: {resolveSeedEventHostEmail(selected)}
              </p>
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
              <p className="admin-label">Archive</p>
              {selected.seedDraftArchivedAt && (
                <p className="text-xs text-[var(--admin-text-muted)]">
                  Archived{' '}
                  {new Date(selected.seedDraftArchivedAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              )}
              {selected.seedScheduledDeleteAt && (
                <p className="text-xs text-amber-400">
                  Auto-delete{' '}
                  {new Date(selected.seedScheduledDeleteAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  {selected.seedDeleteAfterDays
                    ? ` (${selected.seedDeleteAfterDays}-day period)`
                    : ''}
                </p>
              )}
              {selected.seedReminderCount ? (
                <p className="text-xs text-[var(--admin-text-dim)]">
                  Reminders sent before archive: {selected.seedReminderCount}
                  {selected.seedLastReminderAt
                    ? ` · last ${new Date(selected.seedLastReminderAt).toLocaleString()}`
                    : ''}
                </p>
              ) : null}
            </section>

            {actionMessage && (
              <p className="text-xs text-[var(--admin-accent)]">{actionMessage}</p>
            )}
          </div>
        )}
      </AdminDrawer>
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
