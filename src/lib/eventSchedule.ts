import type { HostEvent, HostEventFormData, RepeatPattern } from './account'

/** Per-date schedule row — copied from template when multi-picking days. */
export type EventOccurrence = {
  /** Start date (or sole date for single-day rows). */
  date: string
  /** When set and different from date, one contiguous block (one ticket / one event). */
  dateEnd?: string
  /** Optional label — e.g. "Opening day", "Finals". */
  label?: string
  /** Repeat mode: when true (default for added days), times mirror the template day. */
  timeLocked?: boolean
  startHour: string
  startMinute: string
  startPeriod: 'AM' | 'PM'
  endHour: string
  endMinute: string
  endPeriod: 'AM' | 'PM'
  allDay: boolean
}

/** Top-level schedule UX mode in create-event step. */
export type ScheduleMode = 'single' | 'multiple' | 'seasonal'

export const SCHEDULE_MODE_OPTIONS: {
  id: ScheduleMode
  label: string
  sub: string
  disabled?: boolean
}[] = [
  { id: 'single', label: 'Single day', sub: 'One date, optional extra days' },
  { id: 'multiple', label: 'Multiple day', sub: 'Pick days or drag a range' },
  { id: 'seasonal', label: 'Seasonal', sub: 'Coming soon', disabled: true },
]

/** Host repeat UX mode in create-event schedule step. */
export type ScheduleRepeatMode = 'none' | 'pattern' | 'multi_pick'

/** How the event spans time — drives date inputs and card face. */
export type DayShape = 'one_day' | 'block' | 'pick_dates'

/** @deprecated — migrated to dayShape on read. */
export type ScheduleType = 'single' | 'multi_day'

/** Legacy values stored in older events — migrated on read. */
export type LegacyScheduleType =
  | 'recurring_series'
  | 'multi_date'
  | 'recurring_multi_day'
  | 'seasonal'

export const DAY_SHAPE_OPTIONS: {
  id: DayShape
  label: string
  sub: string
}[] = [
  { id: 'one_day', label: 'One day', sub: 'Single date' },
  { id: 'block', label: 'Block of days', sub: 'First → last' },
  { id: 'pick_dates', label: 'Pick dates', sub: 'Specific dates' },
]

/** @deprecated — use DAY_SHAPE_OPTIONS */
export const SCHEDULE_TYPE_OPTIONS = DAY_SHAPE_OPTIONS.map((o) => ({
  id: o.id === 'one_day' ? 'single' : o.id === 'block' ? 'multi_day' : ('pick_dates' as const),
  label: o.label,
  sub: o.sub,
}))

/** Repeat options shown in create-event schedule step (excludes daily). */
export const SCHEDULE_REPEAT_OPTIONS: {
  value: RepeatPattern
  label: string
}[] = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
]

const RECURRING_REPEAT_PATTERNS: RepeatPattern[] = ['weekly', 'biweekly', 'monthly']

export type TicketScope = 'per_occurrence'

type ScheduleLike = Partial<
  Pick<
    HostEvent,
    | 'dayShape'
    | 'eventType'
    | 'repeats'
    | 'repeatsWeekly'
    | 'weeksOnDeck'
    | 'sellTicketsPerDay'
    | 'advancedTicketSales'
    | 'eventDate'
    | 'recurrenceStartDate'
    | 'recurrenceEndDate'
    | 'seriesEndDate'
    | 'seasonStartDate'
    | 'seasonEndDate'
    | 'multiDates'
    | 'recurrenceCount'
    | 'occurrences'
    | 'scheduleRepeatMode'
    | 'scheduleMode'
    | 'scheduleTimeSlots'
    | 'startHour'
    | 'startMinute'
    | 'startPeriod'
    | 'endHour'
    | 'endMinute'
    | 'endPeriod'
    | 'allDay'
  >
> & {
  /** May be legacy value on read — use inferDayShape to normalize. */
  scheduleType?: ScheduleType | LegacyScheduleType
  scheduleMode?: ScheduleMode
}

/** Build a template occurrence from primary date/time fields. */
export function templateFromScheduleFields(
  source: Pick<
    ScheduleLike,
    | 'eventDate'
    | 'startHour'
    | 'startMinute'
    | 'startPeriod'
    | 'endHour'
    | 'endMinute'
    | 'endPeriod'
    | 'allDay'
  >,
): Omit<EventOccurrence, 'date'> {
  return {
    startHour: source.startHour ?? '12',
    startMinute: source.startMinute ?? '00',
    startPeriod: source.startPeriod ?? 'PM',
    endHour: source.endHour ?? '02',
    endMinute: source.endMinute ?? '00',
    endPeriod: source.endPeriod ?? 'PM',
    allDay: source.allDay ?? false,
  }
}

export function isRangeOccurrence(occ: EventOccurrence): boolean {
  return !!occ.dateEnd && occ.dateEnd !== occ.date
}

/** Map stored 12h fields to `<input type="time">` value (24h HH:MM). */
export function time12ToInputValue(
  hour: string,
  minute: string,
  period: 'AM' | 'PM',
): string {
  let h = parseInt(hour || '12', 10)
  const m = parseInt(minute || '0', 10)
  if (Number.isNaN(h)) h = 12
  const safeM = Number.isNaN(m) ? 0 : Math.min(59, Math.max(0, m))
  if (period === 'AM') {
    if (h === 12) h = 0
  } else if (h !== 12) {
    h += 12
  }
  return `${String(h).padStart(2, '0')}:${String(safeM).padStart(2, '0')}`
}

