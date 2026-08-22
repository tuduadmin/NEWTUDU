import { useParams } from 'react-router-dom'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import EventTicketsView from '../components/my-tudu/EventTicketsView'
import { BackLink } from '../components/NavActionButtons'

export default function MyTuduEventTicketsPage() {
  const { eventId } = useParams<{ eventId: string }>()

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/my-tudu" />

      <main className="pt-2">
        <div className="px-4">
          <BackLink to="/my-tudu">Back to My Tudu</BackLink>
        </div>

        {eventId ? <EventTicketsView eventId={eventId} /> : null}
      </main>

      <BottomNav />
    </div>
  )
}
