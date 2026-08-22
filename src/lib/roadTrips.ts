import type { BucketList } from './bucketLists'
import { resolveEventsFromAnySource } from './bucketLists'
import { DEMO_USER } from './auth'
import { recordEventSave } from './distantSaves'
import { resolveEventSaveMeta } from './eventSaveMeta'
import {
  DEFAULT_ROAD_TRIP_DETOUR_KM,
  formatPlannedCitiesDestination,
  getTripPlannedCities,
  normalizePlannedCity,
  parseDestinationToPlannedCities,
} from './roadTripRoute'
import { getRoadTripPreferences } from './roadTripPreferences'

export type RoadTrip = {
  id: string
  name: string
  bucketListId?: string
  stopEventIds: string[]
  createdAt: string
  /** User email who created the trip (local demo). */
  ownerEmail?: string
  /** Ordered cities along the route (route spine for discover + map). */
  plannedCities?: string[]
  /** Human-readable destination summary (synced from planned cities). */
  destination?: string
  /** draft = work in progress; planning = ready; active = on the road; completed = past */
  status?: 'draft' | 'planning' | 'active' | 'completed'
  /** Max extra stops when finding events along the route. */
  maxStops?: number
  /** How far off the main route (km) to suggest detours. Default 10 for road trips. */
  detourKm?: number
  /** People you follow who can add or follow this trip. */
  taggedFollowerIds?: string[]
  /** Event stops the traveler has checked off while on the road. */
  visitedStopIds?: string[]
  /** When the trip was marked active (left for the road). */
  startedAt?: string
  /** When the trip was marked complete. */
  completedAt?: string
  /** @deprecated Legacy minutes-based detour — use detourKm. */
  detourMinutes?: number
}

export type RoadTripProgress = {
  visitedCount: number
  totalStops: number
  percent: number
  isComplete: boolean
}

const STORAGE_KEY = 'tudu_road_trips'
const ADMIN_DEMO_TRIPS_FLAG = 'tudu_admin_demo_road_trips'