/** Map `<input type="time">` value (24h HH:MM) to stored 12h fields. */
export function timeInputValueTo12(value: string): {
  hour: string
  minute: string
  period: 'AM' | 'PM'
} {
  const [hStr, mStr] = value.split(':')
  const h24 = parseInt(hStr ?? '0', 10)
  const m = parseInt(mStr ?? '0', 10)
  const safeH24 = Number.isNaN(h24) ? 0 : Math.min(23, Math.max(0, h24))
  const safeM = Number.isNaN(m) ? 0 : Math.min(59, Math.max(0, m))
  const period: 'AM' | 'PM' = safeH24 >= 12 ? 'PM' : 'AM'
  let h12 = safeH24 % 12
  if (h12 === 0) h12 = 12
  return {
    hour: String(h12),
    minute: String(safeM).padStart(2, '0'),
    period,
  }
}

export function formatOccurrenceDateLabel(occ: EventOccurrence): string {
  if (isRangeOccurrence(occ)) {
    return formatBlockDateRange(occ.date, occ.dateEnd!)
  }
  return formatShortDate(occ.date)
}

export function occurrenceFromTemplate(
  date: string,
  template: Omit<EventOccurrence, 'date' | 'dateEnd'>,
  extras?: Pick<EventOccurrence, 'dateEnd' | 'label' | 'timeLocked'>,
): EventOccurrence {
  return { date, ...template, ...extras }
}

export function getOccurrenceTimeFields(
  occ: Pick<
    EventOccurrence,
    'startHour' | 'startMinute' | 'startPeriod' | 'endHour' | 'endMinute' | 'endPeriod' | 'allDay'
  >,
): Pick<
  EventOccurrence,
  'startHour' | 'startMinute' | 'startPeriod' | 'endHour' | 'endMinute' | 'endPeriod' | 'allDay'
> {
  return {
    startHour: occ.startHour,
    startMinute: occ.startMinute,
    startPeriod: occ.startPeriod,
    endHour: occ.endHour,
    endMinute: occ.endMinute,
    endPeriod: occ.endPeriod,
    allDay: occ.allDay,
  }
}

/** Copy template times onto repeat days that stay locked. */
export function syncLockedOccurrenceTimes(
  occurrences: EventOccurrence[],
  primaryDate: string,
): EventOccurrence[] {
  const primary = occurrences.find((o) => o.date === primaryDate && !isRangeOccurrence(o))
  if (!primary) return occurrences
  const timeFields = getOccurrenceTimeFields(primary)
  return occurrences.map((o) => {
    if (o.date === primaryDate) return o
    if (o.timeLocked === false) return o
    return { ...o, ...timeFields, timeLocked: o.timeLocked ?? true }
  })
}

export function occurrenceFromRange(
  dateStart: string,
  dateEnd: string,
  template: Omit<EventOccurrence, 'date' | 'dateEnd'>,
  label?: string,
): EventOccurrence {
  return { date: dateStart, dateEnd, ...template, label }
}

export function occurrencesFromDates(
  dates: string[],
  template: Omit<EventOccurrence, 'date'>,
): EventOccurrence[] {
  return [...new Set(dates.filter(Boolean))].sort().map((date) => occurrenceFromTemplate(date, template))
}

/** Multiple schedule rows on the same calendar day (different start/end times). */
export function hasSameDayTimeSlots(occurrences: EventOccurrence[]): boolean {
  const rows = occurrences.filter((o) => o.date && !isRangeOccurrence(o))
  if (rows.length <= 1) return false
  const dates = new Set(rows.map((o) => o.date))
  return dates.size === 1
}

function occurrenceStartSortKey(occ: EventOccurrence): number {
  const h = parseInt(occ.startHour, 10)
  if (Number.isNaN(h)) return 0
  let hours = h % 12
  if (occ.startPeriod === 'PM') hours += 12
  if (occ.startPeriod === 'AM' && h === 12) hours = 0
  const m = parseInt(occ.startMinute, 10)
  return hours * 60 + (Number.isNaN(m) ? 0 : m)
}

export function inferScheduleTimeSlots(
  source: Pick<ScheduleLike, 'scheduleTimeSlots' | 'occurrences' | 'scheduleMode' | 'scheduleRepeatMode'>,
): boolean {
  if (source.scheduleTimeSlots) return true
  if ((source.scheduleMode ?? inferScheduleMode(source)) !== 'single') return false
  if (source.scheduleRepeatMode === 'multi_pick') return false
  return hasSameDayTimeSlots(source.occurrences ?? [])
}

export function inferScheduleMode(source: ScheduleLike): ScheduleMode {
  if (
    source.scheduleMode === 'single' ||
    source.scheduleMode === 'multiple' ||
    source.scheduleMode === 'seasonal'
  ) {
    return source.scheduleMode
  }

  const raw = source.scheduleType
  if (raw === 'seasonal' || source.eventType === 'seasonal') return 'seasonal'

  const dayShape = source.dayShape
  const repeatMode = inferScheduleRepeatMode(source)
  const occurrences = (source.occurrences ?? []).filter((o) => o.date)

  if (occurrences.some(isRangeOccurrence)) return 'multiple'
  if (dayShape === 'block') return 'multiple'
  if (dayShape === 'pick_dates') {
    if (repeatMode === 'multi_pick' && occurrences.length <= 1 && source.eventDate) {
      return 'single'
    }
    return 'multiple'
  }
  if (repeatMode === 'multi_pick' && occurrences.length > 1) return 'single'
  if (source.advancedTicketSales || raw === 'multi_date') return 'multiple'
  return 'single'
}

