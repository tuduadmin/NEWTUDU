import type { ChartPoint } from './adminAnalytics'

const STORAGE_KEY = 'tudu-admin-marketing-campaigns'

export const MARKETING_CAMPAIGNS_CHANGED_EVENT = 'tudu-marketing-campaigns-changed'

export type MarketingChannel =
  | 'facebook'
  | 'instagram'
  | 'email'
  | 'paid_ad'
  | 'event'
  | 'flyer'
  | 'other'

export const MARKETING_CHANNEL_LABELS: Record<MarketingChannel, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  email: 'Email',
  paid_ad: 'Paid ad',
  event: 'In-person event',
  flyer: 'Flyer / print',
  other: 'Other',
}

export interface MarketingCampaign {
  id: string
  name: string
  channel: MarketingChannel
  /** YYYY-MM-DD — day the push went live */
  date: string
  /** Optional spend in dollars */
  spend?: number
  /** Off-platform metric — e.g. Facebook followers gained */
  followersGained?: number
  notes?: string
  link?: string
  createdAt: string
}

export type MarketingCampaignImpact = {
  windowDays: number
  signupsBefore: number
  signupsAfter: number
  eventsBefore: number
  eventsAfter: number
  signupLift: number
  costPerSignup: string | null
  costPerFollower: string | null
  inChartRange: boolean
}

function generateId(): string {
  return `mkt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function dispatchChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(MARKETING_CAMPAIGNS_CHANGED_EVENT))
  }
}

function readItems(): MarketingCampaign[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as MarketingCampaign[]) : []
  } catch {
    return []
  }
}

function saveItems(items: MarketingCampaign[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  dispatchChanged()
}

export function getMarketingCampaigns(): MarketingCampaign[] {
  return readItems().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
}

export function getMarketingCampaignById(id: string): MarketingCampaign | undefined {
  return readItems().find((item) => item.id === id)
}

export function localIsoDate(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isCampaignOnChart(campaign: MarketingCampaign, chartData: ChartPoint[]): boolean {
  if (chartData.length === 0) return false
  const first = chartData[0].date
  const last = chartData[chartData.length - 1].date
  return campaign.date >= first && campaign.date <= last
}

export function getMarketingCampaignsForChart(chartData: ChartPoint[]): MarketingCampaign[] {
  if (chartData.length === 0) return []
  const first = chartData[0].date
  const last = chartData[chartData.length - 1].date
  return getMarketingCampaigns().filter((item) => item.date >= first && item.date <= last)
}

export function addMarketingCampaign(
  input: Omit<MarketingCampaign, 'id' | 'createdAt'>,
): MarketingCampaign {
  const items = readItems()
  const campaign: MarketingCampaign = {
    ...input,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  items.unshift(campaign)
  saveItems(items)
  return campaign
}

export function updateMarketingCampaign(
  id: string,
  patch: Partial<Omit<MarketingCampaign, 'id' | 'createdAt'>>,
): MarketingCampaign | null {
  const items = readItems()
  const idx = items.findIndex((item) => item.id === id)
  if (idx < 0) return null
  items[idx] = { ...items[idx], ...patch }
  saveItems(items)
  return items[idx]
}

export function deleteMarketingCampaign(id: string): boolean {
  const items = readItems()
  const next = items.filter((item) => item.id !== id)
  if (next.length === items.length) return false
  saveItems(next)
  return true
}

function sumMetric(points: ChartPoint[], key: 'signups' | 'events'): number {
  return points.reduce((total, point) => total + point[key], 0)
}

function formatCost(amount: number, divisor: number): string | null {
  if (!divisor || divisor <= 0 || !Number.isFinite(amount)) return null
  return `$${(amount / divisor).toFixed(2)}`
}

export function getMarketingCampaignImpact(
  campaign: MarketingCampaign,
  chartData: ChartPoint[],
  windowDays = 7,
): MarketingCampaignImpact {
  const idx = chartData.findIndex((point) => point.date === campaign.date)
  const inChartRange = idx >= 0

  if (!inChartRange) {
    return {
      windowDays,
      signupsBefore: 0,
      signupsAfter: 0,
      eventsBefore: 0,
      eventsAfter: 0,
      signupLift: 0,
      costPerSignup: null,
      costPerFollower: formatCost(campaign.spend ?? 0, campaign.followersGained ?? 0),
      inChartRange: false,
    }
  }

  const before = chartData.slice(Math.max(0, idx - windowDays), idx)
  const after = chartData.slice(idx, Math.min(chartData.length, idx + windowDays))

  const signupsBefore = sumMetric(before, 'signups')
  const signupsAfter = sumMetric(after, 'signups')
  const eventsBefore = sumMetric(before, 'events')
  const eventsAfter = sumMetric(after, 'events')

  return {
    windowDays,
    signupsBefore,
    signupsAfter,
    eventsBefore,
    eventsAfter,
    signupLift: signupsAfter - signupsBefore,
    costPerSignup: formatCost(campaign.spend ?? 0, signupsAfter),
    costPerFollower: formatCost(campaign.spend ?? 0, campaign.followersGained ?? 0),
    inChartRange: true,
  }
}

export function getMarketingChannelPinColor(channel: MarketingChannel): string {
  switch (channel) {
    case 'facebook':
      return '#1877F2'
    case 'instagram':
      return '#E1306C'
    case 'email':
      return '#22c55e'
    case 'paid_ad':
      return '#f59e0b'
    case 'event':
      return '#a855f7'
    case 'flyer':
      return '#64748b'
    default:
      return '#38bdf8'
  }
}
