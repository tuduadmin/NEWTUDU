import { getCurrentUser } from './auth'
import { getAccount } from './account'
import { incrementEventSave } from './adminAnalytics'
import { formatCityLabel } from './location'

const SAVES_KEY = 'tudu_event_saves'

/** Minimum distance (km) or city mismatch to count as "outside your area". */
export const DISTANT_SAVE_CITY_MISMATCH = true

export type SaveContext = 'saved' | 'bucket_list' | 'road_trip'

export type EventSaveRecord = {
  id: string
  /** Discover card id or host event id. */
  eventId: string
  hostEventId?: string
  attractionId?: string
  hiddenGemId?: string
  userEmail: string
  saverCity: string
  eventCity: string
  savedAt: string
  isDistant: boolean
  /** Where the user saved this experience. */
  saveContext: SaveContext
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function generateId(): string {
  return `save_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function getEventSaveRecords(): EventSaveRecord[] {
  return readJson<EventSaveRecord[]>(SAVES_KEY, [])
}

export function isDistantSave(saverCity: string, eventCity: string): boolean {
  const saver = formatCityLabel(saverCity).toLowerCase()
  const event = formatCityLabel(eventCity).toLowerCase()
  if (!saver || !event) return false
  return saver !== event
}

export function recordEventSave(input: {
  eventId: string
  eventCity: string
  hostEventId?: string
  attractionId?: string
  hiddenGemId?: string
  userEmail?: string
  saverCity?: string
  saveContext?: SaveContext
  /** When false, skip duplicate check (e.g. same event saved to bucket list after My Tudu). */
  allowDuplicateContext?: boolean
}): EventSaveRecord | null {
  const user = getCurrentUser()
  const email = input.userEmail ?? user?.email
  if (!email) return null

  const account = getAccount(email)
  const saverCity = input.saverCity ?? account?.homeCity ?? 'Unknown'
  const distant = isDistantSave(saverCity, input.eventCity)
  const saveContext = input.saveContext ?? 'saved'

  const records = getEventSaveRecords()
  const duplicate = records.some(
    (r) =>
      r.eventId === input.eventId &&
      r.userEmail.toLowerCase() === email.toLowerCase() &&
      r.saveContext === saveContext,
  )
  if (duplicate && !input.allowDuplicateContext) return null

  const record: EventSaveRecord = {
    id: generateId(),
    eventId: input.eventId,
    hostEventId: input.hostEventId,
    attractionId: input.attractionId,
    hiddenGemId: input.hiddenGemId,
    userEmail: email,
    saverCity,
    eventCity: input.eventCity,
    savedAt: new Date().toISOString(),
    isDistant: distant,
    saveContext,
  }

  records.unshift(record)
  writeJson(SAVES_KEY, records.slice(0, 500))

  const metricsId = input.hiddenGemId
    ? `hidden-gem-${input.hiddenGemId}`
    : input.hostEventId ?? input.eventId
  incrementEventSave(metricsId)

  return record
}

function migrateSaveRecord(record: EventSaveRecord): EventSaveRecord {
  if (record.saveContext) return record
  return { ...record, saveContext: 'saved' }
}

export function getEventSaveRecordsNormalized(): EventSaveRecord[] {
  return getEventSaveRecords().map(migrateSaveRecord)
}

export function getSavesForEvent(eventId: string): EventSaveRecord[] {
  return getEventSaveRecordsNormalized().filter(
    (r) => r.eventId === eventId || r.hostEventId === eventId || r.hiddenGemId === eventId,
  )
}

export function getDistantSavesForEvent(eventId: string): EventSaveRecord[] {
  return getSavesForEvent(eventId).filter((r) => r.isDistant)
}

export function getDistantSavesForHostEvents(eventIds: string[]): EventSaveRecord[] {
  const idSet = new Set(eventIds)
  return getEventSaveRecordsNormalized().filter(
    (r) => r.isDistant && (idSet.has(r.eventId) || (r.hostEventId && idSet.has(r.hostEventId))),
  )
}
