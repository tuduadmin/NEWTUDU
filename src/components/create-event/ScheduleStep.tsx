import { CalendarDays, Clock, Moon, Settings } from 'lucide-react'
import type { HostEventFormData } from '../../lib/account'
import type { EventSlotBudget } from '../../lib/eventSlotBudget'
import {
  expandOccurrenceDates,
  getOccurrenceTimeFields,
  groupDatesIntoOccurrences,
  occurrenceFromRange,
  occurrenceFromTemplate,
  SCHEDULE_MODE_OPTIONS,
  syncDerivedScheduleFields,
  syncLockedOccurrenceTimes,
  templateFromScheduleFields,
  type EventOccurrence,
  type ScheduleMode,
} from '../../lib/eventSchedule'
import EventCalendarPicker from './EventCalendarPicker'
import EventSlotTally from './EventSlotTally'
import OccurrenceListEditor from './OccurrenceListEditor'
import { FieldHelper, FieldLabel } from './CreateEventLayout'
import { Plus } from 'lucide-react'

const HOST_PANEL = 'rounded-[14px] border border-app-subtle bg-app-elevated'

const SCHEDULE_TILE =
  'rounded-[14px] border-2 px-2 py-3 text-center transition border-app-subtle bg-app-elevated hover:border-orange/30'

const SCHEDULE_TILE_SELECTED = 'border-orange bg-orange/10'

const SCHEDULE_TILE_DISABLED = 'cursor-not-allowed border-app-subtle bg-app-elevated/40 opacity-60'

type ScheduleStepProps = {
  form: HostEventFormData
  updateForm: (partial: Partial<HostEventFormData>) => void
  slotBudget?: EventSlotBudget | null
}

const DURATIONS = [
  { id: 'short' as const, label: 'Short', sub: '15-30 mins', icon: Clock },
  { id: 'medium' as const, label: 'Medium', sub: '1-4 hours', icon: Settings },
  { id: 'long' as const, label: 'Long', sub: '4+ hours', icon: Moon },
]

function applySchedulePatch(
  form: HostEventFormData,
  partial: Partial<HostEventFormData>,
): Partial<HostEventFormData> {
  const merged = { ...form, ...partial }
  const derived = syncDerivedScheduleFields(merged)
  return { ...partial, ...derived }
}

function primaryOccurrence(form: HostEventFormData): EventOccurrence {
  const template = templateFromScheduleFields(form)
  const existing = form.occurrences.find((o) => o.date === form.eventDate && !o.dateEnd)
  if (existing) return existing
  if (form.eventDate) return { date: form.eventDate, ...template }
  return { date: '', ...template }
}

