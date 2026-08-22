/** Official TUDU brand color tokens — single source of truth for tiers & categories. */

/** Matches `--color-electric-blue` in tokens.css */
export const ELECTRIC_BLUE = '#38bdf8'
/** Matches `--color-sunset-orange` in tokens.css — Pioneer org tier */
export const SUNSET_ORANGE = '#f97316'
/** Matches `--color-warm-yellow` in tokens.css — Hidden Gems category */
export const WARM_YELLOW = '#fbbf24'
/** Matches `--color-sunset-pink` in tokens.css */
export const SUNSET_PINK = '#f4729a'

export const BRAND_TOKENS = {
  user: {
    unverified: '#888780',
    verified: '#97C459',
    explorer: '#7F77DD',
  },
  org: {
    unverified: '#888780',
    verified: '#97C459',
    pioneer: SUNSET_ORANGE,
    trustedHost: ELECTRIC_BLUE,
  },
  category: {
    hiddenGems: WARM_YELLOW,
    partner: '#1D9E75',
    attractions: '#D4537E',
    outdoor: '#1F5C3D',
    secret: '#7A1F2B',
  },
  /** Platform deck fillers — Tudu internal use (see border legend). */
  tudu: {
    red: '#ef4444',
    teal: '#14b8a6',
    cyan: '#06b6d4',
    coral: SUNSET_PINK,
    /** Brand midnight — Tudu Black premium frame */
    black: '#0b0f1a',
    /** Metallic gold — pairs with Tudu Black; distinct from Hidden Gems warm yellow */
    premiumGold: '#d4af37',
  },
} as const

export type UserTierToken = keyof typeof BRAND_TOKENS.user
export type OrgTierToken = keyof typeof BRAND_TOKENS.org
export type CategoryToken = keyof typeof BRAND_TOKENS.category
export type TuduDeckToken = keyof typeof BRAND_TOKENS.tudu

/** CSS token names for docs / theming (matches design reference). */
export const BRAND_TOKEN_NAMES = {
  userUnverified: 'user-unverified',
  userVerified: 'user-verified',
  userExplorer: 'user-explorer',
  orgUnverified: 'org-unverified',
  orgPioneer: 'org-pioneer',
  orgTrustedHost: 'org-trusted-host',
  catHiddenGems: 'cat-hidden-gems',
  catPartner: 'cat-partner',
  catAttractions: 'cat-attractions',
  catOutdoor: 'cat-outdoor',
  catSecret: 'cat-secret',
} as const

/** Soft pill background + text color from a brand hex. */
export function pillStyleFromHex(hex: string, alpha = 0.18): {
  backgroundColor: string
  color: string
} {
  const normalized = hex.replace('#', '')
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})`,
    color: hex,
  }
}

export function userTierTokenColor(token: UserTierToken): string {
  return BRAND_TOKENS.user[token]
}

export function orgTierTokenColor(token: OrgTierToken): string {
  return BRAND_TOKENS.org[token]
}

export function categoryTokenColor(token: CategoryToken): string {
  return BRAND_TOKENS.category[token]
}

export function tuduDeckTokenColor(token: TuduDeckToken): string {
  return BRAND_TOKENS.tudu[token]
}
