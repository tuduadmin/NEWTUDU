import { Calendar, Lock, LockOpen, Trash2 } from 'lucide-react'
import {
  formatBlockDateRange,
  formatOccurrenceDateLabel,
  getOccurrenceTimeFields,
  isRangeOccurrence,
  time12ToInputValue,
  timeInputValueTo12,
  type EventOccurrence,
} from '../../lib/eventSchedule'
import { appFieldClass } from '../../lib/formFieldClasses'
import { FieldLabel } from './CreateEventLayout'

const TIME_INPUT_CLASS = `${appFieldClass} w-full min-h-[44px] py-2 text-xs font-bold`
const TIME_INPUT_DISABLED = `${TIME_INPUT_CLASS} cursor-not-allowed opacity-70`

type OccurrenceListEditorProps = {
  occurrences: EventOccurrence[]
  onChange: (occurrences: EventOccurrence[]) => void
  allowRemove?: boolean
  /** Allow removing the last card (multi-day mode — clears the whole block). */
  allowRemoveLast?: boolean
  /** First-picked day in repeat mode — template times, always editable. */
  repeatTemplateDate?: string
  /** Same-day seatings — hide date field, label rows as time slots. */
  timeSlotMode?: boolean
}

function TimePicker({
  label,
  hour,
  minute,
  period,
  disabled,
  onChange,
}: {
  label: string
  hour: string
  minute: string
  period: 'AM' | 'PM'
  disabled?: boolean
  onChange: (hour: string, minute: string, period: 'AM' | 'PM') => void
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="time"
        disabled={disabled}
        value={time12ToInputValue(hour, minute, period)}
        onChange={(e) => {
          const next = timeInputValueTo12(e.target.value)
          onChange(next.hour, next.minute, next.period)
        }}
        className={disabled ? TIME_INPUT_DISABLED : TIME_INPUT_CLASS}
      />
    </div>
  )
}

export default function OccurrenceListEditor({
  occurrences,
  onChange,
  allowRemove = true,
  allowRemoveLast = false,
  repeatTemplateDate,
  timeSlotMode = false,
}: OccurrenceListEditorProps) {
  const repeatMode = Boolean(repeatTemplateDate)
  const list = occurrences

  function updateOccurrence(index: number, partial: Partial<EventOccurrence>) {
    const next = [...list]
    next[index] = { ...next[index], ...partial }
    onChange(next)
  }

  function removeOccurrence(index: number) {
    onChange(list.filter((_, i) => i !== index))
  }

  function toggleTimeLock(index: number) {
    const occ = list[index]
    const primary = list.find((o) => o.date === repeatTemplateDate)
    if (!primary || occ.date === repeatTemplateDate) return

    if (occ.timeLocked === false) {
      updateOccurrence(index, { ...getOccurrenceTimeFields(primary), timeLocked: true })
      return
    }
    updateOccurrence(index, { timeLocked: false })
  }

  if (list.length === 0) return null

  return (
    <div className="space-y-2">
      {list.map((occ, index) => {
        const range = isRangeOccurrence(occ)
        const isTemplate = repeatMode && occ.date === repeatTemplateDate && !range
        const isLockedFollower =
          repeatMode && !isTemplate && !range && occ.timeLocked !== false

        return (
          <div
            key={`${occ.date}-${occ.dateEnd ?? ''}-${index}`}
            className={`relative rounded-[14px] border bg-app-elevated p-3 ${
              isTemplate ? 'border-orange/35' : 'border-app-subtle'
            }`}
          >
            {repeatMode && !range && !isTemplate && (
              <button
                type="button"
                onClick={() => toggleTimeLock(index)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-[10px] border border-app-subtle bg-app-elevated text-brown-muted transition hover:border-orange/35 hover:text-orange"
                aria-label={isLockedFollower ? 'Unlock to customize times' : 'Lock to match template times'}
                title={isLockedFollower ? 'Unlock to customize times' : 'Lock to match template times'}
              >
                {isLockedFollower ? <Lock size={14} aria-hidden /> : <LockOpen size={14} aria-hidden />}
              </button>
            )}

            <div className="flex items-start justify-between gap-2">
              <div className={`flex-1 space-y-2 ${repeatMode && !isTemplate && !range ? 'pr-10' : ''}`}>
                {range ? (
                  <div>
                    <FieldLabel>Date range</FieldLabel>
                    <p className={`${appFieldClass} py-2 text-xs font-bold`}>
                      {formatBlockDateRange(occ.date, occ.dateEnd!)}
                    </p>
                    <p className="mt-1 text-[10px] text-brown-muted">
                      {formatOccurrenceDateLabel(occ)} — one ticket, one event
                    </p>
                  </div>
                ) : timeSlotMode ? (
                  <div>
                    <FieldLabel>Time slot {index + 1}</FieldLabel>
                    <p className={`${appFieldClass} py-2 text-xs font-bold`}>
                      {formatOccurrenceDateLabel(occ)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <FieldLabel>{isTemplate ? 'Template day' : 'Date'}</FieldLabel>
                      {isTemplate && (
                        <span className="rounded-full bg-orange/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-orange">
                          Template
                        </span>
                      )}
                      {isLockedFollower && (
                        <span className="text-[9px] font-medium text-brown-muted">Same times as template</span>
                      )}
                    </div>
                    <div className="relative">
                      <Calendar
                        size={14}
                        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-brown-muted"
                      />
                      <input
                        type="date"
                        value={occ.date}
                        readOnly={repeatMode}
                        disabled={repeatMode}
                        onChange={(e) =>
                          updateOccurrence(index, { date: e.target.value, dateEnd: undefined })
                        }
                        className={`${appFieldClass} w-full py-2 pl-8 pr-2 text-xs font-bold ${
                          repeatMode ? 'cursor-default opacity-90' : ''
                        }`}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-brown-muted">{formatOccurrenceDateLabel(occ)}</p>
                  </div>
                )}
              </div>
              {allowRemove && (list.length > 1 || allowRemoveLast) && !isTemplate && (
                <button
                  type="button"
                  onClick={() => removeOccurrence(index)}
                  className="rounded-[14px] p-2 text-brown-muted transition hover:bg-orange/10 hover:text-maroon"
                  aria-label={timeSlotMode ? 'Remove time slot' : 'Remove date'}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <TimePicker
                label="Start"
                hour={occ.startHour}
                minute={occ.startMinute}
                period={occ.startPeriod}
                disabled={isLockedFollower}
                onChange={(startHour, startMinute, startPeriod) =>
                  updateOccurrence(index, { startHour, startMinute, startPeriod })
                }
              />
              <TimePicker
                label="End"
                hour={occ.endHour}
                minute={occ.endMinute}
                period={occ.endPeriod}
                disabled={isLockedFollower}
                onChange={(endHour, endMinute, endPeriod) =>
                  updateOccurrence(index, { endHour, endMinute, endPeriod })
                }
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
