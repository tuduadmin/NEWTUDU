type RequiredAsteriskProps = {
  /** Use admin danger token on dark admin surfaces. */
  variant?: 'default' | 'admin'
}

export function RequiredAsterisk({ variant = 'default' }: RequiredAsteriskProps) {
  const colorClass = variant === 'admin' ? 'text-[var(--admin-danger)]' : 'text-red-500'

  return (
    <span className={colorClass} aria-hidden="true">
      *
    </span>
  )
}
