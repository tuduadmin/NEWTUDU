import type { CSSProperties } from 'react'
import { getEventCoverRenderProps } from '../lib/eventCoverImage'

type EventCoverDisplayProps = {
  coverImage: string
  className?: string
  imgClassName?: string
  alt?: string
}

export default function EventCoverDisplay({
  coverImage,
  className = 'h-full w-full',
  imgClassName = 'h-full w-full object-cover',
  alt = '',
}: EventCoverDisplayProps) {
  const props = getEventCoverRenderProps(coverImage)
  if (!props) return null

  if (props.background) {
    return (
      <div
        className={className}
        style={{ background: props.background } satisfies CSSProperties}
        aria-hidden={alt === ''}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
      />
    )
  }

  return (
    <div className={className}>
      <img src={props.src} alt={alt} className={imgClassName} />
    </div>
  )
}
