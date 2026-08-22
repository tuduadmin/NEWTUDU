import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPin, Maximize2, Minimize2 } from 'lucide-react'
import { AdminButton, AdminPanel, AdminSelect } from './AdminUI'
import type { ChartPoint } from '../../lib/adminAnalytics'
import {
  ANALYTICS_CHART_RANGE_OPTIONS,
  type AnalyticsChartRangeDays,
} from '../../lib/adminAnalytics'
import {
  getEnabledGrowthSeries,
  getSeriesValue,
  GROWTH_SERIES_CATALOG,
  type GrowthChartPreferences,
  type GrowthSeriesId,
} from '../../lib/adminChartPreferences'
import {
  getMarketingChannelPinColor,
  MARKETING_CHANNEL_LABELS,
  type MarketingCampaign,
  type MarketingChannel,
} from '../../lib/adminMarketingCampaigns'

type AdminGrowthChartProps = {
  data: ChartPoint[]
  rangeDays?: AnalyticsChartRangeDays
  onRangeDaysChange?: (days: AnalyticsChartRangeDays) => void
  preferences: GrowthChartPreferences
  campaigns?: Pick<MarketingCampaign, 'id' | 'name' | 'date' | 'channel'>[]
  selectedCampaignId?: string | null
  onCampaignClick?: (campaignId: string) => void
  fullscreenEnabled?: boolean
}

