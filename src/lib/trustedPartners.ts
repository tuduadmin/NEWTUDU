/**
 * Platform-managed Trusted Partner orgs (green Discover cards, calendar import).
 */

import {
  defaultHostEventFormData,
  approveSeedEvent,
  getHostEvents,
  getOrganization,
  getOrganizations,
  ORGANIZATIONS_CHANGED_EVENT,
  updateOrganization,
  type HostEvent,
  type Organization,
  type TicketingMode,
} from './account'
import { createAdminSeededEvent, type SeedTarget } from './adminSeed'
import type { EventCardBorderType } from './eventCardColors'

export const TRUSTED_PARTNERS_CHANGED_EVENT = ORGANIZATIONS_CHANGED_EVENT

export type PartnerLifecycle = 'active' | 'invited' | 'graduated'

export type PartnerImportEvent = {
  title: string
  description?: string
  city?: string
  province?: string
  startDate: string
  externalTicketUrl?: string
  zeffyUrl?: string
  ticketingMode?: TicketingMode
  primaryCategory?: string
}

export type PartnerImportResult = {
  ok: boolean
  imported: number
  skipped: number
  eventIds: string[]
  error?: string
}

export const PARTNER_PLATFORM_OWNER = 'admin@tudu.ca'

const PARTNER_ORG_IDS = {
  tourismKindersley: 'org_partner_tourism_kindersley',
  discoverSask: 'org_partner_discover_sask',
} as const

const SAMPLE_CALENDAR_EVENTS: Record<string, PartnerImportEvent[]> = {
  [PARTNER_ORG_IDS.tourismKindersley]: [
    {
      title: 'Kindersley Farmers Market',
      description:
        'Fresh produce, baked goods, and local artisans every Saturday morning on the Kindersley town square.',
      city: 'Kindersley',
      province: 'SK',
      startDate: offsetDate(7),
      ticketingMode: 'free_rsvp',
      primaryCategory: 'food-drink',
    },
    {
      title: 'West Central Music Festival',
      description: 'Live bands, food trucks, and family activities at the Kindersley arena grounds.',
      city: 'Kindersley',
      province: 'SK',
      startDate: offsetDate(21),
      ticketingMode: 'external',
      externalTicketUrl: 'https://www.eventbrite.com/e/sample-kindersley-music-fest',
      primaryCategory: 'music',
    },
    {
      title: 'Community Charity Breakfast',
      description: 'Annual fundraiser supporting local youth programs. Pay-what-you-can via Zeffy.',
      city: 'Kindersley',
      province: 'SK',
      startDate: offsetDate(14),
      ticketingMode: 'free_donation',
      zeffyUrl: 'https://www.zeffy.com/en-CA/sample-charity-breakfast',
      primaryCategory: 'community',
    },
    {
      title: 'Heritage Day at the Museum',
      description: 'Guided tours, pioneer demonstrations, and kids crafts at the Kindersley museum.',
      city: 'Kindersley',
      province: 'SK',
      startDate: offsetDate(28),
      ticketingMode: 'free_rsvp',
      primaryCategory: 'arts-culture',
    },
  ],
  [PARTNER_ORG_IDS.discoverSask]: [
    {
      title: 'Saskatchewan Summer Games Preview',
      description: 'Meet athletes and explore sport venues ahead of the provincial summer games.',
      city: 'Saskatoon',
      province: 'SK',
      startDate: offsetDate(10),
      ticketingMode: 'free_rsvp',
      primaryCategory: 'sports-fitness',
    },
    {
      title: 'Prairie Food & Drink Festival',
      description: 'Province-wide tasting event featuring Saskatchewan breweries and farm-to-table chefs.',
      city: 'Regina',
      province: 'SK',
      startDate: offsetDate(18),
      ticketingMode: 'external',
      externalTicketUrl: 'https://www.eventbrite.com/e/sample-sask-food-fest',
      primaryCategory: 'food-drink',
    },
    {
      title: 'Tourism Saskatchewan Open House',
      description: 'Travel counsellors, road-trip ideas, and free guides for exploring the province.',
      city: 'Regina',
      province: 'SK',
      startDate: offsetDate(5),
      ticketingMode: 'free_rsvp',
      primaryCategory: 'community',
    },
  ],
}

function offsetDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function generatePartnerOrgId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40)
  return `org_partner_${slug}_${Date.now().toString(36).slice(-4)}`
}

