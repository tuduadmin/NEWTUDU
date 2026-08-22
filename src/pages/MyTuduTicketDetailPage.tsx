import { useLocation, useParams } from 'react-router-dom'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import TicketDetailView from '../components/my-tudu/TicketDetailView'
import { BackLink } from '../components/NavActionButtons'

type TicketDetailLocationState = {
  eventId?: string
  returnTo?: string
}

export default function MyTuduTicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const state = (location.state ?? {}) as TicketDetailLocationState
  const backTo =
    state.returnTo ??
    (state.eventId ? `/my-tudu/events/${state.eventId}/tickets` : '/my-tudu')

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/my-tudu" />

      <main className="pt-2">
        <div className="px-4">
          <BackLink to={backTo}>
            {state.eventId || state.returnTo ? 'Back to tickets' : 'Back to My Tudu'}
          </BackLink>
        </div>

        {id ? <TicketDetailView ticketId={id} returnTo={backTo} /> : null}
      </main>

      <BottomNav />
    </div>
  )
}
