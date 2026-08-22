import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react'
import AppHeaderBar from '../../components/locked/AppHeaderBar'
import BottomNav from '../../components/BottomNav'
import GradientButton from '../../components/GradientButton'
import { BackLink } from '../../components/NavActionButtons'
import {
  addOrgDepartment,
  getMemberRole,
  getOrgDepartments,
  removeOrgDepartment,
  updateOrgDepartment,
  type OrgDepartment,
} from '../../lib/account'
import { useHostContext } from '../../hooks/useHostContext'

export default function DepartmentsPage() {
  const { activeOrg, hostAccounts, isPersonal, setHostContext, user } = useHostContext()
  const org = !isPersonal ? activeOrg : null
  const myRole = org && user ? getMemberRole(org.id, user.email) : null
  const canManage = myRole === 'owner' || myRole === 'admin'

  const [refreshKey, setRefreshKey] = useState(0)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const departments = useMemo(
    () => (org ? getOrgDepartments(org.id) : []),
    [org, refreshKey],
  )

  function reload() {
    setRefreshKey((k) => k + 1)
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setError('')
    if (!org) {
      setError('Switch to an organization to manage departments.')
      return
    }
    const result = addOrgDepartment(org.id, { name, description })
    if (!result.ok) {
      setError(result.error ?? 'Could not add department.')
      return
    }
    setName('')
    setDescription('')
    setMessage(`Added "${result.department!.name}".`)
    reload()
  }

  function startEdit(dept: OrgDepartment) {
    setEditingId(dept.id)
    setEditName(dept.name)
    setEditDescription(dept.description ?? '')
    setMessage('')
    setError('')
  }

  function handleSaveEdit(deptId: string) {
    if (!org) return
    setMessage('')
    setError('')
    const result = updateOrgDepartment(org.id, deptId, {
      name: editName,
      description: editDescription,
    })
    if (!result.ok) {
      setError(result.error ?? 'Could not update department.')
      return
    }
    setEditingId(null)
    setMessage('Department updated.')
    reload()
  }

  function handleRemove(deptId: string, deptName: string) {
    if (!org) return
    if (!window.confirm(`Remove "${deptName}"? Events in this department will become org-wide.`)) return
    setMessage('')
    setError('')
    const result = removeOrgDepartment(org.id, deptId)
    if (!result.ok) {
      setError(result.error ?? 'Could not remove department.')
      return
    }
    setMessage(`Removed "${deptName}".`)
    reload()
  }

  if (!user) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo="/host" />
        <main className="px-4 pt-6 text-center">
          <p className="text-brown-muted">Sign in to manage departments.</p>
          <Link to="/signin" className="mt-4 inline-block font-semibold text-orange no-underline">
            Sign in
          </Link>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/host" />

      <main className="px-4 pt-2">
        <BackLink to="/host" className="mb-3">
          Back to Event Manager
        </BackLink>

        <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">Departments</h1>
        <p className="mt-1 text-sm text-brown-muted">
          One organization profile, multiple departments â€” each can host its own events.
        </p>

        {!org && (
          <div className="mt-5 rounded-[14px] border border-brown/10 bg-white p-5 text-center shadow-sm">
            <Building2 size={32} className="mx-auto text-brown-muted/60" />
            <p className="mt-3 text-sm text-brown-muted">
              {hostAccounts.length === 0
                ? 'Create an organization to add departments.'
                : 'Switch to Organization mode in Event Manager to manage departments.'}
            </p>
            {hostAccounts.length === 0 ? (
              <Link
                to="/host/create-org"
                className="mt-4 inline-flex w-full items-center justify-center rounded-[14px] bg-orange py-3 font-display text-sm font-bold text-white no-underline"
              >
                Create organization
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setHostContext(hostAccounts[0].id)}
                className="mt-4 inline-flex w-full items-center justify-center rounded-[14px] bg-orange py-3 font-display text-sm font-bold text-white"
              >
                Switch to {hostAccounts[0].name}
              </button>
            )}
          </div>
        )}

        {org && (
          <>
            <p className="mt-2 font-display text-base font-bold text-brown">{org.name}</p>

            {canManage && (
              <section className="mt-4 rounded-[14px] border border-brown/10 bg-white p-4 shadow-sm">
                <h2 className="flex items-center gap-2 font-display text-base font-bold text-brown">
                  <Plus size={18} className="text-orange" />
                  Add department
                </h2>
                <form onSubmit={handleAdd} className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Department name"
                    className="w-full rounded-[14px] border border-brown/15 bg-cream/40 px-3 py-2.5 text-sm text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={2}
                    className="w-full resize-none rounded-[14px] border border-brown/15 bg-cream/40 px-3 py-2.5 text-sm text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
                  />
                  <GradientButton type="submit" fullWidth className="py-2.5">
                    Add department
                  </GradientButton>
                </form>
              </section>
            )}

            {(error || message) && (
              <p className={`mt-3 text-sm font-semibold ${error ? 'text-maroon' : 'text-emerald-700'}`}>
                {error || message}
              </p>
            )}

            <section className="mt-4 space-y-2">
              {departments.length === 0 ? (
                <div className="rounded-[14px] border border-dashed border-brown/15 bg-white/60 p-8 text-center">
                  <Building2 size={28} className="mx-auto text-brown-muted/60" />
                  <p className="mt-3 font-display text-sm font-bold text-brown">No departments yet</p>
                  <p className="mt-1 text-xs text-brown-muted">
                    Example: Social Club, Public Education, Safety Committee
                  </p>
                </div>
              ) : (
                departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="rounded-[14px] border border-brown/10 bg-white p-4 shadow-sm"
                  >
                    {editingId === dept.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-[14px] border border-brown/15 bg-cream/40 px-3 py-2 text-sm text-brown outline-none"
                        />
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Optional description"
                          rows={2}
                          className="w-full resize-none rounded-[14px] border border-brown/15 bg-cream/40 px-3 py-2 text-sm text-brown outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(dept.id)}
                            className="flex-1 rounded-[14px] bg-orange py-2 text-xs font-bold text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="flex-1 rounded-[14px] border border-brown/15 py-2 text-xs font-semibold text-brown"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-display text-sm font-bold text-brown">{dept.name}</p>
                            {dept.description && (
                              <p className="mt-0.5 text-xs text-brown-muted">{dept.description}</p>
                            )}
                          </div>
                          {canManage && (
                            <div className="flex shrink-0 gap-1">
                              <button
                                type="button"
                                onClick={() => startEdit(dept)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-brown/10 text-brown-muted hover:border-orange/30 hover:text-orange"
                                aria-label={`Edit ${dept.name}`}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemove(dept.id, dept.name)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-brown/10 text-brown-muted hover:border-maroon/30 hover:text-maroon"
                                aria-label={`Remove ${dept.name}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </section>

            <section className="mt-6 rounded-[14px] border border-brown/10 bg-cream-dark/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-brown-muted">Team access (coming soon)</p>
              <p className="mt-1 text-xs leading-relaxed text-brown-muted">
                All org members can see all departments for now. Future: assign team members to specific
                departments with department-scoped roles.
              </p>
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
