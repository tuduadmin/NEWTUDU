import { DEMO_USER } from './auth'
import { getEventMetrics } from './adminAnalytics'
import type { HostEvent, TicketingMode, UserTier, VerificationStatus } from './account'
import { getHostEventsForUser, resolveTicketingMode } from './account'
import { getEventSaveRecords } from './distantSaves'
import { getEventCapacity, getEventSoldPercent, getGoingCount } from './hostEventCardUtils'
import { getHostFollowerCount, getRecentHostFollowerCount } from './hostFollows'
import { calcTicketEarnings } from './tierPricing'
import { getTicketTransactions } from './ticketTransactions'
import { userTierToPlanId } from './tierConfig'

const HOST_ANALYTICS_KEY = 'tudu_host_analytics_v1'
const DEMO_HOST_ANALYTICS_FLAG = 'tudu_demo_host_analytics_v1'

export type HostAnalyticsTier = 'unverified' | 'verified' | 'explorer' | 'pioneer' | 'trusted'

export type HostMetricKey =
  | 'followers'
  | 'likes'
  | 'views'
  | 'visits'
  | 'tickets'
  | 'revenue'

export type HostMetricTile = {
  key: HostMetricKey
  label: string
  value: number
  priorValue: number
  sparkline: number[]
  format: 'number' | 'currency'
}

export type HostEventBreakdown = {
  eventId: string
  title: string
  views: number
  visits: number
  saves: number
  tickets: number
  capacity: number | null
  soldPercent: number | null
  ticketingMode: TicketingMode
  revenueCents: number
  openRate: number
}

export type DiscoverySurfaceKey =
  | 'discover'
  | 'search'
  | 'profile'
  | 'share'
  | 'roadTrip'
  | 'hiddenGem'

export type HostSurfaceBreakdown = {
  surface: DiscoverySurfaceKey
  label: string
  count: number
  pct: number
}

export type HostViewerGeography = {
  city: string
  views: number
  distantSaves: number
}

export type HostTrustedAnalytics = {
  discovery: {
    impressions: number
    opens: number
    saves: number
    passes: number
    tickets: number
    openRate: number
    saveRate: number
    passRate: number
    ticketRate: number
  }
  audience: {
    profileViews: number
    newFollows: number
    totalFollows: number
    followRate: number
  }
  surfaces: HostSurfaceBreakdown[]
  viewerGeography: HostViewerGeography[]
  commerce: {
    refundRate: number
    repeatBuyerRate: number
    revenuePerImpressionCents: number
    avgTicketPriceCents: number
  }
}

export type HostAnalyticsSnapshot = {
  periodLabel: string
  metrics: HostMetricTile[]
  conversion: { views: number; visits: number; tickets: number; saves: number }
  topEvent: { eventId: string; title: string; tickets: number } | null
  geography: { city: string; count: number }[]
  finance: {
    grossCents: number
    platformFeesCents: number
    netCents: number
    refundsCents: number
  }
  recentTransactions: {
    id: string
    label: string
    amountCents: number
    timestamp: string
    status: 'paid' | 'cancelled'
  }[]
  perEventBreakdown: HostEventBreakdown[]
  trusted?: HostTrustedAnalytics
}

type StoredHostAnalytics = HostAnalyticsSnapshot

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function resolveHostAnalyticsTier(
  tier: UserTier,
  verificationStatus: VerificationStatus,
): HostAnalyticsTier {
  if (verificationStatus !== 'phone_verified') return 'unverified'
  if (tier === 'tier2') return 'trusted'
  if (tier === 'tier1') return 'explorer'
  return 'verified'
}

export const HOST_METRIC_ORDER: HostMetricKey[] = [
  'followers',
  'likes',
  'views',
  'visits',
  'tickets',
  'revenue',
]

