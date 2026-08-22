import {
  ADDITIONAL_AMENITIES,
  getEventAmenityLabel,
  PRIMARY_AMENITIES,
} from '../data/eventCategories'

/** Legacy Hidden Gem amenity ids mapped to shared event amenity ids. */
export const LEGACY_HIDDEN_GEM_AMENITY_IDS: Record<string, string> = {
  bar: 'alcohol',
  washroom: 'bathrooms',
  food: 'food-drink',
  patio: 'patio',
  parking: 'parking',
  accessible: 'wheelchair',
  wifi: 'wifi',
  kid_friendly: 'kid-friendly',
  pet_friendly: 'pet-friendly',
}

const EVENT_AMENITY_IDS = new Set<string>([
  ...PRIMARY_AMENITIES.map((a) => a.id),
  ...Object.values(ADDITIONAL_AMENITIES).flatMap((group) => group.map((a) => a.id)),
])

export const HIDDEN_GEM_CARD_VISIBLE_COUNT = 4

export function normalizeAmenityId(id: string): string {
  return LEGACY_HIDDEN_GEM_AMENITY_IDS[id] ?? id
}

export function normalizeAmenityIds(ids?: string[]): string[] {
  if (!ids?.length) return []
  return [...new Set(ids.map(normalizeAmenityId))]
}

export type ResolvedAmenity = {
  id: string
  label: string
}

export function resolveHiddenGemAmenities(ids?: string[]): ResolvedAmenity[] {
  return normalizeAmenityIds(ids)
    .filter((id) => EVENT_AMENITY_IDS.has(id))
    .map((id) => ({ id, label: getEventAmenityLabel(id) }))
}

export function getHiddenGemAmenityLabels(ids?: string[]): string[] {
  return resolveHiddenGemAmenities(ids).map((a) => a.label)
}

export function isHiddenGemAmenityId(id: string): boolean {
  return EVENT_AMENITY_IDS.has(normalizeAmenityId(id))
}
