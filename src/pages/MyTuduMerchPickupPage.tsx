import { Link, useParams } from 'react-router-dom'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import MerchPickupDetailView from '../components/my-tudu/MerchPickupDetailView'
import { BackLink } from '../components/NavActionButtons'
import { getCurrentUser } from '../lib/auth'

export default function MyTuduMerchPickupPage() {
  const { orderId = '' } = useParams<{ orderId: string }>()
  const user = getCurrentUser()

  if (!user) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo="/my-tudu" />
        <main className="px-4 pt-10 text-center">
          <p className="text-sm text-brown-muted">Sign in to view merch pickups.</p>
          <Link to="/signin" className="mt-4 inline-block font-semibold text-orange no-underline">
            Sign in
          </Link>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/my-tudu" />

      <main>
        <div className="px-4 pt-2">
          <BackLink to="/my-tudu">My Tudu</BackLink>
        </div>
        <MerchPickupDetailView orderId={orderId} userEmail={user.email} />
      </main>

      <BottomNav />
    </div>
  )
}
