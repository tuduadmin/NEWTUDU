type EventCardProps = {
  image: string
  title: string
  date: string
  venue: string
  host?: string
  verified?: boolean
  price: string
  spots: string
  highlighted?: boolean
}

export default function EventCard({
  image,
  title,
  date,
  venue,
  host,
  verified,
  price,
  spots,
  highlighted,
}: EventCardProps) {
  return (
    <article
      className={`overflow-hidden rounded-[var(--radius-tudu-xl)] border border-brown/10 bg-white ${
        highlighted ? 'shadow-event-blue' : 'shadow-sm'
      }`}
    >
      <div className="relative h-44 w-full">
        <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
        <span className="absolute right-3 top-3 rounded-full bg-orange px-3 py-1 text-xs font-semibold text-white">
          Hottest event
        </span>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="text-lg font-bold text-brown">{title}</h3>
        <p className="text-sm text-brown-muted">{date}</p>
        <p className="text-sm font-medium text-brown">{venue}</p>
        {host && (
          <p className="flex items-center gap-1 text-sm text-brown-muted">
            {host}
            {verified && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#3B82F6" aria-label="Verified host">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="0" />
                <circle cx="12" cy="12" r="10" fill="#3B82F6" />
                <path
                  d="M8 12l2.5 2.5L16 9"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-sm">
          <span className="font-semibold text-brown">{price}</span>
          <span className="text-brown-muted">{spots}</span>
        </div>
      </div>
    </article>
  )
}
