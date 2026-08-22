import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Users } from 'lucide-react'
import type { DiscoverEvent } from '../../data/discoverEvents'
import {
  getMyTuduFeedItems,
  getMyTuduFeedTimeLabel,
  type MyTuduFeedItem,
} from '../../lib/myTuduFeed'
import { getFeedItemReactionTargetKey } from '../../lib/feedReactions'
import { getFollowingCount, resolveViewerFollowing, type ResolvedFollowedHost } from '../../lib/hostFollows'
import { formatMerchMoney } from '../../lib/eventMerch'
import DiscoverEventDetailPanel from '../DiscoverEventDetailPanel'
import EventCoverDisplay from '../EventCoverDisplay'
import FeedReactionBar from './FeedReactionBar'
import GradientButton from '../GradientButton'
import HostProfileAvatar from '../host/HostProfileAvatar'
import FollowingListDrawer from '../host/FollowingListDrawer'
import { markMyTuduFeedSeen } from '../../lib/myTuduFeedSeen'

type MyTuduFeedSectionProps = {
  viewerEmail: string
}

export default function MyTuduFeedSection({ viewerEmail }: MyTuduFeedSectionProps) {
  const [refresh, setRefresh] = useState(0)
  const [detailEvent, setDetailEvent] = useState<DiscoverEvent | null>(null)
  const [showFollowing, setShowFollowing] = useState(false)

  useEffect(() => {
    return () => {
      markMyTuduFeedSeen(viewerEmail)
    }
  }, [viewerEmail])

  const followingHosts = useMemo(() => {
    void refresh
    return resolveViewerFollowing(viewerEmail)
  }, [viewerEmail, refresh])

  const feedItems = useMemo(() => {
    void refresh
    return getMyTuduFeedItems(viewerEmail)
  }, [viewerEmail, refresh])

  const followingCount = useMemo(() => getFollowingCount(viewerEmail), [viewerEmail, refresh])

  return (
    <>
      <section className="mt-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-bold text-brown">Following feed</h2>
            <p className="mt-0.5 text-xs text-brown-muted">
              New events and merch from hosts you follow.
            </p>
          </div>
          {followingCount > 0 && (
            <button
              type="button"
              onClick={() => setShowFollowing(true)}
              className="inline-flex shrink-0 items-center gap-1 rounded-[12px] border border-app-subtle bg-app-elevated px-2.5 py-1.5 text-[11px] font-semibold text-brown transition hover:border-orange/30"
            >
              <Users size={14} aria-hidden />
              {followingCount}
            </button>
          )}
        </div>

        {feedItems.length === 0 ? (
          <div className="mt-4 rounded-[14px] border border-dashed border-app-subtle bg-cream/30 px-6 py-10 text-center">
            <p className="font-display text-sm font-bold text-brown">Nothing in your feed yet</p>
            <p className="mt-1 text-sm text-brown-muted">
              Follow hosts on Discover or their public profile — their new events and merch will
              show up here.
            </p>
            <GradientButton to="/discover" fullWidth className="mt-4 py-3">
              Browse Discover
            </GradientButton>
            <Link
              to="/following"
              className="mt-3 inline-block text-xs font-semibold text-orange no-underline hover:underline"
            >
              See friend follows →
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {feedItems.map((item) => (
              <li key={item.id}>
                <FeedItemCard
                  item={item}
                  viewerEmail={viewerEmail}
                  onOpenEvent={setDetailEvent}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {showFollowing && (
        <FollowingListDrawer
          hosts={followingHosts}
          onClose={() => {
            setShowFollowing(false)
            setRefresh((n) => n + 1)
          }}
        />
      )}

      {detailEvent && (
        <DiscoverEventDetailPanel
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onSave={() => setDetailEvent(null)}
        />
      )}
    </>
  )
}

function FeedItemCard({
  item,
  viewerEmail,
  onOpenEvent,
}: {
  item: MyTuduFeedItem
  viewerEmail: string
  onOpenEvent: (event: DiscoverEvent) => void
}) {
  const timeLabel = getMyTuduFeedTimeLabel(item.postedAt)
  const reactionTargetKey = getFeedItemReactionTargetKey(item)

  if (item.kind === 'merch') {
    const preview = item.products[0]
    return (
      <article className="overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated shadow-sm">
        <FeedItemHeader host={item.host} timeLabel={timeLabel} actionLabel="New marketplace drop" />
        <div className="px-3 pb-0">
          <div className="flex gap-3 rounded-[12px] border border-orange/15 bg-orange/5 p-3">
            {preview?.imageUrl ? (
              <img
                src={preview.imageUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-[10px] object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[10px] bg-orange/10 text-orange">
                <Package size={22} aria-hidden />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-orange">
                New merch
              </p>
              <p className="mt-0.5 font-display text-sm font-bold text-brown">{item.eventTitle}</p>
              <p className="mt-1 text-xs text-brown-muted">
                {item.products.length === 1
                  ? `Added ${preview?.name ?? 'an item'} · ${formatMerchMoney(preview?.priceCents ?? 0)}`
                  : `${item.products.length} new items added`}
              </p>
              <Link
                to={`/event/${item.eventId}/marketplace`}
                className="mt-2 inline-flex text-xs font-semibold text-orange no-underline hover:underline"
              >
                Browse marketplace →
              </Link>
            </div>
          </div>
        </div>
        <FeedReactionBar targetKey={reactionTargetKey} viewerEmail={viewerEmail} />
      </article>
    )
  }

  return (
    <article className="overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated shadow-sm">
      <FeedItemHeader host={item.host} timeLabel={timeLabel} actionLabel="Posted an event" />
      <button
        type="button"
        onClick={() => onOpenEvent(item.event)}
        className="block w-full border-0 bg-transparent p-0 text-left"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-cream-dark">
          <EventCoverDisplay
            coverImage={item.event.image}
            className="h-full w-full"
            imgClassName="h-full w-full object-cover"
          />
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-teal-600">
            {item.event.dateTag}
          </p>
          <h3 className="mt-0.5 font-display text-sm font-extrabold text-brown">{item.event.title}</h3>
          {item.event.locationDetail && (
            <p className="mt-0.5 truncate text-xs text-brown-muted">{item.event.locationDetail}</p>
          )}
        </div>
      </button>
      <FeedReactionBar targetKey={reactionTargetKey} viewerEmail={viewerEmail} />
    </article>
  )
}

function FeedItemHeader({
  host,
  timeLabel,
  actionLabel,
}: {
  host: ResolvedFollowedHost
  timeLabel: string
  actionLabel: string
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5">
      <Link to={host.profileUrl} className="shrink-0 no-underline">
        <HostProfileAvatar
          name={host.displayName}
          avatarUrl={host.avatarUrl}
          size="sm"
          className="h-9 w-9 text-xs"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-brown">
          <Link to={host.profileUrl} className="text-brown no-underline hover:text-orange">
            {host.displayName}
          </Link>
        </p>
        <p className="text-[11px] text-brown-muted">
          {actionLabel} · {timeLabel}
        </p>
      </div>
    </div>
  )
}
