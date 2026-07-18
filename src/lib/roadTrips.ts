import type { BucketList } from './bucketLists'
import { resolveEventsFromAnySource } from './bucketLists'

export type RoadTrip = {
  id: string
  name: string
  bucketListId?: string
  stopEventIds: string[]
  createdAt: string
}

const STORAGE_KEY = 'tudu_road_trips'

function generateId(): string {
  return `rt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function readAll(): RoadTrip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as RoadTrip[]
  } catch {
    return []
  }
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

export function createRoadTripFromBucketList(bucketList: BucketList): RoadTrip {
  const trip: RoadTrip = {
    id: generateId(),
    name: `Road Trip: ${bucketList.name}`,
    bucketListId: bucketList.id,
    stopEventIds: [...bucketList.eventIds],
    createdAt: new Date().toISOString(),
  }
  writeAll([trip, ...readAll()])
  return trip
}

export function getRoadTripStops(trip: RoadTrip) {
  return resolveEventsFromAnySource(trip.stopEventIds)
}
