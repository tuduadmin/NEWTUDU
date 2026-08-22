import { useEffect } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { AdminBadge, AdminPageHeader } from '../../components/admin/AdminUI'
import { getHostEvents, getSeedDraftArchiveEvents, getSeedQueueStage } from '../../lib/account'
import AdminAttractionsPage from './AdminAttractionsPage'
import AdminBucketListsPage from './AdminBucketListsPage'
import AdminEventsPage from './AdminEventsPage'
import AdminHiddenGemsPanel from '../../components/admin/AdminHiddenGemsPanel'
import AdminRoadTripPage from './AdminRoadTripPage'
import AdminSeedEventsPage from './AdminSeedEventsPage'
import AdminSeedDraftArchivePage from './AdminSeedDraftArchivePage'
export type ContentView =
  | 'events'
  | 'seed-events'
  | 'draft-archive'
  | 'attractions'
  | 'hidden-gems'
  | 'bucket-lists'
  | 'road-trip'

const VIEW_TABS: { id: ContentView; label: string }[] = [
  { id: 'events', label: 'Events registry' },
  { id: 'seed-events', label: 'Seed events' },
  { id: 'draft-archive', label: 'Draft archive' },
  { id: 'attractions', label: 'Attractions' },
  { id: 'hidden-gems', label: 'Hidden Gems' },
  { id: 'bucket-lists', label: 'Bucket lists' },
  { id: 'road-trip', label: 'Road trip' },
]

export function parseContentView(raw: string | null): ContentView {
  if (raw === 'seed-events') return 'seed-events'
  if (raw === 'draft-archive') return 'draft-archive'
  if (raw === 'attractions') return 'attractions'
  if (raw === 'secret-list') return 'attractions'
  if (raw === 'hidden-gems') return 'hidden-gems'
  if (raw === 'bucket-lists') return 'bucket-lists'
  if (raw === 'road-trip') return 'road-trip'
  return 'events'
}

function getSubtitle(view: ContentView): string {
  switch (view) {
    case 'seed-events':
      return 'Platform-created discover deck events — approval queue and publishing.'
    case 'draft-archive':
      return 'Unaccepted seeds on a deletion timer — restore or delete manually.'
    case 'attractions':
      return 'Card deck and secret-list place cards — posting mode sets border and discover behavior.'
    case 'hidden-gems':
      return 'Org-owned gold-border deck cards — browse the registry or manage per organization.'
    case 'bucket-lists':
      return 'Platform and user bucket lists — preview and discovery feed.'
    case 'road-trip':
      return 'User road trips — status, stops, and moderation.'
    default:
      return 'All events — moderation, metrics, seed filters, and publishing.'
  }
}

function getPendingSeedCount(): number {
  return getHostEvents().filter(
    (e) => e.seededByAdmin && getSeedQueueStage(e) === 'pending_review',
  ).length
}

function getDraftArchiveCount(): number {
  return getSeedDraftArchiveEvents().length
}

export default function AdminContentPage() {
  const [params, setParams] = useSearchParams()
  const rawView = params.get('view')
  const view = parseContentView(rawView)
  const pendingSeeds = getPendingSeedCount()
  const draftArchiveCount = getDraftArchiveCount()

  useEffect(() => {
    if (rawView === 'host-events') {
      const next = new URLSearchParams(params)
      next.delete('view')
      setParams(next, { replace: true })
      return
    }
    if (!rawView) return
    const normalized = parseContentView(rawView)
    if (rawView !== normalized) {
      const next = new URLSearchParams(params)
      next.set('view', normalized)
      setParams(next, { replace: true })
    }
  }, [rawView, params, setParams])

  if (rawView === 'rollout') {
    return <Navigate to="/admin/rollout" replace />
  }

  function setView(next: ContentView) {
    const nextParams = new URLSearchParams(params)
    if (next === 'events') {
      nextParams.delete('view')
    } else {
      nextParams.set('view', next)
    }
    setParams(nextParams, { replace: true })
  }

  function headerActions() {
    if (view === 'seed-events') {
      return (
        <Link to="/admin/seed-events/create" className="admin-btn admin-btn-primary no-underline">
          <Plus size={16} />
          Add seed event
        </Link>
      )
    }
    if (view === 'bucket-lists') {
      return (
        <Link to="/admin/bucket-lists/create" className="admin-btn admin-btn-primary no-underline">
          Create bucket list
        </Link>
      )
    }
    if (view === 'attractions') {
      return null
    }
    return null
  }

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader title="Content" subtitle={getSubtitle(view)} actions={headerActions()} />

      <nav
        className="mb-4 flex flex-wrap gap-1 border-b border-[var(--admin-border)]"
        aria-label="Content view"
      >
        {VIEW_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition ${
              view === id
                ? 'border-b-2 border-[var(--admin-accent)] text-[var(--admin-accent)]'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
            }`}
            aria-current={view === id ? 'page' : undefined}
          >
            {label}
            {id === 'seed-events' && pendingSeeds > 0 && (
              <AdminBadge tone="amber">{pendingSeeds}</AdminBadge>
            )}
            {id === 'draft-archive' && draftArchiveCount > 0 && (
              <AdminBadge tone="neutral">{draftArchiveCount}</AdminBadge>
            )}
          </button>
        ))}
      </nav>

      {view === 'events' && <AdminEventsPage embedded />}
      {view === 'seed-events' && <AdminSeedEventsPage embedded />}
      {view === 'draft-archive' && <AdminSeedDraftArchivePage embedded />}
      {view === 'attractions' && <AdminAttractionsPage embedded />}
      {view === 'hidden-gems' && <AdminHiddenGemsPanel />}
      {view === 'bucket-lists' && <AdminBucketListsPage embedded />}
      {view === 'road-trip' && <AdminRoadTripPage embedded />}
    </div>
  )
}