export default function AdminGrowthChart({
  data,
  rangeDays = 30,
  onRangeDaysChange,
  preferences,
  campaigns = [],
  selectedCampaignId = null,
  onCampaignClick,
  fullscreenEnabled = true,
}: AdminGrowthChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const enabledSeries = useMemo(
    () => getEnabledGrowthSeries(preferences),
    [preferences],
  )
  const lineSeries = useMemo(
    () => enabledSeries.filter((series) => series.chartStyle === 'line'),
    [enabledSeries],
  )
  const barSeries = useMemo(
    () => enabledSeries.filter((series) => series.chartStyle === 'bar'),
    [enabledSeries],
  )
  const campaignsByDate = useMemo(() => {
    const map = new Map<string, typeof campaigns>()
    for (const campaign of campaigns) {
      const bucket = map.get(campaign.date) ?? []
      bucket.push(campaign)
      map.set(campaign.date, bucket)
    }
    return map
  }, [campaigns])
  const pinChannelLegend = useMemo(() => {
    const channels = new Set<MarketingChannel>()
    for (const campaign of campaigns) channels.add(campaign.channel)
    return [...channels]
  }, [campaigns])

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  if (data.length === 0) {
    return (
      <AdminPanel className="p-6 text-center text-sm text-[var(--admin-text-dim)]">
        No chart data for this range yet.
      </AdminPanel>
    )
  }

  const maxVal = Math.max(
    1,
    ...data.flatMap((point) => enabledSeries.map((series) => getSeriesValue(point, series.id))),
  )
  const plotBottom = 40
  const plotHeight = 34
  const labelEvery =
    data.length <= 14 ? 1 : data.length <= 31 ? 1 : data.length <= 60 ? 2 : 3

  function plotY(value: number): number {
    return plotBottom - (value / maxVal) * plotHeight
  }

  function plotX(index: number): number {
    return ((index + 0.5) / data.length) * 100
  }

  function columnWidth(): number {
    return 100 / data.length
  }

  function barGeometry(
    index: number,
    seriesIndex: number,
    seriesCount: number,
  ): { x: number; width: number } {
    const col = columnWidth()
    const groupWidth = col * 0.72
    const barWidth = groupWidth / Math.max(1, seriesCount)
    const x =
      index * col + (col - groupWidth) / 2 + seriesIndex * barWidth + barWidth * 0.075
    return { x, width: barWidth * 0.85 }
  }

  function seriesPath(id: GrowthSeriesId): string {
    return data
      .map((point, index) => {
        const cmd = index === 0 ? 'M' : 'L'
        return `${cmd} ${plotX(index)} ${plotY(getSeriesValue(point, id))}`
      })
      .join(' ')
  }

  function formatTooltipDate(isoDate: string): string {
    const date = new Date(`${isoDate}T12:00:00`)
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function monthLabel(isoDate: string): string {
    return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, { month: 'short' })
  }

  function dayLabel(isoDate: string): number {
    return new Date(`${isoDate}T12:00:00`).getDate()
  }

  async function toggleFullscreen() {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await el.requestFullscreen()
    }
  }

  return (
    <div
      ref={containerRef}
      className={`admin-panel p-3 ${isFullscreen ? 'admin-chart-fullscreen min-h-screen' : ''}`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="admin-label">Growth — {rangeDays} days</p>
          {onRangeDaysChange && (
            <AdminSelect
              value={rangeDays}
              onChange={(e) =>
                onRangeDaysChange(Number(e.target.value) as AnalyticsChartRangeDays)
              }
              className="!w-auto min-w-[5.5rem] py-1 text-[10px]"
              aria-label="Chart date range"
            >
              {ANALYTICS_CHART_RANGE_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  {days}d
                </option>
              ))}
            </AdminSelect>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex flex-wrap justify-end gap-3 text-[10px] text-[var(--admin-text-muted)]">
            {enabledSeries.map((series) => (
              <span key={series.id} className="flex items-center gap-1">
                {series.chartStyle === 'bar' ? (
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: series.color }}
                  />
                ) : (
                  <span
                    className="inline-block h-0.5 w-3 rounded-full"
                    style={{ backgroundColor: series.color }}
                  />
                )}
                {series.shortLabel}
              </span>
            ))}
            {pinChannelLegend.length > 0 && (
              <>
                <span className="text-[var(--admin-text-dim)]">·</span>
                {pinChannelLegend.map((channel) => (
                  <span key={channel} className="flex items-center gap-1">
                    <MapPin size={10} style={{ color: getMarketingChannelPinColor(channel) }} aria-hidden />
                    {MARKETING_CHANNEL_LABELS[channel]}
                  </span>
                ))}
              </>
            )}
          </div>
          {fullscreenEnabled && (
            <AdminButton
              variant="ghost"
              className="!px-2 !py-1"
              onClick={() => void toggleFullscreen()}
              aria-label={isFullscreen ? 'Exit full screen' : 'Full screen chart'}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </AdminButton>
          )}
        </div>
      </div>

      {enabledSeries.length === 0 ? (
        <p className="py-10 text-center text-xs text-[var(--admin-text-dim)]">
          Enable at least one metric in Chart appearance to render the chart.
        </p>
      ) : (
        <>
          <div className="relative overflow-visible pt-5">
            <svg viewBox="0 0 100 40" className="admin-chart" preserveAspectRatio="none" aria-hidden>
              {[0.25, 0.5, 0.75].map((fraction) => (
                <line
                  key={fraction}
                  x1={0}
                  x2={100}
                  y1={plotBottom - plotHeight * fraction}
                  y2={plotBottom - plotHeight * fraction}
                  stroke="var(--admin-chart-grid)"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {barSeries.map((series, seriesIndex) =>
                data.map((point, index) => {
                  const value = getSeriesValue(point, series.id)
                  if (value <= 0) return null
                  const { x, width } = barGeometry(index, seriesIndex, barSeries.length)
                  const y = plotY(value)
                  const height = plotBottom - y
                  return (
                    <rect
                      key={`bar-${series.id}-${point.date}`}
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={series.color}
                      opacity={0.82}
                      rx={0.4}
                    />
                  )
                }),
              )}
              {lineSeries.map((series) => (
                <path
                  key={`line-${series.id}`}
                  d={seriesPath(series.id)}
                  className="admin-chart-line"
                  stroke={series.color}
                  strokeWidth={series.strokeWidth}
                />
              ))}
            </svg>

            <div className="pointer-events-none absolute inset-0 flex">
              {data.map((point) => {
                const dayCampaigns = campaignsByDate.get(point.date) ?? []
                return (
                <div key={point.date} className="group relative min-w-0 flex-1">
                  <div className="pointer-events-auto absolute inset-x-0 bottom-0 top-0 z-10" />
                  <div className="admin-chart-tooltip pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden -translate-x-1/2 rounded-[var(--admin-radius)] px-3 py-2 text-[10px] group-hover:block">
                    <p className="font-semibold text-slate-800">
                      {formatTooltipDate(point.date)}
                    </p>
                    <ul className="mt-1 space-y-0.5 text-slate-600">
                      {GROWTH_SERIES_CATALOG.map((def) => {
                        const pref = preferences.series[def.id]
                        if (!pref?.enabled) return null
                        return (
                          <li key={def.id}>
                            {def.shortLabel}:{' '}
                            <span className="admin-tabular font-semibold" style={{ color: pref.color }}>
                              {getSeriesValue(point, def.id)}
                            </span>
                          </li>
                        )
                      })}
                      {dayCampaigns.map((campaign) => (
                        <li key={campaign.id} className="text-slate-700">
                          <MapPin
                            size={9}
                            className="mr-0.5 inline align-[-1px]"
                            style={{ color: getMarketingChannelPinColor(campaign.channel) }}
                            aria-hidden
                          />
                          {campaign.name}{' '}
                          <span className="text-slate-500">
                            ({MARKETING_CHANNEL_LABELS[campaign.channel]})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )})}
            </div>

            {campaigns.map((campaign) => {
              const index = data.findIndex((point) => point.date === campaign.date)
              if (index < 0) return null
              const left = ((index + 0.5) / data.length) * 100
              const color = getMarketingChannelPinColor(campaign.channel)
              const selected = campaign.id === selectedCampaignId
              return (
                <button
                  key={campaign.id}
                  type="button"
                  onClick={() => onCampaignClick?.(campaign.id)}
                  className="group/pin absolute bottom-0 top-0 z-40 w-5 -translate-x-1/2"
                  style={{ left: `${left}%` }}
                  aria-label={`Campaign pin: ${campaign.name}`}
                >
                  <span
                    className="admin-chart-tooltip pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 hidden -translate-x-1/2 rounded-[var(--admin-radius)] px-2.5 py-1.5 text-[10px] group-hover/pin:block"
                  >
                    <span className="font-semibold text-slate-800">{campaign.name}</span>
                    <span className="text-slate-500">
                      {' '}
                      · {MARKETING_CHANNEL_LABELS[campaign.channel]}
                    </span>
                  </span>
                  {selected && (
                    <span
                      className="pointer-events-none absolute left-1/2 top-5 z-50 max-w-[120px] -translate-x-1/2 truncate rounded bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-800 shadow-sm"
                      title={campaign.name}
                    >
                      {campaign.name}
                    </span>
                  )}
                  <span
                    className="absolute bottom-0 top-2 block w-0.5"
                    style={{
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: color,
                      opacity: selected ? 1 : 0.7,
                      boxShadow: selected ? `0 0 8px ${color}` : undefined,
                    }}
                  />
                  <span
                    className="absolute left-1/2 top-0 flex -translate-x-1/2 items-center justify-center rounded-full border-2 border-[var(--admin-surface)] shadow-md"
                    style={{
                      width: selected ? 16 : 13,
                      height: selected ? 16 : 13,
                      backgroundColor: color,
                    }}
                  >
                    <MapPin size={selected ? 9 : 7} className="text-white" aria-hidden />
                  </span>
                </button>
              )
            })}
          </div>
          <div
            className="mt-1 grid leading-none"
            style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
          >
            {data.map((point, index) => {
              const showTick =
                index === 0 || index === data.length - 1 || index % labelEvery === 0
              const showMonth =
                showTick &&
                (index === 0 || monthLabel(point.date) !== monthLabel(data[index - 1].date))
              return (
                <div key={point.date} className="flex flex-col items-center gap-0.5 text-center">
                  <span className="h-3 text-[9px] uppercase tracking-wide text-[var(--admin-text-dim)]">
                    {showMonth ? monthLabel(point.date) : '\u00a0'}
                  </span>
                  <span
                    className={`admin-tabular text-[10px] font-medium text-[var(--admin-text-muted)] ${
                      showTick ? '' : 'invisible'
                    }`}
                    title={formatTooltipDate(point.date)}
                  >
                    {dayLabel(point.date)}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
