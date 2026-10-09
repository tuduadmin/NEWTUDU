import ModeLandingHero from '../mode-landing/ModeLandingHero'
import { MODE_HERO_DEFAULTS } from '../../lib/modeHeroBranding'

type BucketListLandingHeroProps = {
  heroUrl: string
  heroRevision?: string
  onCreate: () => void
}

export default function BucketListLandingHero({
  heroUrl,
  heroRevision,
  onCreate,
}: BucketListLandingHeroProps) {
  return (
    <ModeLandingHero
      heroUrl={heroUrl}
      heroRevision={heroRevision}
      heroFallbackUrl={MODE_HERO_DEFAULTS['bucket-list']}
      eyebrow="Bucket list"
      title="Your lists"
      tagline="Save · Plan · Complete · Share"
      ctaLabel="Create"
      onCta={onCreate}
    />
  )
}
