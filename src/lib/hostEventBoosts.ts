const BALANCE_KEY = 'tudu_host_boost_balance'

function readBalances(): Record<string, number> {
  try {
    const raw = localStorage.getItem(BALANCE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, number>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeBalances(balances: Record<string, number>): void {
  localStorage.setItem(BALANCE_KEY, JSON.stringify(balances))
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Demo boost balance per host user — defaults to 5 for new accounts. */
export function getHostBoostBalance(email: string): number {
  const key = normalizeEmail(email)
  const balances = readBalances()
  if (balances[key] == null) {
    balances[key] = 5
    writeBalances(balances)
    return 5
  }
  return Math.max(0, balances[key])
}

export function setHostBoostBalance(email: string, count: number): void {
  const key = normalizeEmail(email)
  const balances = readBalances()
  balances[key] = Math.max(0, count)
  writeBalances(balances)
}

export function useHostBoost(email: string): { ok: boolean; remaining?: number; error?: string } {
  const key = normalizeEmail(email)
  const balances = readBalances()
  const current = balances[key] ?? 5
  if (current <= 0) {
    return { ok: false, error: 'No boosts available. Buy more on Subscription.' }
  }
  balances[key] = current - 1
  writeBalances(balances)
  return { ok: true, remaining: balances[key] }
}
