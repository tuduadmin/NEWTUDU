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
