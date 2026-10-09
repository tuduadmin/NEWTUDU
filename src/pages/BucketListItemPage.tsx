import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Bookmark,
  Calendar,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Navigation,
} from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import MediaTile from '../components/MediaTile'
import Toast from '../components/Toast'
import GradientButton from '../components/GradientButton'
import AddToBucketListModal from '../components/AddToBucketListModal'
import { BackIconButton } from '../components/NavActionButtons'
import {
  getBucketListById,
  getPublicBucketListById,
  resolveListDisplayEvents,
  type BucketList,
  type PublicBucketList,
} from '../lib/bucketLists'
import { bucketListProgress, getCompletedEventIds } from '../lib/bucketListProgress'
import { bucketListDetailPath, parseBucketListViewContext } from '../lib/bucketListViewContext'
import {
  getDiscoverEventMapsUrl,
  getDiscoverEventOrganizerName,
  getDiscoverEventOrganizerProfileUrl,
  isDiscoverEventExpired,
} from '../lib/discoverEventExpiry'

export default function BucketListItemPage() {
  const { id, itemId } = useParams<{ id: string; itemId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const viewContext = parseBucketListViewContext(searchParams)
  const listBack = id ? bucketListDetailPath(id, viewContext) : '/bucket-list'
  const [ownList, setOwnList] = useState<BucketList | undefined>(() =>
    id ? getBucketListById(id) : undefined,
  )
  const [publicList, setPublicList] = useState<PublicBucketList | undefined>(() =>
    id ? getPublicBucketListById(id) : undefined,
  )
  const [toast, setToast] = useState<string | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)

  const refresh = useCallback(() => {
    if (!id) return
    setOwnList(getBucketListById(id))
    setPublicList(getPublicBucketListById(id))
  }, [id])

  useEffect(() => {
    refresh()
  }, [refresh])

  const events = useMemo(() => {
    if (ownList) return resolveListDisplayEvents(ownList)
    if (publicList) return publicList.events
    return []
  }, [ownList, publicList])

  const event = useMemo(
    () => events.find((e) => e.id === itemId),
    [events, itemId],
  )

  const isOwner = Boolean(ownList)
  const listName = ownList?.name ?? publicList?.name ?? 'Bucket list'
  const ownerName = publicList?.ownerName
  const completedIds = getCompletedEventIds(ownList, publicList)
  const isComplete = itemId ? completedIds.includes(itemId) : false
  const progress = bucketListProgress(events, completedIds)

  useEffect(() => {
    if (ownList?.isDraft === true) {
      navigate(`/bucket-list/create/${ownList.id}/details`, { replace: true })
    }
  }, [ownList, navigate])

  if (!id || !itemId || !event) {
    return (
      <div className="app-page-shell bg-midnight pb-28 text-white">
        <AppHeaderBar logoLinkTo="/bucket-list" />
        <main className="px-4 py-16 text-center">
          <p className="text-white/70">Item not found.</p>
          <Link to={listBack} className="mt-4 inline-block text-sunset-orange">
            Back to list
          </Link>
        </main>
        <BottomNav />
      </div>
    )
  }

  const expired = isDiscoverEventExpired(event)
  const organizerName = getDiscoverEventOrganizerName(event)
  const organizerProfileUrl = getDiscoverEventOrganizerProfileUrl(event)
  const mapsUrl = getDiscoverEventMapsUrl(event)
  const externalLink =
    event.locationDetail?.trim().startsWith('http') ? event.locationDetail.trim() : null
  const venueLine = [event.venueName, event.streetAddress, event.city].filter(Boolean).join(' · ')

  return (
    <div className="app-page-shell bg-midnight pb-28 text-white">
      <AppHeaderBar logoLinkTo="/bucket-list" />

      <div className="relative h-[min(52vh,420px)] w-full overflow-hidden">
        <MediaTile
          src={event.image}
          videoUrl={event.videoUrl}
          mediaType={event.mediaType}
          className={`h-full w-full object-cover ${expired ? 'grayscale' : ''}`}
          autoPlay={event.mediaType === 'video' && !expired}
          muted
          loop
        />
        <div
          className={`absolute inset-0 bg-gradient-to-b from-midnight/30 via-transparent to-midnight ${
            expired ? 'bg-midnight/25' : ''
          }`}
        />
        <BackIconButton
          onClick={() => navigate(listBack)}
          variant="glass"
          className="absolute left-4 top-[calc(12px+env(safe-area-inset-top))] z-[2]"
        />
        {isComplete && (
          <span className="absolute right-4 top-[calc(12px+env(safe-area-inset-top))] inline-flex items-center gap-1 rounded-full bg-success/90 px-3 py-1.5 text-xs font-bold text-white">
            <CheckCircle2 size={14} />
            Done
          </span>
        )}
      </div>

      <main className="relative -mt-6 px-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-sunset-pink">
          {listName}
          {ownerName && !isOwner ? ` · ${ownerName}` : ''}
        </p>
        <h1
          className={`font-display text-2xl font-extrabold leading-tight ${expired ? 'text-white/75' : ''}`}
        >
          {event.title}
        </h1>
        <p className="mt-1 text-sm text-white/60">{venueLine || event.city}</p>

        {expired && (
          <p className="mt-3 rounded-[12px] border border-white/15 bg-white/5 px-3 py-2 text-xs leading-relaxed text-white/65">
            This experience has ended. Details below are for reference.
          </p>
        )}

        <section className="mt-4 space-y-3 rounded-[14px] border border-white/10 bg-midnight-elevated p-4">
          {(event.dateTime || event.dateTag) && (
            <div className="flex gap-3">
              <Calendar size={18} className="mt-0.5 shrink-0 text-sunset-orange" aria-hidden />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">When</p>
                <p className="text-sm font-semibold text-white/90">
                  {event.dateTime ?? event.dateTag}
                </p>
                {event.repeatsLabel && (
                  <p className="mt-0.5 text-xs text-white/55">{event.repeatsLabel}</p>
                )}
              </div>
            </div>
          )}

          {event.cost && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Cost</p>
              <p className="text-sm font-semibold text-white/90">{event.cost}</p>
            </div>
          )}

          {(event.venueName || event.streetAddress) && (
            <div className="flex gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-sunset-orange" aria-hidden />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                  Location
                </p>
                {event.venueName && (
                  <p className="text-sm font-semibold text-white/90">{event.venueName}</p>
                )}
                {event.streetAddress && (
                  <p className="text-xs text-white/60">{event.streetAddress}</p>
                )}
                <p className="text-xs text-white/55">{event.city}</p>
              </div>
            </div>
          )}

          {event.categories && event.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {event.categories.map((cat) => (
                <span
                  key={cat.label}
                  className="rounded-full border border-white/15 bg-midnight-surface px-2.5 py-0.5 text-[11px] font-semibold text-white/75"
                >
                  {cat.label}
                </span>
              ))}
            </div>
          )}

          {event.description && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">About</p>
              <p className="mt-1 text-sm leading-relaxed text-white/75">{event.description}</p>
            </div>
          )}

          {(mapsUrl || externalLink) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-[12px] border border-white/15 px-3 py-2 text-xs font-semibold text-sunset-orange no-underline transition hover:border-sunset-orange/40"
                >
                  <Navigation size={14} aria-hidden />
                  Directions
                </a>
              )}
              {externalLink && (
                <a
                  href={externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-[12px] border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 no-underline transition hover:border-white/25"
                >
                  Open link
                  <ExternalLink size={14} aria-hidden />
                </a>
              )}
            </div>
          )}
        </section>

        {expired && organizerProfileUrl && (
          <div className="mt-4 rounded-[14px] border border-white/10 bg-midnight-elevated px-4 py-3">
            <p className="text-sm leading-relaxed text-white/70">
              Follow {organizerName ?? 'the organizer'} for more events like this.
            </p>
            <Link
              to={organizerProfileUrl}
              className="mt-3 inline-flex text-sm font-bold text-sunset-orange no-underline hover:text-sunset-orange/85"
            >
              View organizer profile →
            </Link>
          </div>
        )}

        {!expired && (organizerName || organizerProfileUrl) && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-[14px] border border-white/10 bg-midnight-elevated px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Hosted by</p>
              <p className="truncate font-display text-sm font-bold text-white/90">
                {organizerName ?? 'TUDU host'}
              </p>
            </div>
            {organizerProfileUrl && (
              <Link
                to={organizerProfileUrl}
                className="shrink-0 text-xs font-bold text-sunset-orange no-underline"
              >
                Profile
              </Link>
            )}
          </div>
        )}

        <p className="mt-3 text-xs text-white/45">
          List progress: {progress.done}/{progress.total} ({progress.pct}%)
        </p>

        {!isOwner && (
          <GradientButton
            type="button"
            fullWidth
            className="mt-6 rounded-[14px] py-3.5 font-bold"
            onClick={() => setShowSaveModal(true)}
          >
            <Bookmark size={18} className="mr-2 inline" />
            Save to my bucket list
          </GradientButton>
        )}
      </main>

      <BottomNav />

      {showSaveModal && (
        <AddToBucketListModal
          eventIds={[event.id]}
          eventTitle={event.title}
          onClose={() => setShowSaveModal(false)}
          onSuccess={(listName) => {
            setShowSaveModal(false)
            setToast(`Added to "${listName}"`)
          }}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
