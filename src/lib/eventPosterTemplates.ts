export type EventPosterTemplateId = 'flyer' | 'table-tent' | 'half-sheet' | 'social'

export type EventPosterTemplate = {
  id: EventPosterTemplateId
  label: string
  description: string
  /** Screen preview aspect ratio (width / height). */
  aspectRatio: number
  printHint: string
}

export const EVENT_POSTER_TEMPLATES: EventPosterTemplate[] = [
  {
    id: 'flyer',
    label: 'Flyer',
    description: 'Letter-size poster for windows, bulletin boards, and handouts.',
    aspectRatio: 8.5 / 11,
    printHint: 'Print on 8.5×11 paper — portrait',
  },
  {
    id: 'table-tent',
    label: 'Table stand',
    description: 'Folded tent card for counters, registration, and merch tables.',
    aspectRatio: 8.5 / 11,
    printHint: 'Print on 8.5×11 — fold into a table tent',
  },
  {
    id: 'half-sheet',
    label: 'Half sheet',
    description: 'Compact flyer for quick posting and community boards.',
    aspectRatio: 5.5 / 8.5,
    printHint: 'Print two per letter page or on half-sheet stock',
  },
  {
    id: 'social',
    label: 'Social square',
    description: 'Square graphic for Instagram, Facebook, and digital screens.',
    aspectRatio: 1,
    printHint: 'Export square — great for social or square displays',
  },
]

export function getEventPosterTemplate(id: EventPosterTemplateId): EventPosterTemplate {
  return EVENT_POSTER_TEMPLATES.find((t) => t.id === id) ?? EVENT_POSTER_TEMPLATES[0]
}
