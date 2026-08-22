import { Plus, Trash2, UserPlus, Users, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  addMemberToShareList,
  createShareList,
  deleteShareList,
  getShareListDemoUsers,
  getShareLists,
  removeMemberFromShareList,
  resolvePrivateInviteEmails,
} from '../../lib/shareLists'
import { appFieldClass } from '../../lib/formFieldClasses'

const PANEL = 'rounded-[14px] border border-app-subtle bg-cream-dark/60'

type PrivateInvitePickerProps = {
  inviteEmails: string[]
  shareListIds: string[]
  onChange: (patch: { privateInviteEmails?: string[]; privateShareListIds?: string[] }) => void
}

export default function PrivateInvitePicker({
  inviteEmails,
  shareListIds,
  onChange,
}: PrivateInvitePickerProps) {
  const [listsRefresh, setListsRefresh] = useState(0)
  const [showNewList, setShowNewList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [managingListId, setManagingListId] = useState<string | null>(null)
  const [emailDraft, setEmailDraft] = useState('')

  const shareLists = useMemo(() => {
    void listsRefresh
    return getShareLists()
  }, [listsRefresh])

  const demoUsers = useMemo(() => getShareListDemoUsers(), [listsRefresh])

  const totalInvites = resolvePrivateInviteEmails(inviteEmails, shareListIds)

  function bumpLists() {
    setListsRefresh((n) => n + 1)
  }

  function toggleList(listId: string) {
    onChange({
      privateShareListIds: shareListIds.includes(listId)
        ? shareListIds.filter((id) => id !== listId)
        : [...shareListIds, listId],
    })
  }

  function toggleEmail(email: string) {
    const normalized = email.toLowerCase()
    onChange({
      privateInviteEmails: inviteEmails.includes(normalized)
        ? inviteEmails.filter((e) => e !== normalized)
        : [...inviteEmails, normalized],
    })
  }

  function addEmailDraft() {
    const normalized = emailDraft.trim().toLowerCase()
    if (!normalized.includes('@')) return
    if (!inviteEmails.includes(normalized)) {
      onChange({ privateInviteEmails: [...inviteEmails, normalized] })
    }
    setEmailDraft('')
  }

  function handleCreateList() {
    if (!newListName.trim()) return
    const created = createShareList(newListName.trim(), inviteEmails)
    onChange({
      privateShareListIds: [...shareListIds, created.id],
      privateInviteEmails: [],
    })
    setNewListName('')
    setShowNewList(false)
    bumpLists()
  }

  return (
    <div className="mt-3 space-y-3 border-t border-brown/10 pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-brown">Invite list</p>
        <span className="text-[10px] font-semibold text-brown-muted">
          {totalInvites.length} invite{totalInvites.length === 1 ? '' : 's'} selected
        </span>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brown-muted">
            <Users size={12} />
            Share lists
          </p>
          <button
            type="button"
            onClick={() => setShowNewList((v) => !v)}
            className="flex items-center gap-1 text-xs font-bold text-orange"
          >
            <Plus size={12} />
            New list
          </button>
        </div>

        {showNewList && (
          <div className={`mb-2 space-y-2 p-3 ${PANEL}`}>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="VIP guests, team, neighbors…"
              className={`w-full ${appFieldClass} text-sm`}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateList}
                className="rounded-[14px] bg-orange px-3 py-1.5 text-xs font-bold text-white"
              >
                Create list
              </button>
              <button
                type="button"
                onClick={() => setShowNewList(false)}
                className="text-xs font-semibold text-brown-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {shareLists.length === 0 ? (
          <p className="text-xs text-brown-muted">
            No saved lists yet — create one to reuse the same group on future events.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {shareLists.map((list) => (
              <li key={list.id} className={`p-2 ${PANEL}`}>
                <div className="flex items-center gap-2">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={shareListIds.includes(list.id)}
                      onChange={() => toggleList(list.id)}
                      className="accent-orange"
                    />
                    <span className="truncate text-sm font-medium text-brown">{list.name}</span>
                    <span className="text-[10px] text-brown-muted">({list.memberEmails.length})</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setManagingListId(managingListId === list.id ? null : list.id)}
                    className="text-brown-muted hover:text-orange"
                    aria-label={`Manage ${list.name}`}
                  >
                    <UserPlus size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete "${list.name}"?`)) {
                        deleteShareList(list.id)
                        onChange({
                          privateShareListIds: shareListIds.filter((id) => id !== list.id),
                        })
                        bumpLists()
                      }
                    }}
                    className="text-brown-muted hover:text-maroon"
                    aria-label={`Delete ${list.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {managingListId === list.id && (
                  <div className="mt-2 border-t border-brown/10 pt-2">
                    <p className="mb-1 text-[10px] text-brown-muted">Add people to this list</p>
                    <div className="max-h-28 space-y-1 overflow-y-auto">
                      {demoUsers
                        .filter((u) => !list.memberEmails.includes(u.email.toLowerCase()))
                        .slice(0, 8)
                        .map((u) => (
                          <button
                            key={u.email}
                            type="button"
                            onClick={() => {
                              addMemberToShareList(list.id, u.email)
                              bumpLists()
                            }}
                            className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs hover:bg-cream-dark"
                          >
                            <span>{u.name}</span>
                            <Plus size={12} className="text-orange" />
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
                              bumpLists()
                            }}
                            className="rounded-full bg-cream-dark px-2 py-0.5 text-[10px] text-brown-muted ring-1 ring-brown/10 hover:text-maroon"
                          >
                            {email.split('@')[0]} ×
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

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">
          Or pick individuals
        </p>
        <ul className={`mt-2 max-h-36 space-y-1 overflow-y-auto p-2 ${PANEL}`}>
          {demoUsers.length === 0 ? (
            <li className="px-2 py-1 text-xs text-brown-muted">No users available yet.</li>
          ) : (
            demoUsers.map((user) => (
              <li key={user.email}>
                <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-cream-dark/80">
                  <input
                    type="checkbox"
                    checked={inviteEmails.includes(user.email.toLowerCase())}
                    onChange={() => toggleEmail(user.email)}
                    className="accent-orange"
                  />
                  <span className="text-brown">{user.name}</span>
                  <span className="truncate text-[10px] text-brown-muted">{user.email}</span>
                </label>
              </li>
            ))
          )}
        </ul>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">
          Add by email
        </p>
        <div className="mt-2 flex gap-2">
          <input
            type="email"
            value={emailDraft}
            onChange={(e) => setEmailDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addEmailDraft()
              }
            }}
            placeholder="name@email.com"
            className={`min-w-0 flex-1 ${appFieldClass} text-sm`}
          />
          <button
            type="button"
            onClick={addEmailDraft}
            className="shrink-0 rounded-[14px] border border-brown/15 bg-cream-dark px-3 py-2 text-xs font-bold text-brown"
          >
            Add
          </button>
        </div>
        {inviteEmails.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {inviteEmails.map((email) => (
              <button
                key={email}
                type="button"
                onClick={() => toggleEmail(email)}
                className="inline-flex items-center gap-1 rounded-full bg-orange/10 px-2 py-0.5 text-[10px] font-medium text-orange"
              >
                {email}
                <X size={10} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export { resolvePrivateInviteEmails }
