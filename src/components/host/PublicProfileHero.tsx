import { getInitialsFromName } from '../../lib/profileInitials'
import ProfilePhotoCarousel from './ProfilePhotoCarousel'

type PublicProfileHeroProps = {
  displayName: string
  galleryImages: string[]
  avatarUrl?: string
  /** Personal hosts use a single photo (avatarUrl) without a swipe carousel. */
  variant?: 'personal' | 'org'
}

export default function PublicProfileHero({
  displayName,
  galleryImages,
  avatarUrl,
  variant = 'org',
}: PublicProfileHeroProps) {
  const initials = getInitialsFromName(displayName)

  if (variant === 'personal') {
    const photo = avatarUrl?.trim()

    if (!photo) {
      return (
        <div
          className="relative aspect-square w-full bg-gradient-tudu sm:aspect-[4/3]"
          aria-hidden
        >
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-display text-5xl font-extrabold text-white/90 sm:text-6xl">{initials}</span>
          </div>
        </div>
      )
    }

    return (
      <div className="relative w-full bg-brown/5">
        <img
          src={photo}
          alt={displayName}
          className="aspect-square w-full object-cover object-center sm:aspect-[4/3]"
        />
        <div className="-mt-10 flex justify-center sm:-mt-12">
          <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-cream-dark shadow-lg ring-2 ring-brown/10 sm:h-24 sm:w-24">
            <img src={photo} alt="" className="h-full w-full object-cover object-center" />
          </div>
        </div>
      </div>
    )
  }

  const photos =
    galleryImages.length > 0
      ? galleryImages
      : avatarUrl?.trim()
        ? [avatarUrl.trim()]
        : []

  if (photos.length === 0) {
    return (
      <div
        className="relative aspect-[4/5] w-full bg-gradient-tudu sm:aspect-[16/10]"
        aria-hidden
      >
        <div className="flex h-full w-full items-center justify-center">
          <span className="font-display text-5xl font-extrabold text-white/90 sm:text-6xl">{initials}</span>
        </div>
      </div>
    )
  }

  return <ProfilePhotoCarousel images={photos} title={displayName} />
}
