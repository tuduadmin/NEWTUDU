import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DiscoverEventDetailPanel from '../../components/DiscoverEventDetailPanel'
import { BackLink } from '../../components/NavActionButtons'
import { buildDiscoverCardFromHostEvent } from '../../data/discoverEvents'
import { getHostEventById } from '../../lib/account'
import { saveEvent } from '../../lib/savedEvents'

export default function HostEventViewPage() {
  const { eventId = '' } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  const hostEvent = useMemo(
    () => (eventId ? getHostEventById(eventId) : undefined),
    [eventId],
  )

  const discoverCard = useMemo(
    () => (hostEvent ? buildDiscoverCardFromHostEvent(hostEvent) : null),
    [hostEvent],
  )

  if (!hostEvent || !discoverCard) {
    return (
      <div className="app-page-shell flex min-h-[100dvh] flex-col items-center justify-center px-4 pb-28 text-center">
        <h1 className="font-display text-xl font-bold text-brown">Event not found</h1>
        <BackLink to="/host" className="mt-4 text-orange">
          Back to Event Manager
        </BackLink>
      </div>
    )
  }

  function handleSave() {
    saveEvent(discoverCard!)
  }

  return (
    <DiscoverEventDetailPanel
      event={discoverCard}
      onClose={() => navigate('/host')}
      onSave={handleSave}
      layout="discover"
    />
  )
}
