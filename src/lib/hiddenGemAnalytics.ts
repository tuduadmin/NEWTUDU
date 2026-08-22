import { getStoredEventMetrics } from './eventMetricsStore'
import { getAccount } from './account'
import { getCurrentUser } from './auth'
import {
  getEventSaveRecordsNormalized,
  type EventSaveRecord,
  type SaveContext,
} from './distantSaves'
import {
  hiddenGemDiscoverId,
  parseHiddenGemIdFromEventId,
} from './hiddenGemIds'
import { getHiddenGemById, type OrgHiddenGem } from './hiddenGems'
import { formatCityLabel } from './location'

const ENGAGEMENT_KEY = 'tudu_hidden_gem_engagement'
const PROMO_PUSH_KEY = 'tudu_hidden_gem_promo_pushes'

export type HiddenGemEngagementType = 'view' | 'open'

export type HiddenGemEngagementRecord = {
  id: string
  gemId: string
  type: HiddenGemEngagementType
  viewerCity: string
  at: string
}

export type HiddenGemPromoPushRecord = {
  id: string
  gemId: string
  promoCode: string
  audience: 'all_savers' | 'distant_savers'
  sentAt: string
  recipientCount: number
}

export type HiddenGemSaveBreakdown = Record<SaveContext, number>

export type HiddenGemGeographyRow = {
  city: string
  count: number
  distant: number
}

export type HiddenGemAnalyticsSnapshot = {
  gemId: string
  title: string
  eventCity: string
  views: number
  opens: number
  saves: number
  shares: number
  savesByContext: HiddenGemSaveBreakdown
  uniqueSavers: number
  distantSavers: number
  saverGeography: HiddenGemGeographyRow[]
  viewerGeography: HiddenGemGeographyRow[]
  promoCode?: string
  recentSaves: EventSaveRecord[]
  promoPushes: HiddenGemPromoPushRecord[]
}

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

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function resolveViewerCity(): string {
  const user = getCurrentUser()
  if (!user?.email) return 'Unknown'
  const account = getAccount(user.email)
  return account?.homeCity?.trim() || 'Unknown'
}

export function getHiddenGemEngagementRecords(): HiddenGemEngagementRecord[] {
  return readJson<HiddenGemEngagementRecord[]>(ENGAGEMENT_KEY, [])
}

export function recordHiddenGemEngagement(
  gemId: string,
  type: HiddenGemEngagementType,
): void {
  const records = getHiddenGemEngagementRecords()
  records.unshift({
    id: generateId('hge'),
    gemId,
    type,
    viewerCity: resolveViewerCity(),
    at: new Date().toISOString(),
  })
  writeJson(ENGAGEMENT_KEY, records.slice(0, 2000))
}

export function syncHiddenGemEmbeddedMetrics(gemId: string): void {
  const gem = getHiddenGemById(gemId)
  if (!gem) return

  const metricsId = hiddenGemDiscoverId(gemId)
  const live = getStoredEventMetrics(metricsId)
  const gems = readJson<OrgHiddenGem[]>('tudu-hidden-gems', [])
  const idx = gems.findIndex((g) => g.id === gemId)
  if (idx === -1) return

  gems[idx] = {
    ...gems[idx],
    metrics: {
      views: live.views,
      saves: live.saves,
      shares: gems[idx].metrics?.shares ?? 0,
    },
  }
  writeJson('tudu-hidden-gems', gems)
}

export function maybeSyncHiddenGemFromMetricsId(metricsId: string, type: 'view' | 'open' | 'save'): void {
  const gemId = parseHiddenGemIdFromEventId(metricsId)
  if (!gemId) return
  if (type === 'view' || type === 'open') {
    recordHiddenGemEngagement(gemId, type)
  }
  syncHiddenGemEmbeddedMetrics(gemId)
}

function matchesGem(record: EventSaveRecord, gemId: string): boolean {
  const discoverId = hiddenGemDiscoverId(gemId)
  return (
    record.eventId === discoverId ||
    record.eventId === gemId ||
    record.hiddenGemId === gemId ||
    record.attractionId === gemId
  )
}

