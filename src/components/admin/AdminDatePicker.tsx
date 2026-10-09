import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getStoredAdminTheme } from '../../lib/adminTheme'

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function parseLocalDate(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`)
}

function formatIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d: Date, months: number): Date {
  const next = new Date(d)
  next.setMonth(next.getMonth() + months)
  return next
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function buildMonthGrid(month: Date): (Date | null)[] {
  const first = startOfMonth(month)
  const startPad = first.getDay()
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells: (Date | null)[] = Array.from({ length: startPad }, () => null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function formatDisplayDate(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

type AdminDatePickerProps = {
  value: string
  onChange: (isoDate: string) => void
  className?: string
  id?: string
  required?: boolean
  'aria-labelledby'?: string
}

export default function AdminDatePicker({
  value,
  onChange,
  className = '',
  id,
  required,
  'aria-labelledby': ariaLabelledBy,
}: AdminDatePickerProps) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(
    null,
  )
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(value ? parseLocalDate(value) : new Date()),
  )

  useEffect(() => {
    if (value) setViewMonth(startOfMonth(parseLocalDate(value)))
  }, [value])

  const today = useMemo(() => new Date(), [])
  const cells = useMemo(() => buildMonthGrid(viewMonth), [viewMonth])
  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const adminTheme = getStoredAdminTheme()

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null)
      return
    }

    function positionMenu() {
      const button = buttonRef.current
      if (!button) return
      const rect = button.getBoundingClientRect()
      const menuWidth = Math.max(rect.width, 280)
      const menuHeight = menuRef.current?.offsetHeight ?? 320
      const gap = 4
      const padding = 8

      let top = rect.bottom + gap
      if (top + menuHeight > window.innerHeight - padding) {
        top = Math.max(padding, rect.top - menuHeight - gap)
      }

      let left = rect.left
      left = Math.max(padding, Math.min(left, window.innerWidth - menuWidth - padding))

      setMenuStyle({ top, left, width: menuWidth })
    }

    positionMenu()
    window.addEventListener('scroll', positionMenu, true)
    window.addEventListener('resize', positionMenu)
    return () => {
      window.removeEventListener('scroll', positionMenu, true)
      window.removeEventListener('resize', positionMenu)
    }
  }, [open, viewMonth])

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  function selectDay(d: Date) {
    onChange(formatIsoDate(d))
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-labelledby={ariaLabelledBy}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="admin-input flex w-full min-w-0 items-center justify-between gap-2 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate text-[var(--admin-text)]">
          {value ? formatDisplayDate(value) : 'Select date'}
        </span>
        <Calendar size={16} className="shrink-0 text-[var(--admin-text-muted)]" aria-hidden />
      </button>
      {required && (
        <input
          tabIndex={-1}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          value={value}
          onChange={() => {}}
          required
        />
      )}

      {open &&
        menuStyle &&
        createPortal(
          <div
            ref={menuRef}
            role="dialog"
            aria-label="Choose date"
            data-admin-theme={adminTheme}
            className="admin-shell admin-date-picker-popover"
            style={{
              top: menuStyle.top,
              left: menuStyle.left,
              width: menuStyle.width,
            }}
          >
            <div className="admin-date-picker-header">
              <button
                type="button"
                className="admin-date-picker-nav"
                aria-label="Previous month"
                onClick={() => setViewMonth((m) => addMonths(m, -1))}
              >
                <ChevronLeft size={18} />
              </button>
              <p className="admin-date-picker-month">{monthLabel}</p>
              <button
                type="button"
                className="admin-date-picker-nav"
                aria-label="Next month"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="admin-date-picker-grid">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="admin-date-picker-weekday">
                  {label}
                </div>
              ))}
              {cells.map((d, i) => {
                if (!d) {
                  return <div key={`empty-${i}`} aria-hidden />
                }
                const iso = formatIsoDate(d)
                const selected = value === iso
                const isToday = isSameDay(d, today)
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => selectDay(d)}
                    className={`admin-date-picker-day${selected ? ' admin-date-picker-day-selected' : ''}${isToday && !selected ? ' admin-date-picker-day-today' : ''}`}
                  >
                    {d.getDate()}
                  </button>
                )
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
