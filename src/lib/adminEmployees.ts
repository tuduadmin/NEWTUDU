import { isPlatformOwner } from './controlRoomAccess'
import { PLATFORM_ADMIN } from './demoAccounts'

const STORAGE_KEY = 'tudu-admin-employees'

export const ADMIN_EMPLOYEES_CHANGED_EVENT = 'tudu-admin-employees-changed'

export type EmployeeRole = 'admin' | 'support' | 'moderator'
export type EmployeeStatus = 'active' | 'inactive' | 'on_leave'

export interface AdminEmployee {
  id: string
  name: string
  email: string
  role: EmployeeRole
  department: string
  status: EmployeeStatus
  joinedAt: string
  /** When false, roster entry cannot sign into Control Room. */
  controlRoomAccess?: boolean
}

function seedEmployees(): AdminEmployee[] {
  return [
    {
      id: 'emp_platform_owner',
      name: `${PLATFORM_ADMIN.firstName} ${PLATFORM_ADMIN.lastName}`.trim(),
      email: PLATFORM_ADMIN.email,
      role: 'admin',
      department: 'Leadership',
      status: 'active',
      controlRoomAccess: true,
      joinedAt: new Date(Date.now() - 86400000 * 400).toISOString(),
    },
  ]
}

function readItems(): AdminEmployee[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seed = seedEmployees()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    return (JSON.parse(raw) as AdminEmployee[]).map(normalizeEmployee)
  } catch {
    return seedEmployees()
  }
}

function saveItems(items: AdminEmployee[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(ADMIN_EMPLOYEES_CHANGED_EVENT))
}

function normalizeEmployee(raw: AdminEmployee): AdminEmployee {
  return {
    ...raw,
    controlRoomAccess: raw.controlRoomAccess !== false,
  }
}

export function getEmployees(): AdminEmployee[] {
  return readItems().sort((a, b) => a.name.localeCompare(b.name))
}

export function getEmployeeStats(): {
  total: number
  active: number
  departments: number
} {
  const items = readItems()
  return {
    total: items.length,
    active: items.filter((e) => e.status === 'active').length,
    departments: new Set(items.map((e) => e.department)).size,
  }
}

export function updateEmployeeStatus(id: string, status: EmployeeStatus): boolean {
  const items = readItems()
  const idx = items.findIndex((e) => e.id === id)
  if (idx < 0) return false
  if (isPlatformOwner(items[idx].email) && status !== 'active') {
    return false
  }
  items[idx] = { ...items[idx], status }
  saveItems(items)
  return true
}

export function addEmployeeRecord(employee: AdminEmployee): { ok: boolean; error?: string } {
  const items = readItems()
  if (items.some((e) => e.email.toLowerCase() === employee.email.toLowerCase())) {
    return { ok: false, error: 'This email is already on the employee roster.' }
  }
  items.push(normalizeEmployee(employee))
  saveItems(items)
  return { ok: true }
}
