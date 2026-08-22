export const EVENT_METRICS_KEY = 'tudu-admin-event-metrics'

export type StoredEventMetrics = {
  eventId: string
  views: number
  saves: number
  opens?: number
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function getStoredEventMetrics(eventId: string): StoredEventMetrics {
  const all = readJson<Record<string, StoredEventMetrics>>(EVENT_METRICS_KEY, {})
  return all[eventId] ?? { eventId, views: 0, saves: 0 }
}
