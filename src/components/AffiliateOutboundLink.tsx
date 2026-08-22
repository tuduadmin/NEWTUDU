import type { ReactNode } from 'react'
import {
  trackAffiliateNavigation,
  wrapAffiliateUrl,
  logAffiliateClick,
  type AffiliateClickKind,
} from '../lib/affiliatePartners'

type AffiliateOutboundLinkProps = {
  href: string
  kind: AffiliateClickKind
  eventId?: string
  orgId?: string
  className?: string
  children: ReactNode
  onClick?: () => void
}

/** Outbound partner link with affiliate wrap + click tracking. */
export default function AffiliateOutboundLink({
  href,
  kind,
  eventId,
  orgId,
  className,
  children,
  onClick,
}: AffiliateOutboundLinkProps) {
  const { url: wrapped, partnerId } = wrapAffiliateUrl(href, kind)

  return (
    <a
      href={wrapped}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={className}
      onClick={() => {
        logAffiliateClick({
          partnerId,
          kind,
          url: href,
          wrappedUrl: wrapped,
          eventId,
          orgId,
        })
        onClick?.()
      }}
    >
      {children}
    </a>
  )
}

export function openAffiliateLink(input: {
  url: string
  kind: AffiliateClickKind
  eventId?: string
  orgId?: string
}): void {
  const wrapped = trackAffiliateNavigation(input)
  window.open(wrapped, '_blank', 'noopener,noreferrer')
}

export function getAffiliateHref(input: {
  url: string
  kind: AffiliateClickKind
}): string {
  return wrapAffiliateUrl(input.url, input.kind).url
}
