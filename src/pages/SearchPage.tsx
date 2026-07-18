import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import { searchEvents } from '../data/mockEvents'
import { INTEREST_CATEGORIES } from '../data/categories'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const results = useMemo(() => {
    let list = searchEvents(query)
    if (categoryFilter && categoryFilter !== 'all') {
      list = list.filter((e) => e.categoryId === categoryFilter)
    }
    return list
  }, [query, categoryFilter])

  return (
    <div className="mx-auto min-h-svh max-w-lg bg-midnight pb-28 text-white">
      <AppHeaderBar logoLinkTo="/discover" />

      <main className="px-4 pt-4">
        <Link
          to="/my-tudu"
          className="inline-flex items-center gap-1 text-sm text-white/60 no-underline transition hover:text-sunset-orange"
        >
          ← Back to My Tudu
        </Link>

        <p className="text-tagline mt-3">Now you know</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Discover Events</h1>
        <p className="mt-1 text-sm text-white/48">Search by event name, category, location, or host.</p>

        <div className="relative mt-4">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events..."
            autoFocus
            className="w-full rounded-full border border-white/[0.08] bg-midnight-surface py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-magenta/40 focus:ring-1 focus:ring-magenta/20"
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {INTEREST_CATEGORIES.slice(0, 8).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter((prev) => (prev === cat.id ? null : cat.id))}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98] ${
                categoryFilter === cat.id
                  ? 'border-magenta bg-magenta/15 text-sunset-orange'
                  : 'border-white/[0.08] bg-midnight-surface text-white/48 hover:border-magenta/30'
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-white/40">
          {results.length} {results.length === 1 ? 'event' : 'events'} found
        </p>

        <ul className="mt-3 space-y-3">
          {results.map((event) => (
            <li key={event.id}>
              <article className="flex gap-3 overflow-hidden rounded-[var(--radius-lg)] glass-surface p-3 transition hover:ring-magenta/20">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)]">
                  <img src={event.image} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display font-bold leading-tight">{event.title}</h2>
                  <p className="mt-0.5 text-xs text-white/48">
                    {event.location} · {event.date}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-magenta/20 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wide text-sunset-pink">
                      {event.category}
                    </span>
                    <span className="text-xs font-medium text-white/48">{event.cost}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/40">Hosted by {event.host}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>

        {results.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-white/48">No events match your search.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setCategoryFilter(null)
              }}
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sunset-orange transition hover:text-sunset-pink"
            >
              <X size={14} />
              Clear filters
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
