import {
  getAllAccounts,
  getAccount,
  getHostEvents,
  getOrganizations,
  getOrganizationsForUser,
  getOrganizationApprovalStatus,
  getOrganizationOwnerEmail,
  getOrganizationCountry,
  ensureAccount,
  getTierLabel,
  saveAccount,
  resolveTicketingMode,
  updateHostEvent,
  type HostEvent,
  type Organization,
  type UserAccount,
  type UserTier,
} from './account'
import { getAllUsers } from './auth'
import { getFeedbackItems } from './adminFeedback'
import { getDemographicsBreakdown, type DemographicsBreakdown } from './demographics'
import { getEventSaveRecords } from './distantSaves'
import { getTopSearchKeywords } from './keywordAnalytics'
import { getSavedEventIds } from './savedEvents'
import { getTicketTransactions, logCancelledTicket, logTicketTransaction, type TicketTransaction } from './ticketTransactions'
import { getTierConfig } from './tierConfig'
import {
  accountMatchesFilters,
  eventMatchesFilters,
  hasActiveGeoFilters,
  isAdminEmail,
  matchesGeoFilter,
  resolveAccountGeo,
  type AnalyticsFilters,
} from './analyticsGeo'
import { getPendingOrgVerificationCount } from './orgVerificationRequests'
import { getAffiliateClicks } from './affiliatePartners'
import { BRAND_TOKENS } from './brandTokens'

export type { AnalyticsFilters } from './analyticsGeo'
export {
  CANADIAN_PROVINCES,
  getGeoFilterOptions,
  getProvinceLabel,
  getProvincesForCountry,
  eventMatchesFilters,
  hasActiveGeoFilters,
} from './analyticsGeo'

const ACTIVITY_LOG_KEY = 'tudu-admin-activity-log'
const EVENT_METRICS_KEY = 'tudu-admin-event-metrics'

export const ACTIVITY_LOG_CHANGED_EVENT = 'tudu-activity-log-changed'

export type ActivityType =
  | 'signup'
  | 'event_published'
  | 'signin'
  | 'page_view'
  | 'feedback'
  | 'report'
  | 'event_report_escalation'
  | 'sync'
  | 'access_change'
  | 'user_suspend'
  | 'user_ban'
  | 'org_suspend'
  | 'org_ban'
  | 'message_delivery'

export interface ActivityLogEntry {
  id: string
  type: ActivityType
  label: string
  timestamp: string
  meta?: Record<string, string>
}

export interface EventMetrics {
  eventId: string
  views: number
  saves: number
  /** Detail panel opens (magnifying glass / swipe-up on Discover). */
  opens?: number
}

export interface PlatformKPIs {
  totalUsers: number
  mau: number
  dau: number
  totalEvents: number
  livePublicEvents: number
  globalViews: number
  savedInterest: number
  totalRsvps: number
  reviewQueue: number
  feedbackCount: number
  saveRate: string
  rsvpConversionRate: string
  crossCityInterest: number
  topCities: { city: string; count: number }[]
  topKeywords: { keyword: string; count: number }[]
  signupTrendWoW: string
}

export interface ChartPoint {
  date: string
  signups: number
  events: number
  rsvps: number
  reports: number
  affiliateClicks: number
  dau: number
  mau: number
}

export const ANALYTICS_CHART_RANGE_OPTIONS = [7, 14, 30, 60, 90] as const
export type AnalyticsChartRangeDays = (typeof ANALYTICS_CHART_RANGE_OPTIONS)[number]

export function parseAnalyticsChartRange(raw: string | null): AnalyticsChartRangeDays {
  const n = Number(raw)
  if (ANALYTICS_CHART_RANGE_OPTIONS.includes(n as AnalyticsChartRangeDays)) {
    return n as AnalyticsChartRangeDays
  }
  return 30
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

function generateId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function dateKey(iso: string): string {
  return iso.slice(0, 10)
}

/** Local calendar date YYYY-MM-DD — matches HTML date inputs and chart axis. */
export function localChartDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

function isWithinHours(iso: string | undefined, hours: number): boolean {
  if (!iso) return false
  const ts = new Date(iso).getTime()
  return Date.now() - ts <= hours * 60 * 60 * 1000
}

function isWithinDays(iso: string | undefined, days: number): boolean {
  return isWithinHours(iso, days * 24)
}

const ENGAGEMENT_ACTIVITY_TYPES: ActivityType[] = ['signin', 'page_view', 'signup']

/** Unique user emails active on each calendar day (from log + account last active). */
function collectDailyActiveUsers(
  log: ActivityLogEntry[],
  accounts: UserAccount[],
  filters: AnalyticsFilters,
): Map<string, Set<string>> {
  const byDay = new Map<string, Set<string>>()
  const allowedEmails = hasActiveGeoFilters(filters)
    ? new Set(filterAccounts(filters).map((a) => a.email.toLowerCase()))
    : null

  function add(day: string, email: string | undefined) {
    if (!email) return
    const normalized = email.toLowerCase()
    if (isAdminEmail(normalized)) return
    if (allowedEmails && !allowedEmails.has(normalized)) return
    const bucket = byDay.get(day) ?? new Set<string>()
    bucket.add(normalized)
    byDay.set(day, bucket)
  }

  for (const entry of log) {
    if (!ENGAGEMENT_ACTIVITY_TYPES.includes(entry.type)) continue
    add(dateKey(entry.timestamp), entry.meta?.email)
  }

  for (const account of accounts) {
    if (isAdminEmail(account.email)) continue
    if (account.lastActiveAt) add(dateKey(account.lastActiveAt), account.email)
  }

  return byDay
}

function countRollingActiveUsers(
  endDayKey: string,
  windowDays: number,
  byDay: Map<string, Set<string>>,
): number {
  const end = new Date(`${endDayKey}T12:00:00`)
  const active = new Set<string>()
  for (let offset = windowDays - 1; offset >= 0; offset--) {
    const day = new Date(end)
    day.setDate(day.getDate() - offset)
    const key = localChartDateKey(day)
    byDay.get(key)?.forEach((email) => active.add(email))
  }
  return active.size
}

export function logActivity(
  entry: Omit<ActivityLogEntry, 'id' | 'timestamp'> & { timestamp?: string },
): ActivityLogEntry {
  const log = getActivityLog()
  const full: ActivityLogEntry = {
    id: generateId(),
    timestamp: entry.timestamp ?? new Date().toISOString(),
    type: entry.type,
    label: entry.label,
    meta: entry.meta,
  }
  log.unshift(full)
  writeJson(ACTIVITY_LOG_KEY, log.slice(0, 500))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ACTIVITY_LOG_CHANGED_EVENT))
  }
  return full
}

