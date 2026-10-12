import { getCurrentUser } from './auth'
import {
  DEFAULT_ROAD_TRIP_DETOUR_KM,
  ROAD_TRIP_DETOUR_KM_OPTIONS,
} from './roadTripConstants'

const STORAGE_KEY = 'tudu_road_trip_preferences'

export type RoadTripPreferences = {
  defaultDetourKm: number
  defaultMaxStops: number
  /** Default “leave from” for new trips and Google Maps origin when a trip has no home base set. */
  defaultHomeBase?: string
}

const DEFAULT_PREFERENCES: RoadTripPreferences = {
  defaultDetourKm: DEFAULT_ROAD_TRIP_DETOUR_KM,
  defaultMaxStops: 8,
}

type PreferenceStore = Record<string, RoadTripPreferences>

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function readStore(): PreferenceStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PreferenceStore) : {}
  } catch {
    return {}
  }
}

function writeStore(store: PreferenceStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function getRoadTripPreferences(viewerEmail?: string): RoadTripPreferences {
  const email = viewerEmail ?? getCurrentUser()?.email
  if (!email) return { ...DEFAULT_PREFERENCES }
  const saved = readStore()[normalizeEmail(email)]
  if (!saved) return { ...DEFAULT_PREFERENCES }
  return {
    defaultDetourKm: ROAD_TRIP_DETOUR_KM_OPTIONS.includes(
      saved.defaultDetourKm as (typeof ROAD_TRIP_DETOUR_KM_OPTIONS)[number],
    )
      ? saved.defaultDetourKm
      : DEFAULT_ROAD_TRIP_DETOUR_KM,
    defaultMaxStops: saved.defaultMaxStops > 0 ? saved.defaultMaxStops : DEFAULT_PREFERENCES.defaultMaxStops,
    defaultHomeBase: saved.defaultHomeBase?.trim() || undefined,
  }
}

export function updateRoadTripPreferences(
  partial: Partial<RoadTripPreferences>,
  viewerEmail?: string,
): RoadTripPreferences {
  const email = viewerEmail ?? getCurrentUser()?.email
  if (!email) return getRoadTripPreferences()

  const key = normalizeEmail(email)
  const store = readStore()
  const current = store[key] ?? { ...DEFAULT_PREFERENCES }
  const next: RoadTripPreferences = {
    defaultDetourKm:
      partial.defaultDetourKm != null ? partial.defaultDetourKm : current.defaultDetourKm,
    defaultMaxStops:
      partial.defaultMaxStops != null ? partial.defaultMaxStops : current.defaultMaxStops,
    defaultHomeBase:
      partial.defaultHomeBase !== undefined
        ? partial.defaultHomeBase.trim() || undefined
        : current.defaultHomeBase,
  }
  store[key] = next
  writeStore(store)
  return next
}

export { ROAD_TRIP_DETOUR_KM_OPTIONS }

export const ROAD_TRIP_MAX_STOP_OPTIONS = [4, 6, 8, 10, 12, 15] as const
