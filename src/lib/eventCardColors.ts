import { BRAND_TOKENS } from './brandTokens'

/** Partner tier accent — admin-seeded attraction cards. */
export const ADMIN_ATTRACTION_BORDER_COLOR = BRAND_TOKENS.category.attractions
export const ADMIN_SECRET_LIST_BORDER_COLOR = BRAND_TOKENS.category.secret

/** Discover deck card border tiers — thin 1px lines only (see docs/EVENT-CARD-COLORS.md). */
export type EventCardBorderType =
  | 'none'
  | 'grey'
  | 'green'
  | 'orange'
  | 'blue'
  | 'gold'
  | 'teal'
  | 'pink'
  | 'explorer'
  | 'partner'
  | 'outdoor'
  | 'secret'
  | 'unused'
  | 'red'
  | 'aqua'
  | 'cyan'
  | 'coral'
  | 'tuduBlack'
  | 'tuduGold'

export const EVENT_CARD_BORDER_CSS: Record<EventCardBorderType, string> = {
  none: 'rgba(255, 255, 255, 0.12)',
  grey: BRAND_TOKENS.user.unverified,
  green: BRAND_TOKENS.user.verified,
  explorer: BRAND_TOKENS.user.explorer,
  orange: BRAND_TOKENS.org.pioneer,
  blue: BRAND_TOKENS.org.trustedHost,
  gold: BRAND_TOKENS.category.hiddenGems,
  partner: BRAND_TOKENS.category.partner,
  teal: BRAND_TOKENS.user.verified,
  pink: BRAND_TOKENS.category.attractions,
  outdoor: BRAND_TOKENS.category.outdoor,
  secret: BRAND_TOKENS.category.secret,
  unused: '#FFFFFF',
  red: BRAND_TOKENS.tudu.red,
  aqua: BRAND_TOKENS.tudu.teal,
  cyan: BRAND_TOKENS.tudu.cyan,
  coral: BRAND_TOKENS.tudu.coral,
  tuduBlack: BRAND_TOKENS.tudu.black,
  tuduGold: BRAND_TOKENS.tudu.premiumGold,
}

export const EVENT_CARD_BORDER_LABELS: Record<
  EventCardBorderType,
  { label: string; description: string }
> = {
  none: { label: 'Neutral', description: 'Default card frame' },
  grey: { label: 'Unverified', description: 'Without phone verification' },
  green: { label: 'Verified', description: 'Phone verified' },
  explorer: { label: 'Explorer', description: 'Paid Explorer subscription' },
  teal: { label: 'Verified', description: 'Legacy alias — same as verified green' },
  pink: { label: 'Attractions', description: 'Platform deck filler — admin-seeded places' },
  partner: { label: 'Partner', description: 'Partner calendar and affiliate integrations' },
  orange: { label: 'Pioneer', description: 'Pioneer organization subscription' },
  blue: { label: 'Trusted Host', description: 'Trusted Host organization subscription' },
  gold: { label: 'Hidden Gems', description: 'Restaurants and entertainment listings' },
  outdoor: { label: 'Outdoor', description: 'Outdoor adventure deck filler' },
  secret: { label: 'Secret list', description: 'Secret list deck filler' },
  unused: { label: 'Unused', description: 'Reserved — no category assigned yet' },
  red: { label: 'Red', description: 'Platform deck filler — reserved slot' },
  aqua: { label: 'Teal', description: 'Platform deck filler — reserved slot' },
  cyan: { label: 'Cyan', description: 'Platform deck filler — reserved slot' },
  coral: { label: 'Coral', description: 'Platform deck filler — reserved slot' },
  tuduBlack: {
    label: 'Tudu Black',
    description: 'Premium black frame + gold hairline — personal or org',
  },
  tuduGold: {
    label: 'Tudu Gold',
    description: 'Premium gold frame — personal or org',
  },
}

export type EventCardBorderLegendItem = {
  type: EventCardBorderType
  label?: string
  description?: string
}

export type EventCardBorderLegendGroup = {
  title: string
  items: EventCardBorderLegendItem[]
}

export const EVENT_CARD_BORDER_LEGEND_GROUPS: EventCardBorderLegendGroup[] = [
  {
    title: 'User',
    items: [
      { type: 'grey', description: 'Personal hosts without phone verification' },
      { type: 'green', description: 'Personal hosts with phone verification' },
      { type: 'explorer' },
    ],
  },
  {
    title: 'Org',
    items: [
      { type: 'grey', description: 'Organizations pending approval or verification' },
      { type: 'green', description: 'Verified organization accounts' },
      { type: 'orange' },
      { type: 'blue' },
    ],
  },
  {
    title: 'Partner',
    items: [{ type: 'partner' }],
  },
  {
    title: 'Hidden Gems',
    items: [{ type: 'gold' }],
  },
  {
    title: 'Tudu (for now)',
    items: [
      { type: 'pink', description: 'Admin-seeded attractions to fill the Discover deck' },
      { type: 'outdoor' },
      { type: 'secret' },
      { type: 'unused' },
      { type: 'red' },
      { type: 'aqua' },
      { type: 'cyan' },
      { type: 'coral' },
    ],
  },
  {
    title: 'Tudu Black',
    items: [{ type: 'tuduBlack' }, { type: 'tuduGold' }],
  },
]

