/**
 * Affiliate partner registry + outbound click tracking (localStorage demo).
 * Phase 2: sync config from Control Room; reconcile earnings via partner dashboards.
 */

const AFFILIATE_CONFIG_KEY = 'tudu_affiliate_config_v1'
const AFFILIATE_CLICKS_KEY = 'tudu_affiliate_clicks_v1'

export const AFFILIATE_CONFIG_CHANGED_EVENT = 'tudu-affiliate-config-changed'
export const AFFILIATE_CLICKS_CHANGED_EVENT = 'tudu-affiliate-clicks-changed'

export type AffiliatePartnerId =
  | 'zeffy'
  | 'eventbrite'
  | 'expedia'
  | 'booking'
  | 'showpass'
  | 'ticketmaster'
  | 'other'

export type AffiliateClickKind =
  | 'external_ticket'
  | 'zeffy_donation'
  | 'hotel'
  | 'uber'
  | 'other'

export type AffiliatePartnerConfig = {
  id: AffiliatePartnerId
  label: string
  enabled: boolean
  /** Query param name (e.g. camref, aff, ref). */
  paramName?: string
  /** Your affiliate / campaign value. */
  paramValue?: string
  /** Partner signup URL for hosts (optional). */
  signupUrl?: string
  notes?: string
}

export type AffiliateClick = {
  id: string
  partnerId: AffiliatePartnerId
  kind: AffiliateClickKind
  url: string
  wrappedUrl: string
  eventId?: string
  orgId?: string
  timestamp: string
}

export type AffiliateConfigStore = {
  partners: AffiliatePartnerConfig[]
  disclosureText: string
}

const DEFAULT_PARTNERS: AffiliatePartnerConfig[] = [
  {
    id: 'zeffy',
    label: 'Zeffy',
    enabled: true,
    paramName: 'ref',
    paramValue: '',
    signupUrl: 'https://www.zeffy.com/',
    notes: 'Charity donations & nonprofit ticketing — affiliate tips program.',
  },
  {
    id: 'eventbrite',
    label: 'Eventbrite',
    enabled: true,
    paramName: 'aff',
    paramValue: '',
    signupUrl: 'https://www.eventbrite.com/organizer/',
    notes: 'Append affiliate param to eventbrite.com links when configured.',
  },
  {
    id: 'expedia',
    label: 'Expedia',
    enabled: true,
    paramName: 'camref',
    paramValue: '',
    signupUrl: 'https://www.expediagroup.com/partner-solutions/',
    notes: 'Hotel search on event pages. Also set VITE_EXPEDIA_AFFILIATE_CAMPAIGN.',
  },
  {
    id: 'booking',
    label: 'Booking.com',
    enabled: false,
    paramName: 'aid',
    paramValue: '',
    signupUrl: 'https://www.booking.com/affiliate-program/v2/index.html',
    notes: 'Optional second hotel partner.',
  },
  {
    id: 'showpass',
    label: 'Showpass',
    enabled: false,
    paramName: 'ref',
    paramValue: '',
    signupUrl: 'https://www.showpass.com/',
    notes: 'Canadian events — affiliate when approved.',
  },
  {
    id: 'ticketmaster',
    label: 'Ticketmaster',
    enabled: false,
    notes: 'Limited affiliate availability — enable when approved.',
  },
  {
    id: 'other',
    label: 'Other',
    enabled: true,
    notes: 'Catch-all for unrecognized outbound links.',
  },
]

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

function mergeWithEnv(partners: AffiliatePartnerConfig[]): AffiliatePartnerConfig[] {
  const expediaCampaign = import.meta.env.VITE_EXPEDIA_AFFILIATE_CAMPAIGN?.trim()
  return partners.map((p) => {
    if (p.id === 'expedia' && expediaCampaign && !p.paramValue?.trim()) {
      return { ...p, paramValue: expediaCampaign, paramName: p.paramName ?? 'camref' }
    }
    return p
  })
}

export function getAffiliateConfig(): AffiliateConfigStore {
  const stored = readJson<Partial<AffiliateConfigStore> | null>(AFFILIATE_CONFIG_KEY, null)
  if (!stored?.partners?.length) {
    return {
      partners: mergeWithEnv(DEFAULT_PARTNERS),
      disclosureText: 'We may earn a commission at no extra cost to you.',
    }
  }
  const byId = new Map(stored.partners.map((p) => [p.id, p]))
  const partners = DEFAULT_PARTNERS.map((def) => ({ ...def, ...byId.get(def.id) }))
  return {
    partners: mergeWithEnv(partners),
    disclosureText:
      stored.disclosureText?.trim() ||
      'We may earn a commission at no extra cost to you.',
  }
}

