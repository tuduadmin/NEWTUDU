import type { RoadTripMood } from '../../lib/roadTripMoods'

type RoadTripMoodBannerProps = {
  mood: RoadTripMood
}

export default function RoadTripMoodBanner({ mood }: RoadTripMoodBannerProps) {
  return (
    <div className="rounded-[14px] border border-orange/25 bg-orange/8 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-orange">Vibe · {mood.label}</p>
      <p className="mt-1 text-sm text-brown-muted">{mood.hint}</p>
    </div>
  )
}
