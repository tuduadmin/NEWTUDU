import { useNavigate } from 'react-router-dom'
import { Camera, Mountain, TreePine, UtensilsCrossed } from 'lucide-react'
import { ROAD_TRIP_MOODS, type RoadTripMoodId } from '../../lib/roadTripMoods'

const MOOD_ICON: Record<RoadTripMoodId, typeof Mountain> = {
  scenic: Mountain,
  food: UtensilsCrossed,
  'must-see': Camera,
  outdoor: TreePine,
}

const MOOD_GLOW: Record<RoadTripMoodId, string> = {
  scenic: 'border-sunset-orange/50 shadow-[0_0_12px_rgba(249,115,22,0.3)] text-sunset-orange',
  food: 'border-sunset-pink/50 shadow-[0_0_12px_rgba(244,114,154,0.3)] text-sunset-pink',
  'must-see': 'border-magenta/50 shadow-[0_0_12px_rgba(192,38,160,0.3)] text-magenta',
  outdoor: 'border-electric-blue/50 shadow-[0_0_12px_rgba(56,189,248,0.25)] text-electric-blue',
}

const MOOD_SHORT: Record<RoadTripMoodId, string> = {
  scenic: 'Scenic',
  food: 'Food',
  'must-see': 'Must see',
  outdoor: 'Outdoor',
}

export default function RoadTripMoodChips() {
  const navigate = useNavigate()

  function openPlan(mood: RoadTripMoodId) {
    navigate(`/road-trip/plan?mood=${encodeURIComponent(mood)}`)
  }

  return (
    <div className="mt-3 grid grid-cols-4 gap-1.5 px-2">
      {ROAD_TRIP_MOODS.map((mood) => {
        const Icon = MOOD_ICON[mood.id]
        return (
          <button
            key={mood.id}
            type="button"
            onClick={() => openPlan(mood.id)}
            title={mood.label}
            className={`flex min-w-0 flex-col items-center gap-1 rounded-[12px] border-2 bg-midnight-surface/90 px-1 py-2.5 text-center transition active:scale-[0.98] ${MOOD_GLOW[mood.id]}`}
          >
            <Icon size={18} strokeWidth={2.25} className="shrink-0" />
            <span className="w-full truncate font-display text-[9px] font-bold leading-tight text-white sm:text-[10px]">
              {MOOD_SHORT[mood.id]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
