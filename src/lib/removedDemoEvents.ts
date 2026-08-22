/** Retired demo host events — may still exist in `tudu_host_events` from older builds. */
export const REMOVED_DEMO_HOST_EVENT_IDS = new Set([
  'kindersley-summer-street-festival',
  'demo-full-event',
])

/** Alias used in UI filters and docs. */
export const REMOVED_DEMO_EVENT_IDS = REMOVED_DEMO_HOST_EVENT_IDS

const REMOVED_DEMO_HOST_EVENT_TITLES_NORMALIZED = new Set([
  'kindersley summer street festival',
])

const HOST_EVENTS_KEY = 'tudu_host_events'
const LEGACY_FULL_EVENT_KEY = 'tudu_demo_full_event_v1'
const SAVED_EVENTS_KEY = 'tudu_saved_events'
const USER_SAVED_EVENTS_KEY = 'tudu_user_saved_events'

function normalizeEventTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function isRemovedDemoHostEventTitle(title: string | undefined | null): boolean {
  if (!title) return false
  return REMOVED_DEMO_HOST_EVENT_TITLES_NORMALIZED.has(normalizeEventTitle(title))
}

export function isRemovedDemoHostEventId(id: string | undefined | null): boolean {
  if (!id) return false
  if (REMOVED_DEMO_HOST_EVENT_IDS.has(id)) return true
  if (id.startsWith('host-') && REMOVED_DEMO_HOST_EVENT_IDS.has(id.slice(5))) return true
  return false
}

export function isRemovedDemoHostEvent(event: {
  id?: string | null
  title?: string | null
}): boolean {
  return isRemovedDemoHostEventId(event.id) || isRemovedDemoHostEventTitle(event.title ?? undefined)
}

function readJsonArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

function purgeSavedEventIds(): void {
  const globalIds = readJsonArray(SAVED_EVENTS_KEY)
  const filteredGlobal = globalIds.filter((id) => !isRemovedDemoHostEventId(id))
  if (filteredGlobal.length !== globalIds.length) {
    localStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(filteredGlobal))
  }

  try {
    const raw = localStorage.getItem(USER_SAVED_EVENTS_KEY)
    if (!raw) return
    const map = JSON.parse(raw) as Record<string, string[]>
    let changed = false
    for (const email of Object.keys(map)) {
      const next = (map[email] ?? []).filter((id) => !isRemovedDemoHostEventId(id))
      if (next.length !== (map[email] ?? []).length) {
        map[email] = next
        changed = true
      }
    }
    if (changed) {
      localStorage.setItem(USER_SAVED_EVENTS_KEY, JSON.stringify(map))
    }
  } catch {
    /* ignore */
  }
}

function purgeLegacyFullEventSeed(): void {
  try {
    const raw = localStorage.getItem(LEGACY_FULL_EVENT_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as { id?: string; title?: string }
    if (isRemovedDemoHostEvent(parsed)) {
      localStorage.removeItem(LEGACY_FULL_EVENT_KEY)
    }
  } catch {
    localStorage.removeItem(LEGACY_FULL_EVENT_KEY)
  }
}

function purgeStoredHostEventsFromKey(): void {
  try {
    const raw = localStorage.getItem(HOST_EVENTS_KEY)
    if (!raw) return
    const events = JSON.parse(raw) as { id: string; title?: string }[]
    if (!Array.isArray(events)) return
    const filtered = events.filter((e) => !isRemovedDemoHostEvent(e))
    if (filtered.length !== events.length) {
      localStorage.setItem(HOST_EVENTS_KEY, JSON.stringify(filtered))
    }
  } catch {
    /* ignore */
  }
}

/** Remove one retired id from `tudu_host_events` (idempotent). */
export function purgeStoredHostEvent(id: string): void {
  if (typeof localStorage === 'undefined') return
  if (!isRemovedDemoHostEventId(id)) return
  try {
    const raw = localStorage.getItem(HOST_EVENTS_KEY)
    if (!raw) return
    const events = JSON.parse(raw) as { id: string }[]
    if (!Array.isArray(events)) return
    const filtered = events.filter((e) => e.id !== id)
    if (filtered.length !== events.length) {
      localStorage.setItem(HOST_EVENTS_KEY, JSON.stringify(filtered))
    }
  } catch {
    /* ignore */
  }
}

/** Idempotent — safe to run on every app load (and after startup seeds). */
export function purgeRemovedDemoEventsFromLocalStorage(): void {
  if (typeof localStorage === 'undefined') return

  for (const id of REMOVED_DEMO_HOST_EVENT_IDS) {
    purgeStoredHostEvent(id)
  }
  purgeStoredHostEventsFromKey()
  purgeLegacyFullEventSeed()
  purgeSavedEventIds()
}