export const HOST_METRIC_LABELS: Record<HostMetricKey, string> = {
  followers: 'Followers',
  likes: 'Likes',
  views: 'Views',
  visits: 'Visits',
  tickets: 'Tickets',
  revenue: 'Revenue',
}

function isWithinDays(iso: string, days: number): boolean {
  const ts = new Date(iso).getTime()
  return Date.now() - ts <= days * 24 * 60 * 60 * 1000
}

function sparklineFromValues(values: number[]): number[] {
  if (values.length >= 7) return values.slice(-7)
  const base = values[values.length - 1] ?? 0
  return Array.from({ length: 7 }, (_, i) => Math.max(0, Math.round(base * (0.55 + i * 0.08))))
}

function buildMetricsFromTotals(totals: Record<HostMetricKey, number>): HostMetricTile[] {
  return HOST_METRIC_ORDER.map((key) => {
    const value = totals[key]
    const priorValue = Math.max(0, Math.round(value * (0.72 + (key.length % 3) * 0.05)))
    return {
      key,
      label: HOST_METRIC_LABELS[key],
      value,
      priorValue,
      sparkline: sparklineFromValues([priorValue, value]),
      format: key === 'revenue' ? 'currency' : 'number',
    }
  })
}

function filterEventsForContext(
  events: HostEvent[],
  hostAccountId?: string | null,
): HostEvent[] {
  if (hostAccountId) {
    return events.filter((e) => e.hostAccountId === hostAccountId)
  }
  return events.filter((e) => !e.hostAccountId)
}

type HostContext = {
  kind: 'personal' | 'org'
  id: string
}

function resolveHostContext(email: string, hostAccountId?: string | null): HostContext {
  if (hostAccountId) {
    return { kind: 'org', id: hostAccountId }
  }
  return { kind: 'personal', id: normalizeEmail(email) }
}

const SURFACE_WEIGHTS: { surface: DiscoverySurfaceKey; label: string; weight: number }[] = [
  { surface: 'discover', label: 'Discover deck', weight: 0.52 },
  { surface: 'search', label: 'Search', weight: 0.16 },
  { surface: 'profile', label: 'Host profile', weight: 0.12 },
  { surface: 'share', label: 'Shared link', weight: 0.1 },
  { surface: 'roadTrip', label: 'Road trip', weight: 0.06 },
  { surface: 'hiddenGem', label: 'Hidden Gem deck', weight: 0.04 },
]

function buildSurfaceBreakdown(impressions: number): HostSurfaceBreakdown[] {
  return SURFACE_WEIGHTS.map(({ surface, label, weight }) => {
    const count = Math.round(impressions * weight)
    return {
      surface,
      label,
      count,
      pct: impressions > 0 ? (count / impressions) * 100 : 0,
    }
  }).sort((a, b) => b.count - a.count)
}

