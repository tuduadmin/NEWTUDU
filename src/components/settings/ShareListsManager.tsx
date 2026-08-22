import { useMemo, useState } from 'react'
import { Trash2, UserPlus } from 'lucide-react'
import {
  addMemberToShareList,
  createShareList,
  deleteShareList,
  getShareListDemoUsers,
  getShareLists,
  removeMemberFromShareList,
  updateShareList,
} from '../../lib/shareLists'

export default function ShareListsManager() {
  const [refresh, setRefresh] = useState(0)
  const [newListName, setNewListName] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [managingId, setManagingId] = useState<string | null>(null)

  const shareLists = useMemo(() => {
    void refresh
    return getShareLists()
  }, [refresh])
  const demoUsers = useMemo(() => getShareListDemoUsers(), [])

  function bump() {
    setRefresh((r) => r + 1)
  }

  function handleCreate() {
    if (!newListName.trim()) return
    createShareList(newListName.trim())
    setNewListName('')
    setShowNew(false)
    bump()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-brown-muted">Quick-share groups for private events.</p>
        <button
          type="button"
          onClick={() => setShowNew((v) => !v)}
          className="shrink-0 text-xs font-bold text-orange"
        >
          {showNew ? 'Cancel' : '+ New list'}
        </button>
      </div>

      {showNew && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="List name"
            className="min-w-0 flex-1 rounded-tudu border border-brown/12 px-3 py-2 text-sm outline-none focus:border-orange/50"
          />
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-[14px] bg-orange px-4 py-2 text-xs font-bold text-white"
          >
            Create
          </button>
        </div>
      )}

      {shareLists.length === 0 ? (
        <p className="rounded-tudu-lg border border-dashed border-brown/15 px-4 py-6 text-center text-xs text-brown-muted">
          No share lists yet. Create one to quickly invite the same group when publishing.
        </p>
      ) : (
        <ul className="space-y-2">
          {shareLists.map((list) => (
            <li
              key={list.id}
              className="rounded-tudu-lg border border-brown/8 bg-cream/30 p-3"
            >
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-brown">{list.name}</p>
                  <p className="text-xs text-brown-muted">{list.memberEmails.length} members</p>
                </div>
                <button
                  type="button"
                  onClick={() => setManagingId(managingId === list.id ? null : list.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-brown-muted transition hover:bg-white hover:text-orange"
                  aria-label={`Manage ${list.name}`}
                >
                  <UserPlus size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete "${list.name}"?`)) {
                      deleteShareList(list.id)
                      bump()
                    }
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-brown-muted transition hover:bg-white hover:text-maroon"
                  aria-label={`Delete ${list.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {managingId === list.id && (
                <div className="mt-3 border-t border-brown/10 pt-3">
                  <input
                    type="text"
                    defaultValue={list.name}
                    onBlur={(e) => {
                      const name = e.target.value.trim()
                      if (name && name !== list.name) {
                        updateShareList(list.id, { name })
                        bump()
                      }
                    }}
                    className="mb-2 w-full rounded-tudu border border-brown/12 px-2 py-1.5 text-xs outline-none focus:border-orange/50"
                  />
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-brown-muted">
                    Add demo users
                  </p>
                  <div className="max-h-24 space-y-1 overflow-y-auto">
                    {demoUsers
                      .filter((u) => !list.memberEmails.includes(u.email.toLowerCase()))
                      .slice(0, 6)
                      .map((u) => (
                        <button
                          key={u.email}
                          type="button"
                          onClick={() => {
                            addMemberToShareList(list.id, u.email)
                            bump()
                          }}
                          className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs hover:bg-white"
                        >
                          <span>{u.name}</span>
                          <span className="text-orange">+</span>
                        </button>
                      ))}
                  </div>
                  {list.memberEmails.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {list.memberEmails.map((email) => (
                        <button
                          key={email}
                          type="button"
                          onClick={() => {
                            removeMemberFromShareList(list.id, email)
                            bump()
                          }}
                          className="rounded-[14px] bg-white px-2 py-0.5 text-[10px] text-brown-muted ring-1 ring-brown/10 hover:text-maroon"
                        >
                          {email.split('@')[0]} Ã—
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