export function getActivityLog(): ActivityLogEntry[] {
  return readJson<ActivityLogEntry[]>(ACTIVITY_LOG_KEY, [])
}

export interface AdminAnalyticsSnapshot {
  kpis: PlatformKPIs
  chart: ChartPoint[]
  activity: ActivityLogEntry[]
  demographics: DemographicsBreakdown
}

/** Single slice for AdminPieChart — label + count. */
export type AnalyticsPieSlice = { label: string; value: number; color?: string }

export type AnalyticsPieSection = {
  charts: { title: string; slices: AnalyticsPieSlice[] }[]
  drillDown?: { label: string; count: number }[]
  topCities?: { label: string; count: number }[]
  topKeywords?: { label: string; count: number }[]
  activityTypes?: { label: string; count: number }[]
}

/**
 * Data linking for analytics pie charts (Phase 1: localStorage).
 *
 * Users  → UserAccount.country, province, homeCity, tier, verificationStatus, lastActiveAt
 * Events → HostEvent.city/province/country, primaryCategory, status, visibility,
 *          seededByAdmin, seedApprovalStatus
 * Engagement → savedEvents, distantSaves, event metrics (views/saves/opens), activity log,
 *              keywordAnalytics, ticket transactions (paid/cancelled)
 *
 * Phase 2: Supabase will replace getAllAccounts/getHostEvents reads — filter helpers
 * in analyticsGeo.ts stay the same.
 */

