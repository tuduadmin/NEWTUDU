import {
  canUsePersonalHostMode,
  getAccount,
  getDefaultOrgContextForUser,
  getHostAccountsForUser,
  getOrganization,
  isOrgOnlyMember,
  setPostingAs,
  type Organization,
  type PostingAs,
} from './account'
import { getCurrentUser } from './auth'

export const HOST_CONTEXT_KEY = 'tudu-host-context'

export type HostContextValue = 'personal' | string

type HostContextListener = () => void

const listeners = new Set<HostContextListener>()

function notifyHostContextChange(): void {
  listeners.forEach((listener) => listener())
}

export function subscribeHostContext(listener: HostContextListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function resolveDefaultContext(email: string): HostContextValue {
  const defaultContext = getDefaultOrgContextForUser(email)
  localStorage.setItem(HOST_CONTEXT_KEY, defaultContext)
  return defaultContext
}

export function getHostContextRaw(): HostContextValue {
  try {
    const user = getCurrentUser()
    if (!user) return 'personal'

    const raw = localStorage.getItem(HOST_CONTEXT_KEY)
    if (raw) {
      if (raw === 'personal') {
        return canUsePersonalHostMode(user.email) ? 'personal' : resolveDefaultContext(user.email)
      }
      const hostAccounts = getHostAccountsForUser(user.email)
      if (hostAccounts.some((org) => org.id === raw)) return raw
      return resolveDefaultContext(user.email)
    }

    const postingAs = getAccount(user.email)?.postingAs
    if (postingAs && postingAs !== 'personal') {
      const hostAccounts = getHostAccountsForUser(user.email)
      if (hostAccounts.some((org) => org.id === postingAs)) {
        localStorage.setItem(HOST_CONTEXT_KEY, postingAs)
        return postingAs
      }
    }

    return resolveDefaultContext(user.email)
  } catch {
    return 'personal'
  }
}

/** Returns validated host context for the signed-in user. */
export function getHostContext(email?: string): HostContextValue {
  const resolvedEmail = email ?? getCurrentUser()?.email
  const raw = getHostContextRaw()

  if (!resolvedEmail) return 'personal'

  if (raw === 'personal') {
    return canUsePersonalHostMode(resolvedEmail) ? 'personal' : getDefaultOrgContextForUser(resolvedEmail)
  }

  const hostAccounts = getHostAccountsForUser(resolvedEmail)
  return hostAccounts.some((org) => org.id === raw) ? raw : getDefaultOrgContextForUser(resolvedEmail)
}

/** Force Event Manager context to personal and notify subscribed UI. */
export function resetHostContextToPersonal(): void {
  const user = getCurrentUser()
  if (user && !canUsePersonalHostMode(user.email)) {
    const orgContext = getDefaultOrgContextForUser(user.email)
    localStorage.setItem(HOST_CONTEXT_KEY, orgContext)
    notifyHostContextChange()
    return
  }
  localStorage.setItem(HOST_CONTEXT_KEY, 'personal')
  notifyHostContextChange()
}

export function setHostContext(context: HostContextValue, email?: string): void {
  const resolvedEmail = email ?? getCurrentUser()?.email

  let normalized: HostContextValue = 'personal'
  if (context === 'personal') {
    if (resolvedEmail && !canUsePersonalHostMode(resolvedEmail)) {
      normalized = getDefaultOrgContextForUser(resolvedEmail)
    } else {
      normalized = 'personal'
    }
  } else if (resolvedEmail) {
    const hostAccounts = getHostAccountsForUser(resolvedEmail)
    normalized = hostAccounts.some((org) => org.id === context)
      ? context
      : getDefaultOrgContextForUser(resolvedEmail)
  }

  localStorage.setItem(HOST_CONTEXT_KEY, normalized)

  if (resolvedEmail) {
    const postingAs: PostingAs = normalized === 'personal' ? 'personal' : normalized
    setPostingAs(resolvedEmail, postingAs)
  }

  notifyHostContextChange()
}

export function resolveHostContext(email: string): {
  context: HostContextValue
  isPersonal: boolean
  activeOrg: Organization | null
  hostAccounts: Organization[]
  canUsePersonalMode: boolean
  isOrgOnlyMember: boolean
} {
  const hostAccounts = getHostAccountsForUser(email)
  const context = getHostContext(email)
  const canUsePersonalMode = canUsePersonalHostMode(email)
  const orgOnlyMember = isOrgOnlyMember(email)
  const activeOrg =
    context === 'personal' ? null : (getOrganization(context) ?? hostAccounts.find((o) => o.id === context) ?? null)

  return {
    context,
    isPersonal: context === 'personal',
    activeOrg,
    hostAccounts,
    canUsePersonalMode,
    isOrgOnlyMember: orgOnlyMember,
  }
}