function aggregateGeography(
  cities: { city: string; distant?: boolean }[],
): HiddenGemGeographyRow[] {
  const map = new Map<string, { count: number; distant: number }>()
  for (const entry of cities) {
    const city = formatCityLabel(entry.city) || 'Unknown'
    const row = map.get(city) ?? { count: 0, distant: 0 }
    row.count += 1
    if (entry.distant) row.distant += 1
    map.set(city, row)
  }
  return [...map.entries()]
    .map(([city, stats]) => ({ city, ...stats }))
    .sort((a, b) => b.count - a.count)
}

function emptySaveBreakdown(): HiddenGemSaveBreakdown {
  return { saved: 0, bucket_list: 0, road_trip: 0 }
}

export function getHiddenGemAnalytics(gemId: string): HiddenGemAnalyticsSnapshot | null {
  const gem = getHiddenGemById(gemId)
  if (!gem) return null

  const metricsId = hiddenGemDiscoverId(gemId)
  const live = getStoredEventMetrics(metricsId)
  const saves = getEventSaveRecordsNormalized().filter((r) => matchesGem(r, gemId))
  const engagement = getHiddenGemEngagementRecords().filter((r) => r.gemId === gemId)

  const savesByContext = emptySaveBreakdown()
  for (const save of saves) {
    savesByContext[save.saveContext] += 1
  }

  const uniqueEmails = new Set(saves.map((s) => s.userEmail.toLowerCase()))

  return {
    gemId,
    title: gem.title,
    eventCity: gem.location.city,
    views: live.views,
    opens: live.opens ?? 0,
    saves: live.saves,
    shares: gem.metrics?.shares ?? 0,
    savesByContext,
    uniqueSavers: uniqueEmails.size,
    distantSavers: saves.filter((s) => s.isDistant).length,
    saverGeography: aggregateGeography(
      saves.map((s) => ({ city: s.saverCity, distant: s.isDistant })),
    ),
    viewerGeography: aggregateGeography(
      engagement.map((e) => ({ city: e.viewerCity })),
    ),
    promoCode: gem.promoCode,
    recentSaves: saves.slice(0, 12),
    promoPushes: getPromoPushesForGem(gemId),
  }
}

export function getPromoPushRecords(): HiddenGemPromoPushRecord[] {
  return readJson<HiddenGemPromoPushRecord[]>(PROMO_PUSH_KEY, [])
}

export function getPromoPushesForGem(gemId: string): HiddenGemPromoPushRecord[] {
  return getPromoPushRecords().filter((p) => p.gemId === gemId)
}

export function sendHiddenGemPromoPush(input: {
  gemId: string
  promoCode: string
  audience: 'all_savers' | 'distant_savers'
}): HiddenGemPromoPushRecord | null {
  const gem = getHiddenGemById(input.gemId)
  if (!gem || !input.promoCode.trim()) return null

  const saves = getEventSaveRecordsNormalized().filter((r) => matchesGem(r, input.gemId))
  const recipients =
    input.audience === 'distant_savers'
      ? saves.filter((s) => s.isDistant)
      : saves
  const uniqueEmails = new Set(recipients.map((s) => s.userEmail.toLowerCase()))
  if (uniqueEmails.size === 0) return null

  const record: HiddenGemPromoPushRecord = {
    id: generateId('hgp'),
    gemId: input.gemId,
    promoCode: input.promoCode.trim(),
    audience: input.audience,
    sentAt: new Date().toISOString(),
    recipientCount: uniqueEmails.size,
  }

  const records = getPromoPushRecords()
  records.unshift(record)
  writeJson(PROMO_PUSH_KEY, records.slice(0, 200))

  return record
}

export function formatSaveContextLabel(context: SaveContext): string {
  switch (context) {
    case 'saved':
      return 'Saved (My Tudu)'
    case 'bucket_list':
      return 'Bucket list'
    case 'road_trip':
      return 'Road trip'
  }
}
