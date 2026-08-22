const STORAGE_KEY = 'tudu-liked-events'

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

export function getLikedEventIds(): string[] {
  return readIds()
}

export function isEventLiked(eventId: string): boolean {
  return readIds().includes(eventId)
}

/** Toggle like — returns the new liked state. */
export function toggleLikedEvent(eventId: string): boolean {
  const ids = readIds()
  const index = ids.indexOf(eventId)
  if (index >= 0) {
    ids.splice(index, 1)
    writeIds(ids)
    return false
  }
  writeIds([eventId, ...ids])
  return true
}

export function removeLikedEvent(eventId: string): void {
  writeIds(readIds().filter((id) => id !== eventId))
}