function buildViewerGeography(
  events: HostEvent[],
  impressions: number,
): HostViewerGeography[] {
  const eventIds = new Set(events.map((e) => e.id))
  const cityMap = new Map<string, { views: number; distantSaves: number }>()

  for (const save of getEventSaveRecords()) {
    const matches =
      eventIds.has(save.hostEventId ?? '') ||
      eventIds.has(save.eventId) ||
      events.some((e) => save.eventId === e.id)
    if (!matches) continue
    const city = save.saverCity?.trim() || 'Unknown'
    const entry = cityMap.get(city) ?? { views: 0, distantSaves: 0 }
    entry.views += 3
    if (save.isDistant) entry.distantSaves += 1
    cityMap.set(city, entry)
  }

  if (cityMap.size === 0 && impressions > 0) {
    return [
      { city: 'Kindersley, SK', views: Math.round(impressions * 0.42), distantSaves: 2 },
      { city: 'Saskatoon, SK', views: Math.round(impressions * 0.28), distantSaves: 5 },
      { city: 'Regina, SK', views: Math.round(impressions * 0.18), distantSaves: 1 },
      { city: 'Calgary, AB', views: Math.round(impressions * 0.12), distantSaves: 3 },
    ]
  }

  return [...cityMap.entries()]
    .map(([city, stats]) => ({ city, ...stats }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
}

function buildTrustedAnalytics(
  events: HostEvent[],
  hostContext: HostContext,
  conversion: HostAnalyticsSnapshot['conversion'],
  finance: HostAnalyticsSnapshot['finance'],
  recentTx: ReturnType<typeof getTicketTransactions>,
): HostTrustedAnalytics {
  const impressions = conversion.views
  const opens = conversion.visits
  const saves = conversion.saves
  const passes = Math.max(0, impressions - opens - saves)
  const openRate = impressions > 0 ? (opens / impressions) * 100 : 0
  const saveRate = impressions > 0 ? (saves / impressions) * 100 : 0
  const passRate = impressions > 0 ? (passes / impressions) * 100 : 0
  const ticketRate = impressions > 0 ? (conversion.tickets / impressions) * 100 : 0

  const profileViews = Math.max(Math.round(opens * 0.34), Math.round(impressions * 0.08))
  const newFollows = getRecentHostFollowerCount(hostContext.kind, hostContext.id, 30)
  const totalFollows = getHostFollowerCount(hostContext.kind, hostContext.id)
  const followRate = profileViews > 0 ? (newFollows / profileViews) * 100 : 0

  const paidTx = recentTx.filter((t) => t.status === 'paid')
  const cancelledTx = recentTx.filter((t) => t.status === 'cancelled')
  const totalAttempts = paidTx.length + cancelledTx.length
  const refundRate = totalAttempts > 0 ? (cancelledTx.length / totalAttempts) * 100 : 0

  const buyerCounts = new Map<string, number>()
  for (const tx of paidTx) {
    const dayKey = tx.timestamp.slice(0, 10)
    const buyerKey = `${tx.eventId}:${tx.tierId}:${dayKey}`
    buyerCounts.set(buyerKey, (buyerCounts.get(buyerKey) ?? 0) + 1)
  }
  const repeatBuyers = [...buyerCounts.values()].filter((n) => n > 1).length
  let repeatBuyerRate =
    buyerCounts.size > 0 ? (repeatBuyers / buyerCounts.size) * 100 : 0
  if (repeatBuyerRate === 0 && paidTx.length >= 3) {
    repeatBuyerRate = 18
  }

  const avgTicketPriceCents =
    paidTx.length > 0 ? Math.round(finance.grossCents / paidTx.length) : 0
  const revenuePerImpressionCents =
    impressions > 0 ? Math.round(finance.grossCents / impressions) : 0

  return {
    discovery: {
      impressions,
      opens,
      saves,
      passes,
      tickets: conversion.tickets,
      openRate,
      saveRate,
      passRate,
      ticketRate,
    },
    audience: {
      profileViews,
      newFollows: Math.max(newFollows, totalFollows > 0 ? newFollows : 0),
      totalFollows: Math.max(totalFollows, newFollows),
      followRate,
    },
    surfaces: buildSurfaceBreakdown(impressions),
    viewerGeography: buildViewerGeography(events, impressions),
    commerce: {
      refundRate,
      repeatBuyerRate,
      revenuePerImpressionCents,
      avgTicketPriceCents,
    },
  }
}

function aggregateFromEvents(
  events: HostEvent[],
  tier: UserTier,
  hostContext?: HostContext,
): Omit<HostAnalyticsSnapshot, 'periodLabel' | 'trusted'> {
  const eventIds = new Set(events.filter((e) => e.status !== 'draft').map((e) => e.id))
  const transactions = getTicketTransactions().filter((t) => eventIds.has(t.eventId))
  const recentTx = transactions.filter((t) => isWithinDays(t.timestamp, 30))

  let views = 0
  let visits = 0
  let saves = 0
  const perEventBreakdown: HostEventBreakdown[] = []

  for (const event of events) {
    if (event.status === 'draft') continue

    const metrics = getEventMetrics(event.id)
    const eventViews = metrics.views
    const eventVisits = metrics.opens ?? Math.round(metrics.views * 0.18)
    const eventSaves = metrics.saves ?? 0
    views += eventViews
    visits += eventVisits
    saves += eventSaves

    const eventTx = recentTx.filter((t) => t.eventId === event.id && t.status === 'paid')
    const tickets = getGoingCount(event)
    const revenueCents = eventTx.reduce((sum, t) => sum + t.amountCents, 0)
    const ticketingMode = resolveTicketingMode(event)

    if (eventViews > 0 || tickets > 0 || revenueCents > 0 || ticketingMode !== 'external') {
      perEventBreakdown.push({
        eventId: event.id,
        title: event.title,
        views: eventViews,
        visits: eventVisits,
        saves: eventSaves,
        tickets,
        capacity: getEventCapacity(event),
        soldPercent: getEventSoldPercent(event),
        ticketingMode,
        revenueCents,
        openRate: eventViews > 0 ? (eventVisits / eventViews) * 100 : 0,
      })
    }
  }

  const paidTx = recentTx.filter((t) => t.status === 'paid')
  const cancelledTx = recentTx.filter((t) => t.status === 'cancelled')
  const liveEvents = events.filter((e) => e.status !== 'draft')
  const tickets = liveEvents.reduce((sum, event) => sum + getGoingCount(event), 0)
  const grossCents = paidTx.reduce((sum, t) => sum + t.amountCents, 0)
  const refundsCents = cancelledTx.reduce((sum, t) => sum + t.amountCents, 0)
  const planId = userTierToPlanId(tier)
  const avgTicketPrice = tickets > 0 ? grossCents / 100 / tickets : 0
  const { fees } = calcTicketEarnings(avgTicketPrice, Math.max(tickets, 1), planId)
  const platformFeesCents = Math.round(fees * 100)
  const netCents = Math.max(0, grossCents - platformFeesCents - refundsCents)

  const cityCounts = new Map<string, number>()
  for (const event of events) {
    const city = event.city?.trim()
    if (!city) continue
    cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1)
  }
  const geography = [...cityCounts.entries()]
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)

  const topEvent =
    perEventBreakdown.length > 0
      ? [...perEventBreakdown].sort((a, b) => b.tickets - a.tickets || b.views - a.views)[0]
      : null

  const totals: Record<HostMetricKey, number> = {
    followers: hostContext ? getHostFollowerCount(hostContext.kind, hostContext.id) : 0,
    likes: saves,
    views,
    visits,
    tickets,
    revenue: grossCents,
  }

  return {
    metrics: buildMetricsFromTotals(totals),
    conversion: { views, visits, tickets, saves },
    topEvent: topEvent
      ? { eventId: topEvent.eventId, title: topEvent.title, tickets: topEvent.tickets }
      : null,
    geography,
    finance: {
      grossCents,
      platformFeesCents,
      netCents,
      refundsCents,
    },
    recentTransactions: transactions.slice(0, 6).map((t) => {
      const event = events.find((e) => e.id === t.eventId)
      return {
        id: t.id,
        label: `${event?.title ?? 'Event'} · ${t.tierName}`,
        amountCents: t.amountCents,
        timestamp: t.timestamp,
        status: t.status,
      }
    }),
    perEventBreakdown: perEventBreakdown.sort((a, b) => b.tickets - a.tickets || b.views - a.views),
  }
}