function generateId(): string {
  return `rt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function readAll(): RoadTrip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return (JSON.parse(raw) as RoadTrip[]).map(migrateRoadTrip)
  } catch {
    return []
  }
}

function migrateRoadTrip(trip: RoadTrip): RoadTrip {
  const migrated = { ...trip }
  if (!migrated.plannedCities || migrated.plannedCities.length === 0) {
    const parsed = parseDestinationToPlannedCities(migrated.destination)
    if (parsed.length > 0) migrated.plannedCities = parsed
  }
  if (migrated.detourKm == null && migrated.detourMinutes == null) {
    migrated.detourKm = DEFAULT_ROAD_TRIP_DETOUR_KM
  }
  if (!migrated.visitedStopIds) migrated.visitedStopIds = []
  return migrated
}

function writeAll(trips: RoadTrip[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips))
}

export function getRoadTrips(): RoadTrip[] {
  return readAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function getRoadTripById(id: string): RoadTrip | undefined {
  return readAll().find((t) => t.id === id)
}

export function getRoadTripsForUser(email: string): RoadTrip[] {
  const normalized = email.trim().toLowerCase()
  return getRoadTrips().filter((t) => t.ownerEmail?.toLowerCase() === normalized)
}

/** Trips from others that tagged followers (invite pool for "Add to my trips"). */
export function getInvitedRoadTripsForUser(email: string): RoadTrip[] {
  const normalized = email.trim().toLowerCase()
  return getRoadTrips().filter(
    (t) =>
      (t.taggedFollowerIds?.length ?? 0) > 0 &&
      t.ownerEmail?.toLowerCase() !== normalized,
  )
}

/** Copy a shared trip into the viewer's road trips. */
export function forkRoadTripForUser(tripId: string, ownerEmail: string): RoadTrip | undefined {
  const source = getRoadTripById(tripId)
  if (!source) return undefined
  const forked: RoadTrip = {
    ...source,
    id: generateId(),
    ownerEmail,
    createdAt: new Date().toISOString(),
    name: source.name.startsWith('Copy of') ? source.name : `Copy of ${source.name}`,
    taggedFollowerIds: [],
    status: source.stopEventIds.length > 0 ? 'planning' : 'draft',
    visitedStopIds: [],
  }
  writeAll([forked, ...readAll()])
  return forked
}

export function createRoadTripFromBucketList(
  bucketList: BucketList,
  ownerEmail?: string,
): RoadTrip {
  const trip: RoadTrip = {
    id: generateId(),
    name: `Road Trip: ${bucketList.name}`,
    bucketListId: bucketList.id,
    stopEventIds: [...bucketList.eventIds],
    createdAt: new Date().toISOString(),
    ownerEmail,
    destination: bucketList.region ?? 'Western Canada',
    status: bucketList.eventIds.length > 0 ? 'planning' : 'draft',
  }
  writeAll([trip, ...readAll()])
  return trip
}

export function startRoadTripCreate(navigate: (path: string) => void, userEmail: string): RoadTrip {
  const trip = createDraftRoadTrip('Untitled road trip', userEmail)
  navigate(`/road-trip/create/${trip.id}/basics`)
  return trip
}

export function createDraftRoadTrip(name: string, ownerEmail?: string): RoadTrip {
  const defaults = getRoadTripPreferences(ownerEmail)
  const trip: RoadTrip = {
    id: generateId(),
    name: name.trim() || 'Untitled road trip',
    stopEventIds: [],
    plannedCities: [],
    taggedFollowerIds: [],
    visitedStopIds: [],
    createdAt: new Date().toISOString(),
    ownerEmail,
    destination: 'Add stops to set route',
    status: 'draft',
    maxStops: defaults.defaultMaxStops,
    detourKm: defaults.defaultDetourKm,
  }
  writeAll([trip, ...readAll()])
  return trip
}

export function createRoadTrip(input: {
  name: string
  stopEventIds?: string[]
  ownerEmail?: string
  destination?: string
  plannedCities?: string[]
  maxStops?: number
  detourKm?: number
  detourMinutes?: number
}): RoadTrip {
  const stopEventIds = [...new Set(input.stopEventIds ?? [])]
  const plannedCities = (input.plannedCities ?? []).map(normalizePlannedCity).filter(Boolean)
  const trip: RoadTrip = {
    id: generateId(),
    name: input.name.trim() || 'Untitled road trip',
    stopEventIds,
    plannedCities,
    createdAt: new Date().toISOString(),
    ownerEmail: input.ownerEmail,
    destination:
      plannedCities.length > 0
        ? formatPlannedCitiesDestination(plannedCities)
        : (input.destination ?? summarizeTripDestination(stopEventIds)),
    status: stopEventIds.length > 0 || plannedCities.length > 0 ? 'planning' : 'draft',
    maxStops: input.maxStops ?? 8,
    detourKm: input.detourKm ?? DEFAULT_ROAD_TRIP_DETOUR_KM,
  }
  writeAll([trip, ...readAll()])
  return trip
}

export function summarizeTripDestination(stopEventIds: string[]): string {
  const stops = resolveEventsFromAnySource(stopEventIds)
  if (stops.length === 0) return 'Add stops to set route'
  if (stops.length === 1) return stops[0].city
  return `${stops[0].city} → ${stops[stops.length - 1].city}`
}

export function getRoadTripProgress(trip: RoadTrip): RoadTripProgress {
  const totalStops = trip.stopEventIds.length
  const visitedCount =
    trip.visitedStopIds?.filter((id) => trip.stopEventIds.includes(id)).length ?? 0
  const percent = totalStops === 0 ? 0 : Math.round((visitedCount / totalStops) * 100)
  return {
    visitedCount,
    totalStops,
    percent,
    isComplete: totalStops > 0 && visitedCount >= totalStops,
  }
}

export function startRoadTrip(tripId: string): RoadTrip | undefined {
  const trip = getRoadTripById(tripId)
  if (!trip || trip.status === 'completed') return undefined
  return updateRoadTrip(tripId, {
    status: 'active',
    startedAt: trip.startedAt ?? new Date().toISOString(),
  })
}

export function completeRoadTrip(tripId: string): RoadTrip | undefined {
  const trip = getRoadTripById(tripId)
  if (!trip) return undefined
  return updateRoadTrip(tripId, {
    status: 'completed',
    completedAt: new Date().toISOString(),
  })
}

export function toggleStopVisited(tripId: string, eventId: string): RoadTrip | undefined {
  const trip = getRoadTripById(tripId)
  if (!trip || !trip.stopEventIds.includes(eventId)) return undefined

  const visited = trip.visitedStopIds ?? []
  const isVisited = visited.includes(eventId)
  const visitedStopIds = isVisited
    ? visited.filter((id) => id !== eventId)
    : [...visited, eventId]

  const partial: Partial<RoadTrip> = { visitedStopIds }

  if (!isVisited && (trip.status === 'planning' || trip.status === 'draft')) {
    partial.status = 'active'
    partial.startedAt = trip.startedAt ?? new Date().toISOString()
  }

  const nextTrip = { ...trip, ...partial }
  const progress = getRoadTripProgress(nextTrip)
  if (!isVisited && progress.isComplete && nextTrip.status === 'active') {
    partial.status = 'completed'
    partial.completedAt = new Date().toISOString()
  }

  return updateRoadTrip(tripId, partial)
}

export function removeStopFromRoadTrip(tripId: string, eventId: string): RoadTrip | undefined {
  const trip = getRoadTripById(tripId)
  if (!trip) return undefined
  const stopEventIds = trip.stopEventIds.filter((id) => id !== eventId)
  const visitedStopIds = (trip.visitedStopIds ?? []).filter((id) => id !== eventId)
  const status =
    trip.status === 'completed' || trip.status === 'active'
      ? trip.status
      : stopEventIds.length === 0
        ? 'draft'
        : 'planning'
  return updateRoadTrip(tripId, { stopEventIds, visitedStopIds, status })
}

function recordRoadTripSave(eventId: string): void {
  const meta = resolveEventSaveMeta(eventId)
  if (!meta) return
  recordEventSave({
    eventId: meta.eventId,
    eventCity: meta.eventCity,
    hostEventId: meta.hostEventId,
    attractionId: meta.attractionId,
    hiddenGemId: meta.hiddenGemId,
    saveContext: 'road_trip',
  })
}

export function addStopToRoadTrip(tripId: string, eventId: string): RoadTrip | undefined {
  const trip = getRoadTripById(tripId)
  if (!trip) return undefined
  if (trip.stopEventIds.includes(eventId)) return trip
  const stopEventIds = [...trip.stopEventIds, eventId]
  const status = trip.status === 'completed' ? 'completed' : stopEventIds.length > 0 ? 'planning' : 'draft'
  recordRoadTripSave(eventId)
  return updateRoadTrip(tripId, { stopEventIds, status })
}

export function addStopsToRoadTrip(tripId: string, eventIds: string[]): RoadTrip | undefined {
  const trip = getRoadTripById(tripId)
  if (!trip) return undefined
  const stopEventIds = [...trip.stopEventIds]
  for (const eventId of eventIds) {
    if (!stopEventIds.includes(eventId)) {
      stopEventIds.push(eventId)
      recordRoadTripSave(eventId)
    }
  }
  const status =
    trip.status === 'completed' ? 'completed' : stopEventIds.length > 0 ? 'planning' : 'draft'
  return updateRoadTrip(tripId, { stopEventIds, status })
}

export type RoadTripListTab = 'planned' | 'past' | 'drafts'

export function getRoadTripListTab(trip: RoadTrip): RoadTripListTab {
  if (trip.status === 'completed') return 'past'
  if (trip.status === 'draft' || (trip.status === 'planning' && trip.stopEventIds.length === 0)) {
    return 'drafts'
  }
  return 'planned'
}

export function filterRoadTripsByTab(trips: RoadTrip[], tab: RoadTripListTab): RoadTrip[] {
  return trips.filter((trip) => getRoadTripListTab(trip) === tab)
}

export function updateRoadTrip(
  id: string,
  partial: Partial<Omit<RoadTrip, 'id' | 'createdAt'>>,
): RoadTrip | undefined {
  const trips = readAll()
  const idx = trips.findIndex((t) => t.id === id)
  if (idx === -1) return undefined
  trips[idx] = { ...trips[idx], ...partial }
  if (partial.plannedCities !== undefined) {
    trips[idx].plannedCities = partial.plannedCities.map(normalizePlannedCity).filter(Boolean)
    trips[idx].destination = formatPlannedCitiesDestination(trips[idx].plannedCities ?? [])
  }
  if (partial.stopEventIds) {
    trips[idx].visitedStopIds = (trips[idx].visitedStopIds ?? []).filter((id) =>
      trips[idx].stopEventIds.includes(id),
    )
    const hasPlannedCities = getTripPlannedCities(trips[idx]).length > 0
    if (!hasPlannedCities) {
      trips[idx].destination = summarizeTripDestination(trips[idx].stopEventIds)
    }
  }
  writeAll(trips)
  return trips[idx]
}

export function deleteRoadTrip(id: string): void {
  writeAll(readAll().filter((t) => t.id !== id))
}

export function getRoadTripStops(trip: RoadTrip) {
  return resolveEventsFromAnySource(trip.stopEventIds)
}

export function seedDemoRoadTripsForAdmin(): void {
  if (localStorage.getItem(ADMIN_DEMO_TRIPS_FLAG) === 'true') return

  const demoEmail = DEMO_USER.email

  const trips: RoadTrip[] = [
    {
      id: generateId(),
      name: 'Weekend sketch',
      stopEventIds: [],
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      ownerEmail: demoEmail,
      destination: 'Add stops to set route',
      status: 'draft',
    },
    {
      id: generateId(),
      name: 'Kindersley → Saskatoon Weekend',
      stopEventIds: [],
      plannedCities: ['Kindersley', 'Saskatoon'],
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      ownerEmail: demoEmail,
      destination: 'Kindersley → Saskatoon',
      status: 'planning',
      detourKm: DEFAULT_ROAD_TRIP_DETOUR_KM,
    },
    {
      id: generateId(),
      name: 'Prairie Food Crawl',
      stopEventIds: [],
      plannedCities: ['Moose Jaw', 'Regina'],
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      ownerEmail: demoEmail,
      destination: 'Moose Jaw → Regina',
      status: 'active',
      detourKm: DEFAULT_ROAD_TRIP_DETOUR_KM,
    },
    {
      id: generateId(),
      name: 'Summer Festival Loop',
      stopEventIds: [],
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      ownerEmail: demoEmail,
      destination: 'Saskatchewan',
      status: 'completed',
    },
  ]

  writeAll([...trips, ...readAll()])
  localStorage.setItem(ADMIN_DEMO_TRIPS_FLAG, 'true')
}
