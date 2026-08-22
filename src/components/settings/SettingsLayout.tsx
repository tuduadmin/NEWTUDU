import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { BackLink } from '../NavActionButtons'
import AppHeaderBar from '../locked/AppHeaderBar'
import BottomNav from '../BottomNav'
import { appFieldClass } from '../../lib/formFieldClasses'

type SettingsLayoutProps = {
  title?: string
  subtitle?: string
  backTo?: string
  backLabel?: string
  children: React.ReactNode
  showTitle?: boolean
}

export default function SettingsLayout({
  title,
  subtitle,
  backTo = '/my-tudu/settings',
  backLabel = 'Back to My Settings',
  children,
  showTitle = true,
}: SettingsLayoutProps) {
  return (
    <div className="my-settings-shell app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/my-tudu" />

      <main className="space-y-4 px-4 pt-3">
        <BackLink to={backTo} variant="chevron">
          {backLabel}
        </BackLink>

        {showTitle && title && (
          <div className="text-center">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-gradient">
              {title}
            </h1>
            {subtitle && <p className="mt-1 text-sm text-brown-muted">{subtitle}</p>}
          </div>
        )}

        {children}
      </main>

      <BottomNav />
    </div>
  )
}

type SettingsNavRowProps = {
  to: string
  icon: React.ReactNode
  title: string
  description: string
  iconBg?: string
}

export function SettingsNavRow({
  to,
  icon,
  title,
  description,
  iconBg = 'bg-cream-dark',
}: SettingsNavRowProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 border-b border-app-subtle px-4 py-3.5 no-underline transition last:border-b-0 hover:bg-app-elevated/60"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${iconBg} text-lg`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-brown">{title}</p>
        <p className="truncate text-xs text-brown-muted">{description}</p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-brown-muted/60" />
    </Link>
  )
}

type SettingsCardProps = {
  children: React.ReactNode
  className?: string
}

export function SettingsCard({ children, className = '' }: SettingsCardProps) {
  return (
    <section className={`app-surface-card host-edit-profile-panel border border-app-subtle ${className}`}>
      {children}
    </section>
  )
}

type SettingsSectionTitleProps = {
  children: React.ReactNode
  icon?: React.ReactNode
}

export function SettingsSectionTitle({ children, icon }: SettingsSectionTitleProps) {
  return (
    <h2 className="flex items-center gap-2 px-1 text-base font-bold text-brown">
      {icon}
      {children}
    </h2>
  )
}

type SettingsToggleRowProps = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function SettingsToggleRow({ label, checked, onChange }: SettingsToggleRowProps) {
  return (
    <label className="app-surface-card flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 transition hover:border-orange/20">
      <span className="text-sm font-medium text-brown">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 rounded border-brown/20 accent-[#2563eb]"
      />
    </label>
  )
}

type SettingsAccordionProps = {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

export function SettingsAccordion({
  title,
  icon,
  children,
  defaultOpen = false,
}: SettingsAccordionProps) {
  return (
    <details
      className="group app-surface-card host-edit-profile-panel rounded-tudu-lg border border-app-subtle shadow-sm"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3.5 text-sm font-semibold text-brown [&::-webkit-details-marker]:hidden">
        {icon}
        <span className="flex-1">{title}</span>
        <ChevronRight
          size={16}
          className="text-brown-muted transition group-open:rotate-90"
        />
      </summary>
      <div className="border-t border-app-subtle px-4 py-3 text-sm leading-relaxed text-brown-muted">
        {children}
      </div>
    </details>
  )
}

export function SettingsInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  readOnly,
  icon,
}: {
  label: string
  type?: string
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  readOnly?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-brown-muted">{label}</label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brown-muted">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          className={`${appFieldClass} py-3 ${icon ? 'pl-10 pr-10' : ''} ${
            readOnly ? 'cursor-default bg-app-surface opacity-90' : ''
          }`}
        />
      </div>
    </div>
  )
}
