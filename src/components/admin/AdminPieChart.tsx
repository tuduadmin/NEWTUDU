import { useMemo, useState } from 'react'
import { AdminPanel } from './AdminUI'

export type PieSlice = {
  label: string
  value: number
  color?: string
}

const PIE_PALETTE = [
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#6366f1',
  '#f43f5e',
  '#8b5cf6',
  '#14b8a6',
  '#64748b',
  '#ec4899',
  '#84cc16',
]

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeSlice(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  if (endAngle - startAngle >= 359.99) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
  }
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`
}

type RenderSlice = PieSlice & {
  color: string
  startAngle: number
  endAngle: number
  percent: number
}

export function AdminPieChart({
  title,
  slices,
  emptyMessage = 'No data yet.',
  className = '',
}: {
  title: string
  slices: PieSlice[]
  emptyMessage?: string
  className?: string
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const { renderSlices, total } = useMemo(() => {
    const filtered = slices.filter((s) => s.value > 0)
    const sum = filtered.reduce((acc, s) => acc + s.value, 0)
    let angle = 0
    const built: RenderSlice[] = filtered.map((slice, i) => {
      const percent = sum > 0 ? (slice.value / sum) * 100 : 0
      const sweep = sum > 0 ? (slice.value / sum) * 360 : 0
      const startAngle = angle
      angle += sweep
      return {
        ...slice,
        color: slice.color ?? PIE_PALETTE[i % PIE_PALETTE.length],
        startAngle,
        endAngle: angle,
        percent,
      }
    })
    return { renderSlices: built, total: sum }
  }, [slices])

  const activeIndex = hoveredIndex ?? (renderSlices.length === 1 ? 0 : null)
  const activeSlice = activeIndex != null ? renderSlices[activeIndex] : null

  return (
    <AdminPanel className={className}>
      <p className="admin-label mb-3">{title}</p>
      {renderSlices.length === 0 || total === 0 ? (
        <p className="text-xs text-[var(--admin-text-dim)]">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative mx-auto shrink-0 sm:mx-0">
            <svg viewBox="0 0 120 120" className="h-32 w-32" role="img" aria-label={title}>
              {renderSlices.map((slice, i) => (
                <path
                  key={slice.label}
                  d={describeSlice(60, 60, 48, slice.startAngle, slice.endAngle)}
                  fill={slice.color}
                  stroke="var(--admin-bg)"
                  strokeWidth={1.5}
                  opacity={activeIndex == null || activeIndex === i ? 1 : 0.45}
                  className="cursor-pointer transition-opacity"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <title>
                    {slice.label}: {slice.value} ({slice.percent.toFixed(1)}%)
                  </title>
                </path>
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              {activeSlice ? (
                <>
                  <span className="text-[10px] font-medium text-[var(--admin-text-muted)]">
                    {activeSlice.label}
                  </span>
                  <span className="admin-tabular text-sm font-semibold text-[var(--admin-accent)]">
                    {activeSlice.value}
                  </span>
                  <span className="admin-tabular text-[10px] text-[var(--admin-text-dim)]">
                    {activeSlice.percent.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[10px] text-[var(--admin-text-dim)]">Total</span>
                  <span className="admin-tabular text-sm font-semibold text-[var(--admin-text)]">
                    {total}
                  </span>
                </>
              )}
            </div>
          </div>

          <ul className="min-w-0 flex-1 space-y-1.5">
            {renderSlices.map((slice, i) => (
              <li
                key={slice.label}
                className={`flex items-center gap-2 rounded-[var(--admin-radius)] px-1 py-0.5 text-xs transition ${
                  activeIndex === i ? 'bg-[var(--admin-accent-muted)]' : ''
                }`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="min-w-0 flex-1 truncate text-[var(--admin-text)]">{slice.label}</span>
                <span className="admin-tabular shrink-0 text-[var(--admin-text-muted)]">
                  {slice.value}
                  <span className="ml-1 text-[var(--admin-text-dim)]">
                    ({slice.percent.toFixed(0)}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AdminPanel>
  )
}

export function AdminBreakdownTable({
  title,
  rows,
  className = '',
}: {
  title: string
  rows: { label: string; count: number; color?: string }[]
  className?: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.count))

  return (
    <AdminPanel className={className}>
      <p className="admin-label mb-2">{title}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-[var(--admin-text-dim)]">No data yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="mb-0.5 flex justify-between text-xs">
                <span className="flex items-center gap-1.5 text-[var(--admin-text)]">
                  {row.color ? (
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                      aria-hidden
                    />
                  ) : null}
                  {row.label}
                </span>
                <span className="admin-tabular text-[var(--admin-text-muted)]">{row.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-[2px] bg-[var(--admin-bg)]">
                <div
                  className="h-full"
                  style={{
                    width: `${(row.count / max) * 100}%`,
                    backgroundColor: row.color ?? 'var(--admin-accent)',
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminPanel>
  )
}
