import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { isAuthenticated } from '../../lib/auth'
import { touchLastActive } from '../../lib/account'

/** Updates lastActiveAt on route changes when user is signed in. */
export default function ActivityTracker() {
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated()) return
    touchLastActive()
  }, [location.pathname])

  return null
}
