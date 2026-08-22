import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminGeoFilterBar from '../../components/admin/AdminGeoFilterBar'
import {
  AdminBadge,
  AdminButton,
  AdminFilterBar,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminTable,
} from '../../components/admin/AdminUI'
import {
  formatRelativeTime,
  getActivityLog,
  getActivitySubjectOptions,
  getActivityTypeCounts,
  getFilteredActivityLog,
  type ActivitySubjectKind,
  type ActivityType,
  type AnalyticsFilters,
} from '../../lib/adminAnalytics'
import { useAdminLiveRefresh } from '../../lib/adminLiveRefresh'

const EMPTY_FILTERS: AnalyticsFilters = {
  country: 'all',
  province: 'all',
  city: 'all',
}

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  signup: 'Signup',
  event_published: 'Event published',
  signin: 'Sign in',
  page_view: 'Page view',
  feedback: 'Feedback',
  report: 'Report',
  event_report_escalation: 'Event escalation',
  sync: 'Sync',
  access_change: 'Access change',
  user_suspend: 'User suspend',
  user_ban: 'User ban',
  org_suspend: 'Org suspend',
  org_ban: 'Org ban',
  message_delivery: 'Message delivery',
}

function activityTone(type: ActivityType): 'emerald' | 'amber' | 'rose' | 'cyan' | 'neutral' {
  if (type.includes('ban') || type === 'event_report_escalation') return 'rose'
  if (type.includes('suspend')) return 'amber'
  if (type === 'signup' || type === 'event_published') return 'emerald'
  if (type === 'message_delivery') return 'cyan'
  return 'neutral'
}

