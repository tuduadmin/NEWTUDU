import type { ChartPoint } from './adminAnalytics'

export const CHART_PREFERENCES_KEY = 'tudu-admin-growth-chart-prefs'
export const CHART_PREFERENCES_CHANGED_EVENT = 'tudu-growth-chart-prefs-changed'

export type GrowthSeriesId =
  | 'signups'
  | 'events'
  | 'rsvps'
  | 'reports'
  | 'affiliateClicks'
  | 'dau'
  | 'mau'

export type GrowthSeriesChartStyle = 'line' | 'bar'

export type GrowthSeriesDefinition = {
  id: GrowthSeriesId
  label: string
  shortLabel: string
  description: string
  defaultColor: string
  defaultEnabled: boolean
  chartStyle: GrowthSeriesChartStyle
}

export type GrowthSeriesPreference = {
  enabled: boolean
  color: string
  strokeWidth: number
  showArea: boolean
}

export type GrowthChartPreferences = {
  series: Record<GrowthSeriesId, GrowthSeriesPreference>
}

export const GROWTH_SERIES_CATALOG: GrowthSeriesDefinition[] = [
  {
    id: 'signups',
    label: 'User signups',
    shortLabel: 'Signups',
    description: 'New accounts registered each day.',
    defaultColor: '#38bdf8',
    defaultEnabled: true,
    chartStyle: 'line',
  },
  {
    id: 'events',
    label: 'Events published',
    shortLabel: 'Events',
    description: 'Host events created or published each day.',
    defaultColor: '#e879f9',
    defaultEnabled: true,
    chartStyle: 'line',
  },
  {
    id: 'rsvps',
    label: 'Ticket sales',
    shortLabel: 'Tickets',
    description: 'Paid ticket transactions per day.',
    defaultColor: '#34d399',
    defaultEnabled: false,
    chartStyle: 'line',
  },
  {
    id: 'reports',
    label: 'Support reports',
    shortLabel: 'Reports',
    description: 'User reports and feedback filed each day.',
    defaultColor: '#fb7185',
    defaultEnabled: false,
    chartStyle: 'line',
  },
  {
    id: 'affiliateClicks',
    label: 'Affiliate clicks',
    shortLabel: 'Affiliate',
    description: 'Outbound affiliate / partner link clicks.',
    defaultColor: '#fbbf24',
    defaultEnabled: false,
    chartStyle: 'line',
  },
  {
    id: 'dau',
    label: 'Daily active users',
    shortLabel: 'DAU',
    description: 'Unique users with sign-in or activity that day.',
    defaultColor: '#22d3ee',
    defaultEnabled: false,
    chartStyle: 'bar',
  },
  {
    id: 'mau',
    label: 'Monthly active users',
    shortLabel: 'MAU',
    description: 'Rolling 30-day unique active users ending that day.',
    defaultColor: '#a78bfa',
    defaultEnabled: false,
    chartStyle: 'bar',
  },
]

function defaultPreferences(): GrowthChartPreferences {
  const series = {} as Record<GrowthSeriesId, GrowthSeriesPreference>
  for (const def of GROWTH_SERIES_CATALOG) {
    series[def.id] = {
      enabled: def.defaultEnabled,
      color: def.defaultColor,
      strokeWidth: 2,
      showArea: false,
    }
  }
  return { series }
}

function dispatchChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CHART_PREFERENCES_CHANGED_EVENT))
  }
}

export function getGrowthChartPreferences(): GrowthChartPreferences {
  try {
    const raw = localStorage.getItem(CHART_PREFERENCES_KEY)
    if (!raw) return defaultPreferences()
    const parsed = JSON.parse(raw) as GrowthChartPreferences
    const base = defaultPreferences()
    for (const def of GROWTH_SERIES_CATALOG) {
      const saved = parsed.series?.[def.id]
      if (saved) {
        base.series[def.id] = {
          enabled: Boolean(saved.enabled),
          color: typeof saved.color === 'string' ? saved.color : def.defaultColor,
          strokeWidth: clampStroke(saved.strokeWidth),
          showArea: Boolean(saved.showArea),
        }
      }
    }
    return base
  } catch {
    return defaultPreferences()
  }
}

export function saveGrowthChartPreferences(prefs: GrowthChartPreferences): void {
  localStorage.setItem(CHART_PREFERENCES_KEY, JSON.stringify(prefs))
  dispatchChanged()
}

export function resetGrowthChartPreferences(): GrowthChartPreferences {
  const defaults = defaultPreferences()
  saveGrowthChartPreferences(defaults)
  return defaults
}

export function updateGrowthSeriesPreference(
  id: GrowthSeriesId,
  patch: Partial<GrowthSeriesPreference>,
): GrowthChartPreferences {
  const current = getGrowthChartPreferences()
  current.series[id] = {
    ...current.series[id],
    ...patch,
    strokeWidth: patch.strokeWidth != null ? clampStroke(patch.strokeWidth) : current.series[id].strokeWidth,
  }
  saveGrowthChartPreferences(current)
  return current
}

function clampStroke(value: number): number {
  if (!Number.isFinite(value)) return 2
  return Math.min(5, Math.max(1, Math.round(value)))
}

export function getSeriesValue(point: ChartPoint, id: GrowthSeriesId): number {
  return point[id] ?? 0
}

export function getEnabledGrowthSeries(
  prefs: GrowthChartPreferences = getGrowthChartPreferences(),
): Array<GrowthSeriesDefinition & GrowthSeriesPreference> {
  return GROWTH_SERIES_CATALOG.filter((def) => prefs.series[def.id]?.enabled).map((def) => ({
    ...def,
    ...prefs.series[def.id],
  }))
}
