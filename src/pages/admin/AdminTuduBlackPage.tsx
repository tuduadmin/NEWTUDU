import AdminTuduBlackPanel from '../../components/admin/AdminTuduBlackPanel'
import { AdminPageHeader } from '../../components/admin/AdminUI'
import { TUDU_BLACK_DISPLAY_NAME } from '../../lib/adminTuduBlack'

export default function AdminTuduBlackPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title={TUDU_BLACK_DISPLAY_NAME}
        subtitle="Invitation-only luxury membership tier — program explainer, waitlist, and tier benefits (demo stub)."
      />
      <AdminTuduBlackPanel />
    </div>
  )
}
