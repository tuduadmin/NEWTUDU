import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import { BackLink } from '../components/NavActionButtons'
import {
  filterDiscoverPoolByQuickPick,
  getDiscoverEventsPool,
  resolveQuickPickFromCategoryParam,
} from '../data/discoverEvents'
import { INTEREST_CATEGORIES } from '../data/categories'
import CategoryIcon from '../components/CategoryIcon'
import { prefChoiceClasses, PREF_CHOICE_ACTIVE_TEXT } from '../lib/prefChoiceClasses'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(() => {
    const quickPick = resolveQuickPickFromCategoryParam(searchParams.get('category'))
    if (quickPick) return quickPick
    return searchParams.get('category')
  })

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
    const quickPick = resolveQuickPickFromCategoryParam(searchParams.get('category'))
    setCategoryFilter(quickPick ?? searchParams.get('category'))
  }, [searchParams])

  const results = useMemo(() => {
    let list = getDiscoverEventsPool(query)
    const quickPick = resolveQuickPickFromCategoryParam(categoryFilter)
    if (quickPick) {
      list = filterDiscoverPoolByQuickPick(list, quickPick)
    } else if (categoryFilter && categoryFilter !== 'all') {
      const cat = INTEREST_CATEGORIES.find((c) => c.id === categoryFilter)
      if (cat) {
        list = list.filter(
          (e) =>
            e.categories?.some((c) => c.label.toLowerCase().includes(cat.label.toLowerCase())) ||
            e.keywords?.some((k) => k.toLowerCase().includes(cat.label.toLowerCase())),
        )
      }
    }
    return list
  }, [query, categoryFilter])

  function updateUrlParams(nextQuery: string, nextCategory: string | null) {
    const params = new URLSearchParams()
    if (nextQuery.trim()) params.set('q', nextQuery.trim())
    if (nextCategory) params.set('category', nextCategory)
    setSearchParams(params, { replace: true })
  }

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/discover" />

      <main className="px-4 pt-4">
        <BackLink to="/my-tudu">Back to My Tudu</BackLink>

        <p className="text-tagline mt-3">Now you know</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">Discover Events</h1>
        <p className="mt-1 text-sm text-brown-muted">
          Search by event name, search words (e.g. wings, cheap), city, or category.
        </p>

        <div className="relative mt-4">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              updateUrlParams(e.target.value, categoryFilter)
            }}
            placeholder="Search events, keywords…"
            autoFocus
            className="w-full rounded-[14px] border border-brown/15 bg-white py-3 pl-11 pr-4 text-sm text-brown outline-none transition focus:border-purple focus:ring-2 focus:ring-purple/20"
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {INTEREST_CATEGORIES.slice(0, 8).map((cat) => {
            const active = categoryFilter === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  const next = categoryFilter === cat.id ? null : cat.id
                  setCategoryFilter(next)
                  updateUrlParams(query, next)
                }}
                className={prefChoiceClasses(
                  active,
                  'inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs',
                )}
              >
                <span
                  className={`pref-choice-icon flex items-center ${
                    active ? '' : 'text-brown-muted'
                  }`}
                >
                  <CategoryIcon category={cat} size={14} />
                </span>
                <span
                  className={`pref-choice-label ${
                    active ? PREF_CHOICE_ACTIVE_TEXT : 'font-medium text-brown-muted'
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            )
          })}
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-brown-muted">
          {results.length} {results.length === 1 ? 'event' : 'events'} found
        </p>

        <ul className="mt-3 space-y-3">
          {results.map((event) => (
            <li key={event.id}>
              <article className="flex gap-3 overflow-hidden rounded-[14px] border border-brown/10 bg-white p-3 shadow-sm transition hover:border-orange/20">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[14px]">
                  <img src={event.image} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display font-bold leading-tight text-brown">{event.title}</h2>
                  <p className="mt-0.5 text-xs text-brown-muted">
                    {event.city}
                    {event.dateTime ? ` Â· ${event.dateTime}` : ''}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {event.categories?.slice(0, 1).map((cat) => (
                      <span
                        key={cat.label}
                        className="rounded-[14px] bg-orange/10 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wide text-orange"
                      >
                        {cat.label}
                      </span>
                    ))}
                    {event.cost && (
                      <span className="text-xs font-medium text-brown-muted">{event.cost}</span>
                    )}
                  </div>
                  {event.keywords && event.keywords.length > 0 && (
                    <p className="mt-1 truncate text-[10px] text-brown-muted/60">
                      {event.keywords.slice(0, 4).join(' · ')}
                    </p>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>

        {results.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-brown-muted">No events match your search.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setCategoryFilter(null)
                setSearchParams({}, { replace: true })
              }}
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-orange transition hover:text-orange/80"
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