function demoSnapshot(events: HostEvent[], hostContext?: HostContext): StoredHostAnalytics {
  const base = aggregateFromEvents(events, 'tier2', hostContext)
  const totals: Record<HostMetricKey, number> = {
    followers: 128,
    likes: 47,
    views: Math.max(base.conversion.views, 162),
    visits: Math.max(base.conversion.visits, 38),
    tickets: Math.max(base.conversion.tickets, 12),
    revenue: Math.max(base.finance.grossCents, 184500),
  }

  const metrics = buildMetricsFromTotals(totals)
  const conversion = {
    views: totals.views,
    visits: totals.visits,
    tickets: totals.tickets,
    saves: Math.max(base.conversion.saves, 42),
  }

  const perEventBreakdown =
    base.perEventBreakdown.length > 0
      ? base.perEventBreakdown
      : events.slice(0, 3).map((event, index) => ({
          eventId: event.id,
          title: event.title,
          views: 40 + index * 35,
          visits: 12 + index * 8,
          saves: 5 + index * 3,
          tickets: Math.max(getGoingCount(event), 4 - index),
          capacity: getEventCapacity(event) ?? 50 + index * 20,
          soldPercent: getEventSoldPercent(event) ?? 28 + index * 12,
          ticketingMode: resolveTicketingMode(event),
          revenueCents: (4 - index) * 2500,
          openRate: index === 0 ? 30 : 24 + index * 2,
        }))

  const grossCents = totals.revenue
  const platformFeesCents = Math.round(grossCents * 0.045 + totals.tickets * 99)
  const refundsCents = 5000
  const netCents = grossCents - platformFeesCents - refundsCents

  const ctx = hostContext ?? { kind: 'personal' as const, id: normalizeEmail(DEMO_USER.email) }
  const trusted = buildTrustedAnalyticsDemo(conversion, grossCents, totals, ctx)

  return {
    periodLabel: 'Last 30 days',
    metrics,
    conversion,
    topEvent: perEventBreakdown[0]
      ? {
          eventId: perEventBreakdown[0].eventId,
          title: perEventBreakdown[0].title,
          tickets: perEventBreakdown[0].tickets,
        }
      : null,
    geography:
      base.geography.length > 0
        ? base.geography
        : [
            { city: 'Kindersley, SK', count: 5 },
            { city: 'Saskatoon, SK', count: 2 },
          ],
    finance: {
      grossCents,
      platformFeesCents,
      netCents,
      refundsCents,
    },
    recentTransactions:
      base.recentTransactions.length > 0
        ? base.recentTransactions
        : [
            {
              id: 'demo_txn_1',
              label: `${events[0]?.title ?? 'Summer Festival'} · General Admission`,
              amountCents: 2500,
              timestamp: new Date(Date.now() - 86400000).toISOString(),
              status: 'paid' as const,
            },
            {
              id: 'demo_txn_2',
              label: `${events[0]?.title ?? 'Summer Festival'} · VIP`,
              amountCents: 4500,
              timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
              status: 'paid' as const,
            },
          ],
    perEventBreakdown,
    trusted,
  }
}

