import { getCurrentUser } from './auth'

function userKey(suffix: string, email?: string): string {
  const userEmail = email ?? getCurrentUser()?.email ?? 'guest'
  return `tudu-settings-${suffix}-${userEmail.toLowerCase()}`
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

/* ── Notification preferences ── */

export type NotificationPreferences = {
  emailRsvpConfirmations: boolean
  emailRecommendations: boolean
  emailEventReminders24h: boolean
  emailFollowedOrganizerUpdates: boolean
  emailDealsPromotions: boolean
  pushRsvpReminders: boolean
  pushNearbyEventAlerts: boolean
  pushFollowedOrganizerEvents: boolean
  smsRsvpConfirmations: boolean
  smsEventReminders: boolean
  smsTicketReceipts: boolean
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  emailRsvpConfirmations: true,
  emailRecommendations: true,
  emailEventReminders24h: true,
  emailFollowedOrganizerUpdates: true,
  emailDealsPromotions: false,
  pushRsvpReminders: true,
  pushNearbyEventAlerts: false,
  pushFollowedOrganizerEvents: true,
  smsRsvpConfirmations: true,
  smsEventReminders: true,
  smsTicketReceipts: true,
}

export function getNotificationPreferences(email?: string): NotificationPreferences {
  return readJson(userKey('notifications', email), DEFAULT_NOTIFICATION_PREFS)
}

export function saveNotificationPreferences(
  prefs: NotificationPreferences,
  email?: string,
): NotificationPreferences {
  writeJson(userKey('notifications', email), prefs)
  return prefs
}

/* ── Privacy & sharing ── */

export type ShareAfterPublish = 'always_ask' | 'skip'

export type PrivacyPreferences = {
  shareAfterPublish: ShareAfterPublish
  profileVisibleInDiscover: boolean
  showAttendedEventsOnProfile: boolean
}

const DEFAULT_PRIVACY_PREFS: PrivacyPreferences = {
  shareAfterPublish: 'always_ask',
  profileVisibleInDiscover: true,
  showAttendedEventsOnProfile: true,
}

export function getPrivacyPreferences(email?: string): PrivacyPreferences {
  return readJson(userKey('privacy', email), DEFAULT_PRIVACY_PREFS)
}

export function savePrivacyPreferences(
  prefs: PrivacyPreferences,
  email?: string,
): PrivacyPreferences {
  writeJson(userKey('privacy', email), prefs)
  return prefs
}

/* ── Messaging ── */

export type MessageArchiveBehavior = 'archive' | 'delete'

export type MessagingPreferences = {
  inAppMessageNotifications: boolean
  emailDigestForMessages: boolean
  archiveBehavior: MessageArchiveBehavior
}

const DEFAULT_MESSAGING_PREFS: MessagingPreferences = {
  inAppMessageNotifications: true,
  emailDigestForMessages: false,
  archiveBehavior: 'archive',
}

export function getMessagingPreferences(email?: string): MessagingPreferences {
  return readJson(userKey('messaging', email), DEFAULT_MESSAGING_PREFS)
}

export function saveMessagingPreferences(
  prefs: MessagingPreferences,
  email?: string,
): MessagingPreferences {
  writeJson(userKey('messaging', email), prefs)
  return prefs
}

/* ── Host & events ── */

export type HostPreferences = {
  defaultEventVisibility: 'public' | 'private'
  autoOpenShareSheetOnPublish: boolean
}

const DEFAULT_HOST_PREFS: HostPreferences = {
  defaultEventVisibility: 'public',
  autoOpenShareSheetOnPublish: true,
}

export function getHostPreferences(email?: string): HostPreferences {
  return readJson(userKey('host', email), DEFAULT_HOST_PREFS)
}

export function saveHostPreferences(prefs: HostPreferences, email?: string): HostPreferences {
  writeJson(userKey('host', email), prefs)
  return prefs
}

/* ── Payments & subscription (demo) ── */

export type SubscriptionInfo = {
  planName: string
  status: 'active' | 'cancelled' | 'none'
  billingCycle: string
  nextPaymentDate: string
  amountCad: number
  memberSince: string
}

export type TransactionRecord = {
  id: string
  label: string
  amountCad: number | null
  date: string
  type: 'subscription' | 'ticket' | 'account'
}

export type PayoutStatus = 'not_connected' | 'pending' | 'connected'

export type PaymentsData = {
  subscription: SubscriptionInfo
  stripeConnectStatus: PayoutStatus
  transactions: TransactionRecord[]
}

const DEFAULT_PAYMENTS: PaymentsData = {
  subscription: {
    planName: 'No active plan',
    status: 'none',
    billingCycle: '—',
    nextPaymentDate: '—',
    amountCad: 0,
    memberSince: '—',
  },
  stripeConnectStatus: 'not_connected',
  transactions: [],
}

export function getPaymentsData(email?: string): PaymentsData {
  return readJson(userKey('payments', email), DEFAULT_PAYMENTS)
}

export function savePaymentsData(data: PaymentsData, email?: string): PaymentsData {
  writeJson(userKey('payments', email), data)
  return data
}

/* ── Account actions ── */

export function resetUserLocalData(email?: string): void {
  const userEmail = email ?? getCurrentUser()?.email
  if (!userEmail) return
  const prefix = `tudu-settings-`
  const suffix = `-${userEmail.toLowerCase()}`
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(prefix) && key.endsWith(suffix)) {
      localStorage.removeItem(key)
    }
  })
  localStorage.removeItem('tudu-app-theme')
}
