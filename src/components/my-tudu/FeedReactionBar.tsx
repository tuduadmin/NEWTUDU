import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import {
  FEED_REACTION_ORDER,
  FEED_REACTIONS,
  type FeedReactionId,
} from '../../data/feedReactions'
import {
  FEED_REACTIONS_CHANGED_EVENT,
  getFeedReactionSummary,
  toggleFeedReaction,
} from '../../lib/feedReactions'

type FeedReactionBarProps = {
  targetKey: string
  viewerEmail: string
  onChange?: () => void
}

export default function FeedReactionBar({
  targetKey,
  viewerEmail,
  onChange,
}: FeedReactionBarProps) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    function refresh(event: Event) {
      const detail = (event as CustomEvent<{ targetKey?: string }>).detail
      if (detail?.targetKey && detail.targetKey !== targetKey) return
      setTick((value) => value + 1)
    }
    window.addEventListener(FEED_REACTIONS_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(FEED_REACTIONS_CHANGED_EVENT, refresh)
  }, [targetKey])

  const summary = useMemo(() => {
    void tick
    return getFeedReactionSummary(targetKey, viewerEmail)
  }, [targetKey, viewerEmail, tick])

  function handleToggle(reactionId: FeedReactionId, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    event.preventDefault()
    toggleFeedReaction(targetKey, reactionId, viewerEmail)
    onChange?.()
  }

  return (
    <div
      className="border-t border-brown/10 px-3 py-2"
      role="group"
      aria-label="React with a Tuduan"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex w-full overflow-hidden rounded-[12px] border border-brown/15 bg-cream/40">
        {FEED_REACTION_ORDER.map((reactionId, index) => {
          const def = FEED_REACTIONS[reactionId]
          const count = summary.counts[reactionId]
          const active = summary.userReaction === reactionId
          const isLast = index === FEED_REACTION_ORDER.length - 1

          return (
            <button
              key={reactionId}
              type="button"
              onClick={(event) => handleToggle(reactionId, event)}
              aria-pressed={active}
              aria-label={`${def.label} — ${def.tuduanName}${count > 0 ? `, ${count} reactions` : ''}`}
              title={`${def.tuduanName}: ${def.label}`}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 transition active:scale-[0.98] ${
                !isLast ? 'border-r border-brown/15' : ''
              } ${active ? 'shadow-inner' : 'hover:bg-white/50'}`}
              style={{
                backgroundColor: active ? `${def.color}24` : undefined,
                color: def.color,
              }}
            >
              <span className="text-sm leading-none" aria-hidden>
                {def.motif}
              </span>
              <span className="max-w-full truncate text-[8px] font-bold leading-tight tracking-tight">
                {def.shortLabel}
              </span>
              {count > 0 && (
                <span className="text-[9px] font-bold tabular-nums leading-none opacity-90">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