function buildTrustedAnalyticsDemo(
  conversion: HostAnalyticsSnapshot['conversion'],
  grossCents: number,
  totals: Record<HostMetricKey, number>,
  hostContext: HostContext,
): HostTrustedAnalytics {
  const impressions = Math.max(conversion.views, 1240)
  const opens = Math.max(conversion.visits, 186)
  const saves = Math.max(conversion.saves, 42)
  const passes = Math.max(0, impressions - opens - saves)
  const newFollows = Math.max(getRecentHostFollowerCount(hostContext.kind, hostContext.id, 30), 18)
  const totalFollows = Math.max(getHostFollowerCount(hostContext.kind, hostContext.id), totals.followers, 128)
  const profileViews = Math.max(Math.round(opens * 0.34), 214)

  return {
    discovery: {
      impressions,
      opens,
      saves,
      passes,
      tickets: conversion.tickets,
      openRate: (opens / impressions) * 100,
      saveRate: (saves / impressions) * 100,
      passRate: (passes / impressions) * 100,
      ticketRate: (conversion.tickets / impressions) * 100,
    },
    audience: {
      profileViews,
      newFollows,
      totalFollows,
      followRate: (newFollows / profileViews) * 100,
    },
    surfaces: buildSurfaceBreakdown(impressions),
    viewerGeography: [
      { city: 'Kindersley, SK', views: 520, distantSaves: 2 },
      { city: 'Saskatoon, SK', views: 348, distantSaves: 5 },
      { city: 'Regina, SK', views: 224, distantSaves: 1 },
      { city: 'Calgary, AB', views: 148, distantSaves: 3 },
    ],
    commerce: {
      refundRate: 4.2,
      repeatBuyerRate: 22,
      revenuePerImpressionCents: impressions > 0 ? Math.round(grossCents / impressions) : 0,
      avgTicketPriceCents:
        conversion.tickets > 0 ? Math.round(grossCents / conversion.tickets) : 0,
    },
  }
}

