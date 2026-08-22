import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  Copy,
  Link2,
  Mail,
  MessageSquare,
  Plus,
  Send,
  Share2,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import type { HostEvent } from '../lib/account'
import { getCurrentUser } from '../lib/auth'
import {
  addMemberToShareList,
  createShareList,
  deleteShareList,
  getShareListDemoUsers,
  getShareLists,
  removeMemberFromShareList,
  type ShareList,
} from '../lib/shareLists'
import {
  buildHostEventEmailShareUrl,
  buildHostEventFacebookShareUrl,
  buildHostEventTwitterShareUrl,
  buildLinkedInShareUrl,
  copyHostEventShareLink,
  getHostEventShareText,
  getHostEventShareUrl,
  sendPrivateEventShare,
  tryNativeHostEventShare,
} from '../lib/sharePublish'
import { canUseWebShare, isSecureShareContext } from '../lib/eventDetailActions'
import { FacebookIcon, InstagramIcon, TwitterIcon } from './host/hostSocialIcons'
import GradientButton from './GradientButton'
import { AdminButton } from './admin/AdminUI'

type SharePublishModalProps = {
  open: boolean
  event: HostEvent | null
  onClose: () => void
  variant?: 'admin' | 'host'
  defaultTab?: 'public' | 'private'
  /** When true, shows a success banner (after publish-to-deck). */
  publishedJustNow?: boolean
}

type ShareTab = 'public' | 'private'

function LinkedInIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.062 2.062 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

