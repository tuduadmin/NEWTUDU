import { recordEventSave } from './distantSaves'

const STORAGE_KEY = 'tudu_saved_events'
const USER_SAVES_KEY = 'tudu_user_saved_events'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function readUserSaveMap(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(USER_SAVES_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {}
  } catch {
    return {}
  }
}

function writeUserSaveMap(map: Record<string, string[]>): void {
  localStorage.setItem(USER_SAVES_KEY, JSON.stringify(map))
}

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

function writeIds(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)]))
}

export function getSavedEventIds(): string[] {
  return readIds()
}

export function isEventSaved(eventId: string): boolean {
  return readIds().includes(eventId)
}

export type SaveEventMeta = {
  eventCity?: string
  hostEventId?: string
  attractionId?: string
  hiddenGemId?: string
}

export function saveEvent(eventId: string, meta?: SaveEventMeta): boolean {
  const ids = readIds()
  if (ids.includes(eventId)) return false
  writeIds([eventId, ...ids])

  try {
    const sessionEmail = localStorage.getItem('tudu_session')
    if (sessionEmail) {
      saveEventsForUser(sessionEmail, [eventId])
    }
  } catch {
    /* session optional */
  }

  if (meta?.eventCity) {
    recordEventSave({
      eventId,
      eventCity: meta.eventCity,
      hostEventId: meta.hostEventId,
      attractionId: meta.attractionId,
      hiddenGemId: meta.hiddenGemId,
      saveContext: 'saved',
    })
  }

  return true
}

export function removeSavedEvent(eventId: string): void {
  removeSavedEvents([eventId])
}

export function removeSavedEvents(eventIds: string[]): void {
  const remove = new Set(eventIds)
  writeIds(readIds().filter((id) => !remove.has(id)))
}

export function clearSavedEvents(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function saveEventsForUser(email: string, eventIds: string[]): void {
  const key = normalizeEmail(email)
  const map = readUserSaveMap()
  const merged = [...new Set([...(map[key] ?? []), ...eventIds])]
  map[key] = merged
  writeUserSaveMap(map)
  writeIds([...new Set([...merged, ...readIds()])])
}

export function getSavedEventIdsForUser(email: string): string[] {
  return readUserSaveMap()[normalizeEmail(email)] ?? []
}

export function removeSavedEventForUser(email: string, eventId: string): void {
  const key = normalizeEmail(email)
  const map = readUserSaveMap()
  map[key] = (map[key] ?? []).filter((id) => id !== eventId)
  writeUserSaveMap(map)
  removeSavedEvent(eventId)
}
