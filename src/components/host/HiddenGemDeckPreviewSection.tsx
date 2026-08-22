import { Check } from 'lucide-react'
import { LANDING_DECK_HIDDEN_GEM_CARD } from '../../data/discoverEvents'
import LandingDeckCardPreview from '../landing/LandingDeckCardPreview'

/** ~200 km radius in miles (linear reach from home city). */
export const HIDDEN_GEM_REACH_KM = 200
export const HIDDEN_GEM_REACH_MI = 125

export const HIDDEN_GEM_REACH_NOTE = `Reach extends up to ${HIDDEN_GEM_REACH_KM} km (~${HIDDEN_GEM_REACH_MI} mi) from your home city.`

const REACH_BULLETS = [
  `Discover deck, search & saves within ${HIDDEN_GEM_REACH_KM} km (~${HIDDEN_GEM_REACH_MI} mi) of home`,
  'Post hours & menu on your listing',
  'Sell tickets through Tudu',
  'Distant saver outreach with promo codes',
] as const

type HiddenGemInfoAndPreviewProps = {
  compact?: boolean
  className?: string
}

/** What Hidden Gems are + sample deck card — used on subscription and admin preview. */
export function HiddenGemInfoAndPreview({
  compact = false,
  className = '',
}: HiddenGemInfoAndPreviewProps) {
  return (
    <div
      className={`grid gap-4 ${compact ? '' : 'sm:grid-cols-[1fr,min(280px,100%)] sm:items-start'} ${className}`}
    >
      <div>
        <p
          className={`text-brown-muted ${compact ? 'text-[10px] leading-snug' : 'text-xs leading-relaxed'}`}
        >
          Your org&apos;s place or business on Discover — an always-on deck card with a gold border.
          List your venue, post what you offer, and reach guests well beyond your neighborhood.
        </p>
        <ul className={`mt-3 space-y-1.5 ${compact ? 'text-[10px]' : 'text-xs'}`}>
          {REACH_BULLETS.map((line) => (
            <li key={line} className="flex items-start gap-1.5 text-brown-muted">
              <Check
                size={compact ? 11 : 13}
                className="mt-0.5 shrink-0 text-success"
                aria-hidden
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        {!compact && (
          <p className="mt-3 text-[10px] text-brown-muted/80">{HIDDEN_GEM_REACH_NOTE}</p>
        )}
      </div>

      <div className={compact ? 'mx-auto w-full max-w-[390px]' : 'mx-auto w-full max-w-[390px] sm:mx-0'}>
        <LandingDeckCardPreview event={LANDING_DECK_HIDDEN_GEM_CARD} />
      </div>
    </div>
  )
}

type HiddenGemDeckPreviewSectionProps = {
  compact?: boolean
  className?: string
}

/** Standalone preview block (admin tier preview). */
export default function HiddenGemDeckPreviewSection({
  compact = false,
  className = '',
}: HiddenGemDeckPreviewSectionProps) {
  return (
    <section
      className={`rounded-[14px] border border-app-subtle bg-cream-dark ${
        compact ? 'p-3' : 'p-4'
      } ${className}`}
    >
      <h3
        className={`font-display font-bold text-brown ${compact ? 'text-xs' : 'text-sm'}`}
      >
        Hidden Gems
      </h3>
      <div className={compact ? 'mt-2' : 'mt-3'}>
        <HiddenGemInfoAndPreview compact={compact} />
      </div>
    </section>
  )
}