export default function SharePublishModal({
  open,
  event,
  onClose,
  variant = 'host',
  defaultTab,
  publishedJustNow = false,
}: SharePublishModalProps) {
  const isAdmin = variant === 'admin'
  const [tab, setTab] = useState<ShareTab>('public')
  const [copied, setCopied] = useState(false)
  const [instagramCopied, setInstagramCopied] = useState(false)
  const [listsRefresh, setListsRefresh] = useState(0)
  const [selectedListIds, setSelectedListIds] = useState<string[]>([])
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [privateMessage, setPrivateMessage] = useState('')
  const [sendStatus, setSendStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [newListName, setNewListName] = useState('')
  const [showNewList, setShowNewList] = useState(false)
  const [managingListId, setManagingListId] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !event) return
    setTab(defaultTab ?? (event.visibility === 'private' ? 'private' : 'public'))
    setCopied(false)
    setInstagramCopied(false)
    setSelectedListIds([])
    setSelectedEmails([])
    setPrivateMessage('')
    setSendStatus('idle')
    setNewListName('')
    setShowNewList(false)
    setManagingListId(null)
  }, [open, event?.id, defaultTab, event?.visibility])

  const shareLists = useMemo(() => {
    void listsRefresh
    return getShareLists()
  }, [listsRefresh])

  const demoUsers = useMemo(() => getShareListDemoUsers(), [listsRefresh])

  if (!open || !event) return null

  const activeEvent = event
  const url = getHostEventShareUrl(activeEvent)
  const text = getHostEventShareText(activeEvent)
  const user = getCurrentUser()

  const publicTargets = [
    {
      id: 'facebook',
      label: 'Facebook',
      icon: <FacebookIcon size={22} />,
      href: buildHostEventFacebookShareUrl(activeEvent),
      brandClass: isAdmin
        ? 'border-[#1877F2]/30 bg-[#1877F2]/10 text-[#1877F2]'
        : 'bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/25',
    },
    {
      id: 'instagram',
      label: 'Instagram',
      icon: <InstagramIcon size={22} />,
      action: 'instagram-copy' as const,
      brandClass: isAdmin
        ? 'border-pink-500/30 bg-pink-500/10 text-pink-400'
        : 'bg-pink-500/10 text-pink-600 border-pink-500/25',
    },
    {
      id: 'twitter',
      label: 'X',
      icon: <TwitterIcon size={22} />,
      href: buildHostEventTwitterShareUrl(activeEvent),
      brandClass: isAdmin
        ? 'border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] text-[var(--admin-text)]'
        : 'bg-brown/5 text-brown border-brown/15',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      icon: <LinkedInIcon size={22} />,
      href: buildLinkedInShareUrl(url),
      brandClass: isAdmin
        ? 'border-[#0A66C2]/30 bg-[#0A66C2]/10 text-[#0A66C2]'
        : 'bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/25',
    },
    {
      id: 'email',
      label: 'Email',
      icon: <Mail size={22} strokeWidth={2} />,
      href: buildHostEventEmailShareUrl(activeEvent),
      brandClass: isAdmin
        ? 'border-orange-500/30 bg-orange-500/10 text-orange-400'
        : 'bg-orange/10 text-orange border-orange/25',
    },
  ]

  async function handleCopyLink() {
    const ok = await copyHostEventShareLink(activeEvent)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleInstagramCopy() {
    const ok = await copyHostEventShareLink(activeEvent)
    if (ok) {
      setInstagramCopied(true)
      window.setTimeout(() => setInstagramCopied(false), 2500)
    }
  }

  async function handleNativeShare() {
    const result = await tryNativeHostEventShare(activeEvent)
    if (result === 'shared') onClose()
  }

  function toggleList(listId: string) {
    setSelectedListIds((prev) =>
      prev.includes(listId) ? prev.filter((id) => id !== listId) : [...prev, listId],
    )
  }

  function toggleEmail(email: string) {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email],
    )
  }

  function resolveRecipientEmails(): string[] {
    const fromLists = selectedListIds.flatMap((id) => {
      const list = shareLists.find((l) => l.id === id)
      return list?.memberEmails ?? []
    })
    return [...new Set([...fromLists, ...selectedEmails])]
  }

  function handleSendPrivate() {
    const recipients = resolveRecipientEmails()
    if (recipients.length === 0) {
      setSendStatus('error')
      return
    }
    const result =     sendPrivateEventShare({
      event: activeEvent,
      recipientEmails: recipients,
      message: privateMessage,
      fromEmail: user?.email,
    })
    if (result.sent > 0) {
      setSendStatus('sent')
    } else {
      setSendStatus('error')
    }
  }

  function handleCreateList() {
    if (!newListName.trim()) return
    createShareList(newListName, selectedEmails)
    setNewListName('')
    setShowNewList(false)
    setListsRefresh((r) => r + 1)
  }

  const shellClass = isAdmin
    ? 'fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-xl'
    : 'w-full max-w-lg rounded-[14px] bg-white shadow-xl'

  const backdropClass = isAdmin ? 'admin-drawer-backdrop' : 'fixed inset-0 bg-black/40'

  const titleClass = isAdmin
    ? 'text-sm font-semibold text-[var(--admin-text)]'
    : 'font-display text-lg font-bold text-brown'

  const subtitleClass = isAdmin
    ? 'mt-0.5 text-xs text-[var(--admin-text-muted)]'
    : 'mt-0.5 text-xs text-brown-muted'

  const tabBtnClass = (active: boolean) =>
    isAdmin
      ? `flex-1 px-3 py-2 text-xs font-medium transition ${
          active
            ? 'border-b-2 border-[var(--admin-accent)] text-[var(--admin-accent)]'
            : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
        }`
      : `flex-1 border-b-2 pb-2 text-sm font-semibold transition ${
          active ? 'border-orange text-orange' : 'border-transparent text-brown-muted'
        }`

  return (
    <>
      <div className={backdropClass} onClick={onClose} aria-hidden />
      <div
        className={
          isAdmin
            ? shellClass
            : `fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center`
        }
        role="presentation"
      >
        <div
          className={isAdmin ? 'flex min-h-0 flex-1 flex-col' : shellClass + ' flex max-h-[85vh] flex-col overflow-hidden p-5'}
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-publish-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={isAdmin ? 'shrink-0 border-b border-[var(--admin-border)] px-4 py-3' : 'mb-4 shrink-0'}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="share-publish-title" className={titleClass}>
                  {publishedJustNow ? 'Published - share it!' : 'Share event'}
                </h2>
                <p className={subtitleClass}>
                  {activeEvent.title}
                  {activeEvent.visibility === 'private' && ' | invite-only'}
                  {activeEvent.visibility === 'public' && publishedJustNow && ' | now on Discover'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={
                  isAdmin
                    ? 'flex h-8 w-8 items-center justify-center rounded-[var(--admin-radius)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-elevated)]'
                    : 'flex h-8 w-8 items-center justify-center rounded-full border border-brown/10 text-brown-muted'
                }
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {publishedJustNow && (
              <p
                className={
                  isAdmin
                    ? 'mt-2 rounded-[var(--admin-radius)] border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400'
                    : 'mt-2 rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800'
                }
              >
                Event is live on the card deck. Share it publicly or send private invites.
              </p>
            )}

            <nav className={`mt-3 flex border-b ${isAdmin ? 'border-[var(--admin-border)]' : 'border-brown/10'}`}>
              <button type="button" className={tabBtnClass(tab === 'public')} onClick={() => setTab('public')}>
                Public
              </button>
              <button type="button" className={tabBtnClass(tab === 'private')} onClick={() => setTab('private')}>
                Private
              </button>
            </nav>
          </div>

          <div className={`min-h-0 flex-1 overflow-y-auto ${isAdmin ? 'px-4 py-3' : ''}`}>
            {tab === 'public' ? (
              <PublicShareTab
                event={activeEvent}
                text={text}
                url={url}
                isAdmin={isAdmin}
                copied={copied}
                instagramCopied={instagramCopied}
                targets={publicTargets}
                onCopyLink={() => void handleCopyLink()}
                onInstagramCopy={() => void handleInstagramCopy()}
                onNativeShare={() => void handleNativeShare()}
              />
            ) : (
              <PrivateShareTab
                isAdmin={isAdmin}
                shareLists={shareLists}
                demoUsers={demoUsers}
                selectedListIds={selectedListIds}
                selectedEmails={selectedEmails}
                privateMessage={privateMessage}
                sendStatus={sendStatus}
                newListName={newListName}
                showNewList={showNewList}
                managingListId={managingListId}
                eventPreview={{ title: activeEvent.title, url, text }}
                onToggleList={toggleList}
                onToggleEmail={toggleEmail}
                onMessageChange={setPrivateMessage}
                onSend={handleSendPrivate}
                onNewListNameChange={setNewListName}
                onShowNewList={setShowNewList}
                onCreateList={handleCreateList}
                onDeleteList={(id) => {
                  deleteShareList(id)
                  setSelectedListIds((prev) => prev.filter((x) => x !== id))
                  setListsRefresh((r) => r + 1)
                }}
                onManageList={setManagingListId}
                onAddMember={(listId, email) => {
                  addMemberToShareList(listId, email)
                  setListsRefresh((r) => r + 1)
                }}
                onRemoveMember={(listId, email) => {
                  removeMemberFromShareList(listId, email)
                  setListsRefresh((r) => r + 1)
                }}
                onRefreshLists={() => setListsRefresh((r) => r + 1)}
              />
            )}
          </div>

          <div
            className={
              isAdmin
                ? 'shrink-0 border-t border-[var(--admin-border)] px-4 py-3'
                : 'mt-4 shrink-0'
            }
          >
            {isAdmin ? (
              <AdminButton variant="ghost" onClick={onClose}>
                Done
              </AdminButton>
            ) : (
              <GradientButton fullWidth onClick={onClose}>
                Done
              </GradientButton>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

type PublicTarget = {
  id: string
  label: string
  icon: React.ReactNode
  href?: string
  action?: 'instagram-copy'
  brandClass: string
}

function PublicShareTab({
  event,
  text,
  url,
  isAdmin,
  copied,
  instagramCopied,
  targets,
  onCopyLink,
  onInstagramCopy,
  onNativeShare,
}: {
  event: HostEvent
  text: string
  url: string
  isAdmin: boolean
  copied: boolean
  instagramCopied: boolean
  targets: PublicTarget[]
  onCopyLink: () => void
  onInstagramCopy: () => void
  onNativeShare: () => void
}) {
  const previewClass = isAdmin
    ? 'rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] px-3 py-2.5'
    : 'rounded-[14px] border border-brown/10 bg-white px-4 py-3 shadow-sm'

  const copyBtnClass = isAdmin
    ? 'admin-btn admin-btn-secondary mt-3 flex w-full items-center justify-center gap-2'
    : 'mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] border-2 border-brown/10 bg-white px-4 py-3.5 text-sm font-bold text-brown transition hover:border-orange/30 active:scale-[0.99]'

  const gridItemClass = (brandClass: string) =>
    isAdmin
      ? `flex flex-col items-center gap-1.5 rounded-[var(--admin-radius)] border px-1 py-3 transition hover:scale-[1.02] ${brandClass}`
      : `flex flex-col items-center gap-1.5 rounded-[14px] border px-1 py-3 transition hover:scale-[1.02] active:scale-[0.98] ${brandClass}`

  return (
    <div>
      <div className={previewClass}>
        <p className={`font-semibold leading-snug ${isAdmin ? 'text-sm text-[var(--admin-text)]' : 'font-display text-base font-bold text-brown'}`}>
          {event.title}
        </p>
        <p className={`mt-1 ${isAdmin ? 'text-xs text-[var(--admin-text-muted)]' : 'text-sm text-brown-muted'}`}>
          {text}
        </p>
      </div>

      <button type="button" onClick={onCopyLink} className={copyBtnClass}>
        <Copy size={18} className={isAdmin ? undefined : 'text-orange'} aria-hidden />
        {copied ? 'Link copied!' : 'Copy link'}
      </button>

      <p
        className={`mt-4 text-center text-[11px] font-bold uppercase tracking-wide ${
          isAdmin ? 'text-[var(--admin-text-dim)]' : 'text-brown-muted'
        }`}
      >
        Share via
      </p>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {targets.map((target) =>
          target.action === 'instagram-copy' ? (
            <button
              key={target.id}
              type="button"
              onClick={onInstagramCopy}
              className={gridItemClass(target.brandClass)}
              title="Instagram has no web share URL - copies link to clipboard"
            >
              {target.icon}
              <span className="text-[10px] font-semibold leading-tight">
                {instagramCopied ? 'Copied!' : target.label}
              </span>
            </button>
          ) : (
            <a
              key={target.id}
              href={target.href}
              target="_blank"
              rel="noopener noreferrer"
              className={gridItemClass(target.brandClass)}
            >
              {target.icon}
              <span className="text-[10px] font-semibold leading-tight">{target.label}</span>
            </a>
          ),
        )}
      </div>

      {instagramCopied && (
        <p className={`mt-2 text-center text-xs ${isAdmin ? 'text-[var(--admin-text-muted)]' : 'text-brown-muted'}`}>
          Link copied - paste into Instagram Stories or DMs.
        </p>
      )}

      {canUseWebShare() && (
        <button
          type="button"
          onClick={onNativeShare}
          className={
            isAdmin
              ? 'admin-btn admin-btn-ghost mt-3 flex w-full items-center justify-center gap-2'
              : 'mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] border border-brown/10 bg-cream-dark/60 px-4 py-3 text-sm font-semibold text-brown-muted transition hover:text-brown'
          }
        >
          <Share2 size={16} aria-hidden />
          {isSecureShareContext() ? 'System share...' : 'Requires HTTPS - use dev:https'}
        </button>
      )}

      <p
        className={`mt-3 break-all rounded-[14px] border px-3 py-2 text-[11px] ${
          isAdmin
            ? 'border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] text-[var(--admin-text-dim)]'
            : 'border-brown/10 bg-cream/40 text-brown-muted'
        }`}
      >
        <Link2 size={12} className="mr-1 inline" aria-hidden />
        {url}
      </p>
    </div>
  )
}

function PrivateShareTab({
  isAdmin,
  shareLists,
  demoUsers,
  selectedListIds,
  selectedEmails,
  privateMessage,
  sendStatus,
  newListName,
  showNewList,
  managingListId,
  eventPreview,
  onToggleList,
  onToggleEmail,
  onMessageChange,
  onSend,
  onNewListNameChange,
  onShowNewList,
  onCreateList,
  onDeleteList,
  onManageList,
  onAddMember,
  onRemoveMember,
}: {
  isAdmin: boolean
  shareLists: ShareList[]
  demoUsers: { email: string; name: string }[]
  selectedListIds: string[]
  selectedEmails: string[]
  privateMessage: string
  sendStatus: 'idle' | 'sent' | 'error'
  newListName: string
  showNewList: boolean
  managingListId: string | null
  eventPreview: { title: string; url: string; text: string }
  onToggleList: (id: string) => void
  onToggleEmail: (email: string) => void
  onMessageChange: (v: string) => void
  onSend: () => void
  onNewListNameChange: (v: string) => void
  onShowNewList: (v: boolean) => void
  onCreateList: () => void
  onDeleteList: (id: string) => void
  onManageList: (id: string | null) => void
  onAddMember: (listId: string, email: string) => void
  onRemoveMember: (listId: string, email: string) => void
  onRefreshLists: () => void
}) {
  const labelClass = isAdmin ? 'admin-label' : 'text-[10px] font-bold uppercase tracking-wide text-brown-muted'
  const panelClass = isAdmin
    ? 'rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)]'
    : 'rounded-[14px] border border-brown/10 bg-cream/30'

  const inputClass = isAdmin
    ? 'admin-input mt-1 w-full'
    : 'mt-1 w-full rounded-[14px] border border-brown/15 bg-white px-3 py-2 text-sm text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20'

  return (
    <div className="space-y-4">
      <div className={panelClass + ' p-3'}>
        <p className={labelClass}>Message preview</p>
        <p className={`mt-1 text-sm ${isAdmin ? 'text-[var(--admin-text)]' : 'font-semibold text-brown'}`}>
          {eventPreview.title}
        </p>
        <p className={`mt-0.5 text-xs ${isAdmin ? 'text-[var(--admin-text-muted)]' : 'text-brown-muted'}`}>
          {eventPreview.text}
        </p>
        <p className={`mt-1 break-all text-[11px] ${isAdmin ? 'text-[var(--admin-text-dim)]' : 'text-brown-muted/80'}`}>
          {eventPreview.url}
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className={labelClass}>
            <Users size={12} className="mr-1 inline" aria-hidden />
            Share lists
          </p>
          <button
            type="button"
            onClick={() => onShowNewList(!showNewList)}
            className={
              isAdmin
                ? 'admin-btn admin-btn-ghost px-2 py-1 text-[10px]'
                : 'flex items-center gap-1 text-xs font-semibold text-orange'
            }
          >
            <Plus size={12} />
            New list
          </button>
        </div>

        {showNewList && (
          <div className={`mb-3 ${panelClass} p-3`}>
            <label className="block">
              <span className={labelClass}>List name</span>
              <input
                type="text"
                value={newListName}
                onChange={(e) => onNewListNameChange(e.target.value)}
                placeholder="VIP guests, team, neighbors..."
                className={inputClass}
              />
            </label>
            <p className={`mt-2 text-[11px] ${isAdmin ? 'text-[var(--admin-text-dim)]' : 'text-brown-muted'}`}>
              {selectedEmails.length > 0
                ? `Will include ${selectedEmails.length} selected user(s).`
                : 'Select users below, then create the list.'}
            </p>
            <div className="mt-2 flex gap-2">
              {isAdmin ? (
                <>
                  <AdminButton variant="primary" onClick={onCreateList}>
                    Create
                  </AdminButton>
                  <AdminButton variant="ghost" onClick={() => onShowNewList(false)}>
                    Cancel
                  </AdminButton>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onCreateList}
                    className="rounded-[14px] bg-orange px-3 py-1.5 text-xs font-bold text-white"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => onShowNewList(false)}
                    className="text-xs font-semibold text-brown-muted"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {shareLists.length === 0 ? (
          <p className={`text-xs ${isAdmin ? 'text-[var(--admin-text-dim)]' : 'text-brown-muted'}`}>
            No lists yet - create one to quickly share with the same group.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {shareLists.map((list) => (
              <li key={list.id} className={`${panelClass} p-2`}>
                <div className="flex items-center gap-2">
                  <label className="flex flex-1 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedListIds.includes(list.id)}
                      onChange={() => onToggleList(list.id)}
                      className="rounded border-brown/30"
                    />
                    <span className={`text-sm font-medium ${isAdmin ? 'text-[var(--admin-text)]' : 'text-brown'}`}>
                      {list.name}
                    </span>
                    <span className={`text-[10px] ${isAdmin ? 'text-[var(--admin-text-dim)]' : 'text-brown-muted'}`}>
                      ({list.memberEmails.length})
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onManageList(managingListId === list.id ? null : list.id)}
                    className={`p-1 ${isAdmin ? 'text-[var(--admin-text-muted)] hover:text-[var(--admin-accent)]' : 'text-brown-muted hover:text-orange'}`}
                    aria-label={`Manage ${list.name}`}
                  >
                    <UserPlus size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteList(list.id)}
                    className={`p-1 ${isAdmin ? 'text-[var(--admin-text-muted)] hover:text-rose-400' : 'text-brown-muted hover:text-maroon'}`}
                    aria-label={`Delete ${list.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {managingListId === list.id && (
                  <div className="mt-2 border-t border-brown/10 pt-2">
                    <p className={`mb-1 text-[10px] ${isAdmin ? 'text-[var(--admin-text-dim)]' : 'text-brown-muted'}`}>
                      Add members from demo users:
                    </p>
                    <div className="max-h-28 space-y-1 overflow-y-auto">
                      {demoUsers
                        .filter((u) => !list.memberEmails.includes(u.email.toLowerCase()))
                        .slice(0, 8)
                        .map((u) => (
                          <button
                            key={u.email}
                            type="button"
                            onClick={() => onAddMember(list.id, u.email)}
                            className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs ${
                              isAdmin
                                ? 'hover:bg-[var(--admin-surface)]'
                                : 'hover:bg-white'
                            }`}
                          >
                            <span>{u.name}</span>
                            <Plus size={12} />
                          </button>
                        ))}
                    </div>
                    {list.memberEmails.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {list.memberEmails.map((email) => {
                          const user = demoUsers.find((u) => u.email.toLowerCase() === email)
                          return (
                            <li
                              key={email}
                              className={`flex items-center justify-between text-xs ${isAdmin ? 'text-[var(--admin-text-muted)]' : 'text-brown-muted'}`}
                            >
                              <span>{user?.name ?? email}</span>
                              <button
                                type="button"
                                onClick={() => onRemoveMember(list.id, email)}
                                className="text-rose-500"
                                aria-label="Remove"
                              >
                                <X size={12} />
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className={labelClass}>
          <MessageSquare size={12} className="mr-1 inline" aria-hidden />
          Or select individuals
        </p>
        <ul className={`mt-2 max-h-36 space-y-1 overflow-y-auto ${panelClass} p-2`}>
          {demoUsers.length === 0 ? (
            <li className={`px-2 py-1 text-xs ${isAdmin ? 'text-[var(--admin-text-dim)]' : 'text-brown-muted'}`}>
              No demo users in localStorage yet.
            </li>
          ) : (
            demoUsers.map((u) => (
              <li key={u.email}>
                <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-white/50">
                  <input
                    type="checkbox"
                    checked={selectedEmails.includes(u.email.toLowerCase())}
                    onChange={() => onToggleEmail(u.email.toLowerCase())}
                    className="rounded border-brown/30"
                  />
                  <span className={isAdmin ? 'text-[var(--admin-text)]' : 'text-brown'}>{u.name}</span>
                  <span className={`ml-auto text-[10px] ${isAdmin ? 'text-[var(--admin-text-dim)]' : 'text-brown-muted'}`}>
                    {u.email}
                  </span>
                </label>
              </li>
            ))
          )}
        </ul>
      </div>

      <label className="block">
        <span className={labelClass}>Optional message</span>
        <textarea
          value={privateMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          rows={3}
          placeholder="Hey! Check out this event on TUDU..."
          className={inputClass + ' resize-none'}
        />
      </label>

      {sendStatus === 'sent' && (
        <p className={`flex items-center gap-1 text-xs ${isAdmin ? 'text-emerald-400' : 'font-semibold text-emerald-700'}`}>
          <Check size={14} />
          Private message(s) sent - recipients will see it in their inbox.
        </p>
      )}
      {sendStatus === 'error' && (
        <p className={`text-xs ${isAdmin ? 'text-rose-400' : 'font-semibold text-maroon'}`}>
          Select at least one list or recipient before sending.
        </p>
      )}

      {isAdmin ? (
        <AdminButton variant="primary" onClick={onSend} className="flex w-full items-center justify-center gap-2">
          <Send size={14} />
          Send private message
        </AdminButton>
      ) : (
        <GradientButton fullWidth onClick={onSend} className="flex items-center justify-center gap-2">
          <Send size={16} />
          Send private message
        </GradientButton>
      )}
    </div>
  )
}