export function saveAffiliateConfig(config: AffiliateConfigStore): void {
  writeJson(AFFILIATE_CONFIG_KEY, config)
  window.dispatchEvent(new Event(AFFILIATE_CONFIG_CHANGED_EVENT))
}

export function getAffiliatePartner(id: AffiliatePartnerId): AffiliatePartnerConfig {
  return getAffiliateConfig().partners.find((p) => p.id === id) ?? DEFAULT_PARTNERS.find((p) => p.id === id)!
}

export function detectAffiliatePartner(url: string): AffiliatePartnerId {
  const lower = url.toLowerCase()
  if (lower.includes('zeffy.com')) return 'zeffy'
  if (lower.includes('eventbrite.')) return 'eventbrite'
  if (lower.includes('expedia.')) return 'expedia'
  if (lower.includes('booking.com')) return 'booking'
  if (lower.includes('showpass.com')) return 'showpass'
  if (lower.includes('ticketmaster.')) return 'ticketmaster'
  return 'other'
}

export function wrapAffiliateUrl(
  rawUrl: string,
  kind: AffiliateClickKind,
): { url: string; partnerId: AffiliatePartnerId } {
  const trimmed = rawUrl.trim()
  if (!trimmed) return { url: trimmed, partnerId: 'other' }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { url: trimmed, partnerId: 'other' }
  }

  const partnerId =
    kind === 'hotel'
      ? 'expedia'
      : kind === 'zeffy_donation'
        ? 'zeffy'
        : detectAffiliatePartner(trimmed)

  const partner = getAffiliatePartner(partnerId)
  if (!partner.enabled) return { url: trimmed, partnerId }

  const paramName = partner.paramName?.trim()
  const paramValue = partner.paramValue?.trim()
  if (paramName && paramValue && !parsed.searchParams.has(paramName)) {
    parsed.searchParams.set(paramName, paramValue)
  }

  return { url: parsed.toString(), partnerId }
}

export function getAffiliateClicks(): AffiliateClick[] {
  return readJson<AffiliateClick[]>(AFFILIATE_CLICKS_KEY, [])
}

export function logAffiliateClick(input: {
  partnerId: AffiliatePartnerId
  kind: AffiliateClickKind
  url: string
  wrappedUrl: string
  eventId?: string
  orgId?: string
}): AffiliateClick {
  const click: AffiliateClick = {
    id: `aff_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    partnerId: input.partnerId,
    kind: input.kind,
    url: input.url,
    wrappedUrl: input.wrappedUrl,
    eventId: input.eventId,
    orgId: input.orgId,
    timestamp: new Date().toISOString(),
  }
  const all = getAffiliateClicks()
  all.unshift(click)
  writeJson(AFFILIATE_CLICKS_KEY, all.slice(0, 3000))
  window.dispatchEvent(new Event(AFFILIATE_CLICKS_CHANGED_EVENT))
  return click
}

/** Wrap URL and log click — use from buttons / window.open. */
export function trackAffiliateNavigation(input: {
  url: string
  kind: AffiliateClickKind
  eventId?: string
  orgId?: string
}): string {
  const { url: wrappedUrl, partnerId } = wrapAffiliateUrl(input.url, input.kind)
  logAffiliateClick({
    partnerId,
    kind: input.kind,
    url: input.url,
    wrappedUrl,
    eventId: input.eventId,
    orgId: input.orgId,
  })
  return wrappedUrl
}

export function getAffiliateClickStats(withinDays = 30): {
  totalClicks: number
  byPartner: { partnerId: AffiliatePartnerId; label: string; count: number }[]
  byKind: { kind: AffiliateClickKind; count: number }[]
} {
  const cutoff = Date.now() - withinDays * 86400000
  const clicks = getAffiliateClicks().filter((c) => new Date(c.timestamp).getTime() >= cutoff)
  const config = getAffiliateConfig()

  const partnerCounts = new Map<AffiliatePartnerId, number>()
  const kindCounts = new Map<AffiliateClickKind, number>()
  for (const c of clicks) {
    partnerCounts.set(c.partnerId, (partnerCounts.get(c.partnerId) ?? 0) + 1)
    kindCounts.set(c.kind, (kindCounts.get(c.kind) ?? 0) + 1)
  }

  return {
    totalClicks: clicks.length,
    byPartner: [...partnerCounts.entries()]
      .map(([partnerId, count]) => ({
        partnerId,
        label: config.partners.find((p) => p.id === partnerId)?.label ?? partnerId,
        count,
      }))
      .sort((a, b) => b.count - a.count),
    byKind: [...kindCounts.entries()]
      .map(([kind, count]) => ({ kind, count }))
      .sort((a, b) => b.count - a.count),
  }
}
