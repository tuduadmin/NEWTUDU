import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { appFieldClassWithIcon, appFieldClassWithIconLg } from '../lib/formFieldClasses'

type FormFieldProps = {
  id: string
  label: string
  error?: string
  children: ReactNode
  variant?: 'light' | 'dark'
}

export function FormField({ id, label, error, children, variant = 'light' }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className={`block text-sm font-medium ${variant === 'dark' ? 'text-white/72' : 'text-brown'}`}
      >
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

type IconInputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon: ReactNode
  error?: boolean
  dark?: boolean
}

export function IconInput({ icon, error, dark, className = '', id, ...props }: IconInputProps) {
  const baseClass = dark
    ? `w-full rounded-[14px] border bg-midnight py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-white/30 focus:border-magenta/50 focus:ring-1 focus:ring-magenta/30 ${
        error ? 'border-error' : 'border-white/[0.08]'
      }`
    : `${appFieldClassWithIconLg} ${
        error ? 'border-red-500' : ''
      }`

  return (
    <div className="relative">
      <span
        className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${dark ? 'text-white/40' : 'text-brown-muted'}`}
      >
        {icon}
      </span>
      <input id={id} aria-invalid={error || undefined} className={`${baseClass} ${className}`} {...props} />
    </div>
  )
}

type PasswordInputProps = Omit<IconInputProps, 'type'> & {
  visible: boolean
  onToggle: () => void
  toggleClassName?: string
}

export function PasswordInput({
  visible,
  onToggle,
  icon,
  error,
  dark,
  className = '',
  toggleClassName = '',
  id,
  ...props
}: PasswordInputProps) {
  const baseClass = dark
    ? `w-full rounded-[14px] border bg-midnight py-3.5 pl-12 pr-12 text-white outline-none transition placeholder:text-white/30 focus:border-magenta/50 focus:ring-1 focus:ring-magenta/30 ${
        error ? 'border-error' : 'border-white/[0.08]'
      }`
    : `${appFieldClassWithIconLg} pr-12 ${
        error ? 'border-red-500' : ''
      }`

  return (
    <div className="relative">
      <span
        className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${dark ? 'text-white/40' : 'text-brown-muted'}`}
      >
        {icon}
      </span>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        aria-invalid={error || undefined}
        className={`${baseClass} ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={onToggle}
        className={`absolute right-3 top-1/2 -translate-y-1/2 ${
          toggleClassName ||
          (dark ? 'text-white/40 hover:text-white' : 'text-brown-muted hover:text-brown')
        }`}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}

type IconSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  icon: ReactNode
  error?: boolean
  dark?: boolean
}

export function IconSelect({ icon, error, dark, className = '', id, children, ...props }: IconSelectProps) {
  const baseClass = dark
    ? `w-full appearance-none rounded-[14px] border bg-midnight py-3.5 pl-12 pr-10 text-white outline-none transition focus:border-magenta/50 focus:ring-1 focus:ring-magenta/30 ${
        error ? 'border-error' : 'border-white/[0.08]'
      }`
    : `${appFieldClassWithIcon} pr-10 ${
        error ? 'border-red-500' : ''
      }`

  return (
    <div className="relative">
      <span
        className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${dark ? 'text-white/40' : 'text-brown-muted'}`}
      >
        {icon}
      </span>
      <select id={id} aria-invalid={error || undefined} className={`${baseClass} ${className}`} {...props}>
        {children}
      </select>
      <span
        className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 ${dark ? 'text-white/40' : 'text-brown-muted'}`}
      >
        â–¾
      </span>
    </div>
  )
}

export function SectionLabel({
  icon,
  children,
  variant = 'light',
}: {
  icon: ReactNode
  children: ReactNode
  variant?: 'light' | 'dark'
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-sunset-orange">{icon}</span>
      <h2 className={`text-base font-bold ${variant === 'dark' ? 'text-white' : 'text-brown'}`}>{children}</h2>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function EnvelopeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16v16H4z" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  )
}

export function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

export function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

export function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function CakeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-8a2 2 0 00-2-2H6a2 2 0 00-2 2v8" />
      <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" />
      <path d="M2 21h20" />
      <path d="M7 8v3M12 8v3M17 8v3" />
      <path d="M7 4h.01M12 4h.01M17 4h.01" />
    </svg>
  )
}

export function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
