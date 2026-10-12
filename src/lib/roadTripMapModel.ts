import type { DiscoverEvent } from '../data/discoverEvents'
import { resolveEventLatLng, resolvePlannedCityLatLng } from './roadTripGeo'
import { buildGoogleMapsDirectionsUrl, getTripHomeBase, getTripPlannedCities } from './roadTripRoute'
import type { RoadTrip } from './roadTrips'

export type RoadTripMapStop = {
  id: string
  lat: number
  lng: number
  order: number
  label: string
  kind: 'event' | 'city' | 'home'
  imageUrl?: string
  event?: DiscoverEvent
}

export function buildRoadTripMapStops(
  trip: RoadTrip | null | undefined,
  eventStops: DiscoverEvent[],
): RoadTripMapStop[] {
  const stops: RoadTripMapStop[] = []
  let order = 1

  if (trip) {
    const homeLabel = getTripHomeBase(trip)
    if (homeLabel) {
      const { lat, lng } = resolvePlannedCityLatLng(homeLabel)
      stops.push({
        id: `home-${cityKey(homeLabel)}`,
        lat,
        lng,
        order: 0,
        label: homeLabel,
        kind: 'home',
      })
    }
  }

  const cities = trip ? getTripPlannedCities(trip) : []
  for (const city of cities) {
    const { lat, lng } = resolvePlannedCityLatLng(city)
    stops.push({
      id: `city-${order}-${cityKey(city)}`,
      lat,
      lng,
      order,
      label: city,
      kind: 'city',
    })
    order += 1
  }

  for (const event of eventStops) {
    const { lat, lng } = resolveEventLatLng(event)
    stops.push({
      id: event.id,
      lat,
      lng,
      order,
      label: event.title,
      kind: 'event',
      imageUrl: event.image,
      event,
    })
    order += 1
  }

  return stops
}

function cityKey(city: string): string {
  return city.trim().toLowerCase().replace(/\s+/g, '-')
}

export function roadTripMapBounds(
  stops: RoadTripMapStop[],
): [[number, number], [number, number]] | null {
  if (stops.length === 0) return null
  let minLng = stops[0].lng
  let maxLng = stops[0].lng
  let minLat = stops[0].lat
  let maxLat = stops[0].lat
  for (const stop of stops) {
    minLng = Math.min(minLng, stop.lng)
    maxLng = Math.max(maxLng, stop.lng)
    minLat = Math.min(minLat, stop.lat)
    maxLat = Math.max(maxLat, stop.lat)
  }
  const padLng = Math.max(0.08, (maxLng - minLng) * 0.15)
  const padLat = Math.max(0.06, (maxLat - minLat) * 0.15)
  return [
    [minLng - padLng, minLat - padLat],
    [maxLng + padLng, maxLat + padLat],
  ]
}

export function googleMapsUrlForMapStop(stop: RoadTripMapStop): string {
  const label =
    stop.kind === 'event' && stop.event
      ? [stop.event.venueName, stop.event.streetAddress, stop.event.city].filter(Boolean).join(', ') ||
        stop.event.mapsQuery?.trim() ||
        stop.event.city
      : stop.label
  return (
    buildGoogleMapsDirectionsUrl([{ lat: stop.lat, lng: stop.lng, label }]) ??
    `https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lng}`
  )
}

/** Default view: Canada-friendly, user can pan worldwide. */
export const ROAD_TRIP_MAP_DEFAULT_VIEW = {
  longitude: -96.5,
  latitude: 56.5,
  zoom: 3.2,
} as const
