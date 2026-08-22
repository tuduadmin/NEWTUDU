import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AdminEventsAnalyticsPanel,
  AdminEngagementAnalyticsPanel,
  AdminGeographyAnalyticsPanel,
  AdminTicketSalesAnalyticsPanel,
  AdminUsersAnalyticsPanel,
} from '../../components/admin/AdminAnalyticsPanels'
import AdminGeoFilterBar from '../../components/admin/AdminGeoFilterBar'
import {
  AdminKpi,
  AdminKpiGrid,
  AdminPageHeader,
  AdminPanel,
} from '../../components/admin/AdminUI'
import {
  getAnalytics,
  seedDemoAnalytics,
  type AnalyticsFilters,
} from '../../lib/adminAnalytics'
import { useAdminLiveRefresh } from '../../lib/adminLiveRefresh'

seedDemoAnalytics()

export type AnalyticsTab = 'summary' | 'users' | 'events' | 'geography' | 'engagement' | 'tickets'

const ANALYTICS_TABS: { id: AnalyticsTab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'users', label: 'Users' },
  { id: 'events', label: 'Events' },
  { id: 'geography', label: 'Geography' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'tickets', label: 'Tickets' },
]

const EMPTY_FILTERS: AnalyticsFilters = {
  country: 'all',
  province: 'all',
  city: 'all',
}

export function parseAnalyticsTab(raw: string | null): AnalyticsTab {
  if (raw === 'users') return 'users'
  if (raw === 'events') return 'events'
  if (raw === 'geography') return 'geography'
  if (raw === 'engagement') return 'engagement'
  if (raw === 'tickets') return 'tickets'
  return 'summary'
}

export default function AdminAnalyticsPage() {
  const [params, setParams] = useSearchParams()
  const activeTab = parseAnalyticsTab(params.get('tab'))
  const [filters, setFilters] = useState<AnalyticsFilters>(EMPTY_FILTERS)
  const { refreshKey } = useAdminLiveRefresh()

  const analytics = useMemo(() => getAnalytics(filters), [filters, refreshKey])

  function setActiveTab(next: AnalyticsTab) {
    const nextParams = new URLSearchParams(params)
    if (next === 'summary') {
      nextParams.delete('tab')
    } else {
      nextParams.set('tab', next)
    }
    setParams(nextParams, { replace: true })
  }

  function handleClearFilters() {
    setFilters(EMPTY_FILTERS)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Analytics"
        subtitle="Platform KPIs and charts — filter by country, province, and city."
      />

      <AdminGeoFilterBar filters={filters} onChange={setFilters} onClear={handleClearFilters} />

      <nav
        className="mb-4 mt-4 flex flex-wrap gap-1 border-b border-[var(--admin-border)]"
        aria-label="Analytics sections"
      >
        {ANALYTICS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-3 py-2 text-xs font-medium transition ${
              activeTab === tab.id
                ? 'border-b-2 border-[var(--admin-accent)] text-[var(--admin-accent)]'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
            }`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'summary' && (
        <>
          <AdminKpiGrid>
            <AdminKpi label="Total Users" value={analytics.kpis.totalUsers} />
            <AdminKpi label="MAU (30d)" value={analytics.kpis.mau} accent="cyan" />
            <AdminKpi label="DAU (24h)" value={analytics.kpis.dau} accent="emerald" />
            <AdminKpi label="Save Rate" value={analytics.kpis.saveRate} accent="cyan" />
            <AdminKpi
              label="RSVP Conversion"
              value={analytics.kpis.rsvpConversionRate}
              accent="emerald"
            />
            <AdminKpi
              label="Cross-City Interest"
              value={analytics.kpis.crossCityInterest}
              accent="amber"
            />
            <AdminKpi
              label="Signup Trend (WoW)"
              value={analytics.kpis.signupTrendWoW}
              accent={analytics.kpis.signupTrendWoW.startsWith('-') ? 'rose' : 'emerald'}
            />
            <AdminKpi label="Total Events" value={analytics.kpis.totalEvents} />
            <AdminKpi label="Live Public" value={analytics.kpis.livePublicEvents} accent="emerald" />
            <AdminKpi label="Global Views" value={analytics.kpis.globalViews.toLocaleString()} />
            <AdminKpi label="Saved Interest" value={analytics.kpis.savedInterest} />
            <AdminKpi label="Total RSVPs" value={analytics.kpis.totalRsvps} accent="cyan" />
            <AdminKpi
              label="Org verification queue"
              value={analytics.kpis.reviewQueue}
              accent="amber"
            />
            <AdminKpi label="Still open" value={analytics.kpis.feedbackCount} accent="rose" />
          </AdminKpiGrid>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <AdminPanel>
              <p className="admin-label mb-2">Top 5 cities by users</p>
              {analytics.kpis.topCities.length === 0 ? (
                <p className="text-xs text-[var(--admin-text-dim)]">No city data yet.</p>
              ) : (
                <ul className="space-y-2">
                  {analytics.kpis.topCities.map((row) => (
                    <li key={row.city} className="flex justify-between text-xs">
                      <span className="text-[var(--admin-text)]">{row.city}</span>
                      <span className="admin-tabular text-[var(--admin-text-muted)]">
                        {row.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminPanel>

            <AdminPanel>
              <p className="admin-label mb-2">Top search keywords</p>
              {analytics.kpis.topKeywords.length === 0 ? (
                <p className="text-xs text-[var(--admin-text-dim)]">
                  No keyword data yet — tags are tracked when events are viewed or saved.
                </p>
              ) : (
                <ul className="space-y-2">
                  {analytics.kpis.topKeywords.map((row) => (
                    <li key={row.keyword} className="flex justify-between text-xs">
                      <span className="text-[var(--admin-text)]">#{row.keyword}</span>
                      <span className="admin-tabular text-[var(--admin-text-muted)]">
                        {row.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminPanel>
          </div>
        </>
      )}

      {activeTab === 'users' && <AdminUsersAnalyticsPanel filters={filters} refreshKey={refreshKey} />}
      {activeTab === 'events' && <AdminEventsAnalyticsPanel filters={filters} refreshKey={refreshKey} />}
      {activeTab === 'geography' && (
        <AdminGeographyAnalyticsPanel filters={filters} refreshKey={refreshKey} />
      )}
      {activeTab === 'engagement' && (
        <AdminEngagementAnalyticsPanel filters={filters} refreshKey={refreshKey} />
      )}
      {activeTab === 'tickets' && (
        <AdminTicketSalesAnalyticsPanel filters={filters} refreshKey={refreshKey} />
      )}
    </div>
  )
}
