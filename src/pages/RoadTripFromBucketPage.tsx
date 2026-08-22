import { useNavigate } from 'react-router-dom'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import GradientButton from '../components/GradientButton'
import { BackIconButton } from '../components/NavActionButtons'
import { createRoadTripFromBucketList, getRoadTrips } from '../lib/roadTrips'
import { getBucketLists, getListCoverImage } from '../lib/bucketLists'
import { getCurrentUser } from '../lib/auth'

export default function RoadTripFromBucketPage() {
  const navigate = useNavigate()
  const lists = getBucketLists()

  function handleSelectList(listId: string) {
    const list = lists.find((l) => l.id === listId)
    if (!list) return

    const existing = getRoadTrips().find((t) => t.bucketListId === list.id)
    const trip = existing ?? createRoadTripFromBucketList(list, getCurrentUser()?.email)
    navigate('/road-trip', { state: { tripId: trip.id } })
  }

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/road-trip" />

      <div className="flex items-center gap-3 px-4 pb-2 pt-2">
        <BackIconButton variant="plain" onClick={() => navigate('/road-trip')} />
        <div>
          <p className="text-tagline">Road Trip</p>
          <h1 className="font-display text-lg font-bold text-brown">From My Bucket List</h1>
        </div>
      </div>

      <main className="px-4 pt-2">
        {lists.length === 0 ? (
          <div className="rounded-[14px] border border-app-subtle bg-app-elevated px-6 py-12 text-center shadow-sm">
            <p className="text-sm text-brown-muted">You don&apos;t have any bucket lists yet.</p>
            <GradientButton
              type="button"
              onClick={() => navigate('/bucket-list?create=true')}
              className="mt-4 rounded-[14px] px-6 py-2.5 text-sm font-bold"
            >
              Create a List
            </GradientButton>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-brown-muted">Pick a list to turn into a road trip.</p>
            {lists.map((list) => (
              <button
                key={list.id}
                type="button"
                onClick={() => handleSelectList(list.id)}
                className="flex w-full items-center gap-3 overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated p-3 text-left shadow-sm transition hover:border-orange/20 active:scale-[0.99]"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[14px]">
                  {getListCoverImage(list) ? (
                    <img
                      src={getListCoverImage(list)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-cream-dark text-xl">
                      ðŸ“‹
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-base font-bold text-brown">{list.name}</h2>
                  <p className="mt-0.5 text-xs text-brown-muted">
                    {list.eventIds.length} events | {list.completedIds.length} done
                  </p>
                </div>
                <span className="pr-1 text-brown-muted/40">&gt;</span>
              </button>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