function countBy<T extends string>(
  items: T[],
  labelFn: (key: T) => string = (k) => k,
): AnalyticsPieSlice[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    const label = labelFn(item) || 'Unknown'
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

function slicesToDrillDown(slices: AnalyticsPieSlice[]): { label: string; count: number }[] {
  return slices.map((s) => ({ label: s.label, count: s.value }))
}

function verificationLabel(status: UserAccount['verificationStatus']): string {
  return status === 'phone_verified' ? 'Phone verified' : 'Unverified'
}

function orgMembershipLabel(email: string): string {
  return getOrganizationsForUser(email).length > 0 ? 'Org member' : 'Personal only'
}

function resolveOrganizationGeo(org: Organization): ReturnType<typeof resolveAccountGeo> {
  const owner = getAccount(getOrganizationOwnerEmail(org))
  const country = getOrganizationCountry(org)
  const province = owner?.province || owner?.homeRegion || ''
  const city = owner?.homeCity?.split(',')[0]?.trim() || ''
  return { country, province, city }
}

function organizationMatchesFilters(org: Organization, filters: AnalyticsFilters): boolean {
  if (!hasActiveGeoFilters(filters)) return true
  return matchesGeoFilter(resolveOrganizationGeo(org), filters)
}

type PersonalUserBucket = 'unverified' | 'verified' | 'explorer'

function classifyPersonalUser(account: UserAccount): PersonalUserBucket {
  if (account.verificationStatus !== 'phone_verified') return 'unverified'
  if (account.tier === 'tier1') return 'explorer'
  if (account.tier === 'verified') return 'verified'
  return 'unverified'
}

type OrgTierBucket = 'unverified' | 'verified' | 'pioneer' | 'trusted'

function classifyOrganization(org: Organization): OrgTierBucket {
  if (getOrganizationApprovalStatus(org) !== 'approved') return 'unverified'
  const ownerTier = getAccount(getOrganizationOwnerEmail(org))?.tier ?? 'free'
  if (ownerTier === 'tier2') return 'trusted'
  if (ownerTier === 'tier1') return 'pioneer'
  return 'verified'
}

export type TierBreakdownRow = { label: string; count: number; color?: string }

export type UsersTierBreakdown = {
  personal: TierBreakdownRow[]
  org: TierBreakdownRow[]
}

export function getUsersTierBreakdown(filters: AnalyticsFilters = {}): UsersTierBreakdown {
  const accounts = filterAccounts(filters).filter((a) => !isAdminEmail(a.email))

  const personalCounts: Record<PersonalUserBucket, number> = {
    unverified: 0,
    verified: 0,
    explorer: 0,
  }
  for (const account of accounts) {
    if (getOrganizationsForUser(account.email).length > 0) continue
    personalCounts[classifyPersonalUser(account)] += 1
  }

  const orgCounts: Record<OrgTierBucket, number> = {
    unverified: 0,
    verified: 0,
    pioneer: 0,
    trusted: 0,
  }
  for (const org of getOrganizations()) {
    if (!organizationMatchesFilters(org, filters)) continue
    orgCounts[classifyOrganization(org)] += 1
  }

  return {
    personal: [
      { label: 'Unverified', count: personalCounts.unverified, color: BRAND_TOKENS.user.unverified },
      { label: 'Verified', count: personalCounts.verified, color: BRAND_TOKENS.user.verified },
      { label: 'Explorer', count: personalCounts.explorer, color: BRAND_TOKENS.user.explorer },
    ],
    org: [
      { label: 'Unverified', count: orgCounts.unverified, color: BRAND_TOKENS.org.unverified },
      { label: 'Verified', count: orgCounts.verified, color: BRAND_TOKENS.org.verified },
      { label: 'Pioneer', count: orgCounts.pioneer, color: BRAND_TOKENS.org.pioneer },
      { label: 'Trusted Host', count: orgCounts.trusted, color: BRAND_TOKENS.org.trustedHost },
    ],
  }
}

export function getUsersPieAnalytics(filters: AnalyticsFilters = {}): AnalyticsPieSection {
  const breakdown = getUsersTierBreakdown(filters)

  const charts = [
    {
      title: 'Personal users',
      slices: breakdown.personal.map((row) => ({
        label: row.label,
        value: row.count,
        color: row.color,
      })),
    },
    {
      title: 'Host accounts (orgs)',
      slices: breakdown.org.map((row) => ({
        label: row.label,
        value: row.count,
        color: row.color,
      })),
    },
  ]

  return { charts }
}

function eventCategoryLabel(event: HostEvent): string {
  return event.primaryCategory?.trim() || event.secondaryCategory?.trim() || 'Uncategorized'
}

function eventStatusLabel(status: HostEvent['status']): string {
  switch (status) {
    case 'live':
      return 'Live'
    case 'upcoming':
      return 'Upcoming'
    case 'past':
      return 'Past'
    case 'draft':
      return 'Draft'
    default:
      return status
  }
}

function visibilityLabel(v: HostEvent['visibility']): string {
  return v === 'private' ? 'Private' : 'Public'
}

export function getEventsPieAnalytics(filters: AnalyticsFilters = {}): AnalyticsPieSection {
  const events = filterEvents(filters)

  const byCategory = countBy(events.map(eventCategoryLabel))
  const byStatus = countBy(events.map((e) => e.status), eventStatusLabel)
  const byVisibility = countBy(events.map((e) => e.visibility), visibilityLabel)
  const bySource = countBy(events.map((e) => (e.seededByAdmin ? 'Admin seeded' : 'Host created')))

  const charts = [
    { title: 'Events by category', slices: byCategory },
    { title: 'Events by status', slices: byStatus },
    { title: 'Events by visibility', slices: byVisibility },
    { title: 'Seeded vs host', slices: bySource },
  ]

  return { charts, drillDown: slicesToDrillDown(byCategory) }
}

export function getGeographyPieAnalytics(filters: AnalyticsFilters = {}): AnalyticsPieSection {
  const accounts = filterAccounts(filters)

  const byCountry = countBy(accounts.map((a) => resolveAccountGeo(a).country))
  const byProvince = countBy(
    accounts.map((a) => a.province || a.homeRegion || 'Unknown'),
    (code) => code,
  )

  const topCities = countBy(
    accounts.map((a) => {
      const city = a.homeCity?.split(',')[0]?.trim()
      return city || 'Unknown'
    }),
  )
    .slice(0, 10)
    .map((s) => ({ label: s.label, count: s.value }))

  const charts = [
    { title: 'Users by country', slices: byCountry },
    { title: 'Users by province / state', slices: byProvince },
  ]

  return { charts, topCities }
}

export function getEngagementPieAnalytics(filters: AnalyticsFilters = {}): AnalyticsPieSection {
  const accounts = filterAccounts(filters)
  const events = filterEvents(filters)
  const filteredEventIds = new Set(events.map((e) => e.id))
  const metrics = getAllEventMetrics()
  const metricValues = Object.values(metrics).filter((m) =>
    hasActiveGeoFilters(filters) ? filteredEventIds.has(m.eventId) : true,
  )

  const totalViews = metricValues.reduce((s, m) => s + m.views, 0)
  const totalSaves = metricValues.reduce((s, m) => s + m.saves, 0)
  const totalOpens = metricValues.reduce((s, m) => s + (m.opens ?? 0), 0)
  const passesStub = Math.max(0, totalViews - totalSaves - totalOpens)

  const totalRsvps = events.reduce((s, e) => s + getEventRsvpCount(e), 0)
  const viewsWithoutRsvp = Math.max(0, totalViews - totalRsvps)

  const mau = accounts.filter((a) => isWithinDays(a.lastActiveAt, 30)).length
  const inactive = accounts.length - mau

  const activityLog = getRecentActivity(50, filters)
  const activityTypeCounts = countBy(activityLog.map((e) => e.type))

  const topKeywords = hasActiveGeoFilters(filters)
    ? getTopKeywordsForEvents(events, 8).map((k) => ({ label: k.keyword, count: k.count }))
    : getTopSearchKeywords(8).map((k) => ({
        label: k.keyword,
        count: k.views + k.saves,
      }))

  const charts = [
    {
      title: 'Card opens vs saves vs passes',
      slices: [
        { label: 'Detail opens', value: totalOpens, color: '#f59e0b' },
        { label: 'Saved', value: totalSaves, color: '#06b6d4' },
        { label: 'Passed (views − opens − saves)', value: passesStub, color: '#64748b' },
      ],
    },
    {
      title: 'RSVP conversion',
      slices: [
        { label: 'RSVPed', value: totalRsvps, color: '#10b981' },
        { label: 'Viewed, no RSVP', value: viewsWithoutRsvp, color: '#64748b' },
      ],
    },
    {
      title: 'MAU vs inactive (30d)',
      slices: [
        { label: 'MAU (active 30d)', value: mau, color: '#06b6d4' },
        { label: 'Inactive', value: inactive, color: '#64748b' },
      ],
    },
  ]

  return {
    charts,
    topKeywords,
    activityTypes: slicesToDrillDown(activityTypeCounts),
  }
}

function filterAccounts(filters: AnalyticsFilters = {}) {
  return getAllAccounts().filter(
    (a) => !isAdminEmail(a.email) && accountMatchesFilters(a, filters),
  )
}

function filterEvents(filters: AnalyticsFilters = {}) {
  return getHostEvents().filter((e) => eventMatchesFilters(e, filters))
}

function filterUsers(filters: AnalyticsFilters = {}) {
  const accounts = filterAccounts(filters)
  const accountEmails = new Set(accounts.map((a) => a.email.toLowerCase()))
  const authUsers = getAllUsers().filter(
    (u) => !isAdminEmail(u.email) && accountEmails.has(u.email.toLowerCase()),
  )
  if (authUsers.length > 0 || !hasActiveGeoFilters(filters)) return authUsers
  return accounts.map((a) => ({
    email: a.email,
    password: '',
    firstName: a.email.split('@')[0],
    lastName: '',
    joinedAt: a.joinedAt,
  }))
}

function getTopKeywordsForEvents(events: HostEvent[], limit = 5) {
  const counts = new Map<string, number>()
  for (const event of events) {
    for (const raw of [...(event.customTags ?? []), ...(event.subCategories ?? [])]) {
      const keyword = raw.trim().toLowerCase().replace(/\s+/g, '-')
      if (!keyword) continue
      counts.set(keyword, (counts.get(keyword) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export function getAnalytics(
  filters: AnalyticsFilters = {},
  options: { chartDays?: number } = {},
): AdminAnalyticsSnapshot {
  const chartDays = options.chartDays ?? 30
  return {
    kpis: getPlatformKPIs(filters),
    chart: getChartData(chartDays, filters),
    activity: getRecentActivity(15, filters),
    demographics: getDemographicsBreakdown(filters),
  }
}

export function getRecentActivity(limit = 20, filters: AnalyticsFilters = {}): ActivityLogEntry[] {
  return filterActivityLog(getActivityLog(), filters).slice(0, limit)
}

function filterActivityLog(log: ActivityLogEntry[], filters: AnalyticsFilters): ActivityLogEntry[] {
  if (!hasActiveGeoFilters(filters)) return log

  const allowedEmails = new Set(filterAccounts(filters).map((a) => a.email.toLowerCase()))
  const filteredEventIds = new Set(filterEvents(filters).map((e) => e.id))

  return log.filter((entry) => {
    if (entry.type === 'signup') {
      const email = entry.meta?.email?.toLowerCase()
      return email ? allowedEmails.has(email) : false
    }
    if (entry.type === 'event_published') {
      const eventId = entry.meta?.eventId
      if (eventId) return filteredEventIds.has(eventId)
      return filteredEventIds.size > 0
    }
    return true
  })
}

export const NOISE_ACTIVITY_TYPES: ActivityType[] = ['signin', 'page_view']

/** High-volume session noise — keep off the platform feed; use lastActiveAt for DAU/MAU. */
export function isNoiseActivityType(type: ActivityType): boolean {
  return NOISE_ACTIVITY_TYPES.includes(type)
}

export type ActivitySubjectKind = 'platform' | 'user' | 'org'

export type ActivitySubjectFilter =
  | { kind: 'platform' }
  | { kind: 'user'; email: string }
  | { kind: 'org'; orgId: string }

export type ActivitySubjectOption = {
  kind: 'user' | 'org'
  id: string
  label: string
  email?: string
  tierLabel: string
  tierColor: string
}

function normalizeActivityEmail(value: string | undefined): string | undefined {
  return value?.trim().toLowerCase() || undefined
}

export function activityEntryMatchesUser(entry: ActivityLogEntry, email: string): boolean {
  const target = normalizeActivityEmail(email)
  if (!target) return false
  const meta = entry.meta ?? {}
  for (const value of [meta.email, meta.toEmail, meta.memberEmail]) {
    if (normalizeActivityEmail(value) === target) return true
  }
  const eventId = meta.eventId
  if (eventId) {
    const event = getHostEvents().find((e) => e.id === eventId)
    if (normalizeActivityEmail(event?.createdBy) === target) return true
  }
  return false
}

export function activityEntryMatchesOrg(entry: ActivityLogEntry, orgId: string): boolean {
  if (!orgId) return false
  const meta = entry.meta ?? {}
  if (meta.orgId === orgId) return true
  const eventId = meta.eventId
  if (eventId) {
    const event = getHostEvents().find((e) => e.id === eventId)
    if (event?.hostAccountId === orgId) return true
  }
  return false
}

function applyActivitySubjectFilter(
  list: ActivityLogEntry[],
  subject: ActivitySubjectFilter | undefined,
): ActivityLogEntry[] {
  if (!subject || subject.kind === 'platform') return list
  if (subject.kind === 'user') {
    return list.filter((entry) => activityEntryMatchesUser(entry, subject.email))
  }
  return list.filter((entry) => activityEntryMatchesOrg(entry, subject.orgId))
}

/** Users + orgs for activity drill-down picker. */
export function getActivitySubjectOptions(): ActivitySubjectOption[] {
  const options: ActivitySubjectOption[] = []

  for (const user of getAllUsers()) {
    if (isAdminEmail(user.email)) continue
    const account = ensureAccount(user.email)
    let tierLabel = 'Unverified'
    let tierColor: string = BRAND_TOKENS.user.unverified
    if (account.verificationStatus !== 'phone_verified') {
      // defaults
    } else if (account.tier === 'tier1') {
      tierLabel = 'Explorer'
      tierColor = BRAND_TOKENS.user.explorer
    } else if (account.tier === 'verified' || account.tier === 'tier2') {
      tierLabel = 'Verified'
      tierColor = BRAND_TOKENS.user.verified
    } else {
      tierLabel = 'Verified'
      tierColor = BRAND_TOKENS.user.verified
    }
    options.push({
      kind: 'user',
      id: user.email,
      label: `${user.firstName} ${user.lastName}`.trim() || user.email,
      email: user.email,
      tierLabel,
      tierColor,
    })
  }

  for (const org of getOrganizations()) {
    let tierLabel = 'Unverified'
    let tierColor: string = BRAND_TOKENS.org.unverified
    if (getOrganizationApprovalStatus(org) === 'approved') {
      const ownerTier = getAccount(getOrganizationOwnerEmail(org))?.tier ?? 'free'
      if (ownerTier === 'tier2') {
        tierLabel = 'Trusted Host'
        tierColor = BRAND_TOKENS.org.trustedHost
      } else if (ownerTier === 'tier1') {
        tierLabel = 'Pioneer'
        tierColor = BRAND_TOKENS.org.pioneer
      } else {
        tierLabel = 'Verified'
        tierColor = BRAND_TOKENS.org.verified
      }
    }
    options.push({
      kind: 'org',
      id: org.id,
      label: org.name,
      tierLabel,
      tierColor,
    })
  }

  return options.sort((a, b) => a.label.localeCompare(b.label))
}

export type ActivityLogFilterOptions = {
  type?: ActivityType | 'all'
  search?: string
  limit?: number
  /** Hide sign-in / page-view noise from the platform feed. */
  excludeNoise?: boolean
  subject?: ActivitySubjectFilter
}

export function getFilteredActivityLog(
  filters: AnalyticsFilters = {},
  options: ActivityLogFilterOptions = {},
): ActivityLogEntry[] {
  let list = filterActivityLog(getActivityLog(), filters)
  list = applyActivitySubjectFilter(list, options.subject)
  if (options.excludeNoise) {
    list = list.filter((entry) => !isNoiseActivityType(entry.type))
  }
  if (options.type && options.type !== 'all') {
    list = list.filter((entry) => entry.type === options.type)
  }
  const search = options.search?.trim().toLowerCase()
  if (search) {
    list = list.filter(
      (entry) =>
        entry.label.toLowerCase().includes(search) ||
        entry.type.toLowerCase().includes(search) ||
        Object.values(entry.meta ?? {}).some((value) => value.toLowerCase().includes(search)),
    )
  }
  const limit = options.limit ?? list.length
  return list.slice(0, limit)
}

export function getActivityTypeCounts(
  options: Pick<ActivityLogFilterOptions, 'excludeNoise' | 'subject'> = {},
): { type: ActivityType; count: number }[] {
  const counts = new Map<ActivityType, number>()
  let list = getActivityLog()
  list = applyActivitySubjectFilter(list, options.subject)
  if (options.excludeNoise) {
    list = list.filter((entry) => !isNoiseActivityType(entry.type))
  }
  for (const entry of list) {
    counts.set(entry.type, (counts.get(entry.type) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
}

export function getMAU(filters: AnalyticsFilters = {}): number {
  return filterAccounts(filters).filter((a) => isWithinDays(a.lastActiveAt, 30)).length
}

export function getDAU(filters: AnalyticsFilters = {}): number {
  return filterAccounts(filters).filter((a) => isWithinHours(a.lastActiveAt, 24)).length
}

function getEventRsvpCount(event: HostEvent): number {
  return (event.ticketTiers ?? []).reduce((sum, t) => sum + (t.sold ?? 0), 0)
}

export function getAllEventMetrics(): Record<string, EventMetrics> {
  return readJson<Record<string, EventMetrics>>(EVENT_METRICS_KEY, {})
}

export function getEventMetrics(eventId: string): EventMetrics {
  const all = getAllEventMetrics()
  return all[eventId] ?? { eventId, views: 0, saves: 0 }
}

function syncHiddenGemMetricsIfNeeded(eventId: string, type: 'view' | 'open' | 'save'): void {
  if (!eventId.startsWith('hidden-gem-')) return
  void import('./hiddenGemAnalytics').then(({ maybeSyncHiddenGemFromMetricsId }) => {
    maybeSyncHiddenGemFromMetricsId(eventId, type)
  })
}

export function incrementEventView(eventId: string): void {
  const all = getAllEventMetrics()
  const current = all[eventId] ?? { eventId, views: 0, saves: 0 }
  all[eventId] = { ...current, views: current.views + 1 }
  writeJson(EVENT_METRICS_KEY, all)
  syncHiddenGemMetricsIfNeeded(eventId, 'view')
}

export function incrementEventSave(eventId: string): void {
  const all = getAllEventMetrics()
  const current = all[eventId] ?? { eventId, views: 0, saves: 0 }
  all[eventId] = { ...current, saves: current.saves + 1 }
  writeJson(EVENT_METRICS_KEY, all)
  syncHiddenGemMetricsIfNeeded(eventId, 'save')
}

export function incrementEventOpen(eventId: string): void {
  const all = getAllEventMetrics()
  const current = all[eventId] ?? { eventId, views: 0, saves: 0, opens: 0 }
  all[eventId] = { ...current, opens: (current.opens ?? 0) + 1 }
  writeJson(EVENT_METRICS_KEY, all)
  syncHiddenGemMetricsIfNeeded(eventId, 'open')
}

export function setEventMetrics(
  eventId: string,
  partial: Partial<Omit<EventMetrics, 'eventId'>>,
): void {
  const all = getAllEventMetrics()
  const current = all[eventId] ?? { eventId, views: 0, saves: 0 }
  all[eventId] = { ...current, ...partial, eventId }
  writeJson(EVENT_METRICS_KEY, all)
}

export type TicketSalesKPIs = {
  /** Sum of tier.sold across filtered events (RSVPs + paid tickets). */
  totalRsvps: number
  /** Paid in-app checkout rows in the transaction log. */
  paidTransactions: number
  /** Paid rows with $0 amount (free RSVP / donation checkout). */
  freeCheckouts: number
  /** @deprecated Use paidTransactions */
  totalSold: number
  totalRevenueCents: number
  cancelledCount: number
  avgTicketPriceCents: number
}

export type TicketSalesEventRow = {
  eventId: string
  title: string
  category: string
  sold: number
  revenueCents: number
}

function filterTransactionsByEvents(
  transactions: TicketTransaction[],
  events: HostEvent[],
): TicketTransaction[] {
  const eventIds = new Set(events.map((e) => e.id))
  return transactions.filter((t) => eventIds.has(t.eventId))
}

export function getTicketSalesKPIs(filters: AnalyticsFilters = {}): TicketSalesKPIs {
  const events = filterEvents(filters)
  const transactions = filterTransactionsByEvents(getTicketTransactions(), events)
  const paid = transactions.filter((t) => t.status === 'paid')
  const cancelled = transactions.filter((t) => t.status === 'cancelled')
  const paidTransactions = paid.filter((t) => t.amountCents > 0).length
  const freeCheckouts = paid.filter((t) => t.amountCents === 0).length
  const paidRevenueRows = paid.filter((t) => t.amountCents > 0)
  const totalRevenueCents = paidRevenueRows.reduce((s, t) => s + t.amountCents, 0)
  const totalRsvps = events.reduce((sum, event) => sum + getEventRsvpCount(event), 0)

  return {
    totalRsvps,
    paidTransactions,
    freeCheckouts,
    totalSold: paidTransactions,
    totalRevenueCents,
    cancelledCount: cancelled.length,
    avgTicketPriceCents:
      paidTransactions > 0 ? Math.round(totalRevenueCents / paidTransactions) : 0,
  }
}

function ticketingModeLabel(mode: ReturnType<typeof resolveTicketingMode>): string {
  switch (mode) {
    case 'sell':
      return 'Paid (Tudu)'
    case 'external':
      return 'External link'
    case 'free_rsvp':
      return 'Free RSVP'
    case 'free_donation':
      return 'Donation / Zeffy'
  }
}

function rsvpSlicesBy(
  events: HostEvent[],
  labelFn: (event: HostEvent) => string,
): AnalyticsPieSlice[] {
  const counts = new Map<string, number>()
  for (const event of events) {
    const sold = getEventRsvpCount(event)
    if (sold <= 0) continue
    const label = labelFn(event) || 'Unknown'
    counts.set(label, (counts.get(label) ?? 0) + sold)
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

export function getTicketSalesPieAnalytics(filters: AnalyticsFilters = {}): AnalyticsPieSection {
  const events = filterEvents(filters)

  const byCategory = rsvpSlicesBy(events, eventCategoryLabel)
  const byMode = rsvpSlicesBy(events, (e) => ticketingModeLabel(resolveTicketingMode(e)))

  const charts = [
    { title: 'RSVPs / tickets by category', slices: byCategory },
    { title: 'RSVPs / tickets by mode', slices: byMode },
  ]

  const drillDown = [...slicesToDrillDown(byCategory), ...slicesToDrillDown(byMode)].sort(
    (a, b) => b.count - a.count,
  )

  return { charts, drillDown }
}

export function getTopEventsByTicketSales(
  filters: AnalyticsFilters = {},
  limit = 10,
): TicketSalesEventRow[] {
  const events = filterEvents(filters)
  const transactions = filterTransactionsByEvents(getTicketTransactions(), events).filter(
    (t) => t.status === 'paid' && t.amountCents > 0,
  )

  const revenueByEvent = new Map<string, number>()
  for (const txn of transactions) {
    revenueByEvent.set(txn.eventId, (revenueByEvent.get(txn.eventId) ?? 0) + txn.amountCents)
  }

  return events
    .map((event) => {
      const sold = getEventRsvpCount(event)
      return {
        eventId: event.id,
        title: event.title,
        category: eventCategoryLabel(event),
        sold,
        revenueCents: revenueByEvent.get(event.id) ?? 0,
      }
    })
    .filter((row) => row.sold > 0)
    .sort((a, b) => b.sold - a.sold || b.revenueCents - a.revenueCents)
    .slice(0, limit)
}

export function getCardOpensKPIs(filters: AnalyticsFilters = {}): {
  totalOpens: number
  totalSaves: number
  totalViews: number
  openRate: string
  saveRate: string
  passRate: string
} {
  const events = filterEvents(filters)
  const filteredEventIds = new Set(events.map((e) => e.id))
  const metrics = getAllEventMetrics()
  const metricValues = Object.values(metrics).filter((m) => filteredEventIds.has(m.eventId))

  const totalViews = metricValues.reduce((s, m) => s + m.views, 0)
  const totalSaves = metricValues.reduce((s, m) => s + m.saves, 0)
  const totalOpens = metricValues.reduce((s, m) => s + (m.opens ?? 0), 0)
  const passes = Math.max(0, totalViews - totalSaves - totalOpens)

  return {
    totalOpens,
    totalSaves,
    totalViews,
    openRate: formatRate(totalOpens, totalViews),
    saveRate: formatRate(totalSaves, totalViews),
    passRate: formatRate(passes, totalViews),
  }
}

export function formatCents(cents: number): string {
  if (cents === 0) return '$0'
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
}

function formatRate(numerator: number, denominator: number): string {
  if (denominator <= 0) return '—'
  return `${((numerator / denominator) * 100).toFixed(1)}%`
}

function getSignupTrendWoW(filters: AnalyticsFilters = {}): string {
  const accounts = filterAccounts(filters)
  const now = Date.now()
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const thisWeekStart = now - weekMs
  const prevWeekStart = now - weekMs * 2

  let thisWeek = 0
  let prevWeek = 0
  for (const account of accounts) {
    if (!account.joinedAt) continue
    const ts = new Date(account.joinedAt).getTime()
    if (ts >= thisWeekStart) thisWeek += 1
    else if (ts >= prevWeekStart && ts < thisWeekStart) prevWeek += 1
  }

  if (prevWeek === 0) return thisWeek > 0 ? '+100%' : '—'
  const change = ((thisWeek - prevWeek) / prevWeek) * 100
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(0)}%`
}

export function getPlatformKPIs(filters: AnalyticsFilters = {}): PlatformKPIs {
  const accounts = filterAccounts(filters)
  const events = filterEvents(filters)
  const filteredEventIds = new Set(events.map((e) => e.id))
  const metrics = getAllEventMetrics()
  const metricValues = Object.values(metrics).filter((m) => filteredEventIds.has(m.eventId))
  const globalViews = metricValues.reduce((s, m) => s + m.views, 0)
  const metricSaves = metricValues.reduce((s, m) => s + m.saves, 0)
  const savedInterest = hasActiveGeoFilters(filters)
    ? getSavedEventIds().filter((id) => filteredEventIds.has(id)).length
    : getSavedEventIds().length
  const totalRsvps = events.reduce((s, e) => s + getEventRsvpCount(e), 0)
  const pendingOrgVerifications = getPendingOrgVerificationCount()
  const feedback = getFeedbackItems()
  const allowedEmails = new Set(filterAccounts(filters).map((a) => a.email.toLowerCase()))
  const crossCityInterest = getEventSaveRecords().filter((r) => {
    if (!r.isDistant) return false
    if (!hasActiveGeoFilters(filters)) return true
    return allowedEmails.has(r.userEmail.toLowerCase())
  }).length
  const topCities = getDemographicsBreakdown(filters).byCity.slice(0, 5)
  const topKeywords = hasActiveGeoFilters(filters)
    ? getTopKeywordsForEvents(events, 5)
    : getTopSearchKeywords(5).map((k) => ({
        keyword: k.keyword,
        count: k.views + k.saves,
      }))

  return {
    totalUsers: accounts.length,
    mau: getMAU(filters),
    dau: getDAU(filters),
    totalEvents: events.length,
    livePublicEvents: events.filter(
      (e) => e.visibility === 'public' && (e.status === 'live' || e.status === 'upcoming'),
    ).length,
    globalViews,
    savedInterest,
    totalRsvps,
    reviewQueue: pendingOrgVerifications,
    feedbackCount: feedback.filter((f) => f.status === 'open').length,
    saveRate: formatRate(metricSaves, globalViews),
    rsvpConversionRate: formatRate(totalRsvps, globalViews),
    crossCityInterest,
    topCities,
    topKeywords,
    signupTrendWoW: getSignupTrendWoW(filters),
  }
}

export function getChartData(days = 30, filters: AnalyticsFilters = {}): ChartPoint[] {
  const log = getActivityLog()
  const accounts = filterAccounts(filters)
  const users = filterUsers(filters)
  const events = filterEvents(filters)
  const allowedEmails = new Set(accounts.map((a) => a.email.toLowerCase()))
  const feedback = getFeedbackItems()
  const ticketTxns = getTicketTransactions().filter((txn) => txn.status === 'paid')
  const affiliateClicks = getAffiliateClicks()
  const dailyActiveUsers = collectDailyActiveUsers(log, accounts, filters)
  const points: ChartPoint[] = []

  for (let i = days - 1; i >= 0; i--) {
    const day = daysAgo(i)
    const key = localChartDateKey(day)
    const signupsFromLog = log.filter(
      (e) =>
        e.type === 'signup' &&
        dateKey(e.timestamp) === key &&
        (!hasActiveGeoFilters(filters) ||
          (e.meta?.email && allowedEmails.has(e.meta.email.toLowerCase()))),
    ).length
    const signupsFromUsers = hasActiveGeoFilters(filters)
      ? accounts.filter((a) => a.joinedAt && dateKey(a.joinedAt) === key).length
      : users.filter((u) => u.joinedAt && dateKey(u.joinedAt) === key).length
    const eventsFromLog = log.filter(
      (e) => e.type === 'event_published' && dateKey(e.timestamp) === key,
    ).length
    const eventsFromData = events.filter((e) => dateKey(e.createdAt) === key).length
    const rsvps = ticketTxns.filter((txn) => dateKey(txn.timestamp) === key).length
    const reports = feedback.filter((item) => dateKey(item.createdAt) === key).length
    const affiliateDay = affiliateClicks.filter((click) => dateKey(click.timestamp) === key).length
    const dau = dailyActiveUsers.get(key)?.size ?? 0
    const mau = countRollingActiveUsers(key, 30, dailyActiveUsers)

    points.push({
      date: key,
      signups: Math.max(signupsFromLog, signupsFromUsers),
      events: hasActiveGeoFilters(filters) ? eventsFromData : Math.max(eventsFromLog, eventsFromData),
      rsvps,
      reports,
      affiliateClicks: affiliateDay,
      dau,
      mau,
    })
  }

  return points
}

export function formatRelativeTime(iso: string | undefined): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export function isInactiveUser(lastActiveAt: string | undefined, days = 14): boolean {
  if (!lastActiveAt) return true
  return !isWithinDays(lastActiveAt, days)
}

export function seedDemoAnalytics(): void {
  seedDemoGeoUsers()
  ensureDemoEngagementActivity()

  if (getActivityLog().length === 0) {
    const now = Date.now()
    const demoEntries: Omit<ActivityLogEntry, 'id'>[] = []

    for (let i = 29; i >= 0; i--) {
      const ts = new Date(now - i * 86400000).toISOString()
      const dayOffset = 29 - i
      if (i % 3 === 0) {
        demoEntries.push({
          type: 'signup',
          label: 'New user registered',
          timestamp: ts,
          meta: { email: `user${dayOffset}@example.com` },
        })
      }
      if (i % 4 === 0) {
        demoEntries.push({
          type: 'event_published',
          label: 'Event published to discover',
          timestamp: ts,
        })
      }
      const dauCount = 4 + (i % 6)
      for (let u = 0; u < dauCount; u++) {
        demoEntries.push({
          type: u % 2 === 0 ? 'signin' : 'page_view',
          label: u % 2 === 0 ? 'User signed in' : 'Page view recorded',
          timestamp: new Date(now - i * 86400000 + u * 5400000).toISOString(),
          meta: { email: `active${dayOffset}-${u}@example.com` },
        })
      }
    }

    demoEntries.push({
      type: 'sync',
      label: 'Local data synced',
      timestamp: new Date().toISOString(),
    })

    writeJson(
      ACTIVITY_LOG_KEY,
      demoEntries.map((e) => ({ ...e, id: generateId() })),
    )
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(ACTIVITY_LOG_CHANGED_EVENT))
    }

    const events = getHostEvents()
    const metrics: Record<string, EventMetrics> = {}
    for (const event of events.slice(0, 20)) {
      const views = 12 + Math.floor(Math.random() * 80)
      const saves = Math.floor(Math.random() * 15)
      metrics[event.id] = {
        eventId: event.id,
        views,
        saves,
        opens: Math.min(views, Math.floor(Math.random() * 25) + 3),
      }
    }
    writeJson(EVENT_METRICS_KEY, metrics)
  }

  seedDemoTicketSales(getHostEvents())
}

const DEMO_ENGAGEMENT_ACTIVITY_KEY = 'tudu_demo_engagement_activity_v1'

/** Backfill sign-in/page-view history so DAU/MAU charts have demo data. */
function ensureDemoEngagementActivity(): void {
  try {
    if (localStorage.getItem(DEMO_ENGAGEMENT_ACTIVITY_KEY)) return
  } catch {
    return
  }

  const log = getActivityLog()
  if (log.some((entry) => entry.type === 'signin' || entry.type === 'page_view')) {
    try {
      localStorage.setItem(DEMO_ENGAGEMENT_ACTIVITY_KEY, '1')
    } catch {
      /* ignore */
    }
    return
  }

  const now = Date.now()
  const entries: ActivityLogEntry[] = []
  for (let i = 29; i >= 0; i--) {
    const dayOffset = 29 - i
    const dauCount = 4 + (i % 6)
    for (let u = 0; u < dauCount; u++) {
      entries.push({
        id: generateId(),
        type: u % 2 === 0 ? 'signin' : 'page_view',
        label: u % 2 === 0 ? 'User signed in' : 'Page view recorded',
        timestamp: new Date(now - i * 86400000 + u * 5400000).toISOString(),
        meta: { email: `active${dayOffset}-${u}@example.com` },
      })
    }
  }

  writeJson(ACTIVITY_LOG_KEY, [...entries, ...log].slice(0, 500))
  try {
    localStorage.setItem(DEMO_ENGAGEMENT_ACTIVITY_KEY, '1')
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ACTIVITY_LOG_CHANGED_EVENT))
  }
}

const DEMO_TICKET_SALES_KEY = 'tudu_demo_ticket_sales_v1'

function seedDemoTicketSales(events: HostEvent[]): void {
  try {
    if (localStorage.getItem(DEMO_TICKET_SALES_KEY)) return
  } catch {
    return
  }

  const sellEvents = events.filter((e) => resolveTicketingMode(e) === 'sell').slice(0, 8)
  const rsvpEvents = events.filter((e) => resolveTicketingMode(e) === 'free_rsvp').slice(0, 6)

  for (const event of sellEvents) {
    const tier = event.ticketTiers?.[0]
    if (!tier) continue
    const soldCount = 3 + Math.floor(Math.random() * 12)
    const cancelledCount = Math.floor(Math.random() * 3)
    const priceCents = tier.priceCents ?? 1500

    for (let i = 0; i < soldCount; i++) {
      logTicketTransaction({
        eventId: event.id,
        tierId: tier.id,
        tierName: tier.name || 'General Admission',
        amountCents: priceCents,
        timestamp: new Date(Date.now() - i * 86400000 * 2).toISOString(),
      })
    }
    for (let i = 0; i < cancelledCount; i++) {
      logCancelledTicket({
        eventId: event.id,
        tierId: tier.id,
        tierName: tier.name || 'General Admission',
        amountCents: priceCents,
      })
    }
    updateHostEvent(event.id, {
      ticketTiers: (event.ticketTiers ?? []).map((t, idx) =>
        idx === 0 ? { ...t, sold: soldCount } : t,
      ),
    })
  }

  for (const event of rsvpEvents) {
    const tier = event.ticketTiers?.[0]
    if (!tier) continue
    const soldCount = 5 + Math.floor(Math.random() * 20)
    for (let i = 0; i < soldCount; i++) {
      logTicketTransaction({
        eventId: event.id,
        tierId: tier.id,
        tierName: tier.name || 'RSVP',
        amountCents: 0,
        timestamp: new Date(Date.now() - i * 86400000).toISOString(),
      })
    }
    updateHostEvent(event.id, {
      ticketTiers: (event.ticketTiers ?? []).map((t, idx) =>
        idx === 0 ? { ...t, sold: soldCount } : t,
      ),
    })
  }

  try {
    localStorage.setItem(DEMO_TICKET_SALES_KEY, '1')
  } catch {
    /* ignore */
  }
}

export type TierSubscriptionAnalytics = {
  verifiedHosts: number
  explorerSubs: number
  pioneerSubs: number
  trustedSubs: number
  freeUnverified: number
  estimatedMrr: number
}

export function getTierSubscriptionAnalytics(): TierSubscriptionAnalytics {
  const config = getTierConfig()
  const accounts = getAllAccounts().filter((a) => !isAdminEmail(a.email))

  let verifiedHosts = 0
  let explorerSubs = 0
  let pioneerSubs = 0
  let trustedSubs = 0
  let freeUnverified = 0

  for (const account of accounts) {
    if (account.verificationStatus !== 'phone_verified') {
      freeUnverified += 1
      continue
    }
    switch (account.tier) {
      case 'tier2':
        trustedSubs += 1
        break
      case 'tier1':
        if (getOrganizationsForUser(account.email).length > 0) {
          pioneerSubs += 1
        } else {
          explorerSubs += 1
        }
        break
      default:
        verifiedHosts += 1
    }
  }

  const estimatedMrr =
    explorerSubs * config.explorer.pricing.monthly +
    pioneerSubs * config.pioneer.pricing.monthly +
    trustedSubs * config.trusted.pricing.monthly

  return { verifiedHosts, explorerSubs, pioneerSubs, trustedSubs, freeUnverified, estimatedMrr }
}

const DEMO_GEO_USERS_KEY = 'tudu_demo_geo_users_v1'

const DEMO_GEO_USERS: {
  email: string
  homeCity: string
  province: string
  country: string
  tier?: UserTier
  verificationStatus?: UserAccount['verificationStatus']
  lastActiveDaysAgo?: number
}[] = [
  { email: 'saskatoon.user@example.com', homeCity: 'Saskatoon, SK', province: 'SK', country: 'Canada', tier: 'free', verificationStatus: 'unverified', lastActiveDaysAgo: 0 },
  { email: 'regina.user@example.com', homeCity: 'Regina, SK', province: 'SK', country: 'Canada', tier: 'verified', verificationStatus: 'phone_verified', lastActiveDaysAgo: 2 },
  { email: 'kindersley.user@example.com', homeCity: 'Kindersley, SK', province: 'SK', country: 'Canada', tier: 'tier1', verificationStatus: 'phone_verified', lastActiveDaysAgo: 5 },
  { email: 'moosejaw.user@example.com', homeCity: 'Moose Jaw, SK', province: 'SK', country: 'Canada', tier: 'free', verificationStatus: 'unverified', lastActiveDaysAgo: 45 },
  { email: 'calgary.user@example.com', homeCity: 'Calgary, AB', province: 'AB', country: 'Canada', tier: 'tier2', verificationStatus: 'phone_verified', lastActiveDaysAgo: 1 },
  { email: 'guelph.user@example.com', homeCity: 'Guelph, ON', province: 'ON', country: 'Canada', tier: 'verified', verificationStatus: 'phone_verified', lastActiveDaysAgo: 3 },
  { email: 'vancouver.user@example.com', homeCity: 'Vancouver, BC', province: 'BC', country: 'Canada', tier: 'tier1', verificationStatus: 'phone_verified', lastActiveDaysAgo: 0 },
  { email: 'seattle.user@example.com', homeCity: 'Seattle, WA', province: 'WA', country: 'United States', tier: 'verified', verificationStatus: 'phone_verified', lastActiveDaysAgo: 4 },
  { email: 'austin.user@example.com', homeCity: 'Austin, TX', province: 'TX', country: 'United States', tier: 'free', verificationStatus: 'unverified', lastActiveDaysAgo: 60 },
  { email: 'london.user@example.com', homeCity: 'London', province: 'ENG', country: 'United Kingdom', tier: 'verified', verificationStatus: 'phone_verified', lastActiveDaysAgo: 7 },
  { email: 'manchester.user@example.com', homeCity: 'Manchester', province: 'ENG', country: 'United Kingdom', tier: 'free', verificationStatus: 'unverified', lastActiveDaysAgo: 20 },
]

function seedDemoGeoUsers(): void {
  try {
    if (localStorage.getItem(DEMO_GEO_USERS_KEY)) return
  } catch {
    return
  }

  const now = Date.now()
  for (let i = 0; i < DEMO_GEO_USERS.length; i++) {
    const spec = DEMO_GEO_USERS[i]
    const account = ensureAccount(spec.email)
    const daysAgoOffset = i * 2
    const lastActiveMs =
      (spec.lastActiveDaysAgo ?? i % 3) * 86400000 +
      (spec.lastActiveDaysAgo === 0 ? 3600000 : 0)
    saveAccount({
      ...account,
      homeCity: spec.homeCity,
      homeRegion: spec.province,
      province: spec.province,
      country: spec.country,
      tier: spec.tier ?? account.tier,
      verificationStatus: spec.verificationStatus ?? account.verificationStatus,
      joinedAt: new Date(now - daysAgoOffset * 86400000).toISOString(),
      lastActiveAt: new Date(now - lastActiveMs).toISOString(),
    })
  }

  try {
    localStorage.setItem(DEMO_GEO_USERS_KEY, '1')
  } catch {
    /* ignore */
  }
}
