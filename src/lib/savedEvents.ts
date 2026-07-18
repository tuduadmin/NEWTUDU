const STORAGE_KEY = 'tudu_saved_events'

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

export function saveEvent(eventId: string): boolean {
  const ids = readIds()
  if (ids.includes(eventId)) return false
  writeIds([eventId, ...ids])
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
