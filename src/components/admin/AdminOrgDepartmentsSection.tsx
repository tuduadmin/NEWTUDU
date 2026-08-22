import { useMemo, useState } from 'react'
import {
  addOrgDepartment,
  getOrgDepartments,
  removeOrgDepartment,
  updateOrgDepartment,
  type OrgDepartment,
} from '../../lib/account'
import {
  AdminButton,
  AdminPanel,
  AdminRowMenu,
  AdminTable,
} from './AdminUI'

type AdminOrgDepartmentsSectionProps = {
  orgId: string
  refreshKey?: number
}

export default function AdminOrgDepartmentsSection({
  orgId,
  refreshKey = 0,
}: AdminOrgDepartmentsSectionProps) {
  const [localRefresh, setLocalRefresh] = useState(0)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const departments = useMemo(() => {
    void refreshKey
    void localRefresh
    return getOrgDepartments(orgId)
  }, [orgId, refreshKey, localRefresh])

  function reload() {
    setLocalRefresh((r) => r + 1)
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const result = addOrgDepartment(orgId, { name, description })
    if (result.ok) {
      setName('')
      setDescription('')
      reload()
    }
  }

  function startEdit(dept: OrgDepartment) {
    setEditingId(dept.id)
    setEditName(dept.name)
    setEditDescription(dept.description ?? '')
  }

  function handleSaveEdit(deptId: string) {
    updateOrgDepartment(orgId, deptId, { name: editName, description: editDescription })
    setEditingId(null)
    reload()
  }

  function handleRemove(deptId: string, deptName: string) {
    if (!window.confirm(`Remove "${deptName}"? Events will become org-wide.`)) return
    removeOrgDepartment(orgId, deptId)
    reload()
  }

  return (
    <AdminPanel>
      <p className="admin-label mb-1">Departments</p>
      <p className="mb-3 text-xs text-[var(--admin-text-muted)]">
        Sub-units within this organization (e.g. Social Club, Public Education).
      </p>

      <form onSubmit={handleAdd} className="mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Department name"
          className="admin-input min-w-[10rem] flex-1"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="admin-input min-w-[12rem] flex-[2]"
        />
        <AdminButton type="submit" variant="primary">
          Add
        </AdminButton>
      </form>

      {departments.length === 0 ? (
        <p className="py-4 text-center text-xs text-[var(--admin-text-dim)]">No departments yet.</p>
      ) : (
        <AdminTable columns={['Name', 'Description', 'Created', '']}>
          {departments.map((dept) => (
            <tr key={dept.id}>
              {editingId === dept.id ? (
                <>
                  <td>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="admin-input w-full"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="admin-input w-full"
                    />
                  </td>
                  <td className="text-xs text-[var(--admin-text-muted)]">
                    {new Date(dept.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <AdminButton variant="primary" onClick={() => handleSaveEdit(dept.id)}>
                        Save
                      </AdminButton>
                      <AdminButton variant="secondary" onClick={() => setEditingId(null)}>
                        Cancel
                      </AdminButton>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="font-medium">{dept.name}</td>
                  <td className="text-xs text-[var(--admin-text-muted)]">{dept.description || '—'}</td>
                  <td className="text-xs text-[var(--admin-text-muted)]">
                    {new Date(dept.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <AdminRowMenu
                      items={[
                        { label: 'Edit', onClick: () => startEdit(dept) },
                        {
                          label: 'Remove',
                          onClick: () => handleRemove(dept.id, dept.name),
                          danger: true,
                        },
                      ]}
                    />
                  </td>
                </>
              )}
            </tr>
          ))}
        </AdminTable>
      )}
    </AdminPanel>
  )
}