export function isTrustedPartnerOrg(org: Organization): boolean {
  return org.isTrustedPartner === true && org.partnerLifecycle !== 'graduated'
}

export function getTrustedPartnerOrgs(): Organization[] {
  return getOrganizations().filter((o) => o.isTrustedPartner)
}

export function getActiveTrustedPartnerOrgs(): Organization[] {
  return getTrustedPartnerOrgs().filter((o) => (o.partnerLifecycle ?? 'active') !== 'graduated')
}

export function getPartnerEventStats(orgId: string): {
  total: number
  live: number
  pending: number
} {
  const events = getHostEvents().filter((e) => e.hostAccountId === orgId)
  return {
    total: events.length,
    live: events.filter((e) => e.status === 'live' && e.visibility === 'public').length,
    pending: events.filter((e) => e.seedApprovalStatus === 'pending').length,
  }
}

export function seedTrustedPartnerOrgs(): void {
  const orgs = getOrganizations()
  const seeds: Organization[] = [
    {
      id: PARTNER_ORG_IDS.tourismKindersley,
      name: 'Tourism Kindersley',
      category: 'Tourism',
      logoInitial: 'T',
      profile: 'Official tourism partner — events imported from local calendars.',
      createdBy: PARTNER_PLATFORM_OWNER,
      createdAt: new Date().toISOString(),
      primaryAdminEmail: PARTNER_PLATFORM_OWNER,
      backupAdminEmail: '',
      approvalStatus: 'approved',
      departments: [],
      country: 'Canada',
      isTrustedPartner: true,
      partnerLifecycle: 'active',
      partnerCity: 'Kindersley',
      partnerProvince: 'SK',
      calendarFeedUrl: 'https://example.com/kindersley/events.ics',
      partnerDefaultTicketing: 'external',
      partnerNotes: 'Demo SK tourism partner — import sample calendar to fill Discover.',
    },
    {
      id: PARTNER_ORG_IDS.discoverSask,
      name: 'Tourism Saskatchewan',
      category: 'Tourism',
      logoInitial: 'S',
      profile: 'Provincial tourism calendar partner for Saskatchewan event discovery.',
      createdBy: PARTNER_PLATFORM_OWNER,
      createdAt: new Date().toISOString(),
      primaryAdminEmail: PARTNER_PLATFORM_OWNER,
      backupAdminEmail: '',
      approvalStatus: 'approved',
      departments: [],
      country: 'Canada',
      isTrustedPartner: true,
      partnerLifecycle: 'active',
      partnerCity: 'Regina',
      partnerProvince: 'SK',
      calendarFeedUrl: 'https://example.com/saskatchewan/events.ics',
      partnerDefaultTicketing: 'free_rsvp',
      partnerNotes: 'Phase B: auto-scrape provincial tourism listings.',
    },
  ]

  let changed = false
  for (const seed of seeds) {
    if (orgs.some((o) => o.id === seed.id)) continue
    orgs.push(seed)
    changed = true
  }
  if (changed) {
    localStorage.setItem('tudu_organizations', JSON.stringify(orgs))
    window.dispatchEvent(new Event(ORGANIZATIONS_CHANGED_EVENT))
  }
}

export function createTrustedPartnerOrg(input: {
  name: string
  city?: string
  province?: string
  calendarFeedUrl?: string
  defaultTicketing?: TicketingMode
  notes?: string
}): Organization {
  const orgs = getOrganizations()
  const org: Organization = {
    id: generatePartnerOrgId(input.name),
    name: input.name.trim(),
    category: 'Tourism',
    logoInitial: input.name.trim().charAt(0).toUpperCase() || 'T',
    createdBy: PARTNER_PLATFORM_OWNER,
    createdAt: new Date().toISOString(),
    primaryAdminEmail: PARTNER_PLATFORM_OWNER,
    backupAdminEmail: '',
    approvalStatus: 'approved',
    departments: [],
    country: 'Canada',
    isTrustedPartner: true,
    partnerLifecycle: 'active',
    partnerCity: input.city?.trim(),
    partnerProvince: input.province?.trim() ?? 'SK',
    calendarFeedUrl: input.calendarFeedUrl?.trim(),
    partnerDefaultTicketing: input.defaultTicketing ?? 'external',
    partnerNotes: input.notes?.trim(),
  }
  orgs.push(org)
  localStorage.setItem('tudu_organizations', JSON.stringify(orgs))
  window.dispatchEvent(new Event(ORGANIZATIONS_CHANGED_EVENT))
  return org
}

