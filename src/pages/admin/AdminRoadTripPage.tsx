import { useMemo, useState } from 'react'
import {
  AdminBadge,
  AdminButton,
  AdminConfirmDialog,
  AdminDrawer,
  AdminInput,
  AdminManageButton,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminTable,
} from '../../components/admin/AdminUI'
import {
  deleteRoadTrip,
  getRoadTripStops,
  getRoadTrips,
  updateRoadTrip,
  type RoadTrip,
} from '../../lib/roadTrips'
import { getAllUsers } from '../../lib/auth'

type AdminRoadTripPageProps = {
  embedded?: boolean
}

export default function AdminRoadTripPage({ embedded = false }: AdminRoadTripPageProps) {
  const [refresh, setRefresh] = useState(0)
  const [selected, setSelected] = useState<RoadTrip | null>(null)
  const [editName, setEditName] = useState('')
  const [editDestination, setEditDestination] = useState('')
  const [editStatus, setEditStatus] = useState<RoadTrip['status']>('planning')
  const [deleteTarget, setDeleteTarget] = useState<RoadTrip | null>(null)

  const trips = useMemo(() => getRoadTrips(), [refresh])

  function refreshData() {
    setRefresh((r) => r + 1)
  }

  function ownerLabel(trip: RoadTrip) {
    if (!trip.ownerEmail) return '—'
    const user = getAllUsers().find(
      (u) => u.email.toLowerCase() === trip.ownerEmail?.toLowerCase(),
    )
    if (user) return `${user.firstName} ${user.lastName}`
    return trip.ownerEmail
  }

  function openView(trip: RoadTrip) {
    setSelected(trip)
    setEditName(trip.name)
    setEditDestination(trip.destination ?? '')
    setEditStatus(trip.status ?? 'planning')
  }

  function saveEdit() {
    if (!selected) return
    updateRoadTrip(selected.id, {
      name: editName.trim() || selected.name,
      destination: editDestination.trim() || undefined,
      status: editStatus,
    })
    setSelected(null)
    refreshData()
  }

  function handleDelete() {
    if (!deleteTarget) return
    deleteRoadTrip(deleteTarget.id)
    setDeleteTarget(null)
    if (selected?.id === deleteTarget.id) setSelected(null)
    refreshData()
  }

  const stops = selected ? getRoadTripStops(selected) : []

  return (
    <div className={embedded ? undefined : 'mx-auto max-w-6xl'}>
      {!embedded && (
        <AdminPageHeader
          title="Road Trip Plans"
          subtitle="Saved road trip itineraries from localStorage (tudu_road_trips)."
        />
      )}

      <AdminPanel className="mb-4">
        <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
          Trips can be created from bucket lists in the consumer app or seeded via Load demo events on
          the Analytics dashboard.
        </p>
      </AdminPanel>

      {trips.length === 0 ? (
        <AdminPanel className="py-12 text-center">
          <p className="text-sm text-[var(--admin-text-dim)]">No road trips saved yet.</p>
        </AdminPanel>
      ) : (
        <AdminTable columns={['Name', 'User', 'Destination', 'Status', 'Stops', 'Created', '']}>
          {trips.map((trip) => (
            <tr key={trip.id}>
              <td>
                <p className="font-medium">{trip.name}</p>
                {trip.bucketListId && (
                  <p className="text-[10px] text-[var(--admin-text-dim)]">
                    from list {trip.bucketListId}
                  </p>
                )}
              </td>
              <td className="text-xs text-[var(--admin-text-muted)]">{ownerLabel(trip)}</td>
              <td className="text-xs text-[var(--admin-text-muted)]">
                {trip.destination ?? '—'}
              </td>
              <td>
                <StatusBadge status={trip.status ?? 'planning'} />
              </td>
              <td className="admin-tabular">{trip.stopEventIds.length}</td>
              <td className="admin-tabular text-xs text-[var(--admin-text-muted)]">
                {new Date(trip.createdAt).toLocaleDateString()}
              </td>
              <td className="text-right">
                <AdminManageButton onClick={() => openView(trip)} />
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <AdminDrawer
        open={!!selected}
        title="Road trip details"
        onClose={() => setSelected(null)}
        centered
        wide
        footer={
          selected && (
            <div className="flex flex-wrap gap-3">
              <AdminButton variant="primary" onClick={saveEdit}>
                Save changes
              </AdminButton>
              <AdminButton
                variant="danger"
                onClick={() => {
                  setDeleteTarget(selected)
                  setSelected(null)
                }}
              >
                Delete trip
              </AdminButton>
              <AdminButton variant="secondary" onClick={() => setSelected(null)}>
                Close
              </AdminButton>
            </div>
          )
        }
      >
        {selected && (
          <div className="space-y-6 text-sm">
            <label className="block">
              <span className="admin-label">Name</span>
              <AdminInput
                className="mt-1 w-full"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="admin-label">Destination</span>
              <AdminInput
                className="mt-1 w-full"
                value={editDestination}
                onChange={(e) => setEditDestination(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="admin-label">Status</span>
              <AdminSelect
                className="mt-1 w-full"
                value={editStatus ?? 'planning'}
                onChange={(e) =>
                  setEditStatus(e.target.value as RoadTrip['status'])
                }
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </AdminSelect>
            </label>

            <div>
              <p className="admin-label mb-2">Stops ({stops.length})</p>
              {stops.length === 0 ? (
                <p className="text-xs text-[var(--admin-text-dim)]">No stops linked yet.</p>
              ) : (
                <ul className="space-y-2">
                  {stops.map((stop) => (
                    <li key={stop.id} className="text-xs">
                      <span className="font-medium">{stop.title}</span>
                      <span className="text-[var(--admin-text-dim)]"> · {stop.city}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </AdminDrawer>

      <AdminConfirmDialog
        open={!!deleteTarget}
        title="Delete road trip"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'active' ? 'cyan' : status === 'completed' ? 'emerald' : 'neutral'
  return <AdminBadge tone={tone}>{status}</AdminBadge>
}
