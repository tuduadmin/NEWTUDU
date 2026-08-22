import { Link, useParams } from 'react-router-dom'
import { Lock, MessageSquare } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import PrivateEventChatPanel from '../components/private-event/PrivateEventChatPanel'
import { BackLink } from '../components/NavActionButtons'
import { getHostEventById } from '../lib/account'
import { isPrivateEventChatEnabled } from '../lib/privateEventChat'
import { useFeatureFlags } from '../hooks/useFeatureFlags'

export default function PrivateEventChatPage() {
  const { id } = useParams<{ id: string }>()
  const flags = useFeatureFlags()
  const event = id ? getHostEventById(id) : undefined
  const chatEnabled = flags.privateEventChatEnabled && isPrivateEventChatEnabled()

  if (!chatEnabled) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar />
        <main className="px-4 pt-10 text-center">
          <MessageSquare size={40} className="mx-auto text-brown-muted" />
          <h1 className="mt-4 font-display text-xl font-bold text-brown">Event chat unavailable</h1>
          <p className="mt-2 text-sm text-brown-muted">
            Private event chat is not enabled for this demo build yet.
          </p>
          <BackLink to={event ? `/event/private/${event.id}` : '/discover'} className="mt-6 text-orange">
            Back to event
          </BackLink>
        </main>
        <BottomNav />
      </div>
    )
  }

  if (!event || event.visibility !== 'private') {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar />
        <main className="px-4 pt-10 text-center">
          <Lock size={40} className="mx-auto text-brown-muted" />
          <h1 className="mt-4 font-display text-xl font-bold text-brown">Private event not found</h1>
          <p className="mt-2 text-sm text-brown-muted">
            This chat link may be invalid or the event was removed.
          </p>
          <Link to="/discover" className="mt-6 inline-block font-semibold text-orange no-underline">
            Browse public events →
          </Link>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar />

      <main className="px-4 pt-4">
        <BackLink to={`/event/private/${event.id}`}>Back to event</BackLink>

        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-orange">Private event</p>
          <h1 className="font-display text-xl font-extrabold text-brown">{event.title}</h1>
          <p className="mt-1 text-sm text-brown-muted">
            One group thread for invitees and RSVPs. Auto-locks when the event ends.
          </p>
        </div>

        <PrivateEventChatPanel event={event} className="mt-4" />
      </main>

      <BottomNav />
    </div>
  )
}
