import { Fragment } from 'react'
import type { ReactNode } from 'react'
import { Globe, Mail, MapPin, Phone } from 'lucide-react'
import { formatStoredPhone, parsePhoneDigits } from '../../lib/phoneFormat'
import { normalizeSocialUrl } from '../../lib/hostSocialLinks'
import type { HostContactInfo } from '../../lib/personalHostProfile'

type PublicProfileContactProps = {
  contact: HostContactInfo
  website?: string
  compact?: boolean
}

function phoneTelHref(phone: string): string {
  const digits = parsePhoneDigits(phone)
  return digits ? `tel:+1${digits}` : `tel:${phone.replace(/[^\d+]/g, '')}`
}

function formatAddressLine(address?: string, city?: string): string {
  return [address?.trim(), city?.trim()].filter(Boolean).join(', ')
}

function mapsHref(address?: string, city?: string): string {
  const query = formatAddressLine(address, city)
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`
}

function displayWebsite(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

type ContactRowProps = {
  icon: ReactNode
  label: string
  href?: string
  children: ReactNode
  compact?: boolean
}

function ContactRow({ icon, label, href, children, compact = false }: ContactRowProps) {
  const content = compact ? (
    <>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brown/5 text-brown-muted">
        {icon}
      </span>
      <span className="min-w-0 truncate text-xs leading-tight text-brown">{children}</span>
    </>
  ) : (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brown/5 text-brown-muted">
        {icon}
      </span>
      <span className="min-w-0 text-sm leading-snug text-brown">{children}</span>
    </>
  )

  const rowClass = compact
    ? 'flex min-w-0 flex-1 items-center gap-2 rounded-[14px] px-0.5 py-0.5'
    : 'flex items-center gap-3 rounded-[14px] px-1 py-1.5'

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        aria-label={label}
        className={`${rowClass} text-left no-underline transition hover:bg-brown/5`}
      >
        {content}
      </a>
    )
  }

  return (
    <div className={rowClass} aria-label={label}>
      {content}
    </div>
  )
}

export default function PublicProfileContact({
  contact,
  website,
  compact = false,
}: PublicProfileContactProps) {
  const phone = contact.phone?.trim()
  const displayPhone = phone ? formatStoredPhone(phone) : ''
  const email = contact.email?.trim()
  const address = contact.address?.trim()
  const city = contact.city?.trim()
  const addressLine = formatAddressLine(address, city)
  const websiteUrl = website?.trim() ? normalizeSocialUrl(website.trim()) : ''

  const hasContact = phone || email || addressLine || websiteUrl
  if (!hasContact) return null

  const iconSize = compact ? 13 : 16

  if (compact) {
    type CompactItem = { key: string; label: string; href: string; text: string }

    const secondaryItems: CompactItem[] = []
    if (phone) {
      secondaryItems.push({
        key: 'phone',
        label: `Call ${displayPhone}`,
        href: phoneTelHref(phone),
        text: displayPhone,
      })
    }
    if (email) {
      secondaryItems.push({
        key: 'email',
        label: `Email ${email}`,
        href: `mailto:${email}`,
        text: email,
      })
    }
    if (websiteUrl) {
      secondaryItems.push({
        key: 'website',
        label: 'Website',
        href: websiteUrl,
        text: displayWebsite(websiteUrl),
      })
    }

    const linkClass =
      'no-underline transition hover:text-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/30 focus-visible:rounded-sm'

    return (
      <div className="mt-3 w-full text-center">
        {addressLine && (
          <p className="mx-auto max-w-full px-1">
            <a
              href={mapsHref(address, city)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Address: ${addressLine}`}
              className={`inline-block max-w-full truncate text-xs leading-relaxed text-brown-muted ${linkClass}`}
            >
              {addressLine}
            </a>
          </p>
        )}

        {secondaryItems.length > 0 && (
          <p
            className={`mx-auto flex max-w-full flex-wrap items-center justify-center px-1 text-[11px] leading-relaxed text-brown-muted/70 ${
              addressLine ? 'mt-1.5' : ''
            }`}
          >
            {secondaryItems.map((item, index) => (
              <Fragment key={item.key}>
                {index > 0 && (
                  <span className="select-none px-1.5 text-brown-muted/25" aria-hidden>
                    Â·
                  </span>
                )}
                <a
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  aria-label={item.label}
                  className={`min-w-0 truncate ${linkClass}`}
                >
                  {item.text}
                </a>
              </Fragment>
            ))}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="mt-4 w-full max-w-sm">
      <div className="flex flex-col gap-0.5">
        {phone && (
          <ContactRow icon={<Phone size={iconSize} />} label={`Call ${displayPhone}`} href={phoneTelHref(phone)}>
            {displayPhone}
          </ContactRow>
        )}
        {email && (
          <ContactRow icon={<Mail size={iconSize} />} label={`Email ${email}`} href={`mailto:${email}`}>
            {email}
          </ContactRow>
        )}
        {addressLine && (
          <ContactRow
            icon={<MapPin size={iconSize} />}
            label={`Address: ${addressLine}`}
            href={mapsHref(address, city)}
          >
            {addressLine}
          </ContactRow>
        )}
        {websiteUrl && (
          <ContactRow icon={<Globe size={iconSize} />} label="Website" href={websiteUrl}>
            {displayWebsite(websiteUrl)}
          </ContactRow>
        )}
      </div>
    </div>
  )
}
