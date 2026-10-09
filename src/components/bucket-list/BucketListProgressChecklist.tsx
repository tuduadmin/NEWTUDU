import { CheckCircle2, Circle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DiscoverEvent } from '../../data/discoverEvents'
import { bucketListProgress } from '../../lib/bucketListProgress'
import BucketListProgressRing from './BucketListProgressRing'

type BucketListProgressChecklistProps = {
  listId: string
  ownerLabel?: string
  events: DiscoverEvent[]
  completedIds: string[]
  completionPhotos?: Record<string, string>
  /** Hide header when progress is shown on the hero */
  compactHeader?: boolean
  /** Owner: tap proof thumbnail to change photos only */
  onProofPhotoClick?: (eventId: string) => void
  itemLink?: (eventId: string) => string
}

export default function BucketListProgressChecklist({
  listId,
  ownerLabel,
  events,
  completedIds,
  completionPhotos,
  compactHeader = false,
  onProofPhotoClick,
  itemLink,
}: BucketListProgressChecklistProps) {
  const linkFor = (eventId: string) =>
    itemLink ? itemLink(eventId) : `/bucket-list/${listId}/item/${eventId}`
  const { total, done } = bucketListProgress(events, completedIds)

  if (total === 0) return null

  return (
    <section className="mx-3 mb-4 rounded-[14px] border border-app-subtle bg-app-elevated p-4 shadow-sm">
      {!compactHeader && (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brown-muted">Checklist</p>
            <p className="font-display text-lg font-bold text-brown">
              {done} of {total} done
            </p>
            {ownerLabel && (
              <p className="mt-0.5 text-xs text-brown-muted">{ownerLabel}&apos;s progress</p>
            )}
          </div>
          <BucketListProgressRing done={done} total={total} size={56} />
        </div>
      )}

      {compactHeader && (
        <p className="text-[10px] font-bold uppercase tracking-wider text-brown-muted">Checklist</p>
      )}

      <ul className={`space-y-1 overflow-y-auto ${compactHeader ? 'mt-2 max-h-52' : 'mt-4 max-h-48'}`}>
        {events.map((event) => {
          const isDone = completedIds.includes(event.id)
          const proof = completionPhotos?.[event.id]
          return (
            <li key={event.id}>
              <div className="flex items-center gap-2 rounded-[12px] px-2 py-2 transition hover:bg-cream-dark/80">
                {isDone && onProofPhotoClick ? (
                  <button
                    type="button"
                    onClick={() => onProofPhotoClick(event.id)}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[8px] transition ${
                      proof ? 'ring-2 ring-success/40 hover:ring-orange/50' : 'bg-success/15 ring-2 ring-success/30 hover:ring-orange/50'
                    }`}
                    aria-label={`${proof ? 'Change' : 'Add'} proof photos for ${event.title}`}
                  >
                    {proof ? (
                      <img src={proof} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <CheckCircle2 size={18} className="text-success" aria-hidden />
                    )}
                  </button>
                ) : proof ? (
                  <img
                    src={proof}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-[8px] object-cover ring-2 ring-success/40"
                  />
                ) : (
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] ${
                      isDone ? 'bg-success/15 text-success' : 'bg-cream-dark text-brown-muted'
                    }`}
                  >
                    {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </span>
                )}
                <Link to={linkFor(event.id)} className="min-w-0 flex-1 no-underline">
                  <span
                    className={`block truncate text-sm font-semibold ${
                      isDone ? 'text-brown-muted line-through' : 'text-brown'
                    }`}
                  >
                    {event.title}
                  </span>
                  <span className="block truncate text-[11px] text-brown-muted">{event.city}</span>
                </Link>
              </div>
            </li>
          )
        })}
      </ul>

      <p className="mt-3 text-[11px] text-brown-muted">
        {onProofPhotoClick
          ? 'Tap a proof photo to update it. Tap the title for the full item page.'
          : 'Tap a row to view the item.'}
      </p>
    </section>
  )
}
