const STORAGE_KEY = 'tudu-admin-tudu-black'

/** User-facing product name (title case, not all caps). */
export const TUDU_BLACK_DISPLAY_NAME = 'Tudu Black'

export const TUDU_BLACK_ICON_SRC = '/icons/tudu-black.svg'

export type TuduBlackWaitlistStatus = 'pending' | 'invited' | 'declined'

export interface TuduBlackWaitlistEntry {
  id: string
  name: string
  email: string
  referrer?: string
  note?: string
  status: TuduBlackWaitlistStatus
  submittedAt: string
}

export interface TuduBlackTierBenefit {
  id: string
  title: string
  description: string
  enabled: boolean
}

export interface TuduBlackStore {
  waitlist: TuduBlackWaitlistEntry[]
  benefits: TuduBlackTierBenefit[]
  invitationOnly: boolean
  membershipFeeCad: number
}

function generateId(): string {
  return `tb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const DEFAULT_TUDU_BLACK_BENEFITS: TuduBlackTierBenefit[] = [
  {
    id: 'private-events',
    title: 'Private & ultra-premium events',
    description: 'Curated access to events not visible on the standard TUDU discover deck.',
    enabled: true,
  },
  {
    id: 'concierge',
    title: 'Concierge planning',
    description: 'White-glove booking support for travel, dining, and exclusive experiences.',
    enabled: true,
  },
  {
    id: 'travel-perks',
    title: 'Premium travel amenities',
    description: 'Priority access, branded travel kit, and partner charter perks (demo stub).',
    enabled: true,
  },
  {
    id: 'privacy',
    title: 'Elevated confidentiality',
    description: 'Stricter data handling and need-to-know internal access controls.',
    enabled: true,
  },
  {
    id: 'luxury-hosted',
    title: 'TUDU-hosted luxury events',
    description: 'Invitation-only gatherings produced by TUDU at the top end of the market.',
    enabled: false,
  },
]

function seedStore(): TuduBlackStore {
  const now = Date.now()
  return {
    invitationOnly: true,
    membershipFeeCad: 0,
    benefits: DEFAULT_TUDU_BLACK_BENEFITS.map((b) => ({ ...b })),
    waitlist: [
      {
        id: generateId(),
        name: 'Alexandra Chen',
        email: 'alexandra.chen@example.com',
        referrer: 'Member referral',
        note: 'Calgary — private dining & art openings',
        status: 'pending',
        submittedAt: new Date(now - 86400000 * 2).toISOString(),
      },
      {
        id: generateId(),
        name: 'Marcus Whitfield',
        email: 'm.whitfield@example.com',
        referrer: 'Application',
        note: 'Toronto — ski weekends & charter interest',
        status: 'invited',
        submittedAt: new Date(now - 86400000 * 9).toISOString(),
      },
      {
        id: generateId(),
        name: 'Elena Rostova',
        email: 'elena.r@example.com',
        referrer: 'Partner network',
        status: 'pending',
        submittedAt: new Date(now - 86400000 * 5).toISOString(),
      },
    ],
  }
}

function readStore(): TuduBlackStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seeded = seedStore()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
      return seeded
    }
    return JSON.parse(raw) as TuduBlackStore
  } catch {
    const seeded = seedStore()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
    return seeded
  }
}

function writeStore(store: TuduBlackStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function getTuduBlackStore(): TuduBlackStore {
  return readStore()
}

export function getTuduBlackWaitlist(): TuduBlackWaitlistEntry[] {
  return readStore().waitlist
}

export function getTuduBlackBenefits(): TuduBlackTierBenefit[] {
  return readStore().benefits
}

export function addTuduBlackWaitlistEntry(
  entry: Omit<TuduBlackWaitlistEntry, 'id' | 'submittedAt' | 'status'>,
): TuduBlackWaitlistEntry {
  const store = readStore()
  const newEntry: TuduBlackWaitlistEntry = {
    ...entry,
    id: generateId(),
    status: 'pending',
    submittedAt: new Date().toISOString(),
  }
  store.waitlist.unshift(newEntry)
  writeStore(store)
  return newEntry
}

export function updateTuduBlackWaitlistStatus(
  id: string,
  status: TuduBlackWaitlistStatus,
): void {
  const store = readStore()
  store.waitlist = store.waitlist.map((e) => (e.id === id ? { ...e, status } : e))
  writeStore(store)
}

export function saveTuduBlackConfig(partial: Partial<Pick<TuduBlackStore, 'invitationOnly' | 'membershipFeeCad'>>): void {
  const store = readStore()
  writeStore({ ...store, ...partial })
}

export function toggleTuduBlackBenefit(id: string): void {
  const store = readStore()
  store.benefits = store.benefits.map((b) =>
    b.id === id ? { ...b, enabled: !b.enabled } : b,
  )
  writeStore(store)
}

export function getTuduBlackStats(): {
  waitlistTotal: number
  pending: number
  invited: number
  activeBenefits: number
} {
  const store = readStore()
  return {
    waitlistTotal: store.waitlist.length,
    pending: store.waitlist.filter((e) => e.status === 'pending').length,
    invited: store.waitlist.filter((e) => e.status === 'invited').length,
    activeBenefits: store.benefits.filter((b) => b.enabled).length,
  }
}
