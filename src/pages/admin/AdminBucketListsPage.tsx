import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminBucketListPreviewDrawer from '../../components/admin/AdminBucketListPreviewDrawer'
import {
  AdminBadge,
  AdminConfirmDialog,
  AdminManageButton,
  AdminPageHeader,
  AdminPanel,
  AdminTable,
} from '../../components/admin/AdminUI'
import {
  deleteBucketList,
  getBucketLists,
  type BucketList,
} from '../../lib/bucketLists'
import { getAllUsers } from '../../lib/auth'

type AdminBucketListsPageProps = {
  embedded?: boolean
}

export default function AdminBucketListsPage({ embedded = false }: AdminBucketListsPageProps) {
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)
  const [previewList, setPreviewList] = useState<BucketList | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BucketList | null>(null)

  const lists = useMemo(() => getBucketLists(), [refresh])

  const ownerLabel = (list: BucketList) => {
    if (list.seededByAdmin) return list.ownerName ?? 'TUDU (platform)'
    if (!list.ownerId) return '—'
    const user = getAllUsers().find((u) => u.email.toLowerCase() === list.ownerId?.toLowerCase())
    if (user) return `${user.firstName} ${user.lastName}`
    return list.ownerId
  }

  const itemCount = (list: BucketList) =>
    list.eventIds.length + (list.customItems?.length ?? 0)

  function refreshData() {
    setRefresh((r) => r + 1)
  }

  function handleDelete() {
    if (!deleteTarget) return
    deleteBucketList(deleteTarget.id)
    setDeleteTarget(null)
    if (previewList?.id === deleteTarget.id) setPreviewList(null)
    refreshData()
  }

  return (
    <div className={embedded ? undefined : 'mx-auto max-w-6xl'}>
      {!embedded && (
        <AdminPageHeader
          title="Bucket Lists"
          subtitle="Monitor, preview, and create platform bucket lists. Public admin lists merge into discovery."
          actions={
            <Link
              to="/admin/bucket-lists/create"
              className="admin-btn admin-btn-primary no-underline"
            >
              Create Bucket List
            </Link>
          }
        />
      )}

      <AdminPanel className="mb-4">
        <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
          Lists are device-local in this demo. Public platform-created lists appear in{' '}
          <code className="text-[var(--admin-accent)]">/bucket-list</code>; private lists
          stay on-device only.
        </p>
      </AdminPanel>

      {lists.length === 0 ? (
        <AdminPanel className="py-12 text-center">
          <p className="text-sm text-[var(--admin-text-dim)]">No bucket lists yet.</p>
          <p className="mt-2 text-xs text-[var(--admin-text-muted)]">
            Load demo data from Analytics or create a platform list.
          </p>
          <Link
            to="/admin/bucket-lists/create"
            className="admin-btn admin-btn-primary mt-4 inline-flex no-underline"
          >
            Create Bucket List
          </Link>
        </AdminPanel>
      ) : (
        <AdminTable
          columns={['Title', 'Owner', 'Items', 'Visibility', 'Source', 'Updated', '']}
        >
          {lists.map((list) => (
            <tr key={list.id}>
              <td>
                <p className="font-medium">{list.name}</p>
                {list.description && (
                  <p className="text-[10px] text-[var(--admin-text-dim)] line-clamp-1">
                    {list.description}
                  </p>
                )}
              </td>
              <td className="text-xs text-[var(--admin-text-muted)]">{ownerLabel(list)}</td>
              <td className="admin-tabular">{itemCount(list)}</td>
              <td>
                <AdminBadge tone={list.isPrivate ? 'amber' : 'emerald'}>
                  {list.isPrivate ? 'Private' : 'Public'}
                </AdminBadge>
              </td>
              <td>
                {list.seededByAdmin ? (
                  <AdminBadge tone="cyan">Platform</AdminBadge>
                ) : (
                  <span className="text-[10px] text-[var(--admin-text-dim)]">User</span>
                )}
              </td>
              <td className="admin-tabular text-xs text-[var(--admin-text-muted)]">
                {new Date(list.updatedAt).toLocaleDateString()}
              </td>
              <td className="text-right">
                <AdminManageButton onClick={() => setPreviewList(list)} />
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <AdminBucketListPreviewDrawer
        list={previewList}
        open={!!previewList}
        onClose={() => setPreviewList(null)}
        onEdit={(list) => {
          setPreviewList(null)
          navigate(`/admin/bucket-lists/create?edit=${list.id}`)
        }}
        onDelete={(list) => {
          setPreviewList(null)
          setDeleteTarget(list)
        }}
      />

      <AdminConfirmDialog
        open={!!deleteTarget}
        title="Delete bucket list"
        message={`Permanently delete "${deleteTarget?.name}" and all ${deleteTarget ? itemCount(deleteTarget) : 0} items?`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
