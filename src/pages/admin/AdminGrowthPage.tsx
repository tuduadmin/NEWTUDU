import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AdminChartAppearancePanel from '../../components/admin/AdminChartAppearancePanel'
import AdminGeoFilterBar from '../../components/admin/AdminGeoFilterBar'
import AdminGrowthChart from '../../components/admin/AdminGrowthChart'
import AdminMarketingCampaignsPanel from '../../components/admin/AdminMarketingCampaignsPanel'
import { AdminButton, AdminPageHeader, AdminPanel } from '../../components/admin/AdminUI'
import {
  getGrowthChartPreferences,
  type GrowthChartPreferences,
} from '../../lib/adminChartPreferences'
import {
  getChartData,
  parseAnalyticsChartRange,
  type AnalyticsChartRangeDays,
  type AnalyticsFilters,
} from '../../lib/adminAnalytics'
import { useAdminLiveRefresh } from '../../lib/adminLiveRefresh'
import { getMarketingCampaignsForChart } from '../../lib/adminMarketingCampaigns'

const EMPTY_FILTERS: AnalyticsFilters = {
  country: 'all',
  province: 'all',
  city: 'all',
}

export default function AdminGrowthPage() {
  const [params, setParams] = useSearchParams()
  const chartDays = parseAnalyticsChartRange(params.get('days'))
  const [filters, setFilters] = useState<AnalyticsFilters>(EMPTY_FILTERS)
  const { refreshKey, refresh } = useAdminLiveRefresh()
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<GrowthChartPreferences>(() =>
    getGrowthChartPreferences(),
  )

  useEffect(() => {
    setPreferences(getGrowthChartPreferences())
  }, [refreshKey])

  const chartData = useMemo(
    () => getChartData(chartDays, filters),
    [chartDays, filters, refreshKey],
  )
  const chartCampaigns = useMemo(() => {
    void refreshKey
    return getMarketingCampaignsForChart(chartData)
  }, [chartData, refreshKey])

  function setChartDays(next: AnalyticsChartRangeDays) {
    const nextParams = new URLSearchParams(params)
    if (next === 30) nextParams.delete('days')
    else nextParams.set('days', String(next))
    setParams(nextParams, { replace: true })
  }

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Growth & marketing"
        subtitle="Trend lines, campaign pins, and chart customization — expand here over time."
        actions={
          <AdminButton variant="ghost" onClick={refresh}>
            Refresh
          </AdminButton>
        }
      />

      <AdminPanel className="mb-4">
        <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
          <strong className="text-[var(--admin-text)]">Phase 1:</strong> read-only trend chart with
          localStorage metrics.{' '}
          <Link to="/admin/activity" className="text-[var(--admin-accent)] no-underline hover:underline">
            Activity log
          </Link>{' '}
          is on its own page. Future: exports, UTM attribution, org-scoped views, saved layouts.
        </p>
      </AdminPanel>

      <AdminGeoFilterBar
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(EMPTY_FILTERS)}
      />

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <AdminGrowthChart
            data={chartData}
            rangeDays={chartDays}
            onRangeDaysChange={setChartDays}
            preferences={preferences}
            campaigns={chartCampaigns}
            selectedCampaignId={selectedCampaignId}
            onCampaignClick={setSelectedCampaignId}
          />
          <AdminMarketingCampaignsPanel
            chartData={chartData}
            chartRangeDays={chartDays}
            selectedId={selectedCampaignId}
            onSelect={setSelectedCampaignId}
          />
        </div>
        <AdminChartAppearancePanel preferences={preferences} onChange={setPreferences} />
      </div>
    </div>
  )
}
