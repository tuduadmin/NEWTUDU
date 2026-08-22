import { PLATFORM_ADMIN } from './auth'

const STORAGE_KEY = 'tudu-admin-employees'

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
}

function generateId(): string {
  return `emp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function seedEmployees(): AdminEmployee[] {
  return [
    {
      id: generateId(),
      name: 'Platform Admin',
      email: PLATFORM_ADMIN.email,
      role: 'admin',
      department: 'Leadership',
      status: 'active',
      joinedAt: new Date(Date.now() - 86400000 * 400).toISOString(),
    },
    {
      id: generateId(),
      name: 'Jordan Lee',
      email: 'jordan@tudu.ca',
      role: 'support',
      department: 'Customer Success',
      status: 'active',
      joinedAt: new Date(Date.now() - 86400000 * 180).toISOString(),
    },
    {
      id: generateId(),
      name: 'Sam Rivera',
      email: 'sam@tudu.ca',
      role: 'moderator',
      department: 'Trust & Safety',
      status: 'active',
      joinedAt: new Date(Date.now() - 86400000 * 90).toISOString(),
    },
    {
      id: generateId(),
      name: 'Alex Chen',
      email: 'alex@tudu.ca',
      role: 'support',
      department: 'Customer Success',
      status: 'on_leave',
      joinedAt: new Date(Date.now() - 86400000 * 240).toISOString(),
    },
    {
      id: generateId(),
      name: 'Morgan Patel',
      email: 'morgan@tudu.ca',
      role: 'moderator',
      department: 'Trust & Safety',
      status: 'inactive',
      joinedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
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
    return JSON.parse(raw) as AdminEmployee[]
  } catch {
    return seedEmployees()
  }
}

function saveItems(items: AdminEmployee[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
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
  items[idx] = { ...items[idx], status }
  saveItems(items)
  return true
}
