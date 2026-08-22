import { Link } from 'react-router-dom'
import { useEffect, useState, type ReactNode } from 'react'
import { isPlatformAdmin } from '../lib/auth'

type AdminEntryLinkProps = {
  className?: string
  children?: ReactNode
}

function adminEntryPath(): string {
  return isPlatformAdmin() ? '/admin' : '/admin/signin'
}

export default function AdminEntryLink({ className = '', children = 'Admin' }: AdminEntryLinkProps) {
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
    <Link to={to} className={className}>
      {children}
    </Link>
  )
}