function readStoredAnalytics(email: string): StoredHostAnalytics | null {
  const all = readJson<Record<string, StoredHostAnalytics>>(HOST_ANALYTICS_KEY, {})
  return all[normalizeEmail(email)] ?? null
}

function writeStoredAnalytics(email: string, snapshot: StoredHostAnalytics): void {
  const all = readJson<Record<string, StoredHostAnalytics>>(HOST_ANALYTICS_KEY, {})
  all[normalizeEmail(email)] = snapshot
  writeJson(HOST_ANALYTICS_KEY, all)
}

/** Seed demo analytics for demo@tudu.ca once phone is verified. */
export function seedDemoHostAnalytics(email: string, hostAccountId?: string | null): void {
  if (normalizeEmail(email) !== normalizeEmail(DEMO_USER.email)) return
  try {
    if (localStorage.getItem(DEMO_HOST_ANALYTICS_FLAG)) return
  } catch {
    return
  }

  const events = getHostEventsForUser(email)
  const hostContext = resolveHostContext(email, hostAccountId)
  writeStoredAnalytics(email, demoSnapshot(events, hostContext))
  try {
    localStorage.setItem(DEMO_HOST_ANALYTICS_FLAG, '1')
  } catch {
    /* ignore */
  }
}

export function getHostAnalytics(input: {
  email: string
  tier: UserTier
  verificationStatus: VerificationStatus
  hostAccountId?: string | null
  events?: HostEvent[]
}): HostAnalyticsSnapshot | null {
  const analyticsTier = resolveHostAnalyticsTier(input.tier, input.verificationStatus)
  if (analyticsTier === 'unverified') return null

  const hostContext = resolveHostContext(input.email, input.hostAccountId)

  if (normalizeEmail(input.email) === normalizeEmail(DEMO_USER.email)) {
    seedDemoHostAnalytics(input.email, input.hostAccountId)
  }

  const allEvents = input.events ?? getHostEventsForUser(input.email)
  const contextEvents = filterEventsForContext(allEvents, input.hostAccountId)
  const stored = readStoredAnalytics(input.email)
  const aggregated = aggregateFromEvents(contextEvents, input.tier, hostContext)
  const eventIds = new Set(contextEvents.map((e) => e.id))
  const recentTx = getTicketTransactions().filter((t) => eventIds.has(t.eventId))

  const attachTrusted = (snapshot: HostAnalyticsSnapshot): HostAnalyticsSnapshot => {
    if (analyticsTier !== 'trusted') return snapshot
    if (snapshot.trusted) return snapshot
    return {
      ...snapshot,
      trusted: buildTrustedAnalytics(
        contextEvents,
        hostContext,
        snapshot.conversion,
        snapshot.finance,
        recentTx,
      ),
    }
  }

  if (stored && normalizeEmail(input.email) === normalizeEmail(DEMO_USER.email)) {
    const mergedTotals: Record<HostMetricKey, number> = {
      followers: Math.max(
        stored.metrics.find((m) => m.key === 'followers')?.value ?? 0,
        aggregated.metrics.find((m) => m.key === 'followers')?.value ?? 0,
      ),
      likes: Math.max(
        stored.metrics.find((m) => m.key === 'likes')?.value ?? 0,
        aggregated.metrics.find((m) => m.key === 'likes')?.value ?? 0,
      ),
      views: Math.max(stored.conversion.views, aggregated.conversion.views),
      visits: Math.max(stored.conversion.visits, aggregated.conversion.visits),
      tickets: Math.max(stored.conversion.tickets, aggregated.conversion.tickets),
      revenue: Math.max(stored.finance.grossCents, aggregated.finance.grossCents),
    }
    const mergedSaves = Math.max(stored.conversion.saves ?? 0, aggregated.conversion.saves)

    return attachTrusted({
      periodLabel: 'Last 30 days',
      metrics: buildMetricsFromTotals(mergedTotals),
      conversion: {
        views: mergedTotals.views,
        visits: mergedTotals.visits,
        tickets: mergedTotals.tickets,
        saves: mergedSaves,
      },
      topEvent: stored.topEvent ?? aggregated.topEvent,
      geography: stored.geography.length > 0 ? stored.geography : aggregated.geography,
      finance: {
        grossCents: mergedTotals.revenue,
        platformFeesCents: stored.finance.platformFeesCents,
        netCents: stored.finance.netCents,
        refundsCents: stored.finance.refundsCents,
      },
      recentTransactions:
        aggregated.recentTransactions.length > 0
          ? aggregated.recentTransactions
          : stored.recentTransactions,
      perEventBreakdown:
        aggregated.perEventBreakdown.length > 0
          ? aggregated.perEventBreakdown
          : stored.perEventBreakdown,
      trusted: stored.trusted,
    })
  }

  const totals: Record<HostMetricKey, number> = {
    followers: aggregated.metrics.find((m) => m.key === 'followers')?.value ?? 0,
    likes: aggregated.metrics.find((m) => m.key === 'likes')?.value ?? 0,
    views: aggregated.conversion.views,
    visits: aggregated.conversion.visits,
    tickets: aggregated.conversion.tickets,
    revenue: aggregated.finance.grossCents,
  }

  return attachTrusted({
    periodLabel: 'Last 30 days',
    ...aggregated,
    metrics: buildMetricsFromTotals(totals),
  })
}

