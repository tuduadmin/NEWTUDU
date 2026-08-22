import AdminHiddenGemsPanel from '../../components/admin/AdminHiddenGemsPanel'
import { AdminPageHeader } from '../../components/admin/AdminUI'

export default function AdminHiddenGemsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Hidden Gems"
        subtitle="Org-owned gold-border deck cards. Manage per organization or browse the registry below."
      />
      <AdminHiddenGemsPanel />
    </div>
  )
}
