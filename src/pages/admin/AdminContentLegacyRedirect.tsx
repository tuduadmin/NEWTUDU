import { Navigate, useLocation } from 'react-router-dom'
import type { ContentView } from './AdminContentPage'

/** Preserves query string when redirecting old Content sidebar routes to the hub. */
export default function AdminContentLegacyRedirect({ view }: { view: ContentView }) {
  const location = useLocation()
  const next = new URLSearchParams(location.search)
  if (view === 'events') {
    next.delete('view')
  } else {
    next.set('view', view)
  }
  const search = next.toString()
  return <Navigate to={search ? `/admin/content?${search}` : '/admin/content'} replace />
}
