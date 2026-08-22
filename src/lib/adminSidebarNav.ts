import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BarChart3,
  Contact,
  Coins,
  Egg,
  Flag,
  Gift,
  HeartHandshake,
  Home,
  Layers,
  Link2,
  LineChart,
  FileText,
  MessageSquare,
  Scale,
  Settings,
  Shapes,
  ShieldAlert,
  Smartphone,
  Ticket,
  UserCog,
  Users,
  Globe,
} from 'lucide-react'

export const SIDEBAR_ORDER_KEY = 'tudu-admin-sidebar-order'
export const SIDEBAR_ORDER_CHANGED_EVENT = 'tudu-sidebar-order-changed'

/** Sidebar section label for infrequently used tools (collapsed by default in AdminLayout). */
export const ADMIN_NAV_MORE_SECTION = 'More'

export type AdminNavBadgeKey = 'messages' | 'orgVerification'

export interface AdminNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  badge?: AdminNavBadgeKey
  section: string
}

export interface AdminNavSectionGroup {
  section: string
  items: AdminNavItem[]
}

export const DEFAULT_ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { to: '/admin', label: 'Home', icon: Home, end: true, section: 'Overview' },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, section: 'Overview' },
  { to: '/admin/growth', label: 'Growth & marketing', icon: LineChart, section: 'Overview' },
  { to: '/admin/activity', label: 'Activity log', icon: Activity, section: 'Overview' },
  { to: '/admin/reports', label: 'Reports', icon: FileText, section: 'Overview' },
  { to: '/admin/people', label: 'Users & Orgs', icon: Users, badge: 'orgVerification', section: 'People' },
  { to: '/admin/support', label: 'Customer Support', icon: MessageSquare, badge: 'messages', section: 'People' },
  { to: '/admin/trusted-partners', label: 'Trusted Partners', icon: Globe, section: 'People' },
  { to: '/admin/affiliates', label: 'Affiliate Partners', icon: Link2, section: 'People' },
  { to: '/admin/content', label: 'Content', icon: Layers, section: 'Content' },
  { to: '/admin/rollout', label: 'Rollout & flags', icon: Flag, section: 'Content' },
  { to: '/admin/tickets', label: 'Tickets & RSVPs', icon: Ticket, section: 'Content' },
  { to: '/admin/categories-amenities', label: 'Categories & Amenities', icon: Shapes, section: 'Product' },
  { to: '/admin/tiers', label: 'Tiers', icon: Layers, section: 'Product' },
  { to: '/admin/team-access', label: 'Team & Access', icon: UserCog, section: 'Settings' },
  { to: '/admin/employees', label: 'Employees', icon: Contact, section: 'Settings' },
  { to: '/admin/security', label: 'Security', icon: ShieldAlert, section: 'Settings' },
  { to: '/admin/safety', label: 'Safety', icon: HeartHandshake, section: 'Settings' },
  { to: '/admin/legal', label: 'Legal', icon: Scale, section: 'Settings' },
  { to: '/admin/settings', label: 'Settings', icon: Settings, section: 'Settings' },
  { to: '/admin/miles', label: 'TUDU Miles', icon: Coins, section: ADMIN_NAV_MORE_SECTION },
  { to: '/admin/rewards', label: 'TUDU Rewards', icon: Gift, section: ADMIN_NAV_MORE_SECTION },
  { to: '/admin/easter-eggs', label: 'Easter Eggs', icon: Egg, section: ADMIN_NAV_MORE_SECTION },
  { to: '/admin/reference', label: 'Product reference', icon: FileText, section: ADMIN_NAV_MORE_SECTION },
]

export function getDefaultSidebarOrder(): string[] {
  return DEFAULT_ADMIN_NAV_ITEMS.map((item) => item.to)
}

const LEGACY_SIDEBAR_PATHS: Record<string, string> = {
  '/admin/users': '/admin/people',
  '/admin/organizations': '/admin/people',
  '/admin/hidden-gems': '/admin/content?view=hidden-gems',
  '/admin/tudu-black': '/admin/people?view=tudu-black',
  '/admin/events': '/admin/content',
  '/admin/seed-events': '/admin/content?view=seed-events',
  '/admin/seed-events/draft-archive': '/admin/content?view=draft-archive',
  '/admin/attractions': '/admin/content?view=attractions',
  '/admin/host-events': '/admin/content',
  '/admin/bucket-lists': '/admin/content?view=bucket-lists',
  '/admin/road-trip': '/admin/content?view=road-trip',
  '/admin/messages': '/admin/support?tab=send',
  '/admin/feedback': '/admin/support',
  '/admin/themes': '/admin',
}

/** Insert new default routes at their canonical index when merging saved sidebar order. */
const SIDEBAR_INSERT_ORDER: string[] = getDefaultSidebarOrder()

