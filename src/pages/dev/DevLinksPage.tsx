import { Link } from 'react-router-dom'

type LinkGroup = {
  title: string
  note?: string
  links: { to: string; label: string }[]
}

const GROUPS: LinkGroup[] = [
  {
    title: 'Start here',
    links: [
      { to: '/', label: 'Home / landing' },
      { to: '/crew', label: 'Tudu Crew' },
      { to: '/signup', label: 'Sign up' },
      { to: '/signin', label: 'Sign in' },
      { to: '/signin/forgot-password', label: 'Forgot password' },
    ],
  },
  {
    title: 'Main app',
    note: 'Sign in as demo@tudu.ca / password123',
    links: [
      { to: '/discover', label: 'Discover (swipe deck)' },
      { to: '/discover/date-night', label: 'Date night (coming soon)' },
      { to: '/my-tudu', label: 'My Tudu' },
      { to: '/my-tudu/feed', label: 'My Tudu feed' },
      { to: '/my-tudu/notifications', label: 'Notifications' },
      { to: '/friends', label: 'Friends' },
      { to: '/search', label: 'Search' },
      { to: '/following', label: 'Following' },
      { to: '/verify-phone', label: 'Verify phone' },
    ],
  },
  {
    title: 'Bucket list',
    links: [
      { to: '/bucket-list', label: 'Browse bucket lists' },
      { to: '/bucket-list/create', label: 'Create bucket list (wizard)' },
      { to: '/bucket-list/mine', label: 'My bucket lists' },
    ],
  },
  {
    title: 'Road trip',
    links: [
      { to: '/road-trip', label: 'Road trip home' },
      { to: '/road-trip/plan', label: 'Plan a trip' },
      { to: '/road-trip/create', label: 'Create trip (wizard)' },
      { to: '/road-trip/surprise', label: 'Surprise trip' },
      { to: '/road-trip/from-bucket-list', label: 'From bucket list' },
    ],
  },
  {
    title: 'Settings',
    links: [
      { to: '/my-tudu/settings', label: 'Settings home' },
      { to: '/my-tudu/settings/edit-profile', label: 'Edit profile' },
      { to: '/my-tudu/settings/profile', label: 'Profile' },
      { to: '/my-tudu/settings/security', label: 'Security' },
      { to: '/my-tudu/settings/app', label: 'App settings' },
      { to: '/my-tudu/settings/notifications', label: 'Notification prefs' },
      { to: '/my-tudu/settings/payments', label: 'Payments' },
      { to: '/my-tudu/settings/privacy', label: 'Privacy' },
      { to: '/my-tudu/settings/host', label: 'Host settings' },
      { to: '/my-tudu/settings/road-trip', label: 'Road trip settings' },
    ],
  },
  {
    title: 'Host',
    note: 'Sign in as demo@tudu.ca or orgadmin@tudu.ca',
    links: [
      { to: '/host', label: 'Host dashboard' },
      { to: '/host/create-event', label: 'Create event' },
      { to: '/host/create-org', label: 'Create org' },
      { to: '/host/profile', label: 'Edit public profile' },
      { to: '/host/team', label: 'Team' },
      { to: '/host/departments', label: 'Departments' },
      { to: '/host/finance', label: 'Finance hub' },
      { to: '/host/subscription', label: 'Subscription / tiers' },
      { to: '/host/scan', label: 'Ticket scanner' },
      { to: '/host/hidden-gem', label: 'Add hidden gem' },
    ],
  },
  {
    title: 'Onboarding',
    links: [
      { to: '/onboarding/interests', label: 'Interests' },
      { to: '/onboarding/budget', label: 'Budget' },
      { to: '/onboarding/distance', label: 'Distance' },
      { to: '/onboarding/timeframe', label: 'Timeframe' },
      { to: '/onboarding/friends', label: 'Friends' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/terms', label: 'Terms of service' },
      { to: '/privacy', label: 'Privacy policy' },
      { to: '/cookie-policy', label: 'Cookie policy' },
    ],
  },
  {
    title: 'Admin (Control Room)',
    note: 'Staff sign-in: /control/signin (or /admin/signin) — admin@tudu.ca / admin123',
    links: [
      { to: '/control/signin', label: 'Control Room sign in' },
      { to: '/admin/signin', label: 'Control Room sign in (legacy path)' },
      { to: '/admin', label: 'Dashboard' },
      { to: '/admin/analytics', label: 'Analytics' },
      { to: '/admin/growth', label: 'Growth' },
      { to: '/admin/activity', label: 'Activity' },
      { to: '/admin/reports', label: 'Reports' },
      { to: '/admin/people', label: 'People' },
      { to: '/admin/people?view=users', label: 'Users list' },
      { to: '/admin/people?view=orgs', label: 'Organizations' },
      { to: '/admin/people?view=tudu-black', label: 'Tudu Black' },
      { to: '/admin/support', label: 'Support' },
      { to: '/admin/content', label: 'Content hub' },
      { to: '/admin/content?view=events', label: 'Events registry' },
      { to: '/admin/content?view=seed-events', label: 'Seed events' },
      { to: '/admin/content?view=draft-archive', label: 'Draft archive' },
      { to: '/admin/content?view=attractions', label: 'Attractions' },
      { to: '/admin/content?view=hidden-gems', label: 'Hidden gems' },
      { to: '/admin/content?view=bucket-lists', label: 'Bucket lists' },
      { to: '/admin/content?view=road-trip', label: 'Road trip content' },
      { to: '/admin/hero-banners', label: 'Hero banners (Road Trip + Bucket List)' },
      { to: '/admin/rollout', label: 'Rollout / feature flags' },
      { to: '/admin/tiers', label: 'Tiers' },
      { to: '/admin/tickets', label: 'Tickets' },
      { to: '/admin/trusted-partners', label: 'Trusted partners' },
      { to: '/admin/affiliates', label: 'Affiliates' },
      { to: '/admin/team-access', label: 'Team access' },
      { to: '/admin/employees', label: 'Employees' },
      { to: '/admin/security', label: 'Security' },
      { to: '/admin/safety', label: 'Safety' },
      { to: '/admin/legal', label: 'Legal (admin)' },
      { to: '/admin/categories-amenities', label: 'Categories & amenities' },
      { to: '/admin/miles', label: 'Miles' },
      { to: '/admin/rewards', label: 'Rewards' },
      { to: '/admin/settings', label: 'Settings' },
      { to: '/admin/settings/app-icon', label: 'App icon' },
      { to: '/admin/easter-eggs', label: 'Easter eggs' },
      { to: '/admin/reference', label: 'Reference' },
      { to: '/admin/seed-events/create', label: 'Create seed event' },
      { to: '/admin/bucket-lists/create', label: 'Create bucket list' },
    ],
  },
  {
    title: 'Dev tools',
    links: [
      { to: '/health', label: 'Health check' },
      { to: '/dev/reset', label: 'Dev reset' },
      { to: '/dev/links', label: 'This links page' },
    ],
  },
]

export default function DevLinksPage() {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-cream px-4 py-8 text-brown">
      <header className="mb-8 border-b border-brown/15 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brown/60">TUDU test navigator</p>
        <h1 className="mt-1 text-2xl font-bold text-brown">All page links</h1>
        <p className="mt-2 text-sm text-brown/75">
          Click any link below. Keep this tab open while you test. Server must be running (
          <code className="rounded bg-brown/10 px-1">npm run dev</code>).
        </p>
        <p className="mt-3 text-sm">
          Bookmark:{' '}
          <a href={`${origin}/dev/links`} className="font-semibold text-orange underline">
            {origin}/dev/links
          </a>
        </p>
      </header>

      <section className="mb-8 rounded-xl border border-brown/15 bg-white p-4 text-sm">
        <h2 className="mb-2 font-semibold text-brown">Demo logins</h2>
        <ul className="space-y-1 text-brown/80">
          <li>
            <strong>User:</strong> demo@tudu.ca / password123
          </li>
          <li>
            <strong>Org admin:</strong> orgadmin@tudu.ca / password123
          </li>
          <li>
            <strong>Platform admin:</strong> admin@tudu.ca / admin123
          </li>
        </ul>
      </section>

      <div className="space-y-8">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="mb-1 text-lg font-bold text-brown">{group.title}</h2>
            {group.note && <p className="mb-3 text-sm text-brown/65">{group.note}</p>}
            <ul className="divide-y divide-brown/10 overflow-hidden rounded-xl border border-brown/15 bg-white">
              {group.links.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="flex flex-col gap-0.5 px-4 py-3 no-underline transition hover:bg-peach/10 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-medium text-brown">{item.label}</span>
                    <span className="font-mono text-xs text-brown/55">{item.to}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
