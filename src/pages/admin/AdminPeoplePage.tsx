import { useEffect } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import AdminOrganizationsPanel from '../../components/admin/AdminOrganizationsPanel'
import AdminTuduBlackPanel from '../../components/admin/AdminTuduBlackPanel'
import AdminUsersPanel from '../../components/admin/AdminUsersPanel'
import { AdminBadge, AdminPageHeader } from '../../components/admin/AdminUI'
import type { OrgApprovalStatus } from '../../lib/account'
import { getPendingOrgVerificationCount } from '../../lib/orgVerificationRequests'
import TuduBlackMark from '../../components/admin/TuduBlackMark'
import { getTuduBlackStats, TUDU_BLACK_DISPLAY_NAME } from '../../lib/adminTuduBlack'

export type PeopleView = 'users' | 'orgs' | 'tudu-black'

const VIEW_TABS: { id: PeopleView; label: string }[] = [
  { id: 'users', label: 'Users' },
  { id: 'orgs', label: 'Organizers' },
  { id: 'tudu-black', label: TUDU_BLACK_DISPLAY_NAME },
]

export function parsePeopleView(raw: string | null): PeopleView {
  if (raw === 'orgs') return 'orgs'
  if (raw === 'tudu-black') return 'tudu-black'
  return 'users'
}

export function parseOrgStatusFilter(
  status: string | null,
  tab: string | null,
): 'all' | OrgApprovalStatus {
  if (status === 'pending' || status === 'approved' || status === 'rejected') {
    return status
  }
  if (tab === 'pending') return 'pending'
  return 'all'
}

function getSubtitle(view: PeopleView): string {
  if (view === 'orgs') {
    return 'Host organizations and event organizers — approval, team access, and verification.'
  }
  if (view === 'tudu-black') {
    return 'Invitation-only luxury membership — waitlist, benefits, and program config.'
  }
  return 'Consumer accounts — suspend blocks posting; ban blocks sign-in.'
}

export default function AdminPeoplePage() {
  const [params, setParams] = useSearchParams()
  const rawView = params.get('view')
  const view = parsePeopleView(rawView)
  const orgStatusFilter = parseOrgStatusFilter(params.get('status'), params.get('tab'))
  const pendingCount = getPendingOrgVerificationCount()
  const tuduBlackPending = getTuduBlackStats().pending

  useEffect(() => {
    const nextParams = new URLSearchParams(params)
    let changed = false

    if (!rawView || rawView === 'all') {
      nextParams.set('view', 'users')
      changed = true
    }

    if (rawView === 'orgs' && params.get('tab') === 'pending' && !params.get('status')) {
      nextParams.set('status', 'pending')
      nextParams.delete('tab')
      changed = true
    }

    if (changed) {
      setParams(nextParams, { replace: true })
    }
  }, [rawView, params, setParams])

  if (rawView === 'hidden-gems') {
    return <Navigate to="/admin/content?view=hidden-gems" replace />
  }

  function setView(next: PeopleView) {
    const nextParams = new URLSearchParams(params)
    nextParams.set('view', next)
    nextParams.delete('tab')
    nextParams.delete('status')
    setParams(nextParams, { replace: true })
  }

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader title="Users & Organizations" subtitle={getSubtitle(view)} />

      <nav
        className="mb-4 flex flex-wrap gap-1 border-b border-[var(--admin-border)]"
        aria-label="People view"
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
            {id === 'tudu-black' ? (
              <TuduBlackMark size="sm" showLabel />
            ) : (
              label
            )}
            {id === 'orgs' && pendingCount > 0 && (
              <AdminBadge tone="amber">{pendingCount}</AdminBadge>
            )}
            {id === 'tudu-black' && tuduBlackPending > 0 && (
              <AdminBadge tone="amber">{tuduBlackPending}</AdminBadge>
            )}
          </button>
        ))}
      </nav>

      {view === 'users' && <AdminUsersPanel />}

      {view === 'orgs' && (
        <AdminOrganizationsPanel initialStatusFilter={orgStatusFilter} />
      )}

      {view === 'tudu-black' && <AdminTuduBlackPanel />}
    </div>
  )
}
