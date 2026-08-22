export type DeliveryChannel = 'email' | 'sms' | 'in_app'

export type UserNotificationType =
  | 'feedback_resolved'
  | 'admin_message'
  | 'org_rejected'
  | 'event_scheduled_live'
  | 'seed_event_reminder'

export interface UserNotification {
  id: string
  userEmail: string
  adminMessageId: string
  fromEmail: string
  subject: string
  body: string
  timestamp: string
  read: boolean
  feedbackId?: string
  ticketNumber?: string
  orgId?: string
  type?: UserNotificationType
}

const NOTIFICATIONS_KEY = 'tudu-user-notifications'

type NotificationsStore = Record<string, UserNotification[]>

function userKey(email: string): string {
  return email.toLowerCase()
}

function readStore(): NotificationsStore {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY)
    return raw ? (JSON.parse(raw) as NotificationsStore) : {}
  } catch {
    return {}
  }
}

function saveStore(store: NotificationsStore): void {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(store))
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function getUserNotifications(email: string): UserNotification[] {
  const list = readStore()[userKey(email)] ?? []
  return [...list].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}

export function getUnreadNotificationCount(email: string): number {
  return getUserNotifications(email).filter((n) => !n.read).length
}

export function getUserNotificationsForOrg(email: string, orgId: string): UserNotification[] {
  return getUserNotifications(email).filter((n) => n.orgId === orgId)
}

export function addUserNotification(input: {
  userEmail: string
  adminMessageId: string
  fromEmail: string
  subject: string
  body: string
  feedbackId?: string
  ticketNumber?: string
  orgId?: string
  type?: UserNotificationType
}): UserNotification {
  const store = readStore()
  const key = userKey(input.userEmail)
  const notification: UserNotification = {
    id: generateId('notif'),
    userEmail: input.userEmail,
    adminMessageId: input.adminMessageId,
    fromEmail: input.fromEmail,
    subject: input.subject.trim(),
    body: input.body.trim(),
    timestamp: new Date().toISOString(),
    read: false,
    feedbackId: input.feedbackId,
    ticketNumber: input.ticketNumber,
    orgId: input.orgId,
    type: input.type,
  }
  const list = store[key] ?? []
  list.unshift(notification)
  store[key] = list
  saveStore(store)
  return notification
}

export function markNotificationRead(notificationId: string, email: string): void {
  const store = readStore()
  const key = userKey(email)
  const list = store[key]
  if (!list) return
  let changed = false
  for (const item of list) {
    if (item.id === notificationId && !item.read) {
      item.read = true
      changed = true
    }
  }
  if (changed) saveStore(store)
}

export function markAllNotificationsRead(email: string): void {
  const store = readStore()
  const key = userKey(email)
  const list = store[key]
  if (!list) return
  let changed = false
  for (const item of list) {
    if (!item.read) {
      item.read = true
      changed = true
    }
  }
  if (changed) saveStore(store)
}
