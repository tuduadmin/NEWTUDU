import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import GradientButton from '../GradientButton'

export type ModeLandingHeroProps = {
  heroUrl: string
  heroRevision?: string
  /** Used if the primary hero URL fails to load. */
  heroFallbackUrl?: string
  eyebrow: string
  title: string
  tagline: string
  ctaLabel: string
  ctaShortLabel?: string
  onCta: () => void
  /** When false, hide the create CTA (e.g. wizard header strip). */
  showCta?: boolean
}

export default function ModeLandingHero({
  heroUrl,
  heroRevision,
  eyebrow,
  title,
  tagline,
  ctaLabel,
  ctaShortLabel,
  onCta,
  heroFallbackUrl,
  showCta = true,
}: ModeLandingHeroProps) {
  const [imgSrc, setImgSrc] = useState(heroUrl)

  useEffect(() => {
    setImgSrc(heroUrl)
  }, [heroUrl, heroRevision])

  return (
    <section className="relative mx-2 mt-1 min-h-[168px] overflow-hidden rounded-[14px] border border-white/10 sm:min-h-[200px]">
      <img
        key={`${heroRevision ?? ''}-${imgSrc.slice(0, 48)}`}
        src={imgSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        decoding="async"
        onError={() => {
          if (heroFallbackUrl && imgSrc !== heroFallbackUrl) {
            setImgSrc(heroFallbackUrl)
          }
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(0, 0, 0, 0.92) 0%, rgba(0, 0, 0, 0.78) 28%, rgba(0, 0, 0, 0.35) 52%, rgba(0, 0, 0, 0.08) 72%, transparent 100%)',
        }}
      />

      <div className="relative z-[1] flex h-full min-h-[168px] items-stretch sm:min-h-[200px]">
        <div className="flex w-[44%] max-w-[168px] shrink-0 flex-col justify-center px-3 py-4 sm:w-[42%] sm:max-w-[280px] sm:px-5 sm:py-6">
          <p className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-sunset-pink sm:text-[11px] sm:tracking-[0.2em]">
            {eyebrow}
          </p>
          <h1 className="road-trip-script-title mt-0.5 text-[1.85rem] leading-[0.92] text-white sm:mt-1 sm:text-[2.65rem]">
            {title}
          </h1>
          <p className="mt-1.5 whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.08em] text-white/45 sm:mt-2 sm:text-[10px] sm:tracking-[0.12em]">
            {tagline}
          </p>
          {showCta && (
            <GradientButton
              type="button"
              fullWidth
              className="road-trip-cta-glow mt-3 px-2 py-2.5 text-[11px] font-extrabold sm:mt-5 sm:px-3 sm:py-3 sm:text-sm"
              onClick={onCta}
            >
              <Plus size={16} className="mr-0.5 inline sm:mr-1" strokeWidth={2.5} />
              {ctaShortLabel ? (
                <>
                  <span className="sm:hidden">{ctaShortLabel}</span>
                  <span className="hidden sm:inline">{ctaLabel}</span>
                </>
              ) : (
                ctaLabel
              )}
            </GradientButton>
          )}
        </div>
      </div>
    </section>
  )
}
