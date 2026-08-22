/** Editable labels for landing page deck card previews (Settings → Landing page rollout). */
export type LandingDeckPreviewCopyId = 'hiddenGem'

export const LANDING_DECK_PREVIEW_COPY_ORDER: LandingDeckPreviewCopyId[] = ['hiddenGem']

export const LANDING_DECK_PREVIEW_COPY_LABELS: Record<LandingDeckPreviewCopyId, string> = {
  hiddenGem: 'Hidden Gem deck preview',
}

export interface LandingDeckPreviewCopy {
  /** Heading above the sample deck card */
  label: string
  /** Short line below the sample deck card */
  caption: string
}

export type LandingDeckPreviewCopyConfig = Record<LandingDeckPreviewCopyId, LandingDeckPreviewCopy>

export const LANDING_ROLLOUT_CARDS_KEY = 'tudu-landing-rollout-cards'
export const LANDING_ROLLOUT_CARDS_CHANGED_EVENT = 'tudu-landing-rollout-cards-changed'

export const DEFAULT_LANDING_ROLLOUT_CARDS: LandingDeckPreviewCopyConfig = {
  hiddenGem: {
    label: 'Hidden Gems',
    caption: 'Gold deck border — full-time restaurants and entertainment with hours on the card.',
  },
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback
  } catch {
    return fallback
  }
}

function mergeCopy(
  base: LandingDeckPreviewCopy,
  patch: Partial<LandingDeckPreviewCopy & { accessLine?: string }> | undefined,
): LandingDeckPreviewCopy {
  if (!patch) return base
  return {
    label: patch.label?.trim() || base.label,
    caption: patch.caption?.trim() || patch.accessLine?.trim() || base.caption,
  }
}

export function getLandingRolloutCards(): LandingDeckPreviewCopyConfig {
  const raw = readJson<
    Partial<
      Record<
        LandingDeckPreviewCopyId,
        Partial<LandingDeckPreviewCopy & { accessLine?: string }>
      >
    >
  >(LANDING_ROLLOUT_CARDS_KEY, {})

  return {
    hiddenGem: mergeCopy(DEFAULT_LANDING_ROLLOUT_CARDS.hiddenGem, raw.hiddenGem),
  }
}

export function saveLandingRolloutCards(cards: LandingDeckPreviewCopyConfig): void {
  localStorage.setItem(LANDING_ROLLOUT_CARDS_KEY, JSON.stringify(cards))
  window.dispatchEvent(new Event(LANDING_ROLLOUT_CARDS_CHANGED_EVENT))
}

export function resetLandingRolloutCards(): LandingDeckPreviewCopyConfig {
  localStorage.removeItem(LANDING_ROLLOUT_CARDS_KEY)
  window.dispatchEvent(new Event(LANDING_ROLLOUT_CARDS_CHANGED_EVENT))
  return DEFAULT_LANDING_ROLLOUT_CARDS
}

/** @deprecated Use LandingDeckPreviewCopy */
export type LandingRolloutCard = LandingDeckPreviewCopy
/** @deprecated Use LandingDeckPreviewCopyId */
export type LandingRolloutCardId = LandingDeckPreviewCopyId
/** @deprecated Use LANDING_DECK_PREVIEW_COPY_ORDER */
export const LANDING_ROLLOUT_CARD_ORDER = LANDING_DECK_PREVIEW_COPY_ORDER
/** @deprecated Use LANDING_DECK_PREVIEW_COPY_LABELS */
export const LANDING_ROLLOUT_CARD_EDITOR_LABELS = LANDING_DECK_PREVIEW_COPY_LABELS
