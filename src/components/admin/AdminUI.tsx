import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical } from 'lucide-react'
import {
  EVENT_CARD_BORDER_CSS,
  EVENT_CARD_BORDER_LEGEND_GROUPS,
  EVENT_CARD_BORDER_LABELS,
  SEED_BORDER_PICKER_GROUPS,
  formatBorderColorCode,
  getBorderLegendAccentStyle,
  type EventCardBorderLegendGroup,
  type EventCardBorderType,
} from '../../lib/eventCardColors'
import { BRAND_TOKENS } from '../../lib/brandTokens'

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[var(--admin-border)] pb-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[var(--admin-text)]">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function AdminKpiGrid({ children }: { children: ReactNode }) {
  return <div className="admin-kpi-grid">{children}</div>
}

export function AdminKpi({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'neutral'
}) {
  const accentClass =
    accent === 'emerald'
      ? 'text-[var(--admin-success)]'
      : accent === 'amber'
        ? 'text-[var(--admin-warning)]'
        : accent === 'rose'
          ? 'text-[var(--admin-danger)]'
          : accent === 'neutral'
            ? 'text-[var(--admin-text-muted)]'
            : 'text-[var(--admin-accent)]'

  return (
    <div className="admin-kpi">
      <p className="admin-label">{label}</p>
      <p className={`admin-kpi-value mt-1 ${accentClass}`}>{value}</p>
    </div>
  )
}

export function AdminBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'emerald' | 'amber' | 'rose' | 'cyan' | 'neutral'
}) {
  return <span className={`admin-badge admin-badge-${tone}`}>{children}</span>
}

