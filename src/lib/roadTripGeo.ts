import type { DiscoverEvent } from '../data/discoverEvents'

export type MapPin = {
  id: string
  label: string
  x: number
  y: number
  order: number
}

export type RoadTripMapView = {
  zoom: number
  tiles: Array<{ x: number; y: number; url: string }>
  gridSize: number
  originX: number
  originY: number
  mapWidth: number
  mapHeight: number
}

/** Rough demo coordinates for prairie cities — map preview only. */
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  kindersley: { lat: 51.467, lng: -109.157 },
  saskatoon: { lat: 52.157, lng: -106.67 },
  regina: { lat: 50.445, lng: -104.618 },
  'moose jaw': { lat: 50.393, lng: -105.551 },
  calgary: { lat: 51.044, lng: -114.071 },
  edmonton: { lat: 53.546, lng: -113.493 },
  winnipeg: { lat: 49.895, lng: -97.138 },
}

const DEFAULT_CENTER = { lat: 51.5, lng: -106.0 }
const GRID_SIZE = 4
const TILE_SIZE = 256

function cityKey(city: string): string {
  return city.split(',')[0]?.trim().toLowerCase() ?? city.toLowerCase()
}

export function resolvePlannedCityLatLng(city: string): { lat: number; lng: number } {
  const key = cityKey(city)
  for (const [name, coords] of Object.entries(CITY_COORDS)) {
    if (key.includes(name) || name.includes(key)) return coords
  }
  const hash = key.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return {
    lat: 51.2 + (hash % 40) / 100,
    lng: -107 - (hash % 60) / 100,
  }
}

function resolveLatLng(event: DiscoverEvent): { lat: number; lng: number } {
  if (event.locationLat != null && event.locationLng != null) {
    return { lat: event.locationLat, lng: event.locationLng }
  }
  const key = cityKey(event.city)
  for (const [name, coords] of Object.entries(CITY_COORDS)) {
    if (key.includes(name)) return coords
  }
  const hash = key.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return {
    lat: 51.2 + (hash % 40) / 100,
    lng: -107 - (hash % 60) / 100,
  }
}

