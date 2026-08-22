import type { EventPosterTemplateId } from './eventPosterTemplates'

export type PosterTextBlockId =
  | 'brand'
  | 'title'
  | 'date'
  | 'location'
  | 'cta'
  | 'byline'
  | 'qr'

export type PosterTextBlock = {
  /** 0–100, from left */
  x: number
  /** 0–100, from top */
  y: number
  /** Size multiplier (default 1) */
  scale: number
  /** Whether the block appears on the poster */
  visible: boolean
}

/** @deprecated Use PosterTextBlock */
export type PosterTextPosition = Pick<PosterTextBlock, 'x' | 'y'>

export type PosterLayout = Record<PosterTextBlockId, PosterTextBlock>

export const POSTER_TEXT_BLOCK_IDS: PosterTextBlockId[] = [
  'brand',
  'title',
  'date',
  'location',
  'cta',
  'byline',
  'qr',
]

export const POSTER_BLOCK_LABELS: Record<PosterTextBlockId, string> = {
  brand: 'TUDU label',
  title: 'Title',
  date: 'Date & time',
  location: 'Location',
  cta: 'RSVP button',
  byline: 'Host byline',
  qr: 'QR code',
}

export const POSTER_SCALE_STEPS = [0.75, 1, 1.25, 1.5, 2] as const

function block(x: number, y: number): PosterTextBlock {
  return { x, y, scale: 1, visible: true }
}

const flyerDefaults: PosterLayout = {
  brand: block(6, 58),
  title: block(6, 66),
  date: block(6, 78),
  location: block(6, 84),
  cta: block(6, 91),
  byline: block(6, 96),
  qr: block(78, 78),
}

const socialDefaults: PosterLayout = {
  brand: block(6, 52),
  title: block(6, 60),
  date: block(6, 74),
  location: block(6, 80),
  cta: block(6, 88),
  byline: block(6, 94),
  qr: block(72, 72),
}

export const DEFAULT_POSTER_LAYOUTS: Record<EventPosterTemplateId, PosterLayout> = {
  flyer: flyerDefaults,
  'half-sheet': {
    ...flyerDefaults,
    title: block(6, 64),
  },
  'table-tent': {
    ...flyerDefaults,
    title: block(6, 28),
    date: block(6, 38),
    location: block(6, 44),
    cta: block(6, 50),
    brand: block(6, 20),
    qr: block(78, 32),
    byline: block(6, 92),
  },
  social: socialDefaults,
}

export function getDefaultPosterLayout(templateId: EventPosterTemplateId): PosterLayout {
  const base = DEFAULT_POSTER_LAYOUTS[templateId]
  return JSON.parse(JSON.stringify(base)) as PosterLayout
}

export function clampPosterPosition(value: number): number {
  return Math.min(92, Math.max(2, value))
}

export function formatPosterScale(scale: number): string {
  const step = POSTER_SCALE_STEPS.find((s) => s === scale)
  if (step != null) return `${step}×`
  return `${scale}×`
}

export function stepPosterScale(current: number, direction: 'up' | 'down'): number {
  const idx = POSTER_SCALE_STEPS.indexOf(current as (typeof POSTER_SCALE_STEPS)[number])
  const resolvedIdx = idx >= 0 ? idx : POSTER_SCALE_STEPS.indexOf(1)
  const next =
    direction === 'up'
      ? Math.min(resolvedIdx + 1, POSTER_SCALE_STEPS.length - 1)
      : Math.max(resolvedIdx - 1, 0)
  return POSTER_SCALE_STEPS[next]
}

export function canStepPosterScale(current: number, direction: 'up' | 'down'): boolean {
  return stepPosterScale(current, direction) !== current
}