export function AdminButton({
  children,
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  to?: string
}) {
  const variantClass =
    variant === 'primary'
      ? 'admin-btn-primary'
      : variant === 'ghost'
        ? 'admin-btn-ghost'
        : variant === 'danger'
          ? 'admin-btn-danger'
          : 'admin-btn-secondary'

  return (
    <button type={type} className={`admin-btn ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function AdminInput({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`admin-input w-full min-w-0 ${className}`.trim()} {...props} />
}

export function AdminSelect({
  className = '',
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`admin-input admin-select bg-[var(--admin-surface-raised)] text-[var(--admin-text)] ${className}`}
      {...props}
    />
  )
}

export function AdminFilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2">
      {children}
    </div>
  )
}

export function AdminPanel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`admin-panel p-3 ${className}`}>{children}</div>
}

export function AdminTable({
  columns,
  children,
}: {
  columns: string[]
  children: ReactNode
}) {
  return (
    <div className="admin-table-wrap admin-panel !p-0">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function AdminManageButton({
  onClick,
  label = 'Manage',
}: {
  onClick: () => void
  label?: string
}) {
  return (
    <AdminButton variant="secondary" className="px-2 py-1 text-xs" onClick={onClick}>
      {label}
    </AdminButton>
  )
}

export function AdminRowMenu({
  items,
}: {
  items: { label: string; onClick: () => void; danger?: boolean }[]
}) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setMenuStyle(null)
      return
    }

    function positionMenu() {
      const button = buttonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const menuWidth = Math.max(160, menuRef.current?.offsetWidth ?? 160)
      const menuHeight = menuRef.current?.offsetHeight ?? items.length * 34 + 8
      const gap = 4
      const padding = 8

      let top = rect.bottom + gap
      if (top + menuHeight > window.innerHeight - padding) {
        top = Math.max(padding, rect.top - menuHeight - gap)
      }

      let left = rect.right - menuWidth
      left = Math.max(padding, Math.min(left, window.innerWidth - menuWidth - padding))

      setMenuStyle({ top, left })
    }

    positionMenu()
    window.addEventListener('scroll', positionMenu, true)
    window.addEventListener('resize', positionMenu)
    return () => {
      window.removeEventListener('scroll', positionMenu, true)
      window.removeEventListener('resize', positionMenu)
    }
  }, [open, items])

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

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="admin-btn admin-btn-ghost px-1.5 py-1"
        aria-label="Row actions"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical size={16} />
      </button>
      {open &&
        menuStyle &&
        createPortal(
          <div
            ref={menuRef}
            className="admin-menu admin-menu-portal"
            style={{ top: menuStyle.top, left: menuStyle.left }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`admin-menu-item ${item.danger ? 'admin-menu-item-danger' : ''}`}
                onClick={() => {
                  setOpen(false)
                  item.onClick()
                }}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}

export function AdminDrawer({
  open,
  title,
  onClose,
  children,
  footer,
  wide = false,
  xwide = false,
  centered = false,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
  xwide?: boolean
  centered?: boolean
}) {
  if (!open) return null

  const sizeClass = xwide
    ? centered
      ? 'admin-drawer-centered-xwide'
      : 'admin-drawer-xwide'
    : wide
      ? centered
        ? 'admin-drawer-centered-wide'
        : 'admin-drawer-wide'
      : ''

  const panelClass = centered
    ? `admin-drawer-centered ${sizeClass}`.trim()
    : `admin-drawer ${sizeClass}`.trim()

  const headerClass = centered
    ? 'flex items-center justify-between border-b border-[var(--admin-border)] px-6 py-4'
    : 'flex items-center justify-between border-b border-[var(--admin-border)] px-4 py-3'

  const bodyClass = centered
    ? 'flex-1 overflow-auto px-6 py-6'
    : 'flex-1 overflow-auto p-4'

  const footerClass = centered
    ? 'border-t border-[var(--admin-border)] px-6 py-4'
    : 'border-t border-[var(--admin-border)] px-4 py-3'

  return (
    <>
      <div className="admin-drawer-backdrop" onClick={onClose} aria-hidden />
      <div
        className={panelClass}
        role="dialog"
        aria-modal
        aria-label={title}
      >
        <div className={headerClass}>
          <h2 className="text-sm font-semibold">{title}</h2>
          <AdminButton variant="ghost" onClick={onClose}>
            Close
          </AdminButton>
        </div>
        <div className={bodyClass}>{children}</div>
        {footer && <div className={footerClass}>{footer}</div>}
      </div>
    </>
  )
}

export function AdminActivityFeed({
  entries,
}: {
  entries: { id: string; label: string; timestamp: string; type: string }[]
}) {
  return (
    <AdminPanel>
      <p className="admin-label mb-2">Recent activity</p>
      <ul className="space-y-2">
        {entries.length === 0 && (
          <li className="text-xs text-[var(--admin-text-dim)]">No activity logged yet.</li>
        )}
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex items-start justify-between gap-3 border-b border-[var(--admin-border-subtle)] pb-2 last:border-0 last:pb-0"
          >
            <div>
              <p className="text-xs text-[var(--admin-text)]">{entry.label}</p>
              <p className="text-[10px] uppercase tracking-wide text-[var(--admin-text-dim)]">
                {entry.type.replace('_', ' ')}
              </p>
            </div>
            <time className="admin-tabular shrink-0 text-[10px] text-[var(--admin-text-muted)]">
              {new Date(entry.timestamp).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </time>
          </li>
        ))}
      </ul>
    </AdminPanel>
  )
}

export function AdminConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null

  return (
    <>
      <div className="admin-drawer-backdrop" onClick={onCancel} aria-hidden />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-xl"
        role="alertdialog"
        aria-modal
        aria-labelledby="admin-confirm-title"
      >
        <div className="border-b border-[var(--admin-border)] px-4 py-3">
          <h2 id="admin-confirm-title" className="text-sm font-semibold text-[var(--admin-text)]">
            {title}
          </h2>
        </div>
        <p className="px-4 py-3 text-xs leading-relaxed text-[var(--admin-text-muted)]">{message}</p>
        <div className="flex justify-end gap-2 border-t border-[var(--admin-border)] px-4 py-3">
          <AdminButton variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </AdminButton>
          <AdminButton
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AdminButton>
        </div>
      </div>
    </>
  )
}

export function AdminDemographicsPanel({
  byCity,
  byAgeBracket,
  byGender,
}: {
  byCity: { city: string; count: number }[]
  byAgeBracket: { label: string; count: number }[]
  byGender: { label: string; count: number }[]
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <BreakdownTable title="Users by city" rows={byCity.map((r) => ({ label: r.city, count: r.count }))} />
      <BreakdownTable title="Users by age bracket" rows={byAgeBracket} />
      <BreakdownTable title="Users by gender" rows={byGender} />
    </div>
  )
}

function BreakdownTable({
  title,
  rows,
}: {
  title: string
  rows: { label: string; count: number }[]
}) {
  const max = Math.max(1, ...rows.map((r) => r.count))

  return (
    <AdminPanel>
      <p className="admin-label mb-2">{title}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-[var(--admin-text-dim)]">No data yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="mb-0.5 flex justify-between text-xs">
                <span className="text-[var(--admin-text)]">{row.label}</span>
                <span className="admin-tabular text-[var(--admin-text-muted)]">{row.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-[2px] bg-[var(--admin-bg)]">
                <div
                  className="h-full bg-[var(--admin-accent)]"
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminPanel>
  )
}

export function EventCardBorderLegend({ className = '' }: { className?: string }) {
  function renderGroup(group: EventCardBorderLegendGroup) {
    return (
      <div key={group.title}>
        <p className="admin-label mb-2">{group.title}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {group.items.map((item) => {
            const defaults = EVENT_CARD_BORDER_LABELS[item.type]
            const label = item.label ?? defaults.label
            const description = item.description ?? defaults.description
            const { accent, swatch } = getBorderLegendAccentStyle(item.type)
            const hex =
              item.type === 'tuduBlack'
                ? `${formatBorderColorCode(BRAND_TOKENS.tudu.black)} + ${formatBorderColorCode(BRAND_TOKENS.tudu.premiumGold)}`
                : formatBorderColorCode(EVENT_CARD_BORDER_CSS[item.type])
            return (
              <div
                key={`${group.title}-${item.type}-${label}`}
                title={description}
                className="flex w-full items-center gap-2 rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2.5 py-2"
                style={{ borderLeft: `3px solid ${accent}` }}
              >
                <span
                  className="inline-block h-3.5 w-3.5 shrink-0 rounded-[2px] ring-1 ring-[var(--admin-border-subtle)]"
                  style={swatch}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-[var(--admin-text)]">{label}</p>
                  <p className="admin-tabular truncate text-[10px] text-[var(--admin-text-dim)]">
                    {hex}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {EVENT_CARD_BORDER_LEGEND_GROUPS.map((group) => renderGroup(group))}
    </div>
  )
}

export function AdminBorderTypePicker({
  value,
  onChange,
  className = '',
}: {
  value: EventCardBorderType
  onChange: (type: EventCardBorderType) => void
  className?: string
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {SEED_BORDER_PICKER_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="admin-label mb-1.5">{group.title}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {group.options.map((option) => {
              const { swatch } = getBorderLegendAccentStyle(option.type)
              const selected = value === option.type
              return (
                <button
                  key={`${group.title}-${option.type}`}
                  type="button"
                  onClick={() => onChange(option.type)}
                  className={`flex w-full items-center gap-2 rounded-[var(--admin-radius)] border px-2.5 py-2 text-left transition ${
                    selected
                      ? 'border-[var(--admin-accent)] bg-[var(--admin-accent-muted)]'
                      : 'border-[var(--admin-border)] bg-[var(--admin-surface)] hover:border-[var(--admin-text-dim)]'
                  }`}
                >
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-[var(--admin-border-subtle)]"
                    style={swatch}
                    aria-hidden
                  />
                  <span className="truncate text-xs font-medium text-[var(--admin-text)]">
                    {option.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
