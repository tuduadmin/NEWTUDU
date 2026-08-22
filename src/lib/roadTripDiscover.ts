import type { DiscoverEvent } from '../data/discoverEvents'
import {
  filterDiscoverPoolByQuickPick,
  getDiscoverEventsPool,
  resolveQuickPickFromCategoryParam,
} from '../data/discoverEvents'
import { INTEREST_CATEGORIES } from '../data/categories'
import {
  getTripDetourKm,
  getTripRoutePoints,
  isEventWithinRouteKm,
} from './roadTripRoute'
import type { RoadTrip } from './roadTrips'

export type RoadTripDiscoverFilters = {
  query?: string
  category?: string | null
  trip: RoadTrip
  routeStops: DiscoverEvent[]
  currentStopIds: string[]
}

export function filterEventsForRoadTrip({
  query = '',
  category = null,
  trip,
  routeStops,
  currentStopIds,
}: RoadTripDiscoverFilters): DiscoverEvent[] {
  const maxStops = trip.maxStops ?? 8
  const detourKm = getTripDetourKm(trip)
  const atCapacity = currentStopIds.length >= maxStops
  let list = getDiscoverEventsPool(query)

  const quickPick = resolveQuickPickFromCategoryParam(category)
  if (quickPick) {
    list = filterDiscoverPoolByQuickPick(list, quickPick)
  } else if (category && category !== 'all') {
    const cat = INTEREST_CATEGORIES.find((c) => c.id === category)
    if (cat) {
      list = list.filter(
        (event) =>
          event.categories?.some((c) => c.label.toLowerCase().includes(cat.label.toLowerCase())) ||
          event.keywords?.some((k) => k.toLowerCase().includes(cat.label.toLowerCase())),
      )
    }
  }

  list = list.filter((event) => !currentStopIds.includes(event.id))

  const routePoints = getTripRoutePoints(trip, routeStops)
  if (routePoints.length > 0) {
    list = list.filter((event) => isEventWithinRouteKm(event, routePoints, detourKm))
  }

  if (atCapacity) return []

  const remaining = maxStops - currentStopIds.length
  return list.slice(0, Math.max(remaining, 20))
}

export function formatDetourKmLabel(km: number): string {
  return `${km} km off route`
}

export { INTEREST_CATEGORIES }