export function inferScheduleRepeatMode(source: ScheduleLike): ScheduleRepeatMode {
  if (
    source.scheduleRepeatMode === 'pattern' ||
    source.scheduleRepeatMode === 'multi_pick' ||
    source.scheduleRepeatMode === 'none'
  ) {
    return source.scheduleRepeatMode
  }

  if (
    source.dayShape === 'pick_dates' ||
    source.advancedTicketSales ||
    source.scheduleType === 'multi_date'
  ) {
    return 'multi_pick'
  }
  if (source.repeats && source.repeats !== 'none') return 'pattern'
  if (source.repeatsWeekly === true) return 'pattern'
  const raw = source.scheduleType
  if (raw === 'recurring_series' || raw === 'recurring_multi_day') return 'pattern'
  const legacyDates = (source.multiDates ?? []).filter(Boolean)
  if (legacyDates.length > 1) return 'multi_pick'
  return 'none'
}

/** Effective occurrence list — prefers stored rows, falls back to legacy fields. */
export function getEffectiveOccurrences(source: ScheduleLike): EventOccurrence[] {
  const stored = (source.occurrences ?? []).filter((o) => o.date)
  if (stored.length > 0) {
    return [...stored].sort((a, b) => {
      const cmp = a.date.localeCompare(b.date)
      if (cmp !== 0) return cmp
      const rangeCmp = (a.dateEnd ?? a.date).localeCompare(b.dateEnd ?? b.date)
      if (rangeCmp !== 0) return rangeCmp
      return occurrenceStartSortKey(a) - occurrenceStartSortKey(b)
    })
  }

  const template = templateFromScheduleFields(source)

  if (source.scheduleRepeatMode === 'multi_pick') {
    const dates = (source.multiDates ?? []).filter(Boolean)
    if (dates.length > 0) return occurrencesFromDates(dates, template)
  }

  if (source.dayShape === 'pick_dates') {
    const dates = (source.multiDates ?? []).filter(Boolean)
    if (dates.length > 0) return occurrencesFromDates(dates, template)
  }

  if (source.dayShape === 'block' && source.eventDate && source.recurrenceEndDate) {
    return occurrencesFromDates(
      enumerateDateRange(source.eventDate, source.recurrenceEndDate),
      template,
    )
  }

  if (source.advancedTicketSales || source.scheduleType === 'multi_date') {
    const dates = (source.multiDates ?? []).filter(Boolean)
    if (dates.length > 0) return occurrencesFromDates(dates, template)
  }

  const legacyDates = (source.multiDates ?? []).filter(Boolean)
  if (legacyDates.length > 1) return occurrencesFromDates(legacyDates, template)

  if (source.eventDate) {
    return [occurrenceFromTemplate(source.eventDate, template)]
  }

  return []
}

export function areDatesContiguous(sortedDates: string[]): boolean {
  if (sortedDates.length < 2) return false
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = parseLocalDate(sortedDates[i - 1])
    const curr = parseLocalDate(sortedDates[i])
    if (daysBetween(prev, curr) !== 1) return false
  }
  return true
}

/** Migrate legacy dayShape / multiDates / block into occurrences + repeat mode. */
export function migrateOccurrencesFromLegacy(source: ScheduleLike): {
  occurrences: EventOccurrence[]
  scheduleRepeatMode: ScheduleRepeatMode
} {
  const existing = (source.occurrences ?? []).filter((o) => o.date)
  if (existing.length > 0) {
    return {
      occurrences: [...existing].sort((a, b) => a.date.localeCompare(b.date)),
      scheduleRepeatMode: inferScheduleRepeatMode(source),
    }
  }

  const template = templateFromScheduleFields(source)
  const dayShape =
    source.dayShape ??
    (source.scheduleType === 'multi_day'
      ? 'block'
      : source.advancedTicketSales || source.scheduleType === 'multi_date'
        ? 'pick_dates'
        : 'one_day')
  const repeats = inferRepeats(source)

  if (dayShape === 'pick_dates') {
    const dates = (source.multiDates ?? []).filter(Boolean)
    return {
      occurrences: occurrencesFromDates(
        dates.length > 0 ? dates : source.eventDate ? [source.eventDate] : [],
        template,
      ),
      scheduleRepeatMode: 'multi_pick',
    }
  }

  if (dayShape === 'block' && source.eventDate && source.recurrenceEndDate) {
    return {
      occurrences: occurrencesFromDates(
        enumerateDateRange(source.eventDate, source.recurrenceEndDate),
        template,
      ),
      scheduleRepeatMode: 'none',
    }
  }

  if (repeats !== 'none' && source.eventDate) {
    return {
      occurrences: [occurrenceFromTemplate(source.eventDate, template)],
      scheduleRepeatMode: 'pattern',
    }
  }

  if (source.eventDate) {
    return {
      occurrences: [occurrenceFromTemplate(source.eventDate, template)],
      scheduleRepeatMode: 'none',
    }
  }

  return { occurrences: [], scheduleRepeatMode: 'none' }
}

