import { getFilledSocialLinks } from '../../lib/hostSocialLinks'
import type { PersonalHostSocialLinks } from '../../lib/personalHostProfile'
import { HOST_SOCIAL_FIELD_ICONS, HOST_SOCIAL_FIELD_LABELS } from './hostSocialIcons'

type HostProfileSocialLinksProps = {
  social: PersonalHostSocialLinks
  /** Keep a horizontal icon row even when no links are set (host dashboard card). */
  reserveSpace?: boolean
  align?: 'center' | 'start'
  size?: 'default' | 'lg'
  className?: string
}

const SIZE_STYLES = {
  default: { button: 'h-7 w-7', icon: 14, minHeight: 'min-h-7' },
  lg: { button: 'h-9 w-9', icon: 18, minHeight: 'min-h-9' },
} as const

export default function HostProfileSocialLinks({
  social,
  reserveSpace = false,
  align = 'center',
  size = 'default',
  className = '',
}: HostProfileSocialLinksProps) {
  const links = getFilledSocialLinks(social)
  const { button, icon, minHeight } = SIZE_STYLES[size]
  const spacingClass = className || 'mt-2.5'

  if (links.length === 0 && !reserveSpace) return null

  if (links.length === 0) {
    return <div className={`${minHeight} ${spacingClass}`} aria-hidden />
  }

  return (
    <div
      className={`${spacingClass} flex ${minHeight} flex-wrap items-center gap-2 ${
        align === 'start' ? 'justify-start' : 'justify-center'
      }`}
    >
      {links.map(({ id, url }) => {
        const Icon = HOST_SOCIAL_FIELD_ICONS[id]
        return (
          <a
            key={id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={HOST_SOCIAL_FIELD_LABELS[id]}
            className={`flex ${button} items-center justify-center rounded-[14px] border border-brown/10 text-brown-muted no-underline transition hover:border-orange/30 hover:text-orange`}
          >
            <Icon size={icon} />
          </a>
        )
      })}
    </div>
  )
}
