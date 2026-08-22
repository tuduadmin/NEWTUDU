import AdminProductRoadmapPanel from '../../components/admin/AdminProductRoadmapPanel'
import { AdminPageHeader } from '../../components/admin/AdminUI'

export default function AdminReferencePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHeader
        title="Product reference"
        subtitle="Internal specs for shipped and planned features — not daily ops. Toggle flags on Rollout & flags."
      />
      <AdminProductRoadmapPanel embedded />
    </div>
  )
}