export function groupDatesIntoOccurrences(
  dates: string[],
  template: Omit<EventOccurrence, 'date' | 'dateEnd'>,
  existingOccurrences: EventOccurrence[] = [],
): EventOccurrence[] {
  const sorted = [...new Set(dates.filter(Boolean))].sort()
  if (sorted.length === 0) return []

  const existingByDate = new Map<string, EventOccurrence>()
  for (const occ of existingOccurrences) {
    for (const d of expandOccurrenceDates([occ])) {
      if (!existingByDate.has(d)) existingByDate.set(d, occ)
    }
  }

  const result: EventOccurrence[] = []
  let runStart = sorted[0]
  let runEnd = sorted[0]

  const flush = (start: string, end: string) => {
    if (start === end) {
      const prior = existingByDate.get(start)
      const timeTemplate = prior ? getOccurrenceTimeFields(prior) : template
      if (prior && !isRangeOccurrence(prior)) {
        result.push({ ...prior, date: start, dateEnd: undefined })
      } else {
        result.push(occurrenceFromTemplate(start, timeTemplate))
      }
      return
    }
    const prior = existingByDate.get(start) ?? existingByDate.get(end)
    const timeTemplate = prior ? getOccurrenceTimeFields(prior) : template
    result.push(occurrenceFromRange(start, end, timeTemplate))
  }

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    if (areDatesContiguous([prev, curr])) {
      runEnd = curr
    } else {
      flush(runStart, runEnd)
      runStart = curr
      runEnd = curr
    }
  }
  flush(runStart, runEnd)
  return result
}

export function expandOccurrenceDates(occurrences: EventOccurrence[]): string[] {
  const dates: string[] = []
  for (const occ of occurrences) {
    if (isRangeOccurrence(occ)) {
      dates.push(...enumerateDateRange(occ.date, occ.dateEnd!))
    } else {
      dates.push(occ.date)
    }
  }
  return [...new Set(dates.filter(Boolean))].sort()
}

/** Sync derived legacy fields from schedule form state. */
export function syncDerivedScheduleFields(
  form: Pick<
    HostEventFormData,
    | 'eventDate'
    | 'occurrences'
    | 'scheduleMode'
    | 'scheduleRepeatMode'
    | 'repeats'
    | 'startHour'
    | 'startMinute'
    | 'startPeriod'
    | 'endHour'
    | 'endMinute'
    | 'endPeriod'
    | 'allDay'
  >,
): Pick<HostEventFormData, 'dayShape' | 'scheduleType' | 'multiDates' | 'recurrenceEndDate'> {
  const mode = form.scheduleMode ?? inferScheduleMode(form)
  const repeatMode = form.scheduleRepeatMode
  const occurrences = getEffectiveOccurrences(form)
  const dates = expandOccurrenceDates(occurrences)
  const rangeOcc = occurrences.find(isRangeOccurrence)

  if (repeatMode === 'pattern' || (form.repeats !== 'none' && repeatMode !== 'multi_pick')) {
    return {
      dayShape: 'one_day',
      scheduleType: 'single',
      multiDates: form.eventDate ? [form.eventDate] : [],
      recurrenceEndDate: '',
    }
  }

  if (mode === 'multiple') {
    if (rangeOcc) {
      return {
        dayShape: 'block',
        scheduleType: 'multi_day',
        multiDates: dates,
        recurrenceEndDate: rangeOcc.dateEnd ?? rangeOcc.date,
      }
    }
    if (dates.length > 1) {
      if (areDatesContiguous(dates)) {
        return {
          dayShape: 'block',
          scheduleType: 'multi_day',
          multiDates: dates,
          recurrenceEndDate: dates[dates.length - 1],
        }
      }
      return {
        dayShape: 'pick_dates',
        scheduleType: 'single',
        multiDates: dates,
        recurrenceEndDate: '',
      }
    }
  }

  if (mode === 'single' && repeatMode === 'multi_pick' && dates.length > 1) {
    return {
      dayShape: 'pick_dates',
      scheduleType: 'single',
      multiDates: dates,
      recurrenceEndDate: '',
    }
  }

  if (dates.length > 1) {
    if (areDatesContiguous(dates)) {
      return {
        dayShape: 'block',
        scheduleType: 'multi_day',
        multiDates: dates,
        recurrenceEndDate: dates[dates.length - 1],
      }
    }
    return {
      dayShape: 'pick_dates',
      scheduleType: 'single',
      multiDates: dates,
      recurrenceEndDate: '',
    }
  }

  return {
    dayShape: 'one_day',
    scheduleType: 'single',
    multiDates: form.eventDate ? [form.eventDate] : [],
    recurrenceEndDate: rangeOcc?.dateEnd ?? '',
  }
}

function isLegacyScheduleType(value: string | undefined): value is LegacyScheduleType {
  return (
    value === 'recurring_series' ||
    value === 'multi_date' ||
    value === 'recurring_multi_day' ||
    value === 'seasonal'
  )
}

