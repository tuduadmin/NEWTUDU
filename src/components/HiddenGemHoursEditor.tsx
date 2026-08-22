import {
  DAY_OF_WEEK_KEYS,
  DAY_OF_WEEK_LABELS,
  isDayClosed,
  normalizeDayHoursEntry,
  type DayHoursEntry,
  type DayOfWeek,
  type WeeklyHours,
} from '../lib/hiddenGems'

type HiddenGemHoursEditorProps = {
  value: WeeklyHours
  onChange: (hours: WeeklyHours) => void
  hoursDescription?: string
  onHoursDescriptionChange?: (value: string) => void
  variant?: 'light' | 'dark'
}

function defaultWeeklyHours(): WeeklyHours {
  return DAY_OF_WEEK_KEYS.reduce((acc, day) => {
    acc[day] = day === 'sunday' ? { open: '10:00', close: '18:00', closed: true } : { open: '10:00', close: '18:00' }
    return acc
  }, {} as WeeklyHours)
}

export function createDefaultWeeklyHours(): WeeklyHours {
  return defaultWeeklyHours()
}

export default function HiddenGemHoursEditor({
  value,
  onChange,
  hoursDescription = '',
  onHoursDescriptionChange,
  variant = 'light',
}: HiddenGemHoursEditorProps) {
  const inputClass =
    variant === 'dark'
      ? 'rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 py-1.5 text-xs text-[var(--admin-text)]'
      : 'app-field px-2 py-1.5 text-xs'

  const noteInputClass =
    variant === 'dark'
      ? `${inputClass} min-w-0 flex-1`
      : `${inputClass} min-w-0 flex-1 placeholder:text-brown-muted/60`

  const textareaClass =
    variant === 'dark'
      ? 'admin-input mt-3 w-full resize-none text-xs'
      : 'app-field mt-3 resize-none px-4 py-3 placeholder:text-brown-muted/60'

  const labelClass =
    variant === 'dark'
      ? 'admin-label mt-0 block'
      : 'mt-0 block text-sm font-medium text-brown'

  function updateDay(day: DayOfWeek, entry: DayHoursEntry) {
    onChange({ ...value, [day]: entry })
  }

  function dayCardClass(day: DayOfWeek, isOpen: boolean): string {
    const isWeekend = day === 'saturday' || day === 'sunday'
    if (variant === 'dark') {
      const leftAccent = isOpen
        ? isWeekend
          ? 'border-l-[var(--admin-accent)]'
          : 'border-l-[var(--admin-accent)]/55'
        : isWeekend
          ? 'border-l-[var(--admin-accent)]/35'
          : 'border-l-[var(--admin-border)]'
      return (
        'rounded-[var(--admin-radius)] border border-l-4 p-3.5 transition-colors ' +
        leftAccent +
        ' ' +
        (isOpen
          ? 'border-[var(--admin-accent)]/25 bg-[var(--admin-accent)]/5'
          : 'border-[var(--admin-border)] bg-[var(--admin-surface)]/60 opacity-90')
      )
    }

    const leftAccent = isOpen
      ? isWeekend
        ? 'border-l-orange/50'
        : 'border-l-orange/35'
      : isWeekend
        ? 'border-l-orange/25'
        : 'border-l-brown/20'
    return (
      'rounded-[14px] border border-l-4 p-3.5 shadow-sm transition-colors ' +
      leftAccent +
      ' ' +
      (isOpen
        ? 'border-orange/25 bg-gradient-to-br from-orange/[0.06] to-cream'
        : 'border-brown/12 bg-cream-dark/30')
    )
  }

  function dayLabelClass(isOpen: boolean): string {
    if (variant === 'dark') {
      return isOpen
        ? 'inline-flex rounded-full bg-[var(--admin-accent)]/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--admin-accent)]'
        : 'inline-flex rounded-full bg-[var(--admin-border)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--admin-text-muted)]'
    }
    return isOpen
      ? 'inline-flex rounded-full bg-orange/12 px-2.5 py-0.5 font-display text-[11px] font-bold uppercase tracking-wide text-orange'
      : 'inline-flex rounded-full bg-brown/8 px-2.5 py-0.5 font-display text-[11px] font-bold uppercase tracking-wide text-brown-muted'
  }

  return (
    <div className="space-y-3">
      {DAY_OF_WEEK_KEYS.map((day) => {
        const entry = normalizeDayHoursEntry(value[day])
        const isOpen = !isDayClosed(value[day])
        const isWeekend = day === 'saturday' || day === 'sunday'
        return (
          <div key={day} className={dayCardClass(day, isOpen)}>
            <div className="grid grid-cols-[5.25rem_1fr] items-center gap-x-3 gap-y-2">
              <div className="flex flex-col gap-1">
                <span className={dayLabelClass(isOpen)}>{DAY_OF_WEEK_LABELS[day].slice(0, 3)}</span>
                {isWeekend && (
                  <span
                    className={
                      variant === 'dark'
                        ? 'text-[10px] font-medium text-[var(--admin-text-muted)]'
                        : 'text-[10px] font-medium text-brown-muted'
                    }
                  >
                    Weekend
                  </span>
                )}
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <label className="flex shrink-0 items-center gap-1.5 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={isOpen}
                    onChange={() =>
                      updateDay(
                        day,
                        isOpen
                          ? { ...entry, closed: true }
                          : { open: entry.open || '10:00', close: entry.close || '18:00', dayNote: entry.dayNote },
                      )
                    }
                    className="h-4 w-4 accent-orange"
                  />
                  {isOpen ? 'Open' : 'Closed'}
                </label>
                {isOpen ? (
                  <div className="inline-flex min-w-0 flex-1 items-center gap-1.5 whitespace-nowrap">
                    <input
                      type="time"
                      value={entry.open}
                      onChange={(e) => updateDay(day, { ...entry, open: e.target.value, closed: false })}
                      className={`${inputClass} min-w-0 flex-1 ${variant === 'light' ? 'bg-white/80' : ''}`}
                      aria-label={`${DAY_OF_WEEK_LABELS[day]} open time`}
                    />
                    <span className="shrink-0 text-xs font-semibold text-brown-muted" aria-hidden>
                      –
                    </span>
                    <input
                      type="time"
                      value={entry.close}
                      onChange={(e) => updateDay(day, { ...entry, close: e.target.value, closed: false })}
                      className={`${inputClass} min-w-0 flex-1 ${variant === 'light' ? 'bg-white/80' : ''}`}
                      aria-label={`${DAY_OF_WEEK_LABELS[day]} close time`}
                    />
                  </div>
                ) : (
                  <span
                    className={
                      variant === 'dark'
                        ? 'text-xs italic text-[var(--admin-text-muted)]'
                        : 'text-xs italic text-brown-muted'
                    }
                  >
                    No hours set
                  </span>
                )}
              </div>
            </div>
            <div
              className={
                variant === 'dark'
                  ? 'mt-3 grid grid-cols-[5.25rem_1fr] items-center gap-x-3 border-t border-[var(--admin-border)]/70 pt-3'
                  : 'mt-3 grid grid-cols-[5.25rem_1fr] items-center gap-x-3 border-t border-brown/8 pt-3'
              }
            >
              <label
                htmlFor={`hours-note-${day}`}
                className={
                  variant === 'dark'
                    ? 'text-[10px] font-semibold uppercase tracking-wide text-[var(--admin-text-muted)]'
                    : 'text-[10px] font-semibold uppercase tracking-wide text-brown-muted'
                }
              >
                Day note
              </label>
              <input
                id={`hours-note-${day}`}
                type="text"
                value={entry.dayNote ?? ''}
                onChange={(e) =>
                  updateDay(day, {
                    ...entry,
                    dayNote: e.target.value || undefined,
                  })
                }
                placeholder="Optional note for this day"
                className={noteInputClass}
              />
            </div>
          </div>
        )
      })}
      {onHoursDescriptionChange && (
        <div
          className={
            variant === 'dark'
              ? 'rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4'
              : 'rounded-[14px] border border-purple/15 bg-purple/[0.04] p-4 shadow-sm'
          }
        >
          <label htmlFor="hours-description" className={labelClass}>
            General hours notes
          </label>
          <p
            className={
              variant === 'dark'
                ? 'mb-2 text-xs text-[var(--admin-text-muted)]'
                : 'mb-2 text-xs text-brown-muted'
            }
          >
            Overall exceptions — e.g. &quot;Closed stat holidays&quot;, &quot;Kitchen closes at 9pm&quot;
          </p>
          <textarea
            id="hours-description"
            rows={2}
            value={hoursDescription}
            onChange={(e) => onHoursDescriptionChange(e.target.value)}
            placeholder="Optional — special hours, holidays, etc."
            className={textareaClass}
          />
        </div>
      )}
    </div>
  )
}
