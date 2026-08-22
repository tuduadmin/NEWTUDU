import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AdminBadge,
  AdminButton,
  AdminDrawer,
  AdminManageButton,
  AdminPanel,
  AdminTable,
} from './AdminUI'
import AdminDiscoverPreviewLink from './AdminDiscoverPreviewLink'
import { findDiscoverEventByTargetId, getDiscoverEventDeepLink } from '../../data/discoverEvents'
import { getEventMetrics } from '../../lib/adminAnalytics'
import { getOrganization } from '../../lib/account'
import {
  deleteOrgHiddenGem,
  formatFullAddress,
  getHiddenGemById,
  getOrgHiddenGems,
  setOrgHiddenGemFeatured,
  setOrgHiddenGemPublished,
  type OrgHiddenGem,
} from '../../lib/hiddenGems'

export default function AdminHiddenGemsPanel() {
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const gems = useMemo(() => {
    void refreshKey
    return getOrgHiddenGems().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [refreshKey])

  const selected = selectedId ? getHiddenGemById(selectedId) : null
  const selectedOrg = selected ? getOrganization(selected.organizationId) : null
  const selectedMetrics = selected ? getEventMetrics(selected.id) : null
  const selectedDiscover = selected ? findDiscoverEventByTargetId(selected.id) : null

  function reload() {
    setRefreshKey((value) => value + 1)
  }

  function refreshSelected(updated: OrgHiddenGem | undefined) {
    reload()
    if (!updated) {
      setSelectedId(null)
    }
  }

  function togglePublish() {
    if (!selected) return
    setOrgHiddenGemPublished(selected.id, !selected.published)
    refreshSelected(getHiddenGemById(selected.id))
  }

  function toggleFeatured() {
    if (!selected) return
    setOrgHiddenGemFeatured(selected.id, !selected.featured)
    refreshSelected(getHiddenGemById(selected.id))
  }

  function handleDelete() {
    if (!selected) return
    if (!window.confirm(`Delete "${selected.title}"? This cannot be undone.`)) return
    deleteOrgHiddenGem(selected.id)
    setSelectedId(null)
    reload()
  }

  function openFullEditor() {
    if (!selected) return
    navigate(
      `/admin/organizations/${selected.organizationId}/hidden-gems?edit=${encodeURIComponent(selected.id)}&returnTo=${encodeURIComponent('/admin/content?view=hidden-gems')}`,
    )
  }

  return (
    <>
      <AdminPanel className="mb-4 border-[#fbbf24]/30">
        <p className="admin-label text-[#fbbf24]">Gold deck border</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--admin-text-muted)]">
          Public, published hidden gems appear on Discover with a thin 1px gold border. Use{' '}
          <strong className="text-[var(--admin-text)]">Manage</strong> to publish, feature, or open
          the full editor — or open{' '}
          <Link to="/admin/people?view=orgs" className="text-[var(--admin-accent)] no-underline">
            Organizers
          </Link>{' '}
          to add gems for an organization.
        </p>
      </AdminPanel>

      <AdminTable columns={['Title', 'Organization', 'City', 'Visibility', 'Status', '']}>
        {gems.length === 0 ? (
          <tr>
            <td colSpan={6} className="py-8 text-center text-sm text-[var(--admin-text-muted)]">
              No hidden gems yet. Open an organization from{' '}
              <Link to="/admin/people?view=orgs" className="text-[var(--admin-accent)] no-underline">
                Organizers
              </Link>{' '}
              to add gems.
            </td>
          </tr>
        ) : (
          gems.map((gem) => {
            const org = getOrganization(gem.organizationId)
            return (
              <tr key={gem.id}>
                <td className="font-medium">{gem.title}</td>
                <td>{org?.name ?? gem.organizationId}</td>
                <td>{gem.location.city || '—'}</td>
                <td>
                  <AdminBadge tone={gem.visibility === 'public' ? 'emerald' : 'neutral'}>
                    {gem.visibility}
                  </AdminBadge>
                </td>
                <td>
                  <AdminBadge tone={gem.published ? 'cyan' : 'amber'}>
                    {gem.published ? 'Published' : 'Draft'}
                  </AdminBadge>
                </td>
                <td className="text-right">
                  <AdminManageButton onClick={() => setSelectedId(gem.id)} />
                </td>
              </tr>
            )
          })
        )}
      </AdminTable>

      <AdminDrawer
        open={!!selected}
        title={selected?.title ?? 'Manage hidden gem'}
        onClose={() => setSelectedId(null)}
        centered
        wide
        footer={
          selected && (
            <div className="flex flex-wrap gap-3">
              <AdminButton variant="primary" onClick={openFullEditor}>
                Open full editor
              </AdminButton>
              <AdminButton variant="secondary" onClick={togglePublish}>
                {selected.published ? 'Unpublish' : 'Publish'}
              </AdminButton>
              <AdminButton variant="secondary" onClick={toggleFeatured}>
                {selected.featured ? 'Unfeature' : 'Feature on deck'}
              </AdminButton>
              {selectedDiscover && (
                <AdminDiscoverPreviewLink
                  href={getDiscoverEventDeepLink(selectedDiscover, {
                    adminReturnTo: '/admin/content?view=hidden-gems',
                  })}
                  variant="secondary"
                />
              )}
              <AdminButton variant="danger" onClick={handleDelete}>
                Delete
              </AdminButton>
              <AdminButton variant="ghost" onClick={() => setSelectedId(null)}>
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
                {selectedOrg?.name ?? selected.organizationId}
              </p>
            </section>

            <section className="flex flex-wrap gap-2">
              <AdminBadge tone={selected.visibility === 'public' ? 'emerald' : 'neutral'}>
                {selected.visibility}
              </AdminBadge>
              <AdminBadge tone={selected.published ? 'cyan' : 'amber'}>
                {selected.published ? 'Published' : 'Draft'}
              </AdminBadge>
              {selected.featured && <AdminBadge tone="amber">Featured</AdminBadge>}
              {selected.category && <AdminBadge tone="neutral">{selected.category}</AdminBadge>}
            </section>

            {selected.description && (
              <section className="space-y-2">
                <p className="admin-label">Description</p>
                <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
                  {selected.description}
                </p>
              </section>
            )}

            <section className="space-y-2">
              <p className="admin-label">Location</p>
              <p className="text-xs text-[var(--admin-text-muted)]">
                {formatFullAddress(selected.location) || selected.location.city || '—'}
              </p>
            </section>

            {selectedMetrics && (
              <section className="grid grid-cols-3 gap-3">
                <div className="admin-panel p-3 text-center">
                  <p className="admin-label">Views</p>
                  <p className="admin-kpi-value text-[var(--admin-accent)]">{selectedMetrics.views}</p>
                </div>
                <div className="admin-panel p-3 text-center">
                  <p className="admin-label">Saves</p>
                  <p className="admin-kpi-value text-[var(--admin-accent)]">{selectedMetrics.saves}</p>
                </div>
                <div className="admin-panel p-3 text-center">
                  <p className="admin-label">Shares</p>
                  <p className="admin-kpi-value text-[var(--admin-accent)]">
                    {selected.metrics?.shares ?? 0}
                  </p>
                </div>
              </section>
            )}

            <section className="space-y-2">
              <p className="admin-label">Organization</p>
              {selectedOrg ? (
                <Link
                  to={`/admin/organizations/${selected.organizationId}/hidden-gems?returnTo=${encodeURIComponent('/admin/content?view=hidden-gems')}`}
                  className="text-xs text-[var(--admin-accent)] no-underline hover:underline"
                >
                  Open {selectedOrg.name} hidden gems →
                </Link>
              ) : (
                <p className="text-xs text-[var(--admin-danger)]">
                  Organization not found ({selected.organizationId}). Use full editor after re-seeding
                  demo orgs.
                </p>
              )}
            </section>
          </div>
        )}
      </AdminDrawer>
    </>
  )
}
