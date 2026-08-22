import { useMemo, useState } from 'react'
import { ExternalLink, Music2 } from 'lucide-react'
import BucketListCoverCard from '../BucketListCoverCard'
import VibeBadge from '../VibeBadge'
import {
  AdminButton,
  AdminDrawer,
} from './AdminUI'
import {
  bucketListToPublic,
  getBucketListById,
  type BucketList,
} from '../../lib/bucketLists'
import type { PublicBucketList } from '../../types/bucketList'

type AdminBucketListPreviewDrawerProps = {
  list: BucketList | null
  open: boolean
  onClose: () => void
  onEdit?: (list: BucketList) => void
  onDelete?: (list: BucketList) => void
}

export default function AdminBucketListPreviewDrawer({
  list,
  open,
  onClose,
  onEdit,
  onDelete,
}: AdminBucketListPreviewDrawerProps) {
  const [itemIndex, setItemIndex] = useState(0)

  const publicPreview = useMemo(() => {
    if (!list) return null
    return bucketListToPublic(list) ?? buildPrivatePreview(list)
  }, [list])

  const items = publicPreview?.events ?? []
  const currentItem = items[itemIndex]

  if (!list || !publicPreview) return null

  return (
    <AdminDrawer
      open={open}
      title={`Preview — ${list.name}`}
      onClose={onClose}
      wide
      centered
      footer={
        <div className="flex flex-wrap gap-3">
          {onEdit && (
            <AdminButton variant="primary" onClick={() => onEdit(list)}>
              Edit list
            </AdminButton>
          )}
          {onDelete && (
            <AdminButton variant="danger" onClick={() => onDelete(list)}>
              Delete list
            </AdminButton>
          )}
          <AdminButton variant="secondary" onClick={onClose}>
            Close
          </AdminButton>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          {list.seededByAdmin && (
            <span className="admin-badge admin-badge-cyan">Platform created</span>
          )}
          <span
            className={`admin-badge ${list.isPrivate ? 'admin-badge-amber' : 'admin-badge-emerald'}`}
          >
            {list.isPrivate ? 'Private' : 'Public · discover feed'}
          </span>
        </div>

        <div className="rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[#0B0F1A] p-4">
          <p className="admin-label mb-3 text-[var(--admin-text-dim)]">Discovery cover card</p>
          <div className="mx-auto max-w-[320px] scale-[0.92] origin-top">
            <div className="pointer-events-none [&_article]:!h-[420px] [&_article]:!max-w-none">
              <BucketListCoverCard list={publicPreview} />
            </div>
          </div>
        </div>

        {(list.spotifyUrl || list.appleMusicUrl) && (
          <div className="rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3">
            <p className="admin-label mb-2 flex items-center gap-1.5">
              <Music2 size={12} />
              Playlist links
            </p>
            <div className="flex flex-col gap-2">
              {list.spotifyUrl && (
                <a
                  href={list.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-[var(--admin-accent)] hover:underline"
                >
                  Spotify
                  <ExternalLink size={12} />
                </a>
              )}
              {list.appleMusicUrl && (
                <a
                  href={list.appleMusicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-[var(--admin-accent)] hover:underline"
                >
                  Apple Music
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="admin-label">Items reel ({items.length})</p>
            {items.length > 1 && (
              <span className="text-[10px] text-[var(--admin-text-dim)]">
                {itemIndex + 1} / {items.length}
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <p className="text-xs text-[var(--admin-text-dim)]">No items on this list yet.</p>
          ) : (
            <>
              <div className="relative mx-auto max-w-[280px] overflow-hidden rounded-[var(--admin-radius)] border border-white/10 bg-[#0B0F1A]">
                <div className="relative aspect-[9/16] w-full">
                  {currentItem && (
                    <>
                      <img
                        src={currentItem.image}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-transparent to-[#0B0F1A]/40" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        {publicPreview.vibe && (
                          <div className="mb-2">
                            <VibeBadge vibe={publicPreview.vibe} />
                          </div>
                        )}
                        <h3 className="font-display text-lg font-bold text-white">
                          {currentItem.title}
                        </h3>
                        {currentItem.city && (
                          <p className="mt-1 text-xs text-white/70">{currentItem.city}</p>
                        )}
                        {currentItem.locationDetail && (
                          <a
                            href={currentItem.locationDetail}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-orange"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Open link
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {items.length > 1 && (
                <div className="mt-3 flex gap-2">
                  <AdminButton
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setItemIndex((i) => (i - 1 + items.length) % items.length)}
                  >
                    ← Prev
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setItemIndex((i) => (i + 1) % items.length)}
                  >
                    Next →
                  </AdminButton>
                </div>
              )}

              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {items.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setItemIndex(idx)}
                    className={`relative aspect-[3/4] overflow-hidden rounded-[var(--admin-radius)] border transition ${
                      idx === itemIndex
                        ? 'border-[var(--admin-accent)] ring-1 ring-[var(--admin-accent)]'
                        : 'border-[var(--admin-border)] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[9px] font-medium text-white line-clamp-2">
                      {item.title}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {list.description && (
          <div>
            <p className="admin-label mb-1">Description</p>
            <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
              {list.description}
            </p>
          </div>
        )}
      </div>
    </AdminDrawer>
  )
}

function buildPrivatePreview(list: BucketList): PublicBucketList {
  const refreshed = getBucketListById(list.id) ?? list
  return {
    id: refreshed.id,
    name: refreshed.name,
    ownerName: refreshed.ownerName ?? 'TUDU',
    ownerInitials: refreshed.ownerInitials ?? 'TU',
    coverImage:
      refreshed.coverImageUrl ??
      refreshed.customItems?.[0]?.image ??
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    description: refreshed.description ?? refreshed.name,
    region: refreshed.region,
    vibe: refreshed.vibe ?? 'Adventurous',
    itemCount: (refreshed.customItems?.length ?? 0) + refreshed.eventIds.length,
    completedCount: refreshed.completedIds.length,
    hasSoundtrack: Boolean(refreshed.spotifyUrl || refreshed.appleMusicUrl),
    events: [],
    seededByAdmin: refreshed.seededByAdmin,
  }
}