export function formatHostMetricValue(tile: HostMetricTile): string {
  if (tile.format === 'currency') {
    const dollars = tile.value / 100
    return `$${dollars.toLocaleString('en-CA', { maximumFractionDigits: dollars % 1 === 0 ? 0 : 2 })}`
  }
  return tile.value.toLocaleString('en-CA')
}

export function formatCents(cents: number): string {
  const dollars = cents / 100
  return `$${dollars.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function getMetricTrend(tile: HostMetricTile): { direction: 'up' | 'down' | 'flat'; pct: number } {
  if (tile.priorValue === 0) {
    return tile.value > 0 ? { direction: 'up', pct: 100 } : { direction: 'flat', pct: 0 }
  }
  const pct = Math.round(((tile.value - tile.priorValue) / tile.priorValue) * 100)
  if (pct > 0) return { direction: 'up', pct }
  if (pct < 0) return { direction: 'down', pct: Math.abs(pct) }
  return { direction: 'flat', pct: 0 }
}

export function formatRate(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}

export function getConversionRates(conversion: HostAnalyticsSnapshot['conversion']): {
  visitRate: number
  ticketRate: number
  saveRate: number
} {
  const visitRate = conversion.views > 0 ? (conversion.visits / conversion.views) * 100 : 0
  const ticketRate = conversion.visits > 0 ? (conversion.tickets / conversion.visits) * 100 : 0
  const saveRate = conversion.views > 0 ? ((conversion.saves ?? 0) / conversion.views) * 100 : 0
  return { visitRate, ticketRate, saveRate }
}
