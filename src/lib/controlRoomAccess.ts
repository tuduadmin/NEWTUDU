import { getEmployees, type AdminEmployee } from './adminEmployees'
import { PLATFORM_ADMIN } from './demoAccounts'

const USERS_KEY = 'tudu_users'

function loginAccountExists(email: string): boolean {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return false
    const users = JSON.parse(raw) as { email: string }[]
    const normalized = email.trim().toLowerCase()
    return users.some((u) => u.email.toLowerCase() === normalized)
  } catch {
    return false
  }
}

export function isPlatformOwner(email?: string | null): boolean {
  if (!email) return false
  return email.trim().toLowerCase() === PLATFORM_ADMIN.email.toLowerCase()
}

/** Active employee roster + login account, or platform owner. */
export function hasControlRoomAccess(email?: string | null): boolean {
  if (!email?.trim()) return false
  const normalized = email.trim().toLowerCase()
  if (isPlatformOwner(normalized)) return true

  const employee = getEmployees().find((e) => e.email.toLowerCase() === normalized)
  if (!employee || employee.status !== 'active' || employee.controlRoomAccess === false) {
    return false
  }

  return loginAccountExists(normalized)
}

export function getControlRoomEmployee(email: string): AdminEmployee | undefined {
  return getEmployees().find((e) => e.email.toLowerCase() === email.trim().toLowerCase())
}