/** Infer dayShape from stored value or legacy scheduleType / advancedTicketSales. */
export function inferDayShape(source: ScheduleLike): DayShape {
  if (source.dayShape === 'one_day' || source.dayShape === 'block' || source.dayShape === 'pick_dates') {
    // Re-derive when occurrences present — contiguous multi-day → block for card face
    const dates = getEffectiveOccurrences(source).map((o) => o.date).sort()
    if (dates.length > 1) {
      if (inferScheduleRepeatMode(source) === 'multi_pick' && !areDatesContiguous(dates)) {
        return 'pick_dates'
      }
      if (areDatesContiguous(dates)) return 'block'
      return 'pick_dates'
    }
    if (source.dayShape === 'block' && dates.length <= 1) return 'one_day'
    return source.dayShape
  }

  const repeatMode = source.scheduleRepeatMode
  const dates = getEffectiveOccurrences(source).map((o) => o.date).sort()
  if (dates.length > 1) {
    if (repeatMode === 'multi_pick' && !areDatesContiguous(dates)) return 'pick_dates'
    if (areDatesContiguous(dates)) return 'block'
    return 'pick_dates'
  }

  if (source.advancedTicketSales || source.scheduleType === 'multi_date') {
    return 'pick_dates'
  }

  const raw = source.scheduleType
  if (raw === 'multi_day') return 'block'
  if (raw === 'single') return 'one_day'
  if (raw && isLegacyScheduleType(raw)) {
    if (raw === 'recurring_multi_day' || raw === 'seasonal') return 'block'
    return 'one_day'
  }
  if (source.eventType === 'seasonal') return 'block'
  if (source.eventType === 'multi-day') return 'block'

  const legacyDates = (source.multiDates ?? []).filter(Boolean)
  if (legacyDates.length > 1) return 'pick_dates'

  return 'one_day'
}

/** @deprecated — use inferDayShape */
export function inferScheduleType(source: ScheduleLike): ScheduleType {
  const shape = inferDayShape(source)
  return shape === 'block' ? 'multi_day' : 'single'
}

/** Derive sellTicketsPerDay from new flag or legacy advancedTicketSales. */
export function inferSellTicketsPerDay(source: ScheduleLike): boolean {
  if (source.sellTicketsPerDay != null) return source.sellTicketsPerDay
  if (source.advancedTicketSales != null) return source.advancedTicketSales
  if (source.scheduleType === 'multi_date') return true
  const dates = (source.multiDates ?? []).filter(Boolean)
  return inferDayShape(source) === 'pick_dates' && dates.length > 1
}

/** @deprecated — use inferSellTicketsPerDay */
export function inferAdvancedTicketSales(source: ScheduleLike): boolean {
  return inferSellTicketsPerDay(source)
}

/** Derive repeat pattern from repeats field or legacy repeatsWeekly / scheduleType. */
export function inferRepeats(source: ScheduleLike): RepeatPattern {
  if (source.scheduleRepeatMode === 'multi_pick') return 'none'
  if (inferDayShape(source) === 'pick_dates') return 'none'

  if (source.repeats && source.repeats !== 'none') {
    if (RECURRING_REPEAT_PATTERNS.includes(source.repeats)) return source.repeats
    if (source.repeats === 'daily') return 'weekly'
  }
  if (source.repeatsWeekly === true) return 'weekly'
  const raw = source.scheduleType
  if (raw === 'recurring_series' || raw === 'recurring_multi_day') return 'weekly'
  return 'none'
}

/** Whether the event repeats on a schedule (weekly, biweekly, or monthly). */
export function inferRepeatsWeekly(source: ScheduleLike): boolean {
  return inferRepeats(source) !== 'none'
}

