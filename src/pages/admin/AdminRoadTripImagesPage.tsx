import { Link } from 'react-router-dom'
import { AdminPageHeader, AdminPanel } from '../../components/admin/AdminUI'
import AdminRoadTripBrandingPanel from '../../components/admin/AdminRoadTripBrandingPanel'

export default function AdminRoadTripImagesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Road Trip images"
        subtitle="Hero and visuals for the consumer Road Trip landing (/road-trip)."
      />

      <AdminRoadTripBrandingPanel />

      <AdminPanel>
        <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
          To review user trips (names, stops, status), open{' '}
          <Link to="/admin/content?view=road-trip" className="text-[var(--admin-accent)] no-underline">
            Content → Road trip
          </Link>
          .
        </p>
      </AdminPanel>
    </div>
  )
}
