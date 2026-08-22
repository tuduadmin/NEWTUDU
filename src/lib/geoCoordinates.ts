export const MAX_ATTRACTION_PHOTOS = 3

export function parseCoordinateInput(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return undefined
  return n
}

export function formatCoordinateInput(value?: number): string {
  if (value == null || !Number.isFinite(value)) return ''
  return String(value)
}

/** Returns an error message when invalid, or null when ok / empty. */
export function validateLatLng(lat?: number, lng?: number): string | null {
  if (lat == null && lng == null) return null
  if (lat == null || lng == null) {
    return 'Enter both latitude and longitude, or leave both empty.'
  }
  if (lat < -90 || lat > 90) return 'Latitude must be between -90 and 90.'
  if (lng < -180 || lng > 180) return 'Longitude must be between -180 and 180.'
  return null
}

export function normalizeLatLng(
  lat?: number,
  lng?: number,
): { lat?: number; lng?: number } {
  if (lat == null && lng == null) return {}
  if (lat == null || lng == null) return { lat: undefined, lng: undefined }
  return { lat, lng }
}
