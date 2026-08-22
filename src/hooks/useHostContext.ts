import { useCallback, useMemo, useSyncExternalStore } from 'react'
import {
  getHostContext,
  resolveHostContext,
  setHostContext as persistHostContext,
  subscribeHostContext,
  type HostContextValue,
} from '../lib/hostContext'
import { getCurrentUser } from '../lib/auth'

export function useHostContext() {
  const user = getCurrentUser()
  const email = user?.email ?? ''

  const context = useSyncExternalStore(
    subscribeHostContext,
    () => (email ? getHostContext(email) : 'personal'),
    () => 'personal' as HostContextValue,
  )

  const resolved = useMemo(
    () =>
      email
        ? resolveHostContext(email)
        : {
            context: 'personal' as const,
            isPersonal: true,
            activeOrg: null,
            hostAccounts: [],
            canUsePersonalMode: true,
            isOrgOnlyMember: false,
          },
    [email, context],
  )

  const setHostContext = useCallback(
    (next: HostContextValue) => {
      if (!email) return
      persistHostContext(next, email)
    },
    [email],
  )

  const personalName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Me'

  return {
    ...resolved,
    context,
    personalName,
    setHostContext,
    user,
  }
}
