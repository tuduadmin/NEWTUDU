import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Globe,
  MapPin,
  Pencil,
  Plus,
  QrCode,
  ScanLine,
  Sparkles,
  Ticket,
  Users,
  Wallet,
} from 'lucide-react'
import AppHeaderBar from '../../components/locked/AppHeaderBar'
import BottomNav from '../../components/BottomNav'
import CreateEventModal from '../../components/CreateEventModal'
import GradientButton from '../../components/GradientButton'
import VerificationBadge from '../../components/VerificationBadge'
import {
  canCreatePublicEvent,
  getCurrentAccount,
  getHostAccountsForUser,
  getPostingAs,
  setPostingAs,
} from '../../lib/account'
import { getCurrentUser } from '../../lib/auth'

type EventTab = 'upcoming' | 'drafts' | 'past'

const ANALYTICS = [
  { label: 'Followers', value: '0' },
  { label: 'Views', value: '162' },
  { label: 'Visits', value: '2' },
  { label: 'Likes', value: '0' },
  { label: 'Tickets', value: '0' },
  { label: 'Revenue', value: '$0' },
]

export default function EventManagerPage() {
  const [activeTab, setActiveTab] = useState<EventTab>('upcoming')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [, setRefreshKey] = useState(0)

  const user = getCurrentUser()
  const account = getCurrentAccount()
  const hostAccounts = user ? getHostAccountsForUser(user.email) : []
  const postingAs = account ? getPostingAs(account) : 'personal'
  const activeHostAccount =
    postingAs !== 'personal' ? hostAccounts.find((h) => h.id === postingAs) ?? null : null
  const displayHostAccount = activeHostAccount ?? hostAccounts[0] ?? null
  const publicCheck = account ? canCreatePublicEvent(account) : null
  const personalName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Me'
  const orgInitial = displayHostAccount?.logoInitial ?? (personalName.charAt(0).toUpperCase() || 'M')
  const orgName =
    postingAs === 'personal'
      ? personalName
      : (displayHostAccount?.name ?? 'Your Host Account')
  const orgCategory =
    postingAs === 'personal' ? 'Personal' : (displayHostAccount?.category ?? 'Entertainment')
  const postingLabel =
    postingAs === 'personal'
      ? `Personal · ${personalName}`
      : `Host Account · ${displayHostAccount?.name ?? 'Unknown'}`

  const tabCounts = { upcoming: 0, drafts: 0, past: 0 }

  return (
    <div className="mx-auto min-h-svh max-w-lg bg-cream pb-28">
      <AppHeaderBar logoLinkTo="/host" />

      <main className="px-4 pt-2">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">Event Manager</h1>

        {/* Org profile card */}
        <section className="mt-4 rounded-[var(--radius-xl)] border border-brown/10 bg-white p-4 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-tudu font-display text-2xl font-extrabold text-white shadow-md ring-4 ring-cream-dark">
              {orgInitial}
            </div>
            <h2 className={`mt-3 font-display text-base font-bold ${displayHostAccount || postingAs === 'personal' ? 'text-brown' : 'italic text-brown-muted/70'}`}>
              {orgName}
            </h2>
            <p className="mt-1 text-[11px] font-semibold text-brown-muted">{postingLabel}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
              <PostAsChip
                active={postingAs === 'personal'}
                label={`Me (${personalName.split(' ')[0]})`}
                onClick={() => {
                  if (user) {
                    setPostingAs(user.email, 'personal')
                    setRefreshKey((k) => k + 1)
                  }
                }}
              />
              {hostAccounts.map((ha) => (
                <PostAsChip
                  key={ha.id}
                  active={postingAs === ha.id}
                  label={ha.name}
                  onClick={() => {
                    if (user) {
                      setPostingAs(user.email, ha.id)
                      setRefreshKey((k) => k + 1)
                    }
                  }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-block rounded-full bg-orange/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange">
                {orgCategory}
              </span>
              <VerificationBadge account={account} showLink />
            </div>
            {!displayHostAccount && postingAs !== 'personal' && (
              <Link
                to="/host/create-org"
                className="mt-2 text-xs font-semibold text-orange no-underline"
              >
                Create a Host Account →
              </Link>
            )}
            {hostAccounts.length === 0 && postingAs === 'personal' && (
              <Link
                to="/host/create-org"
                className="mt-2 text-xs font-semibold text-orange no-underline"
              >
                Create a Host Account for business events →
              </Link>
            )}
            {account && publicCheck && (
              <p className="mt-2 text-xs text-brown-muted">
                Public events: {account.publicEventCount}/{publicCheck.limit}
                {publicCheck.remaining > 0 && ` · ${publicCheck.remaining} remaining`}
                {publicCheck.reason === 'verify' && (
                  <> · <Link to="/verify-phone" className="font-semibold text-orange no-underline">Verify to unlock</Link></>
                )}
                {publicCheck.reason === 'upgrade' && (
                  <> · <span className="font-semibold text-purple">Upgrade for more</span></>
                )}
              </p>
            )}
            <div className="mt-2.5 flex items-center justify-center gap-2">
              <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full border border-brown/10 text-brown-muted">
                <Globe size={14} />
              </button>
              <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full border border-brown/10 text-brown-muted">
                <SocialIcon type="instagram" />
              </button>
              <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full border border-brown/10 text-brown-muted">
                <SocialIcon type="facebook" />
              </button>
            </div>
          </div>

          <GradientButton fullWidth className="mt-4 py-3.5" onClick={() => setShowCreateEvent(true)}>
            <Plus size={18} className="mr-1.5" />
            Create Event
          </GradientButton>

          <Link
            to="/host/team"
            className="mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-brown-muted no-underline transition hover:text-orange"
          >
            <Users size={14} />
            Manage Team
          </Link>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brown-muted">Live Events</p>
              <p className="font-display text-lg font-bold text-brown">
                11 <span className="text-sm font-semibold text-brown-muted">Live events</span>
              </p>
            </div>
            <button type="button" className="rounded-full border border-brown/15 px-3 py-1 text-xs font-semibold text-brown">
              View
            </button>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream-dark">
            <div className="h-full w-[65%] rounded-full bg-gradient-tudu" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              to="/host/scan"
              className="flex items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-brown/15 bg-white py-2.5 text-sm font-semibold text-brown no-underline transition hover:border-orange/30"
            >
              <ScanLine size={16} className="text-orange" />
              Scan Tickets
            </Link>
            <Link
              to="/host/profile"
              className="flex items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-brown/15 bg-white py-2.5 text-sm font-semibold text-brown no-underline transition hover:border-orange/30"
            >
              <Pencil size={16} className="text-orange" />
              Edit Public Profile
            </Link>
          </div>

          {/* Featured event card */}
          <div className="mt-4 rounded-[var(--radius-lg)] border border-brown/10 bg-cream/60 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-brown">WHITE LIE - POLO B...</p>
                <p className="text-xs text-brown-muted">10/11/2023</p>
              </div>
              <span className="shrink-0 font-display text-sm font-bold text-orange">78%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
              <div className="h-full w-[78%] rounded-full bg-gradient-tudu" />
            </div>
            <p className="mt-2 text-xs text-brown-muted">11 seats left to sell</p>
            <div className="mt-3 flex items-center gap-3 rounded-[var(--radius-md)] border border-brown/10 bg-white p-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-dark">
                <QrCode size={18} className="text-orange" />
              </div>
              <div>
                <p className="text-sm font-semibold text-brown">Share QR</p>
                <p className="text-xs text-brown-muted">Let attendees scan to check in</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-4">
              <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full border border-brown/15 text-brown-muted">
                <ChevronLeft size={16} />
              </button>
              <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full border border-brown/15 text-brown-muted">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* Analytics & Finance */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-orange" />
              <h2 className="font-display text-base font-bold text-brown">Analytics &amp; Finance</h2>
            </div>
            <select className="rounded-full border border-brown/15 bg-white px-3 py-1 text-xs font-medium text-brown outline-none">
              <option>Last 7 days</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {ANALYTICS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[var(--radius-lg)] border border-brown/10 bg-white px-2 py-3 text-center"
              >
                <p className="font-display text-lg font-extrabold text-brown">{stat.value}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-brown-muted">{stat.label}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-orange"
          >
            <Download size={14} />
            Export Analytics
          </button>

          <GradientButton fullWidth className="mt-3 py-3.5">
            <Wallet size={18} className="mr-1.5" />
            Open Finance Hub
          </GradientButton>
        </section>

        {/* Permanent Locations */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-orange" />
              <h2 className="font-display text-base font-bold text-brown">Permanent Locations</h2>
            </div>
            <span className="text-xs font-semibold text-brown-muted">0 Added</span>
          </div>

          <div className="rounded-[var(--radius-xl)] border border-brown/10 bg-white p-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange/10">
              <Sparkles size={24} className="text-orange" />
            </div>
            <p className="font-display text-sm font-bold text-brown">No Permanent Locations</p>
            <p className="mt-1 text-xs leading-relaxed text-brown-muted">
              Add your venue or business as a Hidden Gem so the community can discover you year-round.
            </p>
            <Link
              to="/host/hidden-gem"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange py-3 font-display text-sm font-bold text-white no-underline transition hover:brightness-110"
            >
              <Plus size={16} />
              Add a Hidden Gem
            </Link>
          </div>
        </section>

        {/* Events tabs */}
        <section className="mt-6">
          <div className="flex border-b border-brown/10">
            {(['upcoming', 'drafts', 'past'] as EventTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 border-b-2 pb-2.5 text-center text-sm font-semibold capitalize transition ${
                  activeTab === tab
                    ? 'border-orange text-orange'
                    : 'border-transparent text-brown-muted'
                }`}
              >
                {tab} ({tabCounts[tab]})
              </button>
            ))}
          </div>

          <div className="relative mt-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab} events...`}
              className="w-full rounded-[var(--radius-lg)] border border-brown/15 bg-white py-3 pl-10 pr-4 text-sm text-brown outline-none placeholder:text-brown-muted/60 focus:border-purple focus:ring-2 focus:ring-purple/20"
            />
            <Ticket size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-muted" />
          </div>

          <div className="mt-6 rounded-[var(--radius-xl)] border border-brown/10 bg-white p-8 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-cream-dark">
              <Calendar size={28} className="text-brown-muted" />
            </div>
            <p className="font-display text-sm font-bold text-brown">No {activeTab} events found.</p>
            <p className="mt-1 text-xs text-brown-muted">
              You don&apos;t have any {activeTab} events at the moment.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateEvent(true)}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-orange py-3 font-display text-sm font-bold text-white transition hover:brightness-110"
            >
              Create New Event
            </button>
          </div>
        </section>

        {/* Beta Feedback */}
        <section className="mt-6 rounded-[var(--radius-xl)] border border-brown/10 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple/10">
              <Sparkles size={18} className="text-purple" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Beta Feedback</p>
              <p className="mt-1 text-sm text-brown-muted">
                Help us improve Tudu. Share your feedback or report a bug.
              </p>
            </div>
          </div>
          <GradientButton fullWidth className="mt-4 py-3 text-xs tracking-widest">
            SUBMIT FEEDBACK
          </GradientButton>
        </section>
      </main>

      <CreateEventModal
        open={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
        postingAs={postingAs}
      />

      <BottomNav />
    </div>
  )
}

function PostAsChip({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
        active
          ? 'bg-orange text-white'
          : 'border border-brown/15 bg-white text-brown-muted hover:border-orange/30'
      }`}
    >
      {label}
    </button>
  )
}

function SocialIcon({ type }: { type: 'instagram' | 'facebook' }) {
  if (type === 'instagram') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}
