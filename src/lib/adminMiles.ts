import { DEMO_USER } from './auth'

const STORAGE_KEY = 'tudu-admin-miles'

export interface MilesWallet {
  id: string
  userEmail: string
  balance: number
  earned: number
  spent: number
  lastActivity: string
}

export interface MilesEconomyConfig {
  milesPerRsvp: number
  milesPerCheckIn: number
  milesPerKudosReceived: number
  milesPerEventHosted: number
}

export interface MilesStore {
  wallets: MilesWallet[]
  config: MilesEconomyConfig
}

export const DEFAULT_MILES_CONFIG: MilesEconomyConfig = {
  milesPerRsvp: 10,
  milesPerCheckIn: 25,
  milesPerKudosReceived: 5,
  milesPerEventHosted: 50,
}

function generateId(): string {
  return `mi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function seedStore(): MilesStore {
  return {
    config: { ...DEFAULT_MILES_CONFIG },
    wallets: [
      {
        id: generateId(),
        userEmail: DEMO_USER.email,
        balance: 1240,
        earned: 1580,
        spent: 340,
        lastActivity: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: generateId(),
        userEmail: 'jamie@example.com',
        balance: 520,
        earned: 680,
        spent: 160,
        lastActivity: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: generateId(),
        userEmail: 'user12@example.com',
        balance: 85,
        earned: 120,
        spent: 35,
        lastActivity: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
      {
        id: generateId(),
        userEmail: 'reviewer@example.com',
        balance: 2100,
        earned: 2400,
        spent: 300,
        lastActivity: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
    ],
  }
}

function readStore(): MilesStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seed = seedStore()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    return JSON.parse(raw) as MilesStore
  } catch {
    return seedStore()
  }
}

function saveStore(store: MilesStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function getMilesWallets(): MilesWallet[] {
  return readStore().wallets.sort(
    (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime(),
  )
}

export function getMilesConfig(): MilesEconomyConfig {
  return readStore().config
}

export function saveMilesConfig(config: MilesEconomyConfig): void {
  const store = readStore()
  store.config = config
  saveStore(store)
}

export function getMilesStats(): {
  totalIssued: number
  activeWallets: number
  totalBalance: number
} {
  const wallets = readStore().wallets
  return {
    totalIssued: wallets.reduce((sum, w) => sum + w.earned, 0),
    activeWallets: wallets.filter(
      (w) => Date.now() - new Date(w.lastActivity).getTime() < 86400000 * 30,
    ).length,
    totalBalance: wallets.reduce((sum, w) => sum + w.balance, 0),
  }
}
