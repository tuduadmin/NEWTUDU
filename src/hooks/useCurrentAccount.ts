import { useEffect, useMemo, useState } from 'react'
import { ACCOUNTS_CHANGED_EVENT, getAccount } from '../lib/account'
import { AUTH_SESSION_CHANGED_EVENT, getSessionEmail } from '../lib/auth'

/** Live account for the signed-in session — refreshes on sign-in, admin edits, and tab focus. */
export function useCurrentAccount() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    function refresh() {
      setTick((value) => value + 1)
    }

    window.addEventListener(ACCOUNTS_CHANGED_EVENT, refresh)
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener(ACCOUNTS_CHANGED_EVENT, refresh)
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return useMemo(() => {
    const sessionEmail = getSessionEmail()
    return {
      sessionEmail,
      account: sessionEmail ? getAccount(sessionEmail) : null,
    }
  }, [tick])
}
