import { Calendar, CalendarCheck, CalendarDays, CalendarPlus, Clock, Moon, Settings } from 'lucide-react'
import type { HostEventFormData } from '../../lib/account'
import { REPEAT_OPTIONS } from '../../data/eventCategories'
import { FieldLabel } from './CreateEventLayout'

type ScheduleStepProps = {
  form: HostEventFormData
  updateForm: (partial: Partial<HostEventFormData>) => void
}

const EVENT_TYPES = [
  { id: 'single' as const, label: 'Single', sub: 'One day / Repeats', icon: CalendarCheck },
  { id: 'multi-day' as const, label: 'Multi-Day', sub: 'Specific Dates', icon: CalendarDays },
  { id: 'seasonal' as const, label: 'Seasonal', sub: 'Date Range', icon: CalendarPlus },
]

const DURATIONS = [
  { id: 'short' as const, label: 'Short', sub: '15-30 mins', icon: Clock },
  { id: 'medium' as const, label: 'Medium', sub: '1-4 hours', icon: Settings },
  { id: 'long' as const, label: 'Long', sub: '4+ hours', icon: Moon },
]

export default function ScheduleStep({ form, updateForm }: ScheduleStepProps) {
  const repeatsEnabled = form.repeats !== 'none'

  return (
    <section>
      <h2 className="font-display text-xl font-extrabold text-brown">Schedule</h2>
      <p className="mt-1 text-sm leading-relaxed text-brown-muted">
        When is it happening? Set the date, time, and how long guests typically stay.
      </p>

      <div className="mt-5 space-y-5">
        <div>
          <p className="mb-2 text-xs font-semibold text-brown-muted">Event Type</p>
          <div className="grid grid-cols-3 gap-2">
            {EVENT_TYPES.map((type) => {
              const Icon = type.icon
              const selected = form.eventType === type.id
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => updateForm({ eventType: type.id })}
                  className={`rounded-[var(--radius-lg)] border-2 px-2 py-3 text-center transition ${
                    selected ? 'border-orange bg-orange/10' : 'border-brown/10 bg-white hover:border-orange/30'
                  }`}
                >
                  <Icon size={20} className={`mx-auto ${selected ? 'text-orange' : 'text-brown-muted'}`} />
                  <p className={`mt-1.5 text-xs font-bold ${selected ? 'text-orange' : 'text-brown'}`}>{type.label}</p>
                  <p className="mt-0.5 text-[10px] text-brown-muted">{type.sub}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <FieldLabel>Repeats</FieldLabel>
          <select
            value={form.repeats}
            onChange={(e) => updateForm({ repeats: e.target.value as HostEventFormData['repeats'] })}
            className="w-full rounded-[var(--radius-lg)] border border-brown/15 bg-white px-3 py-2.5 text-sm text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
          >
            {REPEAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {repeatsEnabled && (
          <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-lg)] border border-orange/20 bg-orange/5 p-3">
            <div>
              <FieldLabel required>Recurrence Start</FieldLabel>
              <input
                type="date"
                value={form.recurrenceStartDate}
                onChange={(e) => updateForm({ recurrenceStartDate: e.target.value })}
                className="w-full rounded-[var(--radius-lg)] border border-brown/15 bg-white px-3 py-2.5 text-sm text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
              />
            </div>
            <div>
              <FieldLabel required>Recurrence End</FieldLabel>
              <input
                type="date"
                value={form.recurrenceEndDate}
                onChange={(e) => updateForm({ recurrenceEndDate: e.target.value })}
                className="w-full rounded-[var(--radius-lg)] border border-brown/15 bg-white px-3 py-2.5 text-sm text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
              />
            </div>
          </div>
        )}

        <div>
          <FieldLabel required>Date</FieldLabel>
          <div className="relative">
            <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brown-muted" />
            <input
              type="date"
              value={form.eventDate}
              onChange={(e) => updateForm({ eventDate: e.target.value })}
              className="w-full rounded-[var(--radius-lg)] border border-brown/15 bg-white py-2.5 pl-9 pr-3 text-sm text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
            />
          </div>
        </div>

        {!form.allDay && (
          <div className="grid grid-cols-2 gap-3">
            <TimePicker
              label="Start Time"
              hour={form.startHour}
              minute={form.startMinute}
              period={form.startPeriod}
              onChange={(startHour, startMinute, startPeriod) =>
                updateForm({ startHour, startMinute, startPeriod })
              }
            />
            <TimePicker
              label="End Time"
              hour={form.endHour}
              minute={form.endMinute}
              period={form.endPeriod}
              onChange={(endHour, endMinute, endPeriod) => updateForm({ endHour, endMinute, endPeriod })}
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm font-medium text-brown">
          <input
            type="checkbox"
            checked={form.allDay}
            onChange={(e) => updateForm({ allDay: e.target.checked })}
            className="h-4 w-4 rounded border-brown/20 accent-orange"
          />
          All Day Event
        </label>

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
                  className={`rounded-[var(--radius-lg)] border-2 px-2 py-3 text-center transition ${
                    selected ? 'border-orange bg-orange/10' : 'border-brown/10 bg-white hover:border-orange/30'
                  }`}
                >
                  <Icon size={18} className={`mx-auto ${selected ? 'text-orange' : 'text-brown-muted'}`} />
                  <p className={`mt-1.5 text-xs font-bold ${selected ? 'text-orange' : 'text-brown'}`}>{d.label}</p>
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

function TimePicker({
  label,
  hour,
  minute,
  period,
  onChange,
}: {
  label: string
  hour: string
  minute: string
  period: 'AM' | 'PM'
  onChange: (hour: string, minute: string, period: 'AM' | 'PM') => void
}) {
  return (
    <div>
      <FieldLabel required>{label}</FieldLabel>
      <div className="flex items-center gap-1">
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={hour}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 2), minute, period)}
          className="w-10 rounded-md border border-brown/15 bg-white px-1 py-2 text-center text-sm text-brown outline-none focus:border-purple"
        />
        <span className="text-brown-muted">:</span>
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={minute}
          onChange={(e) => onChange(hour, e.target.value.replace(/\D/g, '').slice(0, 2), period)}
          className="w-10 rounded-md border border-brown/15 bg-white px-1 py-2 text-center text-sm text-brown outline-none focus:border-purple"
        />
        <button
          type="button"
          onClick={() => onChange(hour, minute, period === 'AM' ? 'PM' : 'AM')}
          className="rounded-md border border-brown/15 bg-white px-2 py-2 text-xs font-bold text-brown"
        >
          {period}
        </button>
      </div>
    </div>
  )
}
