import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Shield } from 'lucide-react'
import AppHeaderBar from '../../components/locked/AppHeaderBar'
import BottomNav from '../../components/BottomNav'
import GradientButton from '../../components/GradientButton'
import { createOrganization } from '../../lib/account'
import { getCurrentUser } from '../../lib/auth'

const CATEGORIES = [
  'Entertainment',
  'Music',
  'Sports',
  'Food & Drink',
  'Community',
  'Arts & Culture',
  'Other',
]

export default function CreateOrgPage() {
  const navigate = useNavigate()
  const user = getCurrentUser()

  const [name, setName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [backupAdminEmail, setBackupAdminEmail] = useState('')
  const [error, setError] = useState('')

  if (!user) {
    return (
      <div className="mx-auto min-h-svh max-w-lg bg-cream pb-28">
        <AppHeaderBar logoLinkTo="/host" />
        <main className="px-4 pt-6 text-center">
          <p className="text-brown-muted">Sign in to create a Host Account.</p>
          <Link to="/signin" className="mt-4 inline-block font-semibold text-orange no-underline">
            Sign in
          </Link>
        </main>
        <BottomNav />
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Host Account name is required.')
      return
    }
    if (!backupAdminEmail.trim()) {
      setError('Backup admin email is required.')
      return
    }

    const result = createOrganization({
      name,
      category,
      creatorEmail: user!.email,
      backupAdminEmail,
    })

    if (!result.ok) {
      setError(result.error ?? 'Could not create Host Account.')
      return
    }

    navigate('/host')
  }

  const logoInitial = name.trim().charAt(0).toUpperCase() || 'H'

  return (
    <div className="mx-auto min-h-svh max-w-lg bg-cream pb-28">
      <AppHeaderBar logoLinkTo="/host" />

      <main className="px-4 pt-2">
        <Link
          to="/host"
          className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-brown-muted no-underline transition hover:text-brown"
        >
          <ArrowLeft size={16} />
          Back to Event Manager
        </Link>

        <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">Create Host Account</h1>
        <p className="mt-1 text-sm text-brown-muted">
          A Host Account is separate from your personal login. It owns your business events, profile, and analytics.
          You become the Owner; your backup admin gets an Admin invite automatically.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-5 rounded-[var(--radius-xl)] border border-brown/10 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex flex-col items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-tudu shadow-md ring-4 ring-cream-dark">
              <span className="font-display text-3xl font-extrabold text-white">{logoInitial}</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-brown-muted">Logo placeholder</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-brown-muted">
                <Building2 size={14} />
                Host Account Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kindersley Events Co."
                className="w-full rounded-[var(--radius-lg)] border border-brown/15 bg-cream/40 px-3 py-2.5 text-sm text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-brown-muted">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-[var(--radius-lg)] border border-brown/15 bg-cream/40 px-3 py-2.5 text-sm text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-brown-muted">
                <Shield size={14} />
                Backup Admin Email <span className="text-maroon">*</span>
              </label>
              <input
                type="email"
                value={backupAdminEmail}
                onChange={(e) => setBackupAdminEmail(e.target.value)}
                placeholder="backup@example.com"
                required
                className="w-full rounded-[var(--radius-lg)] border border-brown/15 bg-cream/40 px-3 py-2.5 text-sm text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
              />
              <p className="mt-1 text-[11px] text-brown-muted">
                Required. A second person who can take over if you leave. They&apos;ll receive an Admin invite.
              </p>
            </div>
          </div>

          {error && <p className="mt-3 text-sm font-semibold text-maroon">{error}</p>}

          <GradientButton type="submit" fullWidth className="mt-5">
            Create Host Account
          </GradientButton>
        </form>

        <p className="mt-4 text-center text-xs text-brown-muted">
          Already have a team?{' '}
          <Link to="/host/team" className="font-semibold text-orange no-underline">
            Manage team
          </Link>
        </p>
      </main>

      <BottomNav />
    </div>
  )
}
