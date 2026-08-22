import { DEMO_USER } from './auth'

const STORAGE_KEY = 'tudu-admin-rewards'

/** Kudos required to redeem one event boost (host page stub). */
export const KUDOS_PER_BOOST = 500

export type RewardType = 'boost' | 'merch' | 'kudos'
export type RewardStatus = 'pending' | 'completed' | 'cancelled'

export interface RewardEntry {
  id: string
  userEmail: string
  rewardType: RewardType
  amount: number
  status: RewardStatus
  date: string
  notes?: string
}

function generateId(): string {
  return `rw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function seedRewards(): RewardEntry[] {
  return [
    {
      id: generateId(),
      userEmail: DEMO_USER.email,
      rewardType: 'kudos',
      amount: 150,
      status: 'completed',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      notes: 'Post-event kudos from attendees',
    },
    {
      id: generateId(),
      userEmail: DEMO_USER.email,
      rewardType: 'boost',
      amount: 1,
      status: 'completed',
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
      notes: `Redeemed via ${KUDOS_PER_BOOST} kudos balance`,
    },
    {
      id: generateId(),
      userEmail: 'jamie@example.com',
      rewardType: 'merch',
      amount: 1,
      status: 'pending',
      date: new Date(Date.now() - 86400000).toISOString(),
      notes: 'TUDU crew tee — shipping stub',
    },
    {
      id: generateId(),
      userEmail: 'reviewer@example.com',
      rewardType: 'kudos',
      amount: 500,
      status: 'completed',
      date: new Date(Date.now() - 86400000 * 8).toISOString(),
      notes: 'Milestone award — enough for 1 boost redemption',
    },
    {
      id: generateId(),
      userEmail: 'user12@example.com',
      rewardType: 'boost',
      amount: 1,
      status: 'cancelled',
      date: new Date(Date.now() - 86400000 * 12).toISOString(),
      notes: 'Insufficient kudos at redemption time',
    },
  ]
}

function readItems(): RewardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seed = seedRewards()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    return JSON.parse(raw) as RewardEntry[]
  } catch {
    return seedRewards()
  }
}

export function getRewardEntries(): RewardEntry[] {
  return readItems().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
}

export function getRewardStats(): {
  totalRedemptions: number
  pending: number
  kudosIssued: number
} {
  const items = readItems()
  return {
    totalRedemptions: items.filter(
      (r) => r.status === 'completed' && (r.rewardType === 'boost' || r.rewardType === 'merch'),
    ).length,
    pending: items.filter((r) => r.status === 'pending').length,
    kudosIssued: items
      .filter((r) => r.rewardType === 'kudos' && r.status === 'completed')
      .reduce((sum, r) => sum + r.amount, 0),
  }
}
