import ModeLandingHero from '../mode-landing/ModeLandingHero'
import { DEFAULT_ROAD_TRIP_HERO } from '../../lib/roadTripBranding'

type RoadTripLandingHeroProps = {
  heroUrl: string
  heroRevision?: string
  onCreate?: () => void
  showCta?: boolean
}

export default function RoadTripLandingHero({
  heroUrl,
  heroRevision,
  onCreate,
  showCta = true,
}: RoadTripLandingHeroProps) {
  return (
    <ModeLandingHero
      heroUrl={heroUrl}
      heroRevision={heroRevision}
      heroFallbackUrl={DEFAULT_ROAD_TRIP_HERO}
      eyebrow="Road trip"
      title="Your routes"
      tagline="Discover · Plan · Stop · Explore"
      ctaLabel="Create road trip"
      ctaShortLabel="Create"
      onCta={onCreate ?? (() => {})}
      showCta={showCta && Boolean(onCreate)}
    />
  )
}
