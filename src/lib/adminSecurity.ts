import { DEMO_USER } from './auth'
import {
  allocateSupportTicketNumber,
  syncSupportTicketCounter,
} from './supportTicketIds'

const STORAGE_KEY = 'tudu-admin-security-events'

export type SecurityEventType = 'failed_login' | 'ban' | 'suspicious' | 'api_key'
export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical'

export interface SecurityEvent {
  id: string
  /** Trackable reference — e.g. SEC-000012 */
  ticketNumber: string
  eventType: SecurityEventType
  user: string
  timestamp: string
  severity: SecuritySeverity
  details?: string
}

function generateId(): string {
  return `sec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function ensureSecurityTicketNumbers(items: SecurityEvent[]): SecurityEvent[] {
  const needsNumbers = items.some((item) => !item.ticketNumber)
  if (!needsNumbers) return items

  const sorted = [...items].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )
  const numbered = sorted.map((item) => {
    if (item.ticketNumber) {
      syncSupportTicketCounter('security', item.ticketNumber)
      return item
    }
    return { ...item, ticketNumber: allocateSupportTicketNumber('security') }
  })

  return items.map((item) => numbered.find((row) => row.id === item.id) ?? item)
}

function seedEvents(): SecurityEvent[] {
  return [
    {
      id: generateId(),
      ticketNumber: allocateSupportTicketNumber('security'),
      eventType: 'failed_login',
      user: 'unknown@example.com',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      severity: 'low',
      details: '5 failed attempts from 192.168.1.42',
    },
    {
      id: generateId(),
      ticketNumber: allocateSupportTicketNumber('security'),
      eventType: 'suspicious',
      user: DEMO_USER.email,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      severity: 'medium',
      details: 'Bulk RSVP pattern detected on 3 events in 10 minutes',
    },
    {
      id: generateId(),
      ticketNumber: allocateSupportTicketNumber('security'),
      eventType: 'ban',
      user: 'spammer@fake.io',
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      severity: 'high',
      details: 'Platform ban applied by moderator',
    },
    {
      id: generateId(),
      ticketNumber: allocateSupportTicketNumber('security'),
      eventType: 'api_key',
      user: 'dev@tudu.ca',
      timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
      severity: 'low',
      details: 'Stub API key created (Phase 1 — not functional)',
    },
    {
      id: generateId(),
      ticketNumber: allocateSupportTicketNumber('security'),
      eventType: 'failed_login',
      user: 'admin@tudu.ca',
      timestamp: new Date(Date.now() - 86400000 * 14).toISOString(),
      severity: 'critical',
      details: 'Admin login attempt from unrecognized IP — review recommended',
    },
  ]
}

function readItems(): SecurityEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seed = seedEvents()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    const items = JSON.parse(raw) as SecurityEvent[]
    const migrated = ensureSecurityTicketNumbers(items)
    if (migrated !== items) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
    }
    return migrated
  } catch {
    return seedEvents()
  }
}

export function getSecurityEvents(): SecurityEvent[] {
  return readItems().sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}

export function getSecurityEventByTicketNumber(ticketNumber: string): SecurityEvent | undefined {
  const normalized = ticketNumber.trim().toUpperCase()
  return getSecurityEvents().find((item) => item.ticketNumber.toUpperCase() === normalized)
}

export function getSecurityStats(): {
  total: number
  critical: number
  last24h: number
} {
  const items = readItems()
  const dayAgo = Date.now() - 86400000
  return {
    total: items.length,
    critical: items.filter((e) => e.severity === 'critical' || e.severity === 'high').length,
    last24h: items.filter((e) => new Date(e.timestamp).getTime() >= dayAgo).length,
  }
}

export function addSecurityEvent(
  input: Omit<SecurityEvent, 'id' | 'ticketNumber' | 'timestamp'> & { timestamp?: string },
): SecurityEvent {
  const items = readItems()
  const event: SecurityEvent = {
    ...input,
    id: generateId(),
    ticketNumber: allocateSupportTicketNumber('security'),
    timestamp: input.timestamp ?? new Date().toISOString(),
  }
  items.unshift(event)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  return event
}
