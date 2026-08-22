import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { FieldHelper } from './CreateEventLayout'

type RangeSelection = { start: string; end: string }

type EventCalendarPickerProps = {
  mode: 'single' | 'multi'
  selected: string | string[]
  onChange: (value: string | string[]) => void
  /** When true, drag across days to select a contiguous range (multiple-day mode). */
  enableRangeDrag?: boolean
  onRangeSelect?: (start: string, end: string) => void
  /** Drag-created ranges â€” connected bar styling only within each block. */
  rangeSelections?: RangeSelection[]
  /** When false, multi-select keeps tap order instead of sorting by date. */
  sortSelected?: boolean
  minDate?: string
  compact?: boolean
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function parseLocalDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`)
}

function formatDateString(d: Date): string {
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
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function normalizeRange(start: string, end: string): [string, string] {
  return start <= end ? [start, end] : [end, start]
}

function datesInRange(start: string, end: string): Set<string> {
  const [from, to] = normalizeRange(start, end)
  const set = new Set<string>()
  let cursor = parseLocalDate(from)
  const last = parseLocalDate(to)
  while (cursor <= last) {
    set.add(formatDateString(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return set
}

function addDaysString(dateStr: string, delta: number): string {
  const d = parseLocalDate(dateStr)
  d.setDate(d.getDate() + delta)
  return formatDateString(d)
}

function isDateInRanges(dateStr: string, ranges: RangeSelection[]): boolean {
  for (const range of ranges) {
    const [from, to] = normalizeRange(range.start, range.end)
    if (dateStr >= from && dateStr <= to) return true
  }
  return false
}

function getRangeConnections(
  dateStr: string,
  cellIndex: number,
  connectedSet: Set<string>,
): { connectLeft: boolean; connectRight: boolean } {
  if (!connectedSet.has(dateStr)) {
    return { connectLeft: false, connectRight: false }
  }
  const col = cellIndex % 7
  return {
    connectLeft: col > 0 && connectedSet.has(addDaysString(dateStr, -1)),
    connectRight: col < 6 && connectedSet.has(addDaysString(dateStr, 1)),
  }
}

export default function EventCalendarPicker({
  mode,
  selected,
  onChange,
  enableRangeDrag = false,
  onRangeSelect,
  rangeSelections = [],
  sortSelected = true,
  minDate,
  compact = true,
}: EventCalendarPickerProps) {
  const selectedSet = useMemo(() => {
    const dates = Array.isArray(selected) ? selected : selected ? [selected] : []
    return new Set(dates.filter(Boolean))
  }, [selected])

  const initialMonth = useMemo(() => {
    const first = Array.isArray(selected) ? selected.filter(Boolean).sort()[0] : selected
    if (first) return startOfMonth(parseLocalDate(first))
    return startOfMonth(new Date())
  }, [])

  const [viewMonth, setViewMonth] = useState(initialMonth)
  const [dragAnchor, setDragAnchor] = useState<string | null>(null)
  const [dragHover, setDragHover] = useState<string | null>(null)
  const draggingRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)
  const today = useMemo(() => new Date(), [])
  const min = minDate ? parseLocalDate(minDate) : null
  const cells = useMemo(() => buildMonthGrid(viewMonth), [viewMonth])

  const dragPreviewSet = useMemo(() => {
    if (!dragAnchor || !dragHover) return new Set<string>()
    return datesInRange(dragAnchor, dragHover)
  }, [dragAnchor, dragHover])

  const connectedSet = useMemo(() => {
    const set = new Set<string>()
    for (const range of rangeSelections) {
      for (const date of datesInRange(range.start, range.end)) {
        set.add(date)
      }
    }
    for (const date of dragPreviewSet) {
      set.add(date)
    }
    return set
  }, [rangeSelections, dragPreviewSet])

  const monthLabel = viewMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  const padClass = compact ? 'p-2.5' : 'p-4'
  const dayHeightClass = compact ? 'h-9' : 'aspect-square'
  const dayTextClass = compact ? 'text-[14px]' : 'text-sm'
  const headerTextClass = compact ? 'text-[11px] py-1' : 'text-xs py-1.5'
  const navBtnClass = compact ? 'p-1.5' : 'p-2'
  const navIconSize = compact ? 20 : 22

  function isDisabled(d: Date): boolean {
    if (min && d < min) return true
    return false
  }

  function dateFromPointerTarget(target: EventTarget | null): string | null {
    if (!(target instanceof Element)) return null
    const button = target.closest('[data-date]')
    return button?.getAttribute('data-date') ?? null
  }

  function updateDragHover(dateStr: string | null) {
    if (!dateStr || dateStr === dragHover) return
    const d = parseLocalDate(dateStr)
    if (isDisabled(d)) return
    setDragHover(dateStr)
  }

  function toggleMultiDay(dateStr: string) {
    const next = new Set(selectedSet)
    if (next.has(dateStr)) {
      next.delete(dateStr)
    } else {
      next.add(dateStr)
    }
    onChange(sortSelected ? [...next].sort() : [...next])
  }

  function finishDrag() {
    if (dragAnchor && dragHover) {
      if (dragAnchor === dragHover) {
        toggleMultiDay(dragAnchor)
      } else if (onRangeSelect) {
        const [start, end] = normalizeRange(dragAnchor, dragHover)
        onRangeSelect(start, end)
      }
    }
    draggingRef.current = false
    pointerIdRef.current = null
    setDragAnchor(null)
    setDragHover(null)
  }

  function handleDayPointerDown(e: React.PointerEvent<HTMLButtonElement>, d: Date) {
    if (isDisabled(d)) return
    const dateStr = formatDateString(d)

    if (mode === 'multi' && enableRangeDrag && onRangeSelect) {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      pointerIdRef.current = e.pointerId
      draggingRef.current = true
      setDragAnchor(dateStr)
      setDragHover(dateStr)
      return
    }

    // Non-drag modes rely on onClick only â€” calling handleDayClick here too would toggle twice.
  }

  function handleGridPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || !dragAnchor) return
    updateDragHover(dateFromPointerTarget(e.target))
  }

  function handleDayPointerEnter(d: Date) {
    if (!draggingRef.current || !dragAnchor || isDisabled(d)) return
    setDragHover(formatDateString(d))
  }

  function handleDayClick(d: Date) {
    if (isDisabled(d)) return
    const dateStr = formatDateString(d)

    if (mode === 'single') {
      onChange(dateStr)
      return
    }

    const next = new Set(selectedSet)
    if (next.has(dateStr)) {
      next.delete(dateStr)
    } else {
      next.add(dateStr)
    }
    onChange(sortSelected ? [...next].sort() : [...next])
  }

  const dayTransitionClass = 'transition-[color,background-color,box-shadow,transform] duration-150'

  function dayCellClassName(
    dateStr: string,
    cellIndex: number,
    disabled: boolean,
    isToday: boolean,
  ): string {
    const isSelected = selectedSet.has(dateStr)
    const isDragPreview = dragPreviewSet.has(dateStr)
    const inCommittedRange = isDateInRanges(dateStr, rangeSelections)
    const useConnectedStyle =
      isDragPreview || (isSelected && inCommittedRange)
    const isHighlighted = isSelected || isDragPreview
    const { connectLeft, connectRight } = getRangeConnections(dateStr, cellIndex, connectedSet)
    const widthClass = useConnectedStyle ? 'w-full' : compact ? 'w-9' : 'w-full'
    const centerClass = useConnectedStyle ? '' : 'mx-auto '
    const baseClass = `${centerClass}flex items-center justify-center font-bold ${dayTransitionClass} ${dayHeightClass} ${widthClass} ${dayTextClass}`

    if (disabled) {
      return `${baseClass} cursor-not-allowed rounded-[14px] text-brown-muted/35`
    }

    if (isHighlighted) {
      const previewOnly = isDragPreview && !isSelected
      let shapeClass = 'rounded-[14px]'
      if (useConnectedStyle) {
        if (connectLeft && connectRight) shapeClass = 'rounded-none'
        else if (connectLeft) shapeClass = 'rounded-r-full'
        else if (connectRight) shapeClass = 'rounded-l-full'
        else shapeClass = 'rounded-[14px]'
      }

      const fillClass = previewOnly
        ? 'bg-orange/30 text-orange'
        : useConnectedStyle
          ? 'bg-orange/20 text-orange'
          : 'bg-orange text-white shadow-sm active:scale-95'

      return `${baseClass} ${shapeClass} ${fillClass}`
    }

    if (isToday) {
      return `${baseClass} rounded-[14px] ring-2 ring-orange/35 ring-inset text-orange hover:bg-orange/10`
    }

    return `${baseClass} rounded-[14px] text-brown hover:bg-brown/5`
  }

  return (
    <div
      className={`rounded-[14px] border border-app-subtle bg-app-elevated shadow-sm ${padClass}`}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      <div
        className={`flex items-center justify-between border-b border-app-subtle ${compact ? 'mb-2 pb-2' : 'mb-4 pb-3'}`}
      >
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
          className={`rounded-[14px] ${navBtnClass} text-brown-muted transition-colors duration-150 hover:bg-brown/5 hover:text-orange active:scale-95`}
          aria-label="Previous month"
        >
          <ChevronLeft size={navIconSize} />
        </button>
        <p
          className={`font-display font-semibold tracking-tight text-brown ${compact ? 'text-sm' : 'text-base'}`}
        >
          {monthLabel}
        </p>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className={`rounded-[14px] ${navBtnClass} text-brown-muted transition-colors duration-150 hover:bg-brown/5 hover:text-orange active:scale-95`}
          aria-label="Next month"
        >
          <ChevronRight size={navIconSize} />
        </button>
      </div>

      <div
        className={`grid grid-cols-7 text-center ${compact ? 'gap-1' : 'gap-1.5'} touch-none select-none`}
        onPointerMove={handleGridPointerMove}
      >
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className={`font-semibold uppercase tracking-wider text-brown-muted ${headerTextClass}`}
          >
            {label}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) {
            return <div key={`empty-${i}`} aria-hidden />
          }
          const dateStr = formatDateString(d)
          const isToday = isSameDay(d, today)
          const disabled = isDisabled(d)

          return (
            <button
              key={dateStr}
              type="button"
              data-date={dateStr}
              disabled={disabled}
              onPointerDown={(e) => {
                if (enableRangeDrag) e.preventDefault()
                handleDayPointerDown(e, d)
              }}
              onPointerEnter={() => handleDayPointerEnter(d)}
              onClick={() => {
                if (!enableRangeDrag) handleDayClick(d)
              }}
              className={dayCellClassName(dateStr, i, disabled, isToday)}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>

      {mode === 'multi' && selectedSet.size > 0 && (
        <FieldHelper className={`text-center ${compact ? 'mt-2' : 'mt-4'}`}>
          {selectedSet.size} day{selectedSet.size === 1 ? '' : 's'} selected
          {enableRangeDrag ? ' — tap to add or remove, drag for a range' : ' — tap again to remove'}
        </FieldHelper>
      )}
    </div>
  )
}
