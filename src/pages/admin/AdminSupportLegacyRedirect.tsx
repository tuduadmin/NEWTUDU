import { Navigate, useLocation } from 'react-router-dom'
import type { SupportTab } from './AdminSupportPage'

/** Preserves query string when redirecting legacy Support routes. */
export default function AdminSupportLegacyRedirect({
  tab,
}: {
  tab?: SupportTab
}) {
  const location = useLocation()
  const next = new URLSearchParams(location.search)

  if (tab) {
    if (tab === 'inbox') {
      next.delete('tab')
    } else {
      next.set('tab', tab)
    }
  }

  const search = next.toString()
  return <Navigate to={search ? `/admin/support?${search}` : '/admin/support'} replace />
}
