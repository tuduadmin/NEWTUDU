import AvatarStoryRing from './AvatarStoryRing'
import VibeBadge from './VibeBadge'
import type { PublicBucketList } from '../types/bucketList'

type BucketListCoverCardProps = {
  list: PublicBucketList
  style?: React.CSSProperties
  onOpen?: () => void
  onSaveList?: () => void
  onShare?: () => void
}

export default function BucketListCoverCard({
  list,
  style,
  onOpen,
  onSaveList,
  onShare,
}: BucketListCoverCardProps) {
  return (
    <article
      className="relative mx-auto h-[min(72vh,620px)] w-full max-w-[390px] overflow-hidden rounded-[var(--radius-cover)] shadow-float ring-1 ring-white/10"
      style={style}
    >
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 z-10 block h-full w-full text-left"
        aria-label={`Open ${list.name} by ${list.ownerName}`}
      >
        <img src={list.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="overlay-readability absolute inset-0" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <AvatarStoryRing
            initials={list.ownerInitials}
            imageUrl={list.ownerAvatarUrl}
            size={44}
            verified={list.ownerVerified}
            alt={list.ownerName}
          />
          <div className="flex gap-2">
            {list.hasSoundtrack && (
              <span className="glass-surface flex h-11 min-w-[44px] items-center justify-center gap-1 rounded-full px-3 text-[11px] font-semibold text-white">
                <span aria-hidden>🎵</span>
                <span className="sr-only">Has soundtrack</span>
              </span>
            )}
            {onShare && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onShare()
                }}
                className="glass-surface flex h-11 w-11 items-center justify-center rounded-full text-white/90"
                aria-label="Share list"
              >
                ↗
              </button>
            )}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5 pb-6">
          {list.vibe && (
            <div className="mb-3">
              <VibeBadge vibe={list.vibe} />
            </div>
          )}
          <h2 className="font-display text-[28px] font-extrabold leading-[1.1] tracking-tight text-white">
            {list.name}
          </h2>
          <p className="mt-2 text-sm font-medium text-white/75">by {list.ownerName}</p>
          {list.region && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-white/55">
              <span aria-hidden>📍</span>
              {list.region}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-white/65">
            <span>
              {list.itemCount} {list.itemCount === 1 ? 'item' : 'items'}
            </span>
            <span aria-hidden>·</span>
            <span>{list.completedCount} completed</span>
            {list.likeCount != null && list.likeCount > 0 && (
              <>
                <span aria-hidden>·</span>
                <span>❤️ {list.likeCount}</span>
              </>
            )}
          </div>
        </div>
      </button>

      {onSaveList && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSaveList()
          }}
          className="absolute bottom-5 right-5 z-20 flex h-12 min-w-[44px] items-center justify-center rounded-full bg-gradient-tudu px-4 font-display text-sm font-bold text-white glow-warm"
        >
          Save List
        </button>
      )}
    </article>
  )
}
