import { getOrganization, getOrganizationCountry } from './account'
import {
  defaultHiddenGemLocation,
  generateHiddenGemContactId,
  parseLegacyFullAddress,
  type HiddenGemContact,
  type HiddenGemLocation,
} from './hiddenGems'
import { getOrgHostProfile } from './orgHostProfile'

export type HiddenGemProfileCopyPayload = {
  title: string
  description: string
  location: HiddenGemLocation
  contacts: HiddenGemContact[]
  website: string
  photos: string[]
}

function buildLocation(orgId: string, address: string, city: string): HiddenGemLocation {
  const org = getOrganization(orgId)
  const country = org ? getOrganizationCountry(org) : defaultHiddenGemLocation().country
  const parsed = parseLegacyFullAddress(address)

  return {
    ...defaultHiddenGemLocation(),
    ...parsed,
    street1: parsed.street1 ?? address.trim(),
    city: city.trim() || parsed.city || '',
    country: parsed.country || country,
    venue: org?.name.trim() || undefined,
  }
}

function buildContacts(phone?: string, email?: string): HiddenGemContact[] {
  const contacts: HiddenGemContact[] = []
  const trimmedPhone = phone?.trim()
  const trimmedEmail = email?.trim()

  if (trimmedPhone || trimmedEmail) {
    contacts.push({
      id: generateHiddenGemContactId(),
      label: 'General',
      phone: trimmedPhone || undefined,
      email: trimmedEmail || undefined,
    })
  }

  return contacts
}

/** Pull name, address, contact, bio, website, and photos from the org public profile. */
export function getHiddenGemDefaultsFromOrgProfile(orgId: string): HiddenGemProfileCopyPayload | null {
  const org = getOrganization(orgId)
  if (!org) return null

  const profile = getOrgHostProfile(orgId)
  const address = profile.address?.trim() ?? ''
  const city = profile.city?.trim() ?? ''
  const description = profile.bio?.trim() || org.profile?.trim() || ''
  const website = profile.social?.website?.trim() ?? ''
  const photos = (profile.galleryImages ?? []).filter(Boolean).slice(0, 6)

  return {
    title: org.name.trim(),
    description,
    location: buildLocation(orgId, address, city),
    contacts: buildContacts(profile.phone, profile.email ?? org.contactEmail),
    website,
    photos,
  }
}

export function orgProfileHasHiddenGemCopyData(orgId: string): boolean {
  const payload = getHiddenGemDefaultsFromOrgProfile(orgId)
  if (!payload) return false
  return Boolean(
    payload.title ||
      payload.description ||
      payload.location.street1 ||
      payload.location.city ||
      payload.contacts.length > 0 ||
      payload.website ||
      payload.photos.length > 0,
  )
}
