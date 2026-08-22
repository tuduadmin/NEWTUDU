import type { DiscoverEvent } from '../data/discoverEvents'

type MediaTileProps = {
  src: string
  videoUrl?: string
  mediaType?: 'image' | 'video'
  alt?: string
  className?: string
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  controls?: boolean
  playsInline?: boolean
}

export function resolveMediaType(
  mediaType: 'image' | 'video' | undefined,
  videoUrl?: string,
): 'image' | 'video' {
  if (mediaType) return mediaType
  return videoUrl ? 'video' : 'image'
}

export default function MediaTile({
  src,
  videoUrl,
  mediaType,
  alt = '',
  className = 'h-full w-full object-cover',
  autoPlay = false,
  muted = true,
  loop = true,
  controls = false,
  playsInline = true,
}: MediaTileProps) {
  const type = resolveMediaType(mediaType, videoUrl)
  const videoSrc = videoUrl || (type === 'video' ? src : undefined)

  if (type === 'video' && videoSrc) {
    return (
      <video
        src={videoSrc}
        className={className}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        controls={controls}
        playsInline={playsInline}
        poster={src !== videoSrc ? src : undefined}
      />
    )
  }

  return <img src={src} alt={alt} className={className} />
}

export function eventMediaSource(event: DiscoverEvent): { src: string; videoUrl?: string; mediaType?: 'image' | 'video' } {
  return {
    src: event.image,
    videoUrl: event.videoUrl,
    mediaType: event.mediaType,
  }
}
