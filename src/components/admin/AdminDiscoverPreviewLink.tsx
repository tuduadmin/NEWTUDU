import { ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'

type AdminDiscoverPreviewLinkProps = {
  href: string
  variant?: 'primary' | 'secondary'
  className?: string
  showIcon?: boolean
  children?: ReactNode
}

/** Opens Discover user preview in a new tab so Control Room stays open. */
export default function AdminDiscoverPreviewLink({
  href,
  variant = 'primary',
  className = '',
  showIcon = true,
  children = 'Preview on Discover',
}: AdminDiscoverPreviewLinkProps) {
  const variantClass = variant === 'primary' ? 'admin-btn-primary' : 'admin-btn-secondary'

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`admin-btn ${variantClass} inline-flex items-center gap-1.5 no-underline ${className}`.trim()}
      title="Opens in a new tab — Control Room stays open"
    >
      {children}
      {showIcon && <ExternalLink size={14} aria-hidden />}
    </a>
  )
}