/** Derive occurrence count from weeksOnDeck or legacy recurrenceCount / date span. */
export function inferWeeksOnDeck(source: ScheduleLike): number {
  if (source.weeksOnDeck != null && source.weeksOnDeck >= 1) return source.weeksOnDeck
  if (source.recurrenceCount != null && source.recurrenceCount >= 1) return source.recurrenceCount

  const startStr = source.eventDate || source.recurrenceStartDate || source.seasonStartDate
  const endStr =
    source.seriesEndDate ||
    source.recurrenceEndDate ||
    source.seasonEndDate
  if (startStr && endStr) {
    const start = parseLocalDate(startStr)
    const end = parseLocalDate(endStr)
    const repeat = inferRepeats(source)
    if (repeat === 'monthly') {
      const months =
        (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
      if (months >= 1) return months
    } else if (repeat === 'biweekly') {
      const days = daysBetween(start, end)
      const occurrences = Math.floor(days / 14) + 1
      if (occurrences >= 1) return occurrences
    } else {
      const days = daysBetween(start, end)
      const weeks = Math.ceil((days + 1) / 7)
      if (weeks >= 1) return weeks
    }
  }

  return 8
}

/** Keep legacy eventType in sync for admin tools and older readers. */
export function legacyEventTypeFromDayShape(dayShape: DayShape): HostEvent['eventType'] {
  return dayShape === 'block' ? 'multi-day' : 'single'
}

/** @deprecated — use legacyEventTypeFromDayShape */
export function legacyEventTypeFromScheduleType(scheduleType: ScheduleType): HostEvent['eventType'] {
  return scheduleType === 'multi_day' ? 'multi-day' : 'single'
}

export function migrateScheduleFields<T extends ScheduleLike>(
  source: T,
): T & {
  dayShape: DayShape
  scheduleType: ScheduleType
  scheduleMode: ScheduleMode
  scheduleTimeSlots: boolean
  repeats: RepeatPattern
  weeksOnDeck: number
  sellTicketsPerDay: boolean
  advancedTicketSales: boolean
  occurrences: EventOccurrence[]
  scheduleRepeatMode: ScheduleRepeatMode
} {
  const migratedOccurrences = migrateOccurrencesFromLegacy(source)
  const dayShape = inferDayShape({ ...source, ...migratedOccurrences })
  const scheduleType = dayShape === 'block' ? 'multi_day' : 'single'
  const scheduleMode = inferScheduleMode({ ...source, ...migratedOccurrences, dayShape })
  const sellTicketsPerDay = inferSellTicketsPerDay(source)
  const merged = { ...source, ...migratedOccurrences, dayShape, scheduleMode }
  return {
    ...source,
    ...migratedOccurrences,
    dayShape,
    scheduleType,
    scheduleMode,
    scheduleTimeSlots: inferScheduleTimeSlots(merged),
    repeats: inferRepeats(source),
    weeksOnDeck: inferWeeksOnDeck(source),
    sellTicketsPerDay,
    advancedTicketSales: sellTicketsPerDay,
    eventType: source.eventType ?? legacyEventTypeFromDayShape(dayShape),
  }
}

function parseLocalDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`)
}

function formatDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

function addMonths(d: Date, months: number): Date {
  const next = new Date(d)
  const day = next.getDate()
  next.setMonth(next.getMonth() + months)
  if (next.getDate() < day) next.setDate(0)
  return next
}

function daysBetween(a: Date, b: Date): number {
  const ms = startOfLocalDay(b).getTime() - startOfLocalDay(a).getTime()
  return Math.round(ms / (24 * 60 * 60 * 1000))
}

function formatShortDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

/** Block-once card face: "Mar 15–17" (same month) or "Mar 15–Apr 2". */
export function formatBlockDateRange(start: string, end: string): string {
  const startDate = parseLocalDate(start)
  const endDate = parseLocalDate(end)
  const startMonth = startDate.toLocaleDateString(undefined, { month: 'short' })
  const endMonth = endDate.toLocaleDateString(undefined, { month: 'short' })
  if (startMonth === endMonth && startDate.getFullYear() === endDate.getFullYear()) {
    return `${startMonth} ${startDate.getDate()}–${endDate.getDate()}`
  }
  return `${formatShortDate(start)}–${formatShortDate(end)}`
}

function isRecurrenceMatch(anchor: Date, candidate: Date, repeat: RepeatPattern): boolean {
  if (candidate < anchor) return false
  const diff = daysBetween(anchor, candidate)
  switch (repeat) {
    case 'daily':
      return true
    case 'weekly':
      return diff % 7 === 0
    case 'biweekly':
      return diff % 14 === 0
    case 'monthly':
      return candidate.getDate() === anchor.getDate()
    default:
      return false
  }
}

/** Compute series end date from anchor, repeat frequency, and occurrence count. */
export function computeSeriesEndDate(
  anchorDate: string,
  repeat: RepeatPattern,
  occurrencesOnDeck: number,
): string {
  const anchor = parseLocalDate(anchorDate)
  if (occurrencesOnDeck < 1) return anchorDate

  switch (repeat) {
    case 'weekly':
      return formatDateString(addDays(anchor, (occurrencesOnDeck - 1) * 7))
    case 'biweekly':
      return formatDateString(addDays(anchor, (occurrencesOnDeck - 1) * 14))
    case 'monthly':
      return formatDateString(addMonths(anchor, occurrencesOnDeck - 1))
    default:
      return formatDateString(addDays(anchor, (occurrencesOnDeck - 1) * 7))
  }
}

function resolveSeriesEnd(source: ScheduleLike): string | undefined {
  const repeat = inferRepeats(source)
  if (repeat !== 'none') {
    const anchor = source.eventDate || source.recurrenceStartDate
    if (anchor) {
      const occurrences = inferWeeksOnDeck(source)
      return computeSeriesEndDate(anchor, repeat, occurrences)
    }
  }
  return source.seriesEndDate || source.recurrenceEndDate || source.seasonEndDate
}

function resolveMultiDates(source: ScheduleLike): string[] {
  const fromOccurrences = expandOccurrenceDates(getEffectiveOccurrences(source))
  if (fromOccurrences.length > 0) return fromOccurrences
  const dates = (source.multiDates ?? []).filter(Boolean)
  if (dates.length > 0) return [...dates].sort()
  if (source.eventDate) return [source.eventDate]
  return []
}

function enumerateDateRange(start: string, end: string): string[] {
  const dates: string[] = []
  let cursor = parseLocalDate(start)
  const last = parseLocalDate(end)
  while (cursor <= last) {
    dates.push(formatDateString(cursor))
    cursor = addDays(cursor, 1)
  }
  return dates
}

/** Dates guests can pick when sellTicketsPerDay is on. */
export function resolveTicketDates(source: ScheduleLike): string[] {
  if (!inferSellTicketsPerDay(source)) return []

  const dates = expandOccurrenceDates(getEffectiveOccurrences(source))
  if (dates.length > 1) return dates

  const dayShape = inferDayShape(source)
  if (dayShape === 'pick_dates') return resolveMultiDates(source)
  if (dayShape === 'block' && inferSellTicketsPerDay(source)) {
    const start = source.eventDate
    const end = source.recurrenceEndDate
    if (start && end) return enumerateDateRange(start, end)
  }
  return []
}

function computeNextRecurrenceDate(source: ScheduleLike, now = new Date()): string | null {
  const anchorStr = source.eventDate || source.recurrenceStartDate
  if (!anchorStr) return null

  const repeat = inferRepeats(source)
  if (repeat === 'none') return anchorStr

  const anchor = parseLocalDate(anchorStr)
  const today = startOfLocalDay(now)
  const seriesEndStr = resolveSeriesEnd(source)
  const seriesEnd = seriesEndStr ? parseLocalDate(seriesEndStr) : null

  if (seriesEnd && today > seriesEnd) return null

  let candidate = today < anchor ? anchor : today

  for (let i = 0; i < 400; i++) {
    if (isRecurrenceMatch(anchor, candidate, repeat)) {
      if (!seriesEnd || candidate <= seriesEnd) {
        return formatDateString(candidate)
      }
      return null
    }
    candidate = addDays(candidate, 1)
  }

  return null
}

/**
 * Next upcoming calendar date for expiry / sorting logic.
 * Block-once returns the start date; pick_dates returns earliest upcoming.
 */
export function getNextDisplayDate(source: ScheduleLike, now = new Date()): string | null {
  const dayShape = inferDayShape(source)
  const today = formatDateString(startOfLocalDay(now))

  if (dayShape === 'pick_dates') {
    const upcoming = resolveMultiDates(source).filter((d) => d >= today)
    return upcoming[0] ?? null
  }

  if (inferRepeats(source) !== 'none') {
    return computeNextRecurrenceDate(source, now)
  }

  if (dayShape === 'block') {
    const end = source.recurrenceEndDate
    if (end && end < today) return null
    const start = source.eventDate
    if (start && start >= today) return start
    if (start && end && start <= today && end >= today) return today
    return start ?? null
  }

  return source.eventDate ?? null
}

/** Card-facing date string for Discover and review preview. */
export function formatCardDateTime(
  source: ScheduleLike & Pick<HostEvent, 'allDay' | 'startHour' | 'startMinute' | 'startPeriod'>,
  now = new Date(),
): string | undefined {
  const dayShape = inferDayShape(source)
  const repeat = inferRepeats(source)

  if (dayShape === 'block' && repeat === 'none') {
    const rangeOcc = getEffectiveOccurrences(source).find(isRangeOccurrence)
    const start = rangeOcc?.date ?? source.eventDate
    const end = rangeOcc?.dateEnd ?? source.recurrenceEndDate
    if (!start || !end) return undefined
    const range = formatBlockDateRange(start, end)
    if (source.allDay) return range
    const startTime = `${source.startHour ?? '12'}:${source.startMinute ?? '00'} ${source.startPeriod ?? 'PM'}`
    return `${range}, ${startTime}`
  }

  const displayDate = getNextDisplayDate(source, now)
  if (!displayDate) return undefined

  const date = new Date(displayDate + 'T12:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  if (source.allDay) return date
  const start = `${source.startHour ?? '12'}:${source.startMinute ?? '00'} ${source.startPeriod ?? 'PM'}`
  return `${date}, ${start}`
}

/** Whether the detail panel should list multiple selectable dates. */
export function hasMultipleDisplayDates(source: ScheduleLike, now = new Date()): boolean {
  const ticketDates = resolveTicketDates(source)
  if (ticketDates.length > 1) {
    const today = formatDateString(startOfLocalDay(now))
    return ticketDates.filter((d) => d >= today).length > 1
  }
  return false
}

/** End-of-life timestamp for deck removal (end of local day unless time fields exist). */
export function computeExpiresAt(source: ScheduleLike): string | undefined {
  const dayShape = inferDayShape(source)
  let endDateStr: string | undefined

  const rangeOcc = getEffectiveOccurrences(source).find(isRangeOccurrence)
  if (rangeOcc?.dateEnd) {
    endDateStr = rangeOcc.dateEnd
  } else if (dayShape === 'pick_dates') {
    const dates = resolveMultiDates(source)
    endDateStr = dates[dates.length - 1]
  } else if (inferRepeats(source) !== 'none') {
    endDateStr = resolveSeriesEnd(source)
  } else {
    switch (dayShape) {
      case 'one_day':
        endDateStr = source.eventDate
        break
      case 'block':
        endDateStr = source.recurrenceEndDate || source.eventDate
        break
    }
  }

  if (!endDateStr) return undefined

  const d = parseLocalDate(endDateStr)
  if (source.allDay) {
    d.setHours(23, 59, 59, 999)
    return d.toISOString()
  }

  if (source.endHour) {
    let h = parseInt(source.endHour, 10)
    const m = parseInt(source.endMinute ?? '0', 10)
    if (source.endPeriod === 'AM') {
      if (h === 12) h = 0
    } else if (h !== 12) {
      h += 12
    }
    d.setHours(h, m, 59, 999)
    return d.toISOString()
  }

  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

export function isHostEventDiscoverVisible(event: HostEvent, now = new Date()): boolean {
  if (event.scheduledPublishAt) {
    const publishAt = new Date(event.scheduledPublishAt)
    if (now < publishAt) return false
  }

  if (inferRepeats(event) !== 'none' || inferDayShape(event) === 'pick_dates') {
    if (!getNextDisplayDate(event, now)) return false
  }

  const expiresAt = event.expiresAt ? new Date(event.expiresAt) : computeExpiresAt(event)
  if (expiresAt && now > expiresAt) return false

  return true
}

export function scheduleFieldsFromForm(form: HostEventFormData): Partial<HostEvent> {
  const derived = syncDerivedScheduleFields(form)
  const dayShape = derived.dayShape
  const scheduleType = derived.scheduleType
  const repeats = inferRepeats(form)
  const weeksOnDeck = form.weeksOnDeck
  const sellTicketsPerDay = form.sellTicketsPerDay
  const occurrences = getEffectiveOccurrences({ ...form, ...derived })
  const dates = occurrences.map((o) => o.date).sort()
  const anchor = dates[0] || form.eventDate || form.recurrenceStartDate
  const isRecurring = repeats !== 'none' && form.scheduleRepeatMode === 'pattern'

  let seriesEndDate: string | undefined
  if (isRecurring && anchor) {
    seriesEndDate = computeSeriesEndDate(anchor, repeats, weeksOnDeck)
  } else if (dayShape === 'block' && dates.length > 1) {
    seriesEndDate = dates[dates.length - 1]
  } else if (dayShape === 'pick_dates') {
    seriesEndDate = dates[dates.length - 1]
  }

  const expiresAt = computeExpiresAt({
    ...form,
    ...derived,
    dayShape,
    scheduleType,
    repeats,
    seriesEndDate,
    occurrences,
  })

  const hasTickets =
    form.ticketingMode === 'sell' ||
    form.ticketingMode === 'free_donation' ||
    form.ticketingMode === 'free_rsvp'
  const ticketScope: TicketScope | undefined =
    isRecurring && hasTickets && !form.sellTicketsPerDay ? 'per_occurrence' : undefined

  const multiDates =
    dayShape === 'pick_dates' || (sellTicketsPerDay && dates.length > 1)
      ? dates
      : sellTicketsPerDay && dayShape === 'block' && form.eventDate && form.recurrenceEndDate
        ? enumerateDateRange(form.eventDate, form.recurrenceEndDate)
        : dates.length > 1
          ? dates
          : undefined

  return {
    dayShape,
    scheduleType,
    scheduleMode: form.scheduleMode ?? inferScheduleMode(form),
    eventType: legacyEventTypeFromDayShape(dayShape),
    weeksOnDeck: isRecurring ? weeksOnDeck : undefined,
    sellTicketsPerDay: sellTicketsPerDay || undefined,
    advancedTicketSales: sellTicketsPerDay || undefined,
    ticketScope,
    scheduledPublishAt: form.scheduledPublishAt.trim() || undefined,
    expiresAt,
    seriesEndDate,
    recurrenceEndDate: dayShape === 'block' ? (derived.recurrenceEndDate || dates[dates.length - 1]) : undefined,
    repeats,
    multiDates: multiDates?.length ? multiDates : undefined,
    occurrences: occurrences.length > 0 ? occurrences : undefined,
    scheduleRepeatMode: form.scheduleRepeatMode,
    scheduleTimeSlots: form.scheduleTimeSlots || undefined,
    eventDate: anchor || form.eventDate,
  }
}

export function formatDayShapeLabel(dayShape: DayShape): string {
  return DAY_SHAPE_OPTIONS.find((o) => o.id === dayShape)?.label ?? dayShape
}

/** @deprecated — use formatDayShapeLabel */
export function formatScheduleTypeLabel(scheduleType: ScheduleType): string {
  const dayShape = scheduleType === 'multi_day' ? 'block' : 'one_day'
  return formatDayShapeLabel(dayShape)
}

/** Plain-English schedule summary for review step. */
export function formatScheduleSummary(form: HostEventFormData): string {
  const mode = form.scheduleMode ?? inferScheduleMode(form)
  const occurrences = getEffectiveOccurrences(form)
  const dates = expandOccurrenceDates(occurrences)
  const rangeOcc = occurrences.find(isRangeOccurrence)
  const parts: string[] = []

  if (mode === 'single') parts.push('Single day')
  else if (mode === 'multiple') parts.push('Multiple day')
  else if (mode === 'seasonal') parts.push('Seasonal')

  if (form.scheduleTimeSlots && hasSameDayTimeSlots(occurrences)) {
    parts.push(`${occurrences.length} time slots`)
  }

  if (form.scheduleRepeatMode === 'pattern' && form.repeats !== 'none') {
    parts.push('Repeating')
    if (form.eventDate) parts.push(form.eventDate)
  } else if (rangeOcc) {
    parts.push(formatBlockDateRange(rangeOcc.date, rangeOcc.dateEnd!))
  } else if (dates.length > 1) {
    if (areDatesContiguous(dates)) {
      parts.push(`${dates[0]} → ${dates[dates.length - 1]}`)
    } else {
      parts.push(`${dates.length} dates`)
    }
  } else if (form.eventDate) {
    parts.push(form.eventDate)
  }

  if (form.sellTicketsPerDay) {
    parts.push('Tickets sold per day')
  } else if (form.repeats && form.repeats !== 'none' && form.scheduleRepeatMode === 'pattern') {
    const freq =
      SCHEDULE_REPEAT_OPTIONS.find((o) => o.value === form.repeats)?.label.toLowerCase() ??
      form.repeats
    parts.push(
      `Repeats ${freq} · ${form.weeksOnDeck} time${form.weeksOnDeck === 1 ? '' : 's'} on deck`,
    )
  }

  if (!form.allDay && form.startHour) {
    parts.push(
      `${form.startHour}:${form.startMinute} ${form.startPeriod} – ${form.endHour}:${form.endMinute} ${form.endPeriod}`,
    )
  } else if (form.allDay) {
    parts.push('All day')
  }

  return parts.join(' · ')
}
