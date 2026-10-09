import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BookOpen, Bookmark, CheckCircle2, Globe, Heart, Lock, Pencil, Share2, Trash2 } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import AvatarStoryRing from '../components/AvatarStoryRing'
import BottomNav from '../components/BottomNav'
import MediaTile from '../components/MediaTile'
import Toast from '../components/Toast'
import VibeBadge from '../components/VibeBadge'
import { BackIconButton, BackLink } from '../components/NavActionButtons'
import {
  ModeActionBar,
  ModeActionPrimaryBar,
  ModeActionTile,
} from '../components/mode/ModeActionTile'
import type { DiscoverEvent } from '../data/discoverEvents'
import {
  copyPublicListToMine,
  deleteBucketList,
  getBucketListById,
  getListCoverImage,
  getPublicBucketListById,
  resolveListDisplayEvents,
  updateBucketListName,
  updateBucketListVisibility,
  type BucketList,
  type PublicBucketList,
} from '../lib/bucketLists'
import type { VibeTag } from '../types/bucketList'
import BucketListProgressChecklist from '../components/bucket-list/BucketListProgressChecklist'
import BucketListProofPhotosModal from '../components/bucket-list/BucketListProofPhotosModal'
import BucketListProgressRing from '../components/bucket-list/BucketListProgressRing'
import {
  bucketListProgress,
  getCompletedEventIds,
  getCompletionPhoto,
  isBucketListFullyComplete,
} from '../lib/bucketListProgress'
import {
  bucketListDetailPath,
  bucketListHubPath,
  bucketListItemPath,
  bucketListRecapPath,
  parseBucketListViewContext,
} from '../lib/bucketListViewContext'
import {
  getBucketListDisplayLikeCount,
  isBucketListLiked,
  toggleBucketListLike,
} from '../lib/bucketListLikes'
import { isDiscoverEventExpired } from '../lib/discoverEventExpiry'

type TileSize = 'large' | 'small' | 'portrait' | 'editorial'

const GRID_PATTERN: TileSize[] = ['large', 'small', 'small', 'portrait', 'small', 'editorial']

function readListState(listId: string | undefined): {
  ownList: BucketList | undefined
  publicList: PublicBucketList | undefined
} {
  if (!listId) return { ownList: undefined, publicList: undefined }
  return {
    ownList: getBucketListById(listId),
    publicList: getPublicBucketListById(listId),
  }
}