/** Tier borders for admin seed event form — name + color dot picker. */
export type SeedBorderPickerOption = {
  type: EventCardBorderType
  label: string
}

export type SeedBorderPickerGroup = {
  title: string
  options: SeedBorderPickerOption[]
}

export const SEED_BORDER_PICKER_GROUPS: SeedBorderPickerGroup[] = [
  {
    title: 'User',
    options: [
      { type: 'grey', label: 'Unverified' },
      { type: 'green', label: 'Verified' },
      { type: 'explorer', label: 'Explorer' },
    ],
  },
  {
    title: 'Org',
    options: [
      { type: 'grey', label: 'Unverified' },
      { type: 'green', label: 'Verified' },
      { type: 'orange', label: 'Pioneer' },
      { type: 'blue', label: 'Trusted Host' },
    ],
  },
]

export function getSeedBorderOptionLabel(type: EventCardBorderType): string {
  for (const group of SEED_BORDER_PICKER_GROUPS) {
    const match = group.options.find((option) => option.type === type)
    if (match) return match.label
  }
  return EVENT_CARD_BORDER_LABELS[type]?.label ?? type
}

export const EVENT_CARD_BORDER_LEGEND: EventCardBorderType[] = EVENT_CARD_BORDER_LEGEND_GROUPS.flatMap(
  (group) => group.items.map((item) => item.type),
)

/** Display hex for legend rows (uppercase #RRGGBB). */
export function formatBorderColorCode(cssColor: string): string {
  return cssColor.startsWith('#') ? cssColor.toUpperCase() : cssColor
}

/** Legacy discoverEvents borderColor values → canonical border type. */
export function normalizeBorderType(
  value?: string | EventCardBorderType,
): EventCardBorderType {
  switch (value) {
    case 'green':
    case 'grey':
    case 'orange':
    case 'blue':
    case 'gold':
    case 'teal':
    case 'pink':
    case 'explorer':
    case 'partner':
    case 'outdoor':
    case 'secret':
    case 'unused':
    case 'red':
    case 'aqua':
    case 'cyan':
    case 'coral':
    case 'tuduBlack':
    case 'tuduGold':
    case 'none':
      return value === 'none' ? 'green' : value
    case 'yellow':
      return 'gold'
    default:
      return 'green'
  }
}

export type BorderStyle = { border: string; boxShadow?: string }

export function getDiscoverCardBorderStyle(
  borderType: EventCardBorderType,
  options?: { widthPx?: number },
): BorderStyle {
  const widthPx = options?.widthPx ?? 1
  const color = EVENT_CARD_BORDER_CSS[borderType]
  if (borderType === 'none') {
    return { border: `${widthPx}px solid rgba(255, 255, 255, 0.12)` }
  }
  if (borderType === 'tuduBlack') {
    return {
      border: `${widthPx}px solid ${BRAND_TOKENS.tudu.black}`,
      boxShadow: `0 0 0 ${widthPx}px ${BRAND_TOKENS.tudu.premiumGold}`,
    }
  }
  return { border: `${widthPx}px solid ${color}` }
}

/** Full-frame border for opened discover detail — inset shadow stays visible on all sides. */
export function getDiscoverCardDetailFrameStyle(
  borderType: EventCardBorderType,
  widthPx = 2,
): { boxShadow: string } {
  const outerShadow = '0 12px 40px rgba(0, 0, 0, 0.55)'
  const color = EVENT_CARD_BORDER_CSS[borderType]
  if (borderType === 'none') {
    return {
      boxShadow: `inset 0 0 0 ${widthPx}px rgba(255, 255, 255, 0.12), ${outerShadow}`,
    }
  }
  if (borderType === 'tuduBlack') {
    return {
      boxShadow: `inset 0 0 0 ${widthPx}px ${BRAND_TOKENS.tudu.black}, inset 0 0 0 ${widthPx * 2}px ${BRAND_TOKENS.tudu.premiumGold}, ${outerShadow}`,
    }
  }
  return {
    boxShadow: `inset 0 0 0 ${widthPx}px ${color}, ${outerShadow}`,
  }
}

/** Swatch + accent styles for admin border legend boxes. */
export function getBorderLegendAccentStyle(borderType: EventCardBorderType): {
  accent: string
  swatch: { backgroundColor: string; boxShadow?: string }
} {
  if (borderType === 'tuduBlack') {
    return {
      accent: BRAND_TOKENS.tudu.premiumGold,
      swatch: {
        backgroundColor: BRAND_TOKENS.tudu.black,
        boxShadow: `0 0 0 1px ${BRAND_TOKENS.tudu.premiumGold}`,
      },
    }
  }
  const color = EVENT_CARD_BORDER_CSS[borderType]
  return {
    accent: color,
    swatch: { backgroundColor: color },
  }
}

export const CATEGORY_TOKEN_COLORS = BRAND_TOKENS.category
