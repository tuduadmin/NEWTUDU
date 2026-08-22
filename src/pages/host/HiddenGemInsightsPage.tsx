import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import AppHeaderBar from '../../components/locked/AppHeaderBar'
import BottomNav from '../../components/BottomNav'
import { BackLink } from '../../components/NavActionButtons'
import HiddenGemAnalyticsPanel from '../../components/host/HiddenGemAnalyticsPanel'
import { getCurrentUser } from '../../lib/auth'
import { getHiddenGemById } from '../../lib/hiddenGems'
import { useHostContext } from '../../hooks/useHostContext'

export default function HiddenGemInsightsPage() {
  const { gemId } = useParams<{ gemId: string }>()
  const user = getCurrentUser()
  const { activeOrg, isPersonal } = useHostContext()

  const gem = useMemo(() => (gemId ? getHiddenGemById(gemId) : undefined), [gemId])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (isPersonal || !activeOrg) {
    return <Navigate to="/host" replace />
  }

  if (!gemId || !gem) {
    return (
      <div className="min-h-app bg-cream pb-nav">
        <AppHeaderBar />
        <main className="mx-auto max-w-lg px-4 py-6">
          <BackLink to="/host" className="text-orange">
            Event Manager
          </BackLink>
          <p className="mt-4 text-sm text-brown-muted">Hidden Gem not found.</p>
        </main>
        <BottomNav />
      </div>
    )
  }

  if (gem.organizationId !== activeOrg.id) {
    return <Navigate to="/host" replace />
  }

  return (
    <div className="min-h-app bg-cream pb-nav">
      <AppHeaderBar />
      <main className="mx-auto max-w-lg px-4 py-6">
        <BackLink to="/host" className="text-orange">
          Event Manager
        </BackLink>
        <div className="mt-4 app-surface-card p-4">
          <HiddenGemAnalyticsPanel gemId={gemId} />
        </div>
        <p className="mt-4 text-center text-xs text-brown-muted">
          <Link to={`/host/hidden-gem?edit=${encodeURIComponent(gemId)}`} className="text-orange no-underline">
            Edit listing
          </Link>
        </p>
      </main>
      <BottomNav />
    </div>
  )
}
