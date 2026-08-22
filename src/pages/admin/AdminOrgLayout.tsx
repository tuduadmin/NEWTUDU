import { Link, NavLink, Outlet, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getOrganization, getOrganizationApprovalStatus } from '../../lib/account'
import { getHiddenGemCountForOrg } from '../../lib/hiddenGems'
import { AdminBadge, AdminPageHeader } from '../../components/admin/AdminUI'
import { buildAdminSeedEventCreatePath } from '../../lib/adminSeed'

export default function AdminOrgLayout() {
  const { orgId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const org = getOrganization(orgId)

  if (!org) {
    return (
      <div className="mx-auto max-w-6xl">
        <p className="text-sm text-[var(--admin-text-dim)]">Organization not found.</p>
        <Link
          to="/admin/people?view=orgs"
          className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--admin-accent)] no-underline"
        >
          <ArrowLeft size={14} />
          Back to organizations
        </Link>
      </div>
    )
  }

  const gemCount = getHiddenGemCountForOrg(orgId)
  const status = getOrganizationApprovalStatus(org)

  const tabs = [
    { to: `/admin/organizations/${orgId}`, label: 'Overview', end: true },
    { to: `/admin/organizations/${orgId}/team`, label: 'Team & Access', end: false },
    {
      to: `/admin/organizations/${orgId}/hidden-gems`,
      label: 'Hidden Gems',
      end: false,
      badge: gemCount,
    },
    { to: `/admin/organizations/${orgId}/slideshow`, label: 'Slideshow', end: false },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to={returnTo?.startsWith('/admin') ? returnTo : '/admin/people?view=orgs'}
        className="mb-3 inline-flex items-center gap-1 text-xs text-[var(--admin-text-dim)] no-underline hover:text-[var(--admin-accent)]"
      >
        <ArrowLeft size={14} />
        {returnTo?.includes('hidden-gems') ? 'Content · Hidden Gems' : 'Organizations'}
      </Link>

      <AdminPageHeader
        title={org.name}
        subtitle={`${org.category} · ${org.id}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={buildAdminSeedEventCreatePath({ orgId })}
              className="admin-btn admin-btn-secondary no-underline"
            >
              Seed event
            </Link>
            <StatusBadge status={status} />
            {gemCount > 0 && (
              <AdminBadge tone="amber">{gemCount} hidden gem{gemCount === 1 ? '' : 's'}</AdminBadge>
            )}
          </div>
        }
      />

      <nav className="mb-4 flex flex-wrap gap-1 border-b border-[var(--admin-border)]">
        {tabs.map(({ to, label, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative px-3 py-2 text-xs font-medium no-underline transition ${
                isActive
                  ? 'border-b-2 border-[var(--admin-accent)] text-[var(--admin-accent)]'
                  : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
              }`
            }
          >
            {label}
            {badge !== undefined && badge > 0 && (
              <span className="ml-1.5 inline-flex min-w-[1.1rem] justify-center rounded-[var(--admin-radius)] bg-[#fbbf24]/20 px-1 text-[10px] font-semibold text-[#fbbf24]">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  )
}

function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const tone = status === 'approved' ? 'emerald' : status === 'pending' ? 'amber' : 'rose'
  return <AdminBadge tone={tone}>{status}</AdminBadge>
}
