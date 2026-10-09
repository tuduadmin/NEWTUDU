import { Link } from 'react-router-dom'
import { useEffect, useState, type ReactNode } from 'react'
import { getCurrentUser, hasControlRoomAccess } from '../lib/auth'
import { getControlRoomSignInPath } from '../lib/controlRoomRoutes'

type AdminEntryLinkProps = {
  className?: string
  children?: ReactNode
  'aria-label'?: string
}

function adminEntryPath(): string {
  return hasControlRoomAccess(getCurrentUser()?.email) ? '/admin' : getControlRoomSignInPath()
}

export default function AdminEntryLink({
  className = '',
  children = 'Control Room',
  'aria-label': ariaLabel = 'Control Room sign in',
}: AdminEntryLinkProps) {
  const [to, setTo] = useState(() => adminEntryPath())

  useEffect(() => {
    function refresh() {
      setTo(adminEntryPath())
    }

    refresh()
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [])

  return (
    <Link to={to} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  )
}
