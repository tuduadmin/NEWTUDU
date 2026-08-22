import { Navigate, useLocation } from 'react-router-dom'

/** Redirect legacy /admin/messages routes to Support with the right tab. */
export default function AdminMessagesLegacyRedirect() {
  const location = useLocation()
  const next = new URLSearchParams(location.search)

  if (next.get('thread')) {
    next.set('tab', 'threads')
  } else {
    next.set('tab', 'send')
    if (next.get('to') && !next.get('compose')) {
      next.set('compose', '1')
    }
  }

  const search = next.toString()
  return <Navigate to={`/admin/support?${search}`} replace />
}
