import { AdminPageHeader } from '../../components/admin/AdminUI'
import AdminContentRolloutPanel from '../../components/admin/AdminContentRolloutPanel'

export default function AdminRolloutPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Rollout & flags"
        subtitle="Landing page sections and platform feature flags."
      />
      <AdminContentRolloutPanel />
    </div>
  )
}