export default function BucketListDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const viewContext = parseBucketListViewContext(searchParams)
  const hubBack = bucketListHubPath(viewContext)
  const [toast, setToast] = useState<string | null>(null)
  const [ownList, setOwnList] = useState<BucketList | undefined>(
    () => readListState(id).ownList,
  )
  const [publicList, setPublicList] = useState<PublicBucketList | undefined>(
    () => readListState(id).publicList,
  )
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [stickyVisible, setStickyVisible] = useState(false)
  const [proofPhotoEdit, setProofPhotoEdit] = useState<{ eventId: string; title: string } | null>(
    null,
  )
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  const isPublic = Boolean(publicList && !ownList)
  /** Edit/delete only from My lists — Explore is view-only even for the owner */
  const canManage = Boolean(ownList) && viewContext === 'mine'
  const exploreViewer = viewContext === 'explore' && Boolean(publicList || ownList)
  const listName = ownList?.name ?? publicList?.name ?? 'Bucket List'
  const coverImage =
    (ownList && getListCoverImage(ownList)) || publicList?.coverImage || undefined
  const vibe = (publicList?.vibe ?? 'Adventurous') as VibeTag

  const refresh = useCallback(() => {
    if (!id) return
    const mine = getBucketListById(id)
    const pub = getPublicBucketListById(id)
    setOwnList(mine)
    setPublicList(pub)
    if (mine) setNameDraft(mine.name)
  }, [id])

  useEffect(() => {
    refresh()
    if (!location.pathname.includes('/item/')) {
      window.scrollTo(0, 0)
    }
  }, [id, refresh, location.pathname])

  useEffect(() => {
    if (!id) return
    setLiked(isBucketListLiked(id))
    setLikeCount(getBucketListDisplayLikeCount(id, publicList?.likeCount ?? 0))
  }, [id, publicList?.likeCount])

  useEffect(() => {
    if (ownList?.isDraft === true) {
      navigate(`/bucket-list/create/${ownList.id}/details`, { replace: true })
    }
  }, [ownList, navigate])

  useEffect(() => {
    function onScroll() {
      setStickyVisible(window.scrollY > 200)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const events = useMemo(() => {
    if (ownList) return resolveListDisplayEvents(ownList)
    if (publicList) return publicList.events
    return []
  }, [ownList, publicList])

  if (!id || (!ownList && !publicList)) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo="/bucket-list" />
        <main className="px-4 py-16 text-center">
          <h1 className="font-display text-xl font-bold text-brown">List not found</h1>
          <BackLink to="/bucket-list" className="mt-4">
            Back to Bucket Lists
          </BackLink>
        </main>
        <BottomNav />
      </div>
    )
  }

  function handleSaveName() {
    if (!ownList) return
    updateBucketListName(ownList.id, nameDraft)
    setEditingName(false)
    refresh()
    setToast('List renamed')
  }

  async function handleShare() {
    const url = `${window.location.origin}/bucket-list/${id}?from=explore`
    try {
      if (navigator.share) {
        await navigator.share({ title: listName, text: `NOW YOU KNOW - ${listName}`, url })
      } else {
        await navigator.clipboard.writeText(url)
        setToast('Link copied to clipboard')
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url)
        setToast('Link copied to clipboard')
      } catch {
        setToast('Could not share list')
      }
    }
  }

  function handleSaveWholePublicList() {
    if (!publicList) return
    const copy = copyPublicListToMine(publicList)
    setToast(`Saved as "${copy.name}"`)
    navigate(bucketListDetailPath(copy.id, 'mine'))
  }

  function handleLike() {
    if (!id) return
    toggleBucketListLike(id)
    setLiked(isBucketListLiked(id))
    setLikeCount(getBucketListDisplayLikeCount(id, publicList?.likeCount ?? 0))
  }

  function handleExploreSave() {
    if (ownList) {
      navigate('/bucket-list?tab=mine')
      return
    }
    handleSaveWholePublicList()
  }

  function handleDeleteList() {
    if (!ownList) return
    if (!window.confirm(`Delete "${ownList.name}"?`)) return
    deleteBucketList(ownList.id)
    navigate('/bucket-list')
  }

  function handleToggleVisibility() {
    if (!ownList) return
    const currentlyPrivate = ownList.isPrivate === true
    updateBucketListVisibility(ownList.id, !currentlyPrivate)
    refresh()
    setToast(currentlyPrivate ? 'List is now public in Explore' : 'List is now private')
  }

  const completedIds = getCompletedEventIds(ownList, publicList)
  const { total: progressTotal, done: completedCount } = bucketListProgress(events, completedIds)
  const listFullyComplete = isBucketListFullyComplete(events, completedIds)
  const completionPhotos = useMemo(() => {
    const out: Record<string, string> = {}
    for (const event of events) {
      const thumb = getCompletionPhoto(event.id, ownList, publicList)
      if (thumb) out[event.id] = thumb
    }
    return out
  }, [events, ownList, publicList])

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/bucket-list" />
      {/* Sticky condensed header */}
      <header
        className={`fixed inset-x-0 top-0 z-[var(--z-header)] mx-auto max-w-lg border-b border-app-subtle bg-app-elevated/95 backdrop-blur-sm transition duration-[var(--duration-fast)] ${
          stickyVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
        style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}
      >
        <div className="flex h-[52px] items-center gap-3 px-4">
          <BackIconButton to={hubBack} variant="plain" />
          <h1 className="truncate font-display text-lg font-bold text-brown">{listName}</h1>
        </div>
      </header>

      {/* Hero header */}
      <div className="relative h-[280px] w-full overflow-hidden">
        {coverImage ? (
          <img src={coverImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-dusk" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-midnight/20 via-transparent to-midnight/95" />
        <BackIconButton
          to={hubBack}
          variant="glass"
          className="absolute left-4 top-[calc(12px+env(safe-area-inset-top))]"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
          <div className="min-w-0 flex-1">
            {exploreViewer && publicList && (
              <div className="mb-3 flex items-center gap-2">
                <AvatarStoryRing initials={publicList.ownerInitials} size={32} />
                <span className="text-sm text-white/72">
                  by {publicList.ownerName}
                  {ownList && viewContext === 'explore' && (
                    <span className="text-white/50"> · Explore view</span>
                  )}
                </span>
              </div>
            )}
            {canManage && editingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  autoFocus
                  className="min-w-0 flex-1 rounded-[14px] border border-white/[0.08] bg-midnight-surface/90 px-3 py-2 font-display text-lg font-bold outline-none focus:border-magenta/50"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="rounded-[14px] bg-gradient-tudu px-4 py-2 text-sm font-bold"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => canManage && setEditingName(true)}
                disabled={!canManage}
                className={canManage ? '' : 'cursor-default'}
              >
                <h1 className="text-left font-display text-[28px] font-extrabold leading-tight tracking-tight">
                  {listName}
                  {canManage && <span className="ml-2 text-sm text-white/40">✎</span>}
                </h1>
              </button>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-sm text-white/48">
                {events.length} {events.length === 1 ? 'item' : 'items'}
              </span>
              <VibeBadge vibe={vibe} />
            </div>
            {publicList?.description && (
              <p className="mt-2 line-clamp-2 text-sm text-white/60">{publicList.description}</p>
            )}
          </div>
          {events.length > 0 && (
            <BucketListProgressRing
              done={completedCount}
              total={events.length}
              size={72}
              variant="light"
            />
          )}
        </div>
      </div>

      <div className="py-4">
        <ModeActionBar>
          {canManage ? (
            <>
              <div className="grid grid-cols-4 gap-1.5">
                <ModeActionTile compact label="Share" tone="neutral" onClick={handleShare}>
                  <Share2 size={16} aria-hidden />
                </ModeActionTile>
                <ModeActionTile
                  compact
                  label="Edit"
                  tone="edit"
                  onClick={() => navigate(`/bucket-list/create/${ownList!.id}/details`)}
                >
                  <Pencil size={16} aria-hidden />
                </ModeActionTile>
                <ModeActionTile compact label="Del" tone="danger" onClick={handleDeleteList}>
                  <Trash2 size={16} aria-hidden />
                </ModeActionTile>
                <ModeActionTile
                  compact
                  label={ownList!.isPrivate === true ? 'Public' : 'Private'}
                  tone="neutral"
                  onClick={handleToggleVisibility}
                >
                  {ownList!.isPrivate === true ? (
                    <Globe size={16} aria-hidden />
                  ) : (
                    <Lock size={16} aria-hidden />
                  )}
                </ModeActionTile>
              </div>
              {progressTotal > 0 && (
                <div className="mt-2">
                  {listFullyComplete ? (
                    <ModeActionPrimaryBar
                      label="View recap"
                      icon={<BookOpen size={18} aria-hidden />}
                      onClick={() => navigate(bucketListRecapPath(ownList!.id, 'mine'))}
                    />
                  ) : (
                    <p className="rounded-[12px] border border-brown/10 bg-cream-dark/80 px-3 py-2.5 text-center text-[11px] leading-snug text-brown-muted">
                      Complete every item to unlock your recap ({completedCount}/{progressTotal})
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-1.5">
                <ModeActionTile
                  compact
                  label={likeCount > 0 ? String(likeCount) : 'Like'}
                  tone="neutral"
                  onClick={handleLike}
                >
                  <Heart
                    size={16}
                    aria-hidden
                    className={liked ? 'fill-error text-error' : undefined}
                  />
                </ModeActionTile>
                <ModeActionTile compact label="Share" tone="neutral" onClick={handleShare}>
                  <Share2 size={16} aria-hidden />
                </ModeActionTile>
                <ModeActionTile compact label="Save" tone="neutral" onClick={handleExploreSave}>
                  <Bookmark size={16} aria-hidden />
                </ModeActionTile>
              </div>
              {listFullyComplete && (
                <div className="mt-2">
                  <ModeActionPrimaryBar
                    label="View recap"
                    icon={<BookOpen size={18} aria-hidden />}
                    onClick={() => navigate(bucketListRecapPath(id!, 'explore'))}
                  />
                </div>
              )}
            </>
          )}
        </ModeActionBar>
      </div>

      <BucketListProgressChecklist
        listId={id!}
        ownerLabel={exploreViewer ? publicList?.ownerName : undefined}
        itemLink={(eventId) => bucketListItemPath(id!, eventId, viewContext)}
        events={events}
        completedIds={completedIds}
        completionPhotos={completionPhotos}
        compactHeader
        onProofPhotoClick={
          canManage
            ? (eventId) => {
                const ev = events.find((e) => e.id === eventId)
                setProofPhotoEdit({ eventId, title: ev?.title ?? 'Item' })
              }
            : undefined
        }
      />

      {/* Masonry mood board grid */}
      <main className="px-3 pb-8">
        {events.length === 0 ? (
          <div className="app-surface-card px-6 py-10 text-center">
            <p className="text-sm text-brown-muted">No events in this list yet.</p>
            <Link to="/discover" className="mt-3 inline-block text-sm font-semibold text-orange">
              Discover events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {events.map((event, i) => {
              const size = GRID_PATTERN[i % GRID_PATTERN.length]
              const isComplete = completedIds.includes(event.id)
              const expired = isDiscoverEventExpired(event)
              return (
                <ExperienceTile
                  key={event.id}
                  event={event}
                  size={size}
                  isComplete={isComplete}
                  expired={expired}
                  onOpen={() => navigate(bucketListItemPath(id!, event.id, viewContext))}
                />
              )
            })}
          </div>
        )}
      </main>

      <BottomNav />

      {canManage && (
        <BucketListProofPhotosModal
          listId={id!}
          eventId={proofPhotoEdit?.eventId ?? null}
          eventTitle={proofPhotoEdit?.title}
          onClose={() => setProofPhotoEdit(null)}
          onSaved={() => {
            refresh()
            setToast('Photos saved')
          }}
          onError={(message) => setToast(message)}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}

function ExperienceTile({
  event,
  size,
  isComplete,
  expired,
  onOpen,
}: {
  event: DiscoverEvent
  size: TileSize
  isComplete: boolean
  expired?: boolean
  onOpen: () => void
}) {
  const sizeClass =
    size === 'large' || size === 'editorial'
      ? 'col-span-2'
      : size === 'portrait'
        ? 'row-span-1'
        : ''

  const heightClass =
    size === 'large'
      ? 'h-[240px]'
      : size === 'portrait'
        ? 'h-[200px]'
        : size === 'editorial'
          ? 'h-[120px]'
          : 'h-[160px]'

  return (
    <article className={`relative overflow-hidden rounded-[14px] ${sizeClass} ${heightClass}`}>
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 z-[1] cursor-pointer"
        aria-label={`Open ${event.title}`}
      />
      <MediaTile
        src={event.image}
        videoUrl={event.videoUrl}
        mediaType={event.mediaType}
        className={`h-full w-full object-cover ${expired ? 'grayscale' : ''}`}
        autoPlay={event.mediaType === 'video' && !expired}
        muted
        loop
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-midnight/85" />

      {isComplete && (
        <span
          className="pointer-events-none absolute right-2.5 top-2.5 z-[2] flex h-8 w-8 items-center justify-center rounded-full bg-success text-white shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
          aria-hidden
        >
          <CheckCircle2 size={20} strokeWidth={2.5} />
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 z-[2] p-3">
        <h3 className="line-clamp-2 font-display text-sm font-bold leading-tight text-white">
          {event.title}
        </h3>
        <p className="mt-0.5 text-[11px] text-white/60">{event.city}</p>
      </div>
    </article>
  )
}

