import type { DiscoverEvent } from '../data/discoverEvents'
import { hiddenGemToDiscoverEvent } from '../data/discoverEvents'
import { getOrganization } from './account'
import { getOrgHostProfile } from './orgHostProfile'
import { getOrgPublicProfileUrl } from './publicHostProfile'
import {
  DEFAULT_HIDDEN_GEM_COUNTRY,
  DEFAULT_HIDDEN_GEM_IMAGE,
  defaultHiddenGemLocation,
  formatFullAddress,
  getHiddenGemDisplayCategory,
  HIDDEN_GEM_CATEGORIES,
  normalizeHiddenGemReviewLinks,
  type AgePolicy,
  type HiddenGemCategoryId,
  type HiddenGemContact,
  type HiddenGemLocation,
  type HiddenGemReviewLink,
  type OrgHiddenGem,
  type WeeklyHours,
} from './hiddenGems'
import type { DoorPaymentMode } from './eventDoorPayment'
import { normalizeWebsiteUrl } from './websiteUrl'

export type HiddenGemFormPreviewState = {
  title: string
  description: string
  menu?: string
  images: string[]
  location: HiddenGemLocation
  /** Category label (`Food & Drink`) or id (`food_drink`). */
  category?: string | HiddenGemCategoryId | null
  amenities: string[]
  doorPayment: DoorPaymentMode
  atmOnSite: boolean
  contacts: HiddenGemContact[]
  reviewLinks: HiddenGemReviewLink[]
  website?: string
  agePolicy: AgePolicy
  weeklyHours: WeeklyHours
  hoursDescription?: string
  priceLabel?: string
  organizationId?: string
}

const PLACEHOLDER_TITLE = 'Your business name'
const PLACEHOLDER_DESCRIPTION =
  'Tell people what makes this place special — your about section will appear here.'

function resolveCategoryLabel(category?: string | HiddenGemCategoryId | null): string {
  if (!category) return 'Food & Drink'
  const trimmed = String(category).trim()
  if (!trimmed) return 'Food & Drink'
  const byId = HIDDEN_GEM_CATEGORIES.find((c) => c.id === trimmed)
  if (byId) return byId.label
  return getHiddenGemDisplayCategory(trimmed)
}

function resolvePreviewLocation(location: HiddenGemLocation): HiddenGemLocation {
  if (formatFullAddress(location).trim()) {
    return {
      ...defaultHiddenGemLocation(),
      ...location,
      street1: location.street1?.trim() ?? '',
      city: location.city?.trim() ?? '',
      region: location.region?.trim() ?? '',
      postalCode: location.postalCode?.trim() ?? '',
      country: location.country?.trim() || DEFAULT_HIDDEN_GEM_COUNTRY,
    }
  }

  return {
    ...defaultHiddenGemLocation(),
    street1: '123 Main Street',
    city: 'Your city',
    region: 'SK',
    postalCode: '',
    country: DEFAULT_HIDDEN_GEM_COUNTRY,
  }
}

/** Build a Discover detail-panel event from unsaved hidden gem form state (no persistence). */
export function buildHiddenGemPreviewFromForm(form: HiddenGemFormPreviewState): DiscoverEvent {
  const organizationId = form.organizationId ?? 'preview-org'
  const org = form.organizationId ? getOrganization(form.organizationId) : null
  const orgProfile = form.organizationId ? getOrgHostProfile(form.organizationId) : null

  const location = resolvePreviewLocation(form.location)
  const title = form.title.trim() || PLACEHOLDER_TITLE
  const description = form.description.trim() || PLACEHOLDER_DESCRIPTION
  const images =
    form.images.filter(Boolean).length > 0
      ? form.images.filter(Boolean).slice(0, 6)
      : [DEFAULT_HIDDEN_GEM_IMAGE]

  const contacts = form.contacts
    .map((c) => ({
      ...c,
      id: c.id || `preview_${c.label}`,
      label: c.label.trim() || 'General',
      phone: c.phone?.trim() || undefined,
      email: c.email?.trim() || undefined,
      note: c.note?.trim() || undefined,
    }))
    .filter((c) => c.label || c.phone || c.email)

  const draftGem: OrgHiddenGem = {
    id: 'preview-draft',
    organizationId,
    title,
    description,
    menu: form.menu?.trim() ? form.menu : undefined,
    images,
    location,
    category: resolveCategoryLabel(form.category),
    tags: [],
    cardType: 'hidden-gem',
    borderType: 'gold',
    visibility: 'public',
    published: false,
    featured: false,
    amenities: form.amenities.filter(Boolean),
    doorPayment: form.doorPayment || undefined,
    atmOnSite: form.atmOnSite || undefined,
    weeklyHours: form.weeklyHours,
    hoursDescription: form.hoursDescription?.trim() || undefined,
    contacts: contacts.length > 0 ? contacts : undefined,
    reviewLinks: form.reviewLinks.length > 0 ? normalizeHiddenGemReviewLinks(form.reviewLinks) : undefined,
    website: (() => {
      const raw = form.website?.trim()
      if (!raw) return undefined
      return normalizeWebsiteUrl(raw) || raw
    })(),
    agePolicy: form.agePolicy,
    priceLabel: form.priceLabel?.trim() || undefined,
    createdAt: new Date().toISOString(),
  }

  const event = hiddenGemToDiscoverEvent(draftGem)

  return {
    ...event,
    id: 'preview-hidden-gem-draft',
    hostLabel: org?.name ?? 'Your organization',
    hostProfileUrl: org ? getOrgPublicProfileUrl(organizationId) : undefined,
    hostAvatarInitial: org?.logoInitial ?? org?.name?.charAt(0) ?? 'O',
    hostAvatarUrl: orgProfile?.logoUrl?.trim() || undefined,
  }
}

/** Build a Discover detail-panel event from a saved hidden gem. */
export function buildHiddenGemPreviewFromGem(gem: OrgHiddenGem): DiscoverEvent {
  const org = getOrganization(gem.organizationId)
  const orgProfile = getOrgHostProfile(gem.organizationId)
  const event = hiddenGemToDiscoverEvent(gem)

  return {
    ...event,
    hostLabel: org?.name ?? 'Organization',
    hostProfileUrl: org ? getOrgPublicProfileUrl(gem.organizationId) : undefined,
    hostAvatarInitial: org?.logoInitial ?? org?.name?.charAt(0) ?? 'O',
    hostAvatarUrl: orgProfile.logoUrl?.trim() || event.hostAvatarUrl,
  }
}
