import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  Bookmark,
  Calendar,
  HandHeart,
  MoreVertical,
  Search,
  Settings2,
  Ticket,
  Users,
} from 'lucide-react'
import MyTuduHeader from '../components/MyTuduHeader'
import BottomNav from '../components/BottomNav'
import GradientButton from '../components/GradientButton'
import { SAVED_TIME_FILTERS, SORT_OPTIONS } from '../data/categories'
import type { SavedTimeFilterId, SortOptionId } from '../data/categories'
import { getPreferences } from '../lib/preferences'

type TabId = 'saved' | 'tickets' | 'past'

const TAB_COUNTS = { saved: 0, tickets: 0, past: 2 }

export default function MyTuduPage() {
  const navigate = useNavigate()
  const prefs = getPreferences()
  const [activeTab, setActiveTab] = useState<TabId>('saved')
  const [searchQuery, setSearchQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState<SavedTimeFilterId>('today')
  const [sortBy, setSortBy] = useState<SortOptionId>('soonest')
  const [compactList, setCompactList] = useState(false)
  const [showTimeFilter, setShowTimeFilter] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)

  const timeFilterLabel = SAVED_TIME_FILTERS.find((f) => f.id === timeFilter)?.label ?? 'Any Time'

  const emptyMessage = useMemo(() => {
    if (activeTab === 'past') return "You haven't attended any events yet for this period."
    if (activeTab === 'tickets') return "You don't have any tickets for this time period."
    return "You haven't saved any events for this period."
  }, [activeTab])

  function handleClearAll() {
    setSearchQuery('')
    setTimeFilter('any')
    setSortBy('soonest')
    setCompactList(false)
    setShowSortMenu(false)
  }

  return (
    <div className="mx-auto min-h-svh max-w-lg bg-cream pb-28">
      <MyTuduHeader location="Kindersley" />

      <main className="space-y-4 px-4 pt-4">
        {/* Profile card */}
        <section className="rounded-tudu-lg bg-white p-4 shadow-sm ring-1 ring-brown/5">
          <div className="flex items-start gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-500 text-lg font-bold text-white">
              AP
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="text-lg font-bold capitalize text-brown">{prefs.screenName}</h1>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-brown-muted">
                    <Calendar size={12} aria-hidden />
                    Joined Tudu April 2026
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    🛡️
                  </span>
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-cream-dark text-brown-muted">
                    <Bell size={16} />
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-maroon px-1 text-[10px] font-bold text-white">
                      1
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            <StatRow
              icon={<Users size={18} className="text-brown-muted" />}
              label="Followed Hosts"
              value="4"
              onClick={() => navigate('/following')}
            />
            <StatRow
              icon={<Ticket size={18} className="text-brown-muted" />}
              label="Past Events"
              value={String(TAB_COUNTS.past)}
            />
            <StatRow
              icon={<HandHeart size={18} className="text-brown-muted" />}
              label="Kudos"
              value="0"
            />
          </ul>

          <div className="mt-4 space-y-2">
            <GradientButton fullWidth to="/my-tudu/settings" className="gap-2">
              <Settings2 size={16} />
              Edit Profile &amp; Interests
            </GradientButton>
            <Link
              to="/friends"
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-orange bg-white px-6 py-3 text-sm font-bold text-orange no-underline transition hover:bg-orange/5 active:scale-[0.98]"
            >
              Invite Friends
            </Link>
          </div>
        </section>

        {/* Tabs + search */}
        <section className="rounded-tudu-lg bg-white shadow-sm ring-1 ring-brown/5">
          <div className="grid grid-cols-3 border-b border-brown/5">
            {(
              [
                { id: 'saved' as const, label: 'Saved', icon: Bookmark, count: TAB_COUNTS.saved },
                { id: 'tickets' as const, label: 'My Tickets', icon: Ticket, count: TAB_COUNTS.tickets },
                { id: 'past' as const, label: 'Past', icon: Calendar, count: TAB_COUNTS.past },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center gap-0.5 px-2 py-3 text-center transition ${
                  activeTab === tab.id ? 'text-orange' : 'text-brown-muted'
                }`}
              >
                <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                <span className="text-xs font-semibold">{tab.label}</span>
                <span className="text-sm font-bold">{tab.count}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-orange" />
                )}
              </button>
            ))}
          </div>

          <div className="relative flex items-center gap-2 p-3">
            <div className="relative min-w-0 flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brown-muted"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved..."
                className="w-full rounded-full border border-brown/10 bg-cream py-2 pl-9 pr-3 text-sm text-brown outline-none focus:border-orange/50"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowTimeFilter((v) => !v)
                  setShowSortMenu(false)
                }}
                aria-label={`Time filter: ${timeFilterLabel}`}
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brown/10 bg-white shadow-sm"
              >
                <Calendar size={18} className="text-maroon" />
                {timeFilter !== 'any' && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-maroon" />
                )}
              </button>
              {showTimeFilter && (
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-tudu border border-brown/10 bg-white py-1 shadow-lg">
                  {SAVED_TIME_FILTERS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setTimeFilter(opt.id)
                        setShowTimeFilter(false)
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-cream"
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                          timeFilter === opt.id ? 'border-orange bg-orange' : 'border-brown/20'
                        }`}
                      >
                        {timeFilter === opt.id && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      <span className={timeFilter === opt.id ? 'font-semibold text-orange' : 'text-brown'}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowSortMenu((v) => !v)
                  setShowTimeFilter(false)
                }}
                aria-label="Sort and view options"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brown/10 bg-white text-brown-muted shadow-sm"
              >
                <MoreVertical size={18} />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[210px] rounded-tudu border border-brown/10 bg-white py-2 shadow-lg">
                  <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-wide text-brown-muted">
                    Sort By
                  </p>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSortBy(opt.id)}
                      className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-cream ${
                        sortBy === opt.id ? 'font-semibold text-orange' : 'text-brown'
                      }`}
                    >
                      <span>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                  <hr className="my-2 border-brown/10" />
                  <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-wide text-brown-muted">
                    View
                  </p>
                  <button
                    type="button"
                    onClick={() => setCompactList((v) => !v)}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-cream ${
                      compactList ? 'font-semibold text-orange' : 'text-brown'
                    }`}
                  >
                    <MoreVertical size={14} />
                    Compact List
                  </button>
                  <hr className="my-2 border-brown/10" />
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-maroon hover:bg-cream"
                  >
                    🗑️ Clear All
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Empty state */}
          <div className="px-6 pb-6 pt-2 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-cream-dark text-brown-muted">
              <Ticket size={32} strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-bold text-brown">Nothing to see here!</h2>
            <p className="mt-1 text-sm text-brown-muted">{emptyMessage}</p>
            {timeFilter !== 'any' && (
              <p className="mt-1 text-xs text-brown-muted">Filter: {timeFilterLabel}</p>
            )}
            {compactList && (
              <p className="mt-1 text-xs text-brown-muted">Compact list view enabled</p>
            )}

            <div className="mt-5 space-y-2">
              <GradientButton fullWidth to="/search" className="gap-2">
                <Search size={16} />
                Discover Events
              </GradientButton>
              <Link
                to="/host"
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-orange bg-white px-6 py-3 text-sm font-bold text-orange no-underline transition hover:bg-orange/5 active:scale-[0.98]"
              >
                ＋ Host Your Own
              </Link>
            </div>
          </div>
        </section>

        {/* Beta feedback */}
        <section className="rounded-tudu-lg bg-white p-4 shadow-sm ring-1 ring-brown/5">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>
              ✏️
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wide text-brown">Beta Feedback</h2>
          </div>
          <p className="mt-2 text-sm text-brown-muted">
            Help us improve Tudu. Found a bug or have an idea? Let us know directly.
          </p>
          <GradientButton
            fullWidth
            className="mt-4 uppercase tracking-wide"
            onClick={() => window.alert('Thanks for your feedback! This feature is coming soon.')}
          >
            Submit Feedback
          </GradientButton>
        </section>
      </main>

      <BottomNav />

      {(showTimeFilter || showSortMenu) && (
        <button
          type="button"
          className="fixed inset-0 z-10"
          aria-label="Close menu"
          onClick={() => {
            setShowTimeFilter(false)
            setShowSortMenu(false)
          }}
        />
      )}
    </div>
  )
}

function StatRow({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: string
  onClick?: () => void
}) {
  const content = (
    <>
      {icon}
      <span className="flex-1 text-sm font-medium text-brown">{label}</span>
      <span className="text-sm font-bold text-brown">{value}</span>
    </>
  )

  if (onClick) {
    return (
      <li>
        <button
          type="button"
          onClick={onClick}
          className="flex w-full items-center gap-3 rounded-tudu bg-cream px-3 py-2.5 text-left transition hover:bg-cream-dark"
        >
          {content}
        </button>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-3 rounded-tudu bg-cream px-3 py-2.5">
      {content}
    </li>
  )
}