/** Canonical section order for sidebar grouping (matches DEFAULT_ADMIN_NAV_ITEMS). */
const SECTION_ORDER: string[] = [
  'Overview',
  'People',
  'Content',
  'Product',
  'Settings',
  ADMIN_NAV_MORE_SECTION,
]

const SECTION_BY_PATH = new Map(DEFAULT_ADMIN_NAV_ITEMS.map((item) => [item.to, item.section]))

function insertMissingAtDefaultIndex(order: string[], path: string): string[] {
  const targetIndex = SIDEBAR_INSERT_ORDER.indexOf(path)
  if (targetIndex === -1) return [...order, path]
  const next = [...order]
  let insertAt = next.length
  for (let i = targetIndex - 1; i >= 0; i -= 1) {
    const anchor = SIDEBAR_INSERT_ORDER[i]
    const anchorIndex = next.indexOf(anchor)
    if (anchorIndex !== -1) {
      insertAt = anchorIndex + 1
      break
    }
  }
  next.splice(insertAt, 0, path)
  return next
}

/** Map legacy sidebar paths to current routes and drop duplicate entries (first wins). */
function normalizeSidebarPaths(order: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []
  for (const path of order) {
    const next = LEGACY_SIDEBAR_PATHS[path] ?? path
    if (seen.has(next)) continue
    seen.add(next)
    normalized.push(next)
  }
  return normalized
}

/** Keep custom within-section order but pack each section into one contiguous block. */
function repackSidebarOrderBySection(order: string[]): string[] {
  const buckets = new Map<string, string[]>()
  for (const path of order) {
    const section = SECTION_BY_PATH.get(path)
    if (!section) continue
    const bucket = buckets.get(section)
    if (bucket) {
      bucket.push(path)
    } else {
      buckets.set(section, [path])
    }
  }
  const repacked: string[] = []
  for (const section of SECTION_ORDER) {
    const paths = buckets.get(section)
    if (paths) repacked.push(...paths)
  }
  return repacked
}

function readRawStoredOrder(): string[] | null {
  try {
    const raw = localStorage.getItem(SIDEBAR_ORDER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed.filter((entry): entry is string => typeof entry === 'string')
  } catch {
    return null
  }
}

export function getSidebarOrder(): string[] {
  const raw = readRawStoredOrder()
  if (!raw) return getDefaultSidebarOrder()
  const merged = mergeSidebarOrder(raw)
  if (JSON.stringify(merged) !== JSON.stringify(raw)) {
    localStorage.setItem(SIDEBAR_ORDER_KEY, JSON.stringify(merged))
  }
  return merged
}

export function mergeSidebarOrder(savedOrder: string[]): string[] {
  const defaults = getDefaultSidebarOrder()
  const known = new Set(defaults)
  let ordered = normalizeSidebarPaths(savedOrder).filter((path) => known.has(path))
  for (const path of defaults) {
    if (!ordered.includes(path)) {
      ordered = insertMissingAtDefaultIndex(ordered, path)
    }
  }
  return repackSidebarOrderBySection(ordered)
}

export function saveSidebarOrder(order: string[]): void {
  localStorage.setItem(SIDEBAR_ORDER_KEY, JSON.stringify(mergeSidebarOrder(order)))
  window.dispatchEvent(new Event(SIDEBAR_ORDER_CHANGED_EVENT))
}

export function resetSidebarOrder(): void {
  localStorage.removeItem(SIDEBAR_ORDER_KEY)
  window.dispatchEvent(new Event(SIDEBAR_ORDER_CHANGED_EVENT))
}

export function hasCustomSidebarOrder(): boolean {
  const raw = readRawStoredOrder()
  if (!raw) return false
  const merged = mergeSidebarOrder(raw)
  return merged.some((path, index) => path !== getDefaultSidebarOrder()[index])
}

export function getOrderedNavItems(order = getSidebarOrder()): AdminNavItem[] {
  const byPath = new Map(DEFAULT_ADMIN_NAV_ITEMS.map((item) => [item.to, item]))
  return order
    .map((path) => byPath.get(path))
    .filter((item): item is AdminNavItem => item != null)
}

/** Group nav items by section (items are packed contiguously by mergeSidebarOrder). */
export function groupNavItemsBySection(items: AdminNavItem[]): AdminNavSectionGroup[] {
  const groups: AdminNavSectionGroup[] = []
  for (const item of items) {
    const last = groups[groups.length - 1]
    if (last && last.section === item.section) {
      last.items.push(item)
    } else {
      groups.push({ section: item.section, items: [item] })
    }
  }
  return groups
}

export function isPathInMoreSection(pathname: string, items: AdminNavItem[]): boolean {
  return items.some(
    (item) =>
      item.section === ADMIN_NAV_MORE_SECTION &&
      (item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`)),
  )
}

export function moveSidebarItem(order: string[], path: string, direction: 'up' | 'down'): string[] {
  const index = order.indexOf(path)
  if (index === -1) return order
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= order.length) return order
  const next = [...order]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}