export default function ScheduleStep({ form, updateForm, slotBudget = null }: ScheduleStepProps) {
  const scheduleMode = form.scheduleMode ?? 'single'
  const isSingleRepeat = scheduleMode === 'single' && form.scheduleRepeatMode === 'multi_pick'
  const isTimeSlots = scheduleMode === 'single' && form.scheduleTimeSlots && !isSingleRepeat

  const singleOccurrences =
    form.occurrences.length > 0
      ? form.occurrences
      : form.eventDate
        ? [primaryOccurrence(form)]
        : []

  const multiCalendarDates = expandOccurrenceDates(form.occurrences)
  const multiRangeSelections = form.occurrences
    .filter((o) => o.dateEnd && o.dateEnd !== o.date)
    .map((o) => ({ start: o.date, end: o.dateEnd! }))

  function patchForm(partial: Partial<HostEventFormData>) {
    updateForm(applySchedulePatch(form, partial))
  }

  function setScheduleMode(mode: ScheduleMode) {
    if (mode === 'seasonal') return

    if (mode === 'single') {
      const occ = form.eventDate
        ? [occurrenceFromTemplate(form.eventDate, templateFromScheduleFields(form))]
        : []
      patchForm({
        scheduleMode: 'single',
        scheduleRepeatMode: 'none',
        scheduleTimeSlots: false,
        repeats: 'none',
        occurrences: occ,
        eventDate: form.eventDate,
      })
      return
    }

    patchForm({
      scheduleMode: 'multiple',
      scheduleRepeatMode: 'none',
      scheduleTimeSlots: false,
      repeats: 'none',
      occurrences: [],
      eventDate: '',
    })
  }

  function handleRepeatOccurrencesChange(next: EventOccurrence[]) {
    const primaryDate = resolveRepeatTemplateDate(next.map((o) => o.date))
    const synced = syncLockedOccurrenceTimes(next, primaryDate)
    const primary = synced.find((o) => o.date === primaryDate) ?? synced[0]
    const timeFields = primary ? getOccurrenceTimeFields(primary) : {}

    patchForm({
      occurrences: synced,
      eventDate: primaryDate,
      ...timeFields,
    })
  }

  function syncPrimaryOccurrence(partial: Partial<EventOccurrence>) {
    const base = primaryOccurrence(form)
    const next = { ...base, ...partial }
    const timePartial: Partial<HostEventFormData> = {
      eventDate: next.date,
      startHour: next.startHour,
      startMinute: next.startMinute,
      startPeriod: next.startPeriod,
      endHour: next.endHour,
      endMinute: next.endMinute,
      endPeriod: next.endPeriod,
      allDay: next.allDay,
    }

    if (isSingleRepeat) {
      const timeFields = getOccurrenceTimeFields(next)
      const updatedOccurrences = form.occurrences.map((o) => {
        if (o.date === form.eventDate && !o.dateEnd) return next
        if (o.timeLocked === false) return o
        return { ...o, ...timeFields, timeLocked: o.timeLocked ?? true }
      })
      patchForm({
        ...timePartial,
        occurrences: updatedOccurrences,
      })
      return
    }

    patchForm({
      ...timePartial,
      occurrences: next.date ? [next] : [],
    })
  }

  function setPrimaryDate(eventDate: string) {
    if (!eventDate) {
      syncPrimaryOccurrence({ date: '', dateEnd: undefined })
      return
    }
    if (isTimeSlots) {
      const template = templateFromScheduleFields(form)
      const nextOccurrences =
        form.occurrences.length > 0
          ? form.occurrences.map((o) => ({ ...o, date: eventDate, dateEnd: undefined }))
          : [occurrenceFromTemplate(eventDate, template)]
      patchForm({
        eventDate,
        occurrences: nextOccurrences,
      })
      return
    }
    syncPrimaryOccurrence({ date: eventDate, dateEnd: undefined })
  }

  function openSingleRepeat() {
    const primary = primaryOccurrence(form)
    patchForm({
      scheduleRepeatMode: 'multi_pick',
      scheduleTimeSlots: false,
      repeats: 'none',
      occurrences: form.eventDate ? [primary] : [],
    })
  }

  function closeSingleRepeat() {
    const primary = primaryOccurrence(form)
    patchForm({
      scheduleRepeatMode: 'none',
      repeats: 'none',
      occurrences: form.eventDate ? [primary] : [],
    })
  }

  function openTimeSlots() {
    const primary = primaryOccurrence(form)
    patchForm({
      scheduleTimeSlots: true,
      scheduleRepeatMode: 'none',
      repeats: 'none',
      occurrences: form.eventDate ? [primary] : [],
    })
  }

  function closeTimeSlots() {
    const primary = primaryOccurrence(form)
    patchForm({
      scheduleTimeSlots: false,
      occurrences: form.eventDate ? [primary] : [],
    })
  }

  function handleTimeSlotOccurrencesChange(next: EventOccurrence[]) {
    const date = form.eventDate || next[0]?.date || ''
    const normalized = next.map((o) => ({ ...o, date, dateEnd: undefined }))
    const primary = normalized[0]
    const timeFields = primary ? getOccurrenceTimeFields(primary) : {}
    patchForm({
      occurrences: normalized,
      eventDate: date,
      ...timeFields,
    })
  }

  function addTimeSlot() {
    const date = form.eventDate || form.occurrences[0]?.date
    if (!date) return
    const last = form.occurrences[form.occurrences.length - 1] ?? primaryOccurrence(form)
    const seed = getOccurrenceTimeFields(last)
    patchForm({
      occurrences: [
        ...form.occurrences,
        occurrenceFromTemplate(date, seed, { timeLocked: false }),
      ],
    })
  }

  /** Flat list of selected calendar days (ranges expanded). */
  function currentSelectedDraftDates(): string[] {
    if ((form.scheduleMode ?? 'single') === 'multiple') {
      return expandOccurrenceDates(form.occurrences)
    }
    return form.occurrences.map((o) => o.date).filter(Boolean)
  }

  function resolveRepeatTemplateDate(selectedDatesInOrder: string[]): string {
    const dates = selectedDatesInOrder.filter(Boolean)
    if (form.eventDate && dates.includes(form.eventDate)) {
      return form.eventDate
    }
    return dates[0] ?? ''
  }

  /** Keep existing pick order; newly tapped dates append at the end. */
  function mergeDatesInPickOrder(incomingDates: string[]): string[] {
    const incoming = incomingDates.filter(Boolean)
    const incomingSet = new Set(incoming)
    const kept = currentSelectedDraftDates().filter((d) => incomingSet.has(d))
    const keptSet = new Set(kept)
    const added = incoming.filter((d) => !keptSet.has(d))
    return [...kept, ...added]
  }

  function handleSingleRepeatDates(dates: string[]) {
    const ordered = mergeDatesInPickOrder(dates)
    const primaryDate = resolveRepeatTemplateDate(ordered)
    const templateOcc = primaryOccurrence(form)
    const template = getOccurrenceTimeFields(templateOcc)
    const existingByDate = new Map(form.occurrences.map((o) => [o.date, o]))
    const next = ordered.map((date) => {
      const existing = existingByDate.get(date)
      if (existing) return existing
      return occurrenceFromTemplate(date, template, {
        timeLocked: date !== primaryDate ? true : undefined,
      })
    })
    patchForm({
      scheduleRepeatMode: 'multi_pick',
      repeats: 'none',
      occurrences: syncLockedOccurrenceTimes(next, primaryDate),
      eventDate: primaryDate,
    })
  }

  function handleSingleCalendarChange(value: string | string[]) {
    if (isSingleRepeat) {
      handleSingleRepeatDates(value as string[])
    } else {
      setPrimaryDate(value as string)
    }
  }

  function handleMultipleDayTap(dates: string[]) {
    const ordered = mergeDatesInPickOrder(dates)
    const grouped = groupDatesIntoOccurrences(
      ordered,
      templateFromScheduleFields(form),
      form.occurrences,
    )
    const primary = grouped[0]
    const timeFields = primary ? getOccurrenceTimeFields(primary) : {}
    patchForm({
      scheduleMode: 'multiple',
      scheduleRepeatMode: 'none',
      occurrences: grouped,
      eventDate: primary?.date ?? '',
      ...timeFields,
    })
  }

  function handleMultipleRange(start: string, end: string) {
    const [rangeStart, rangeEnd] = start <= end ? [start, end] : [end, start]
    const rangeDates = expandOccurrenceDates([
      occurrenceFromRange(rangeStart, rangeEnd, templateFromScheduleFields(form)),
    ])
    const combined = [...new Set([...currentSelectedDraftDates(), ...rangeDates])]
    handleMultipleDayTap(combined)
  }

  const primary = primaryOccurrence(form)
  const templateDate = form.eventDate || singleOccurrences[0]?.date || ''
  const repeatDayCount = isSingleRepeat ? singleOccurrences.length : 0

  return (
    <section>
      <h2 className="font-display text-xl font-extrabold text-brown">Schedule</h2>
      <p className="mt-1 text-sm leading-relaxed text-brown-muted">
        Choose how your event spans time: single day, multiple days, or seasonal (coming soon).
      </p>

      {slotBudget && (
        <div className="mt-4">
          <EventSlotTally budget={slotBudget} />
        </div>
      )}

      <div className="mt-5 space-y-5">
        <div className="grid grid-cols-3 gap-2">
          {SCHEDULE_MODE_OPTIONS.map((opt) => {
            const selected = scheduleMode === opt.id
            const disabled = opt.disabled
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => setScheduleMode(opt.id)}
                className={
                  disabled
                    ? SCHEDULE_TILE_DISABLED
                    : selected
                      ? `${SCHEDULE_TILE} ${SCHEDULE_TILE_SELECTED}`
                      : SCHEDULE_TILE
                }
              >
                <CalendarDays
                  size={16}
                  className={`mx-auto ${selected && !disabled ? 'text-orange' : 'text-brown-muted'}`}
                />
                <p
                  className={`mt-1.5 text-[11px] font-bold leading-tight ${
                    selected && !disabled ? 'text-orange' : disabled ? 'text-brown-muted' : 'text-brown'
                  }`}
                >
                  {opt.label}
                </p>
                <p className="mt-0.5 text-[9px] leading-snug text-brown-muted">{opt.sub}</p>
              </button>
            )
          })}
        </div>

        {scheduleMode === 'seasonal' && (
          <div className={`${HOST_PANEL} px-4 py-6 text-center`}>
            <p className="font-display text-sm font-bold text-brown">Seasonal scheduling</p>
            <p className="mt-1 text-xs text-brown-muted">Coming soon: full season passes and recurring blocks.</p>
          </div>
        )}

        {scheduleMode === 'single' && (
          <>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-brown">
                <input
                  type="checkbox"
                  checked={isSingleRepeat}
                  onChange={(e) => (e.target.checked ? openSingleRepeat() : closeSingleRepeat())}
                  className="h-4 w-4 rounded border-brown/20 accent-orange"
                />
                Does this repeat?
              </label>
              {!isSingleRepeat && (
                <>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-brown">
                    <input
                      type="checkbox"
                      checked={isTimeSlots}
                      onChange={(e) => (e.target.checked ? openTimeSlots() : closeTimeSlots())}
                      className="h-4 w-4 rounded border-brown/20 accent-orange"
                    />
                    Does this event have time slots?
                  </label>
                  {isTimeSlots && (
                    <FieldHelper className="mb-2">
                      Same day, multiple seatings — e.g. tea party at 11–1, 2–4, and 3–6. Each slot gets its
                      own ticket capacity on the Ticketing step.
                    </FieldHelper>
                  )}
                </>
              )}
              {isSingleRepeat && (
                <>
                  <p className="mb-2 text-[11px] leading-relaxed text-brown-muted">
                    Pick your template day first, then add more dates. Extra days copy the template times
                    until you unlock a day to adjust it.
                  </p>
                  {repeatDayCount > 1 && (
                    <p className="mb-2 text-[11px] leading-relaxed text-brown-muted">
                      One card on Discover — guests pick their night. Each date counts toward your slot tally.
                    </p>
                  )}
                </>
              )}
              <FieldLabel required>Pick a day</FieldLabel>
              <EventCalendarPicker
                mode={isSingleRepeat ? 'multi' : 'single'}
                sortSelected={!isSingleRepeat}
                selected={
                  isSingleRepeat ? singleOccurrences.map((o) => o.date) : form.eventDate
                }
                onChange={handleSingleCalendarChange}
              />
            </div>

            {isSingleRepeat && templateDate ? (
              <OccurrenceListEditor
                occurrences={singleOccurrences}
                repeatTemplateDate={templateDate}
                allowRemove={singleOccurrences.length > 1}
                onChange={handleRepeatOccurrencesChange}
              />
            ) : isTimeSlots && form.eventDate ? (
              <>
                <OccurrenceListEditor
                  occurrences={singleOccurrences}
                  timeSlotMode
                  allowRemove={singleOccurrences.length > 1}
                  onChange={handleTimeSlotOccurrencesChange}
                />
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="mt-2 inline-flex min-h-11 items-center gap-1 rounded-[14px] px-1 text-sm font-bold text-orange"
                >
                  <Plus size={16} />
                  Add time slot
                </button>
              </>
            ) : (
              form.eventDate && (
                <OccurrenceListEditor
                  occurrences={[primary]}
                  allowRemove={false}
                  onChange={(next) => {
                    if (next[0]) syncPrimaryOccurrence(next[0])
                  }}
                />
              )
            )}
          </>
        )}

        {scheduleMode === 'multiple' && (
          <>
            <div>
              <FieldLabel required>Pick days or drag a range</FieldLabel>
              <p className="mb-2 text-[11px] leading-relaxed text-brown-muted">
                Contiguous days join into one time block. Separate picks stay on their own row. Each calendar
                day counts toward your slot tally.
              </p>
              <EventCalendarPicker
                mode="multi"
                sortSelected={false}
                selected={multiCalendarDates}
                rangeSelections={multiRangeSelections}
                enableRangeDrag
                onRangeSelect={handleMultipleRange}
                onChange={(value) => handleMultipleDayTap(value as string[])}
              />
            </div>

            {form.occurrences.length > 0 && (
              <OccurrenceListEditor
                occurrences={form.occurrences}
                allowRemoveLast
                onChange={(next) =>
                  patchForm({
                    occurrences: next,
                    eventDate: next[0]?.date ?? '',
                  })
                }
              />
            )}
          </>
        )}

        <div>
          <FieldLabel>Typical Visit Duration</FieldLabel>
          <div className="grid grid-cols-3 gap-2">
            {DURATIONS.map((d) => {
              const Icon = d.icon
              const selected = form.visitDuration === d.id
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => updateForm({ visitDuration: d.id })}
                  className={
                    selected ? `${SCHEDULE_TILE} ${SCHEDULE_TILE_SELECTED}` : SCHEDULE_TILE
                  }
                >
                  <Icon size={18} className={`mx-auto ${selected ? 'text-orange' : 'text-brown-muted'}`} />
                  <p className={`mt-1.5 text-xs font-bold ${selected ? 'text-orange' : 'text-brown'}`}>
                    {d.label}
                  </p>
                  <p className="text-[10px] text-brown-muted">{d.sub}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
