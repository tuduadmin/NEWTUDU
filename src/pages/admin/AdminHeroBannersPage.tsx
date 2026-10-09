import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPageHeader, AdminPanel } from '../../components/admin/AdminUI'
import AdminModeHeroBrandingPanel from '../../components/admin/AdminModeHeroBrandingPanel'
import type { ModeHeroId } from '../../lib/modeHeroBranding'

const TABS: { id: ModeHeroId; label: string }[] = [
  { id: 'road-trip', label: 'Road Trip' },
  { id: 'bucket-list', label: 'Bucket List' },
]

export default function AdminHeroBannersPage() {
  const [tab, setTab] = useState<ModeHeroId>('road-trip')

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Hero banners"
        subtitle="Mode landing images for Road Trip and Bucket List — one place to update every device."
      />

      <nav
        className="mb-4 flex flex-wrap gap-1 border-b border-[var(--admin-border)]"
        aria-label="Hero banner mode"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-2 text-xs font-medium transition ${
              tab === id
                ? 'border-b-2 border-[var(--admin-accent)] text-[var(--admin-accent)]'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
            }`}
            aria-current={tab === id ? 'page' : undefined}
          >
            {label}
          </button>
        ))}
      </nav>

      <AdminModeHeroBrandingPanel mode={tab} />

      {tab === 'road-trip' && (
        <AdminPanel>
          <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
            Trip moderation:{' '}
            <Link to="/admin/content?view=road-trip" className="text-[var(--admin-accent)] no-underline">
              Content → Road trip
            </Link>
          </p>
        </AdminPanel>
      )}
    </div>
  )
}