export default function AdminActivityPage() {
  const { refreshKey, refresh } = useAdminLiveRefresh()
  const [filters, setFilters] = useState<AnalyticsFilters>(EMPTY_FILTERS)
  const [subjectKind, setSubjectKind] = useState<ActivitySubjectKind>('platform')
  const [subjectSearch, setSubjectSearch] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all')
  const [search, setSearch] = useState('')

  const subjectOptions = useMemo(() => {
    void refreshKey
    return getActivitySubjectOptions()
  }, [refreshKey])

  const kindSubjects = useMemo(
    () => subjectOptions.filter((option) => option.kind === subjectKind),
    [subjectOptions, subjectKind],
  )

  const filteredSubjects = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase()
    if (!q) return kindSubjects
    return kindSubjects.filter(
      (option) =>
        option.label.toLowerCase().includes(q) ||
        option.email?.toLowerCase().includes(q) ||
        option.id.toLowerCase().includes(q) ||
        option.tierLabel.toLowerCase().includes(q),
    )
  }, [kindSubjects, subjectSearch])

  const selectedSubject = useMemo(
    () => subjectOptions.find((option) => option.id === subjectId) ?? null,
    [subjectOptions, subjectId],
  )

  const filterOptions = useMemo(
    () => ({
      type: typeFilter,
      search,
      limit: 500,
      excludeNoise: subjectKind === 'platform',
      subject:
        subjectKind === 'user' && subjectId
          ? ({ kind: 'user' as const, email: subjectId })
          : subjectKind === 'org' && subjectId
            ? ({ kind: 'org' as const, orgId: subjectId })
            : ({ kind: 'platform' as const }),
    }),
    [typeFilter, search, subjectKind, subjectId],
  )

  const entries = useMemo(
    () => getFilteredActivityLog(filters, filterOptions),
    [filters, filterOptions, refreshKey],
  )

  const typeCounts = useMemo(
    () =>
      getActivityTypeCounts({
        excludeNoise: filterOptions.excludeNoise,
        subject: filterOptions.subject,
      }),
    [filterOptions, refreshKey, entries.length],
  )

  const totalStored = useMemo(() => {
    void refreshKey
    return getActivityLog().length
  }, [refreshKey, entries.length])

  const subtitle =
    subjectKind === 'platform'
      ? 'Platform actions — moderation, signups, messages. Sign-ins are excluded (DAU/MAU use last active).'
      : subjectKind === 'user'
        ? 'Activity tied to one personal account.'
        : 'Activity tied to one host organization.'

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Activity log"
        subtitle={subtitle}
        actions={
          <AdminButton variant="ghost" onClick={refresh}>
            Refresh
          </AdminButton>
        }
      />

      <AdminPanel className="mb-4">
        <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
          At scale, don&apos;t log every sign-in here — that belongs in analytics aggregates. Use{' '}
          <strong className="text-[var(--admin-text)]">Platform</strong> for ops-worthy events, or pick a{' '}
          <strong className="text-[var(--admin-text)]">User</strong> /{' '}
          <strong className="text-[var(--admin-text)]">Org</strong> to audit one account. Growth charts live on{' '}
          <Link to="/admin/growth" className="text-[var(--admin-accent)] no-underline hover:underline">
            Growth & marketing
          </Link>
          .
        </p>
      </AdminPanel>

      <AdminPanel className="mb-4 space-y-3">
        <span className="admin-label">View</span>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'platform' as const, label: 'Platform' },
              { id: 'user' as const, label: 'User' },
              { id: 'org' as const, label: 'Org' },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                setSubjectKind(mode.id)
                setSubjectId('')
                setSubjectSearch('')
              }}
              className={`rounded-[var(--admin-radius)] border px-2 py-2 text-xs font-semibold transition ${
                subjectKind === mode.id
                  ? 'border-[var(--admin-accent)] bg-[var(--admin-accent-muted)] text-[var(--admin-accent)]'
                  : 'border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:border-[var(--admin-text-dim)]'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {subjectKind !== 'platform' ? (
          <>
            <AdminInput
              value={subjectSearch}
              onChange={(e) => setSubjectSearch(e.target.value)}
              placeholder={subjectKind === 'user' ? 'Search users…' : 'Search orgs…'}
            />
            <div className="max-h-44 overflow-y-auto rounded-[var(--admin-radius)] border border-[var(--admin-border)]">
              {filteredSubjects.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-[var(--admin-text-dim)]">
                  No {subjectKind === 'user' ? 'users' : 'orgs'} match
                </p>
              ) : (
                filteredSubjects.map((option) => {
                  const selected = subjectId === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSubjectId(option.id)}
                      className={`flex w-full items-start justify-between gap-3 border-b border-[var(--admin-border-subtle)] px-3 py-2.5 text-left last:border-b-0 ${
                        selected
                          ? 'bg-[var(--admin-accent-muted)]'
                          : 'hover:bg-[var(--admin-bg)]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-[var(--admin-text)]">
                          {option.label}
                        </p>
                        {option.email ? (
                          <p className="truncate text-[10px] text-[var(--admin-text-dim)]">
                            {option.email}
                          </p>
                        ) : null}
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-medium text-[var(--admin-text-muted)]">
                        <span
                          className="inline-block h-2 w-2 rounded-full ring-1 ring-[var(--admin-border-subtle)]"
                          style={{ backgroundColor: option.tierColor }}
                          aria-hidden
                        />
                        {option.tierLabel}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
            {selectedSubject ? (
              <p className="text-[11px] text-[var(--admin-text-muted)]">
                Showing activity for{' '}
                <span className="font-medium text-[var(--admin-text)]">{selectedSubject.label}</span>
              </p>
            ) : (
              <p className="text-[11px] text-[var(--admin-text-dim)]">
                Select a {subjectKind} to load their activity
              </p>
            )}
          </>
        ) : null}
      </AdminPanel>

      <AdminGeoFilterBar
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(EMPTY_FILTERS)}
      />

      <div className="mb-4 mt-4 flex flex-wrap gap-2">
        {typeCounts.slice(0, 6).map(({ type, count }) => (
          <AdminBadge key={type} tone={activityTone(type)}>
            {ACTIVITY_TYPE_LABELS[type]}: {count}
          </AdminBadge>
        ))}
        <AdminBadge tone="neutral">{totalStored} stored (browser)</AdminBadge>
      </div>

      <AdminFilterBar>
        <AdminSelect
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ActivityType | 'all')}
        >
          <option value="all">All types</option>
          {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map((type) => (
            <option key={type} value={type}>
              {ACTIVITY_TYPE_LABELS[type]}
            </option>
          ))}
        </AdminSelect>
        <AdminInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search label or meta…"
          className="min-w-[200px]"
        />
      </AdminFilterBar>

      <AdminTable columns={['When', 'Type', 'Event', 'Details']}>
        {subjectKind !== 'platform' && !subjectId ? (
          <tr>
            <td colSpan={4} className="py-10 text-center text-sm text-[var(--admin-text-dim)]">
              Pick a {subjectKind} above to view their activity.
            </td>
          </tr>
        ) : entries.length === 0 ? (
          <tr>
            <td colSpan={4} className="py-10 text-center text-sm text-[var(--admin-text-dim)]">
              No activity matches your filters.
            </td>
          </tr>
        ) : (
          entries.map((entry) => (
            <tr key={entry.id}>
              <td className="whitespace-nowrap text-xs text-[var(--admin-text-muted)]">
                <p className="admin-tabular">{new Date(entry.timestamp).toLocaleString()}</p>
                <p className="text-[10px] text-[var(--admin-text-dim)]">
                  {formatRelativeTime(entry.timestamp)}
                </p>
              </td>
              <td>
                <AdminBadge tone={activityTone(entry.type)}>
                  {ACTIVITY_TYPE_LABELS[entry.type] ?? entry.type}
                </AdminBadge>
              </td>
              <td className="max-w-[320px] text-xs text-[var(--admin-text)]">{entry.label}</td>
              <td className="max-w-[240px] text-[10px] text-[var(--admin-text-dim)]">
                {entry.meta ? (
                  <ul className="space-y-0.5">
                    {Object.entries(entry.meta).map(([key, value]) => (
                      <li key={key}>
                        <span className="text-[var(--admin-text-muted)]">{key}:</span> {value}
                      </li>
                    ))}
                  </ul>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))
        )}
      </AdminTable>
    </div>
  )
}
