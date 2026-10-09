import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, MapPin } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import Toast from '../components/Toast'
import { BackIconButton, ShareButton } from '../components/NavActionButtons'
import {
  getBucketListById,
  getListCoverImage,
  resolveListDisplayEvents,
} from '../lib/bucketLists'
import BucketListProofPhotosModal from '../components/bucket-list/BucketListProofPhotosModal'
import {
  getCompletionNote,
  getCompletionPhotoUrls,
  getCompletionTaggedUserIds,
  isBucketListFullyComplete,
} from '../lib/bucketListProgress'
import { getFollowableUserProfileUrl, resolveTaggedFollowers } from '../lib/userFollows'
import {
  bucketListDetailPath,
  bucketListItemPath,
  parseBucketListViewContext,
} from '../lib/bucketListViewContext'

export default function BucketListCompletionRecapPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const viewContext = parseBucketListViewContext(searchParams)
  const canManage = viewContext === 'mine'
  const listBack = id ? bucketListDetailPath(id, viewContext) : '/bucket-list'
  const [toast, setToast] = useState<string | null>(null)
  const [proofPhotoEdit, setProofPhotoEdit] = useState<{ eventId: string; title: string } | null>(
    null,
  )
  const [recapKey, setRecapKey] = useState(0)

  const ownList = useMemo(() => {
    void recapKey
    return id ? getBucketListById(id) : undefined
  }, [id, recapKey])
  const events = useMemo(
    () => (ownList ? resolveListDisplayEvents(ownList) : []),
    [ownList],
  )
  const completedIds = ownList?.completedIds ?? []
  const fullyComplete = isBucketListFullyComplete(events, completedIds)

  const completedEvents = useMemo(
    () => events.filter((e) => completedIds.includes(e.id)),
    [events, completedIds],
  )

  async function handleShare() {
    if (!id || !ownList) return
    const url = `${window.location.origin}/bucket-list/${id}/recap?from=explore`
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${ownList.name} — complete`,
          text: `I finished my bucket list: ${ownList.name}`,
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        setToast('Link copied to clipboard')
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url)
        setToast('Link copied to clipboard')
      } catch {
        setToast('Could not share recap')
      }
    }
  }

  if (!id || !ownList) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo="/bucket-list" />
        <main className="px-4 py-16 text-center">
          <h1 className="font-display text-xl font-bold text-brown">List not found</h1>
          <Link to="/bucket-list" className="mt-4 inline-block text-sm font-semibold text-orange">
            Back to Bucket Lists
          </Link>
        </main>
        <BottomNav />
      </div>
    )
  }

  if (!fullyComplete) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo="/bucket-list" />
        <main className="px-4 py-16 text-center">
          <h1 className="font-display text-xl font-bold text-brown">Recap not ready yet</h1>
          <p className="mt-2 text-sm text-brown-muted">
            Mark every item complete to unlock your recap. You can still add or remove items anytime.
          </p>
          <Link
            to={listBack}
            className="mt-6 inline-block rounded-[14px] bg-gradient-tudu px-6 py-2.5 text-sm font-bold text-white no-underline"
          >
            Back to list
          </Link>
        </main>
        <BottomNav />
      </div>
    )
  }

  const cover = getListCoverImage(ownList)

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/bucket-list" />

      <div className="relative h-44 w-full overflow-hidden">
        {cover ? (
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-dusk" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-midnight/30 to-midnight/90" />
        <BackIconButton
          to={listBack}
          variant="glass"
          className="absolute left-4 top-[calc(12px+env(safe-area-inset-top))]"
        />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-success/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            <CheckCircle2 size={12} aria-hidden />
            All done
          </span>
          <h1 className="mt-2 font-display text-2xl font-extrabold text-white">{ownList.name}</h1>
          <p className="mt-1 text-sm text-white/70">
            {completedEvents.length} {completedEvents.length === 1 ? 'memory' : 'memories'} with proof
          </p>
        </div>
      </div>

      <div className="px-4 py-4">
        <ShareButton
          onClick={handleShare}
          className="w-full min-h-0 justify-center border-brown/20 bg-app-elevated py-2.5 font-display text-sm font-bold"
        />
      </div>

      <main className="space-y-4 px-4 pb-6">
        {completedEvents.map((event) => {
          const photos = getCompletionPhotoUrls(event.id, ownList)
          const note = getCompletionNote(event.id, ownList)
          const completedAt = ownList.completedAt?.[event.id]
          const taggedIds = getCompletionTaggedUserIds(event.id, ownList)

          return (
            <article
              key={event.id}
              className="overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated shadow-sm"
            >
              <div className="relative aspect-[16/10] bg-cream-dark">
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => setProofPhotoEdit({ eventId: event.id, title: event.title })}
                    className="block h-full w-full"
                    aria-label={`Change proof photos for ${event.title}`}
                  >
                    <img
                      src={photos[0] ?? event.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ) : (
                  <img
                    src={photos[0] ?? event.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
                {photos.length > 1 && (
                  <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white">
                    +{photos.length - 1} photos
                  </span>
                )}
                {canManage && (
                  <span className="pointer-events-none absolute right-2 bottom-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white">
                    Edit photos
                  </span>
                )}
              </div>
              <div className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-orange">
                    <MapPin size={12} aria-hidden />
                    {event.city}
                  </p>
                  <Link
                    to={bucketListItemPath(id!, event.id, viewContext)}
                    className="mt-1 block font-display text-lg font-bold text-brown no-underline hover:text-orange"
                  >
                    {event.title}
                  </Link>
                  {completedAt && (
                    <p className="mt-1 text-xs text-brown-muted">
                      Completed {formatDate(completedAt)}
                    </p>
                  )}
                  {note && (
                    <p className="mt-2 text-sm leading-relaxed text-brown-muted">{note}</p>
                  )}
                  {canManage && !note && photos.length === 0 && (
                    <p className="mt-2 text-xs text-brown-muted">Tap the image to add proof photos.</p>
                  )}
                </div>
                <RecapTaggedAvatars userIds={taggedIds} />
              </div>
            </article>
          )
        })}
      </main>

      <section className="mx-4 mb-4 rounded-[14px] border border-dashed border-brown/20 bg-cream-dark/50 px-4 py-3 text-center">
        <p className="text-xs font-semibold text-brown">Optional recap video</p>
        <p className="mt-1 text-[11px] leading-relaxed text-brown-muted">
          Edit in CapCut (or similar), then upload a short clip here — coming soon.
        </p>
      </section>

      <div className="px-4 pb-2">
        <button
          type="button"
          onClick={() => navigate(listBack)}
          className="w-full rounded-[14px] border border-brown/15 bg-white py-2.5 text-sm font-bold text-brown transition hover:border-orange/30"
        >
          Back to list
        </button>
      </div>

      {canManage && (
        <BucketListProofPhotosModal
          listId={id}
          eventId={proofPhotoEdit?.eventId ?? null}
          eventTitle={proofPhotoEdit?.title}
          onClose={() => setProofPhotoEdit(null)}
          onSaved={() => {
            setRecapKey((k) => k + 1)
            setToast('Photos saved')
          }}
          onError={(message) => setToast(message)}
        />
      )}

      <BottomNav />
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}

const RECAP_TAG_AVATAR_MAX = 4

function RecapTaggedAvatars({ userIds }: { userIds: string[] }) {
  const people = resolveTaggedFollowers(userIds)
  if (people.length === 0) return null

  const visible = people.slice(0, RECAP_TAG_AVATAR_MAX)
  const extra = people.length - visible.length

  return (
    <div className="flex w-[92px] shrink-0 flex-col items-end gap-2 pt-0.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-brown-muted">With</span>
      <div className="flex flex-wrap justify-end gap-1.5">
        {visible.map((person) => (
          <Link
            key={person.id}
            to={getFollowableUserProfileUrl(person)}
            title={person.name}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-app-elevated transition hover:ring-orange/50 active:scale-95"
            style={{ backgroundColor: person.avatarColor }}
          >
            {person.initials}
          </Link>
        ))}
        {extra > 0 && (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream-dark text-[10px] font-bold text-brown ring-2 ring-brown/10"
            title={`${extra} more`}
          >
            +{extra}
          </span>
        )}
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}
