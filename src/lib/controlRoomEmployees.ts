import { ensureAccount } from './account'
import {
  addEmployeeRecord,
  type AdminEmployee,
  type EmployeeRole,
} from './adminEmployees'
import { isPlatformOwner } from './controlRoomAccess'
import { isUsernameTaken, registerStoredUser } from './auth'
import {
  suggestUsernameFromEmail,
  validateUsername,
  withUsernameSuffix,
} from './username'
import { sendControlRoomWelcomeEmail } from './controlRoomWelcomeEmail'

export type CreateControlRoomEmployeeInput = {
  firstName: string
  lastName: string
  email: string
  password: string
  role: EmployeeRole
  department: string
  controlRoomAccess?: boolean
  /** When true (default), sends welcome email with sign-in URL and temporary password. */
  sendWelcomeEmail?: boolean
  signInUrl?: string
}

export type CreateControlRoomEmployeeResult = {
  ok: boolean
  error?: string
  employee?: AdminEmployee
  welcomeEmailSent?: boolean
}

function allocateUsername(email: string): string {
  let base = suggestUsernameFromEmail(email)
  let candidate = base
  let suffix = 1
  while (true) {
    const check = validateUsername(candidate)
    if (check.ok && !isUsernameTaken(check.username)) {
      return check.username
    }
    candidate = withUsernameSuffix(base, suffix)
    suffix += 1
    if (suffix > 9999) {
      const last = validateUsername(candidate)
      if (last.ok && !isUsernameTaken(last.username)) return last.username
      return 'staffuser'
    }
  }
}

export function createControlRoomEmployee(
  input: CreateControlRoomEmployeeInput,
  createdByEmail: string,
): CreateControlRoomEmployeeResult {
  if (!isPlatformOwner(createdByEmail)) {
    return { ok: false, error: 'Only the platform owner can create Control Room employees.' }
  }

  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const email = input.email.trim().toLowerCase()
  const password = input.password
  const department = input.department.trim()

  if (!firstName || !lastName) {
    return { ok: false, error: 'First and last name are required.' }
  }
  if (!email.includes('@')) {
    return { ok: false, error: 'Enter a valid work email.' }
  }
  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' }
  }
  if (!department) {
    return { ok: false, error: 'Department is required.' }
  }

  const username = allocateUsername(email)

  const register = registerStoredUser(
    {
      email,
      password,
      firstName,
      lastName,
      username,
    },
    { startSession: false },
  )
  if (!register.ok) {
    return { ok: false, error: register.error ?? 'Could not create login account.' }
  }

  ensureAccount(email)

  const employee: AdminEmployee = {
    id: `emp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: `${firstName} ${lastName}`.trim(),
    email,
    role: input.role,
    department,
    status: 'active',
    controlRoomAccess: input.controlRoomAccess !== false,
    joinedAt: new Date().toISOString(),
  }

  const added = addEmployeeRecord(employee)
  if (!added.ok) {
    return { ok: false, error: added.error }
  }

  let welcomeEmailSent = false
  if (input.sendWelcomeEmail !== false) {
    sendControlRoomWelcomeEmail(
      {
        firstName,
        email,
        password,
        department,
        signInUrl: input.signInUrl,
      },
      createdByEmail,
    )
    welcomeEmailSent = true
  }

  return { ok: true, employee, welcomeEmailSent }
}
