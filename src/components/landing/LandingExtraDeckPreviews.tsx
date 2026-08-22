import type { DiscoverEvent } from '../../data/discoverEvents'
import {
  LANDING_DECK_ATTRACTION_CARD,
  LANDING_DECK_HIDDEN_GEM_CARD,
} from '../../data/discoverEvents'
import type { LandingRolloutFlags } from '../../lib/adminSettings'
import { getLandingRolloutCards } from '../../lib/landingRolloutCards'
import type { LandingDeckPreviewCopy } from '../../lib/landingRolloutCards'
import LandingDeckCardPreview from './LandingDeckCardPreview'

const ATTRACTION_PREVIEW_COPY = {
  label: 'Attractions',
  caption: 'Partner-pink border — always-on landmarks and trails curated for the deck.',
}

function DeckPreviewBlock({
  copy,
  event,
}: {
  copy: LandingDeckPreviewCopy
  event: DiscoverEvent
}) {
  return (
    <div className="space-y-3">
      <p className="text-center font-display text-xs font-bold uppercase tracking-wider text-white/60">
        {copy.label}
      </p>
      <LandingDeckCardPreview event={event} />
      <p className="text-center text-sm leading-relaxed text-white/72">{copy.caption}</p>
    </div>
  )
}

/** Hidden Gem + Attractions deck samples — below the featured Trusted Host card. */
export default function LandingExtraDeckPreviews({ flags }: { flags: LandingRolloutFlags }) {
  const copy = getLandingRolloutCards()

  const showHiddenGem = flags.landingHiddenGems
  const showAttractions = flags.landingAttractions

  if (!showHiddenGem && !showAttractions) return null

  return (
    <div className="space-y-12 border-t border-white/10 pt-12">
      {showHiddenGem && (
        <DeckPreviewBlock copy={copy.hiddenGem} event={LANDING_DECK_HIDDEN_GEM_CARD} />
      )}
      {showAttractions && (
        <DeckPreviewBlock copy={ATTRACTION_PREVIEW_COPY} event={LANDING_DECK_ATTRACTION_CARD} />
      )}
    </div>
  )
}
