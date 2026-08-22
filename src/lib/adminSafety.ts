import { DEMO_USER } from './auth'

const STORAGE_KEY = 'tudu-admin-safety-incidents'

export type SafetyIncidentType =
  | 'harassment'
  | 'unsafe_venue'
  | 'content_violation'
  | 'underage'
  | 'other'

export type SafetyIncidentStatus = 'open' | 'investigating' | 'resolved' | 'dismissed'

export interface SafetyIncident {
  id: string
  incidentType: SafetyIncidentType
  reporter: string
  status: SafetyIncidentStatus
  description: string
  linkedFeedbackId?: string
  linkedEventId?: string
  createdAt: string
}

function generateId(): string {
  return `safe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function seedIncidents(): SafetyIncident[] {
  return [
    {
      id: generateId(),
      incidentType: 'harassment',
      reporter: 'jamie@example.com',
      status: 'investigating',
      description: 'Repeated inappropriate DMs after an event RSVP.',
      linkedFeedbackId: 'fb_demo_harassment',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: generateId(),
      incidentType: 'unsafe_venue',
      reporter: DEMO_USER.email,
      status: 'open',
      description: 'Venue capacity exceeded; fire exits blocked per attendee report.',
      linkedEventId: 'event_demo_1',
      linkedFeedbackId: 'fb_demo_venue',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: generateId(),
      incidentType: 'content_violation',
      reporter: 'reviewer@example.com',
      status: 'resolved',
      description: 'Event imagery violated community guidelines — host notified.',
      linkedFeedbackId: 'fb_demo_content',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: generateId(),
      incidentType: 'other',
      reporter: 'user12@example.com',
      status: 'dismissed',
      description: 'Duplicate report — already handled via Feedback queue.',
      linkedFeedbackId: 'fb_demo_spam',
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
  ]
}

function readItems(): SafetyIncident[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seed = seedIncidents()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    return JSON.parse(raw) as SafetyIncident[]
  } catch {
    return seedIncidents()
  }
}

function saveItems(items: SafetyIncident[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function getSafetyIncidents(): SafetyIncident[] {
  return readItems().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function getSafetyStats(): {
  open: number
  investigating: number
  resolved: number
} {
  const items = readItems()
  return {
    open: items.filter((i) => i.status === 'open').length,
    investigating: items.filter((i) => i.status === 'investigating').length,
    resolved: items.filter((i) => i.status === 'resolved' || i.status === 'dismissed').length,
  }
}

export function updateSafetyStatus(id: string, status: SafetyIncidentStatus): boolean {
  const items = readItems()
  const idx = items.findIndex((i) => i.id === id)
  if (idx < 0) return false
  items[idx] = { ...items[idx], status }
  saveItems(items)
  return true
}