export function updateTrustedPartnerOrg(
  orgId: string,
  partial: Parameters<typeof updateOrganization>[1],
): Organization | null {
  return updateOrganization(orgId, partial)
}

export function graduateTrustedPartner(orgId: string): Organization | null {
  return updateOrganization(orgId, {
    partnerLifecycle: 'graduated',
    isTrustedPartner: false,
    partnerNotes: 'Graduated to self-serve org — platform calendar import disabled.',
  })
}

function buildFormFromImport(
  item: PartnerImportEvent,
  org: Organization,
): ReturnType<typeof defaultHostEventFormData> {
  const form = defaultHostEventFormData()
  form.title = item.title.trim()
  form.description = item.description?.trim() ?? `${item.title} — imported partner calendar event.`
  form.city = item.city?.trim() || org.partnerCity || 'Saskatchewan'
  form.province = item.province?.trim() || org.partnerProvince || 'SK'
  form.eventDate = item.startDate
  form.visibility = 'public'
  form.primaryCategory = item.primaryCategory ?? 'community'
  form.ticketingMode =
    item.ticketingMode ?? org.partnerDefaultTicketing ?? 'external'
  if (form.ticketingMode === 'free_donation') {
    form.externalTicketUrl = item.zeffyUrl ?? org.partnerDefaultZeffyUrl ?? item.externalTicketUrl ?? ''
  } else if (form.ticketingMode === 'external') {
    form.externalTicketUrl = item.externalTicketUrl ?? ''
  }
  return form
}

function isDuplicateImport(orgId: string, title: string, startDate: string): boolean {
  const norm = title.trim().toLowerCase()
  return getHostEvents().some(
    (e) =>
      e.hostAccountId === orgId &&
      e.title.trim().toLowerCase() === norm &&
      e.eventDate === startDate,
  )
}

export function importPartnerCalendarEvents(
  orgId: string,
  events: PartnerImportEvent[],
  options?: { publishLive?: boolean },
): PartnerImportResult {
  const org = getOrganization(orgId)
  if (!org?.isTrustedPartner) {
    return { ok: false, imported: 0, skipped: 0, eventIds: [], error: 'Not a trusted partner org.' }
  }

  const target: SeedTarget = { type: 'org', id: orgId, label: org.name }
  const publishLive = options?.publishLive ?? true
  const eventIds: string[] = []
  let imported = 0
  let skipped = 0

  for (const item of events) {
    if (!item.title?.trim() || !item.startDate) {
      skipped += 1
      continue
    }
    if (isDuplicateImport(orgId, item.title, item.startDate)) {
      skipped += 1
      continue
    }

    const form = buildFormFromImport(item, org)
    const result = createAdminSeededEvent({
      target,
      form,
      publishLive,
      discoverBorderType: 'green' as EventCardBorderType,
    })

    if (result.ok && result.event) {
      approveSeedEvent(result.event.id)
      eventIds.push(result.event.id)
      imported += 1
    } else {
      skipped += 1
    }
  }

  updateOrganization(orgId, {
    lastPartnerImportAt: new Date().toISOString(),
    lastPartnerImportCount: imported,
  })

  return { ok: true, imported, skipped, eventIds }
}

export function importSamplePartnerCalendar(orgId: string): PartnerImportResult {
  const sample = SAMPLE_CALENDAR_EVENTS[orgId]
  if (!sample?.length) {
    return {
      ok: false,
      imported: 0,
      skipped: 0,
      eventIds: [],
      error: 'No sample calendar for this partner. Paste JSON events instead.',
    }
  }
  return importPartnerCalendarEvents(orgId, sample)
}

export function parsePartnerImportJson(raw: string): PartnerImportEvent[] {
  const parsed = JSON.parse(raw) as unknown
  if (!Array.isArray(parsed)) {
    throw new Error('JSON must be an array of events.')
  }
  return parsed.map((row) => {
    const item = row as PartnerImportEvent
    if (!item.title || !item.startDate) {
      throw new Error('Each event needs title and startDate (YYYY-MM-DD).')
    }
    return item
  })
}

export function listPartnerEvents(orgId: string): HostEvent[] {
  return getHostEvents()
    .filter((e) => e.hostAccountId === orgId)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
}
