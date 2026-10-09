import type { DiscoverEvent } from '../data/discoverEvents'
import type { RoadTrip } from './roadTrips'
import {
  distanceToRouteKm,
  haversineKm,
  resolveEventLatLng,
  resolvePlannedCityLatLng,
} from './roadTripGeo'

export const DEFAULT_ROAD_TRIP_DETOUR_KM = 10
export const ROAD_TRIP_DETOUR_KM_OPTIONS = [5, 10, 15, 25, 50] as const

export function normalizePlannedCity(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

export function formatPlannedCitiesDestination(cities: string[]): string {
  const cleaned = cities.map(normalizePlannedCity).filter(Boolean)
  if (cleaned.length === 0) return 'Add stops to set route'
  return cleaned.join(' → ')
}

export function parseDestinationToPlannedCities(destination?: string): string[] {
  if (!destination || destination === 'Add stops to set route') return []
  return destination
    .split('→')
    .map((part) => normalizePlannedCity(part))
    .filter(Boolean)
}

export function getTripPlannedCities(trip: RoadTrip): string[] {
  if (trip.plannedCities && trip.plannedCities.length > 0) {
    return trip.plannedCities.map(normalizePlannedCity).filter(Boolean)
  }
  return parseDestinationToPlannedCities(trip.destination)
}

export function getTripDetourKm(trip: RoadTrip): number {
  if (trip.detourKm != null && trip.detourKm > 0) return trip.detourKm
  if (trip.detourMinutes != null && trip.detourMinutes > 0) {
    return Math.max(5, Math.round(trip.detourMinutes * 0.8))
  }
  return DEFAULT_ROAD_TRIP_DETOUR_KM
}

export function getRoutePointsFromPlannedCities(
  cities: string[],
): Array<{ lat: number; lng: number; label: string }> {
  return cities.map((city) => ({
    label: city,
    ...resolvePlannedCityLatLng(city),
  }))
}

/** Route spine: planned cities first, then event stops if no cities yet. */
export function getTripRoutePoints(
  trip: RoadTrip,
  eventStops: DiscoverEvent[] = [],
): Array<{ lat: number; lng: number; label: string }> {
  const cities = getTripPlannedCities(trip)
  if (cities.length > 0) {
    return getRoutePointsFromPlannedCities(cities)
  }
  return eventStops.map((stop) => ({
    label: stop.city,
    ...resolveEventLatLng(stop),
  }))
}

function directionsLabelForEvent(stop: DiscoverEvent): string {
  const parts = [stop.venueName, stop.streetAddress, stop.city].filter(Boolean)
  if (parts.length > 0) return parts.join(', ')
  if (stop.mapsQuery?.trim()) return stop.mapsQuery.trim()
  return stop.city
}

/** Cities plus event stops (for Google Maps multi-stop directions). */
export function getTripDirectionsPoints(
  trip: RoadTrip,
  eventStops: DiscoverEvent[] = [],
): Array<{ lat: number; lng: number; label: string }> {
  const cityPoints = getRoutePointsFromPlannedCities(getTripPlannedCities(trip))
  const stopPoints = eventStops.map((stop) => ({
    label: directionsLabelForEvent(stop),
    ...resolveEventLatLng(stop),
  }))

  if (cityPoints.length > 0 && stopPoints.length > 0) {
    return [...cityPoints, ...stopPoints]
  }
  if (cityPoints.length > 0) return cityPoints
  return stopPoints
}

/** Open in Google Maps with origin, destination, and waypoints. */
export function buildGoogleMapsDirectionsUrl(
  points: Array<{ lat: number; lng: number; label: string }>,
): string | null {
  if (points.length === 0) return null

  const queryFor = (p: { lat: number; lng: number; label: string }) =>
    p.label?.trim() || `${p.lat},${p.lng}`

  if (points.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryFor(points[0]))}`
  }

  const params = new URLSearchParams()
  params.set('api', '1')
  params.set('origin', queryFor(points[0]))
  params.set('destination', queryFor(points[points.length - 1]))
  params.set('travelmode', 'driving')

  const middle = points.slice(1, -1)
  if (middle.length > 0) {
    params.set('waypoints', middle.map(queryFor).join('|'))
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`
}

export function getTripGoogleMapsDirectionsUrl(
  trip: RoadTrip,
  eventStops: DiscoverEvent[] = [],
): string | null {
  return buildGoogleMapsDirectionsUrl(getTripDirectionsPoints(trip, eventStops))
}

export function isEventWithinRouteKm(
  event: DiscoverEvent,
  routePoints: Array<{ lat: number; lng: number }>,
  maxKm: number,
): boolean {
  if (routePoints.length === 0) return true
  const point = resolveEventLatLng(event)
  const distanceKm = distanceToRouteKm(point, routePoints)
  return distanceKm <= maxKm
}

/** Nearest planned city on the route (for “look ahead” labels later). */
export function nearestRouteCityLabel(
  event: DiscoverEvent,
  routePoints: Array<{ lat: number; lng: number; label: string }>,
): string | undefined {
  if (routePoints.length === 0) return undefined
  const point = resolveEventLatLng(event)
  let best = routePoints[0]
  let bestKm = haversineKm(point, best)
  for (const candidate of routePoints.slice(1)) {
    const km = haversineKm(point, candidate)
    if (km < bestKm) {
      bestKm = km
      best = candidate
    }
  }
  return best.label
}
