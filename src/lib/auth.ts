import { isOnboardingComplete } from './preferences'

export const DEMO_USER = {
  email: 'demo@tudu.ca',
  password: 'password123',
  firstName: 'Demo',
  lastName: 'User',
} as const

export interface StoredUser {
  email: string
  password: string
  firstName: string
  lastName: string
  dob?: string
  hearAbout?: string
  notify?: boolean
}

const USERS_KEY = 'tudu_users'
const SESSION_KEY = 'tudu_session'

function getUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredUser[]) : []
  } catch {
    return []
  }
}

function saveUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function setSession(email: string): void {
  localStorage.setItem(SESSION_KEY, email)
}

export function seedDemoUser(): void {
  const users = getUsers()
  const exists = users.some(
    (u) => u.email.toLowerCase() === DEMO_USER.email.toLowerCase(),
  )
  if (!exists) {
    users.push({
      email: DEMO_USER.email,
      password: DEMO_USER.password,
      firstName: DEMO_USER.firstName,
      lastName: DEMO_USER.lastName,
    })
    saveUsers(users)
  }
}

export function signUp(userData: StoredUser): boolean {
  const users = getUsers()
  if (users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
    return false
  }
  users.push(userData)
  saveUsers(users)
  setSession(userData.email)
  return true
}

export function signIn(email: string, password: string): boolean {
  const user = getUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  )
  if (!user) return false
  setSession(user.email)
  return true
}

export function signOut(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(SESSION_KEY) !== null
}

export function getCurrentUser(): StoredUser | null {
  const email = localStorage.getItem(SESSION_KEY)
  if (!email) return null
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null
}

export function getPostAuthPath(): string {
  return isOnboardingComplete() ? '/discover' : '/onboarding/interests'
}

export function getDiscoverPath(): string {
  if (!isAuthenticated()) return '/signin'
  return isOnboardingComplete() ? '/discover' : '/onboarding/interests'
}

export function getHostPath(): string {
  if (!isAuthenticated()) return '/signin'
  return '/host'
}