function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = 2 ** zoom
  const x = Math.floor(((lng + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  )
  return { x, y }
}

function latLngToWorldPx(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = 2 ** zoom
  const x = ((lng + 180) / 360) * n * TILE_SIZE
  const latRad = (lat * Math.PI) / 180
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n * TILE_SIZE
  return { x, y }
}

function zoomForSpan(latSpan: number, lngSpan: number): number {
  const span = Math.max(latSpan, lngSpan)
  if (span > 8) return 4
  if (span > 4) return 5
  if (span > 2) return 6
  if (span > 1) return 7
  if (span > 0.5) return 8
  if (span > 0.25) return 9
  if (span > 0.12) return 10
  return 11
}

function buildMapView(
  points: Array<{ lat: number; lng: number }>,
): RoadTripMapView & { originX: number; originY: number; mapWidth: number; mapHeight: number } {
  let centerLat = DEFAULT_CENTER.lat
  let centerLng = DEFAULT_CENTER.lng
  let zoom = 5

  if (points.length > 0) {
    const lats = points.map((p) => p.lat)
    const lngs = points.map((p) => p.lng)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    centerLat = (minLat + maxLat) / 2
    centerLng = (minLng + maxLng) / 2
    const latSpan = Math.max(maxLat - minLat, 0.15)
    const lngSpan = Math.max(maxLng - minLng, 0.15)
    zoom = zoomForSpan(latSpan, lngSpan)
  }

  const centerTile = latLngToTile(centerLat, centerLng, zoom)
  const originX = (centerTile.x - Math.floor(GRID_SIZE / 2)) * TILE_SIZE
  const originY = (centerTile.y - Math.floor(GRID_SIZE / 2)) * TILE_SIZE
  const mapWidth = GRID_SIZE * TILE_SIZE
  const mapHeight = GRID_SIZE * TILE_SIZE

  const tiles: RoadTripMapView['tiles'] = []
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const x = centerTile.x - Math.floor(GRID_SIZE / 2) + col
      const y = centerTile.y - Math.floor(GRID_SIZE / 2) + row
      tiles.push({
        x,
        y,
        url: `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
      })
    }
  }

  return {
    zoom,
    tiles,
    gridSize: GRID_SIZE,
    originX,
    originY,
    mapWidth,
    mapHeight,
  }
}

type LatLngPoint = { lat: number; lng: number }

function pointsFromLatLng(points: LatLngPoint[]) {
  return buildMapView(points)
}

/** Build OSM tile grid + projection context for the route preview map. */
export function getRoadTripMapView(stops: DiscoverEvent[]) {
  const points = stops.map((stop) => resolveLatLng(stop))
  return pointsFromLatLng(points)
}

export function getRoadTripMapViewFromPoints(points: LatLngPoint[]) {
  return pointsFromLatLng(points)
}

export function resolveEventLatLng(event: DiscoverEvent): { lat: number; lng: number } {
  return resolveLatLng(event)
}

/** Haversine distance in km between two lat/lng points. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function distancePointToSegmentKm(
  point: { lat: number; lng: number },
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dx = b.lng - a.lng
  const dy = b.lat - a.lat
  if (dx === 0 && dy === 0) return haversineKm(point, a)

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.lng - a.lng) * dx + (point.lat - a.lat) * dy) / (dx * dx + dy * dy),
    ),
  )
  const proj = { lat: a.lat + t * dy, lng: a.lng + t * dx }
  return haversineKm(point, proj)
}

/** Minimum distance from a point to the route polyline (km). */
export function distanceToRouteKm(
  point: { lat: number; lng: number },
  routePoints: Array<{ lat: number; lng: number }>,
): number {
  if (routePoints.length === 0) return Infinity
  if (routePoints.length === 1) return haversineKm(point, routePoints[0])

  let min = Infinity
  for (let i = 0; i < routePoints.length - 1; i += 1) {
    min = Math.min(min, distancePointToSegmentKm(point, routePoints[i], routePoints[i + 1]))
  }
  return min
}

/** Approximate km allowed off-route for a driving detour in minutes (60 km/h). */
export function detourMinutesToKm(minutes: number): number {
  return Math.max(1, minutes) * 1.0
}

export function isEventWithinDetour(
  event: DiscoverEvent,
  routeStops: DiscoverEvent[],
  detourMinutes: number,
): boolean {
  if (routeStops.length === 0) return true
  const point = resolveLatLng(event)
  const routePoints = routeStops.map((stop) => resolveLatLng(stop))
  const distanceKm = distanceToRouteKm(point, routePoints)
  return distanceKm <= detourMinutesToKm(detourMinutes)
}

function projectLatLngPointsToMapPins(
  items: Array<{ id: string; label: string; lat: number; lng: number }>,
): MapPin[] {
  if (items.length === 0) return []

  const view = buildMapView(items.map((p) => ({ lat: p.lat, lng: p.lng })))

  return items.map((p, index) => {
    const world = latLngToWorldPx(p.lat, p.lng, view.zoom)
    const x = ((world.x - view.originX) / view.mapWidth) * 100
    const y = ((world.y - view.originY) / view.mapHeight) * 100
    return {
      id: p.id,
      label: p.label,
      x: Math.min(96, Math.max(4, x)),
      y: Math.min(96, Math.max(4, y)),
      order: index + 1,
    }
  })
}

/** Project planned cities into map pins (route spine). */
export function projectPlannedCitiesToMapPins(
  cities: string[],
): MapPin[] {
  return projectLatLngPointsToMapPins(
    cities.map((city, index) => ({
      id: `city-${index}-${cityKey(city)}`,
      label: city,
      ...resolvePlannedCityLatLng(city),
    })),
  )
}

/** Project stops into 0–100 % coordinates on the tile preview. */
export function projectStopsToMapPins(stops: DiscoverEvent[]): MapPin[] {
  if (stops.length === 0) return []

  return projectLatLngPointsToMapPins(
    stops.map((stop) => ({
      id: stop.id,
      label: stop.city,
      ...resolveLatLng(stop),
    })),
  )
}

/** City route pins first; event stops appended when both exist. */
export function projectTripRouteToMapPins(
  cities: string[],
  eventStops: DiscoverEvent[],
): MapPin[] {
  const cityPins = projectPlannedCitiesToMapPins(cities)
  if (cityPins.length > 0) return cityPins
  return projectStopsToMapPins(eventStops)
}
