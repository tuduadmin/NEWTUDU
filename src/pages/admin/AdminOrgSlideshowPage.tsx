import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import HostSlideshowCarousel from '../../components/HostSlideshowCarousel'
import HostSlideshowEditor from '../../components/HostSlideshowEditor'
import { AdminPanel } from '../../components/admin/AdminUI'
import { getOrganization } from '../../lib/account'
import { getHostSlideshowSlides } from '../../lib/hostSlideshows'

export default function AdminOrgSlideshowPage() {
  const { orgId = '' } = useParams()
  const org = getOrganization(orgId)
  const [refreshKey, setRefreshKey] = useState(0)

  const slides = useMemo(
    () => (orgId ? getHostSlideshowSlides(orgId) : []),
    [orgId, refreshKey],
  )

  if (!org) {
    return <p className="text-sm text-[var(--admin-text-dim)]">Organization not found.</p>
  }

  return (
    <div className="space-y-4">
      <AdminPanel>
        <p className="admin-label mb-2">Live preview</p>
        <HostSlideshowCarousel slides={slides} />
      </AdminPanel>

      <AdminPanel>
        <HostSlideshowEditor
          orgId={orgId}
          orgName={org.name}
          initialSlides={slides}
          variant="admin"
          onSaved={() => setRefreshKey((key) => key + 1)}
        />
      </AdminPanel>
    </div>
  )
}
