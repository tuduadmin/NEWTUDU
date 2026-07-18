import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import GradientButton from '../components/GradientButton'
import { DEMO_CONTACTS } from '../data/demoContacts'
import {
  contactsApiSupported,
  fetchDeviceContacts,
  matchContacts,
  type MatchedContact,
  type UnmatchedContact,
} from '../utils/contacts'

type Tab = 'add' | 'invite'
type PageView = 'find' | 'results'

function ContactCheckbox({
  id,
  checked,
  onChange,
  label,
  sublabel,
  badge,
}: {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  sublabel?: string
  badge?: string
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 rounded-tudu border border-brown/10 bg-white px-4 py-3 shadow-sm transition hover:border-purple/25"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 rounded border-brown/30 accent-purple"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-brown">{label}</p>
        {sublabel && <p className="truncate text-xs text-brown-muted">{sublabel}</p>}
      </div>
      {badge && (
        <span className="shrink-0 rounded-full bg-gradient-tudu px-2.5 py-0.5 text-xs font-semibold text-white">
          {badge}
        </span>
      )}
    </label>
  )
}

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 flex max-w-sm -translate-x-1/2 items-center gap-3 rounded-tudu bg-brown px-4 py-3 text-sm text-white shadow-lg"
    >
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="text-white/70 hover:text-white"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-tudu text-sm font-bold text-white">
      {initials}
    </span>
  )
}

type FriendsPageProps = {
  onboarding?: boolean
}

export default function FriendsPage({ onboarding = false }: FriendsPageProps) {
  const [view, setView] = useState<PageView>('find')
  const [tab, setTab] = useState<Tab>('add')
  const [loading, setLoading] = useState(false)
  const [usedDemoData, setUsedDemoData] = useState(false)
  const [onTudu, setOnTudu] = useState<MatchedContact[]>([])
  const [notOnTudu, setNotOnTudu] = useState<UnmatchedContact[]>([])
  const [selectedAdd, setSelectedAdd] = useState<Set<string>>(new Set())
  const [selectedInvite, setSelectedInvite] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)

  const allInviteSelected = useMemo(
    () => notOnTudu.length > 0 && selectedInvite.size === notOnTudu.length,
    [notOnTudu.length, selectedInvite.size],
  )

  const someInviteSelected = selectedInvite.size > 0 && !allInviteSelected

  async function handleFindFriends() {
    setLoading(true)
    try {
      const { contacts, usedDemoData: demo } = await fetchDeviceContacts()
      const matched = matchContacts(contacts)
      setOnTudu(matched.onTudu)
      setNotOnTudu(matched.notOnTudu)
      setUsedDemoData(demo)
      setSelectedAdd(new Set())
      setSelectedInvite(new Set())
      setTab(matched.onTudu.length > 0 ? 'add' : 'invite')
      setView('results')
    } finally {
      setLoading(false)
    }
  }

  function handleUseDemoContacts() {
    const matched = matchContacts(DEMO_CONTACTS)
    setOnTudu(matched.onTudu)
    setNotOnTudu(matched.notOnTudu)
    setUsedDemoData(true)
    setSelectedAdd(new Set())
    setSelectedInvite(new Set())
    setTab(matched.onTudu.length > 0 ? 'add' : 'invite')
    setView('results')
  }

  function toggleAdd(id: string, checked: boolean) {
    setSelectedAdd((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleInvite(id: string, checked: boolean) {
    setSelectedInvite((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleInviteAll(checked: boolean) {
    if (checked) {
      setSelectedInvite(new Set(notOnTudu.map((c) => c.id)))
    } else {
      setSelectedInvite(new Set())
    }
  }

  function handleAddFriends() {
    if (selectedAdd.size === 0) return
    const names = onTudu
      .filter((c) => selectedAdd.has(c.id))
      .map((c) => c.tuduUser.name)
      .join(', ')
    setToast(`Friend request sent to ${names}!`)
    setSelectedAdd(new Set())
  }

  function handleSendInvites() {
    if (selectedInvite.size === 0) return
    const count = selectedInvite.size
    setToast(
      count === 1
        ? "Invite sent! They'll get a link to join TUDU."
        : `${count} invites sent! Your friends will get a link to join TUDU.`,
    )
    setSelectedInvite(new Set())
  }

  return (
    <div
      className={`mx-auto min-h-svh max-w-lg ${onboarding ? 'bg-midnight pb-36 text-white' : 'bg-cream pb-10'}`}
    >
      {!onboarding && <Header />}

      <main className="px-4 pt-2">
        {!onboarding && (
          <Link to="/" className="text-sm text-brown-muted no-underline hover:text-brown">
            ← Back home
          </Link>
        )}

        {onboarding && (
          <>
            <p className="text-tagline mt-4">Now you know</p>
            <p className="mt-2 font-display text-xs font-bold text-white/48">Step 5 of 5</p>
          </>
        )}

        <h1
          className={`mt-4 text-2xl font-extrabold ${onboarding ? 'text-white' : 'text-gradient'}`}
        >
          Find Your Friends
        </h1>
        <p className={`mb-6 text-sm ${onboarding ? 'text-white/60' : 'text-brown-muted'}`}>
          Connect with people you already know — see who&apos;s on TUDU and invite the rest.
        </p>

        {view === 'find' && (
          <section className="space-y-6">
            <div className="rounded-tudu-lg bg-white p-6 shadow-md ring-1 ring-brown/5">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-tudu text-3xl text-white">
                👥
              </div>
              <h2 className="text-center text-lg font-bold text-brown">Find Your Friends</h2>
              <p className="mt-2 text-center text-sm text-brown-muted">
                {contactsApiSupported()
                  ? 'We will match your phone contacts against TUDU users by name and phone number.'
                  : 'Your browser does not support the Contacts API. We will load demo contacts so you can try the flow on desktop.'}
              </p>
              {!contactsApiSupported() && (
                <p className="mt-3 rounded-tudu bg-cream-dark px-3 py-2 text-center text-xs text-brown-muted">
                  On mobile Chrome or Safari, tap below to access your real contact list.
                </p>
              )}
              <GradientButton
                fullWidth
                className="mt-6 disabled:opacity-60"
                disabled={loading}
                onClick={handleFindFriends}
              >
                {loading ? 'Loading contacts…' : 'Find Your Friends'}
              </GradientButton>
              {contactsApiSupported() && (
                <GradientButton
                  fullWidth
                  variant="ghost"
                  className="mt-3 disabled:opacity-60"
                  disabled={loading}
                  onClick={handleUseDemoContacts}
                >
                  Use demo contacts
                </GradientButton>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { step: '1', title: 'Find', desc: 'Import your contacts' },
                { step: '2', title: 'Add', desc: 'Connect with TUDU users' },
                { step: '3', title: 'Invite', desc: 'Bring friends aboard' },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-tudu border border-brown/10 bg-white/60 px-3 py-4 text-center"
                >
                  <span className="text-gradient text-lg font-extrabold">{item.step}</span>
                  <p className="mt-1 text-sm font-bold text-brown">{item.title}</p>
                  <p className="text-xs text-brown-muted">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === 'results' && (
          <section className="space-y-5">
            {usedDemoData && (
              <p className="rounded-tudu bg-cream-dark px-3 py-2 text-xs text-brown-muted">
                Showing demo contacts — enable the Contacts API on a supported mobile browser for
                real data.
              </p>
            )}

            <div className="flex gap-2 rounded-tudu bg-white p-1 shadow-sm ring-1 ring-brown/5">
              <button
                type="button"
                onClick={() => setTab('add')}
                className={`flex-1 rounded-tudu py-2.5 text-sm font-semibold transition ${
                  tab === 'add'
                    ? 'bg-gradient-tudu text-white shadow-sm'
                    : 'text-brown-muted hover:text-brown'
                }`}
              >
                Add Friends
                {onTudu.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-white/25 px-1.5 text-xs">
                    {onTudu.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setTab('invite')}
                className={`flex-1 rounded-tudu py-2.5 text-sm font-semibold transition ${
                  tab === 'invite'
                    ? 'bg-gradient-tudu text-white shadow-sm'
                    : 'text-brown-muted hover:text-brown'
                }`}
              >
                Invite Friends
                {notOnTudu.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-white/25 px-1.5 text-xs">
                    {notOnTudu.length}
                  </span>
                )}
              </button>
            </div>

            {tab === 'add' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-brown">Add Friends</h2>
                  <p className="text-sm text-brown-muted">
                    These contacts are already on TUDU. Select who you&apos;d like to add.
                  </p>
                </div>

                {onTudu.length === 0 ? (
                  <p className="rounded-tudu border border-brown/10 bg-white px-4 py-8 text-center text-sm text-brown-muted">
                    None of your contacts are on TUDU yet. Switch to Invite Friends to bring them
                    in!
                  </p>
                ) : (
                  <>
                    <ul className="space-y-2">
                      {onTudu.map((contact) => (
                        <li key={contact.id} className="flex items-center gap-3">
                          <AvatarInitials name={contact.name} />
                          <div className="min-w-0 flex-1">
                            <ContactCheckbox
                              id={`add-${contact.id}`}
                              checked={selectedAdd.has(contact.id)}
                              onChange={(checked) => toggleAdd(contact.id, checked)}
                              label={contact.tuduUser.name}
                              sublabel={`@${contact.tuduUser.username} · ${contact.matchedPhone}`}
                              badge="On TUDU"
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                    <GradientButton
                      fullWidth
                      className="disabled:opacity-50"
                      disabled={selectedAdd.size === 0}
                      onClick={handleAddFriends}
                    >
                      Add Selected ({selectedAdd.size})
                    </GradientButton>
                  </>
                )}
              </div>
            )}

            {tab === 'invite' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-brown">Invite Friends</h2>
                  <p className="text-sm text-brown-muted">
                    These contacts aren&apos;t on TUDU yet. Send them an invite to join.
                  </p>
                </div>

                {notOnTudu.length === 0 ? (
                  <p className="rounded-tudu border border-brown/10 bg-white px-4 py-8 text-center text-sm text-brown-muted">
                    All your contacts are already on TUDU — nice!
                  </p>
                ) : (
                  <>
                    <label className="flex cursor-pointer items-center gap-3 rounded-tudu border-2 border-dashed border-purple/30 bg-white px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allInviteSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someInviteSelected
                        }}
                        onChange={(e) => toggleInviteAll(e.target.checked)}
                        className="h-5 w-5 shrink-0 rounded border-brown/30 accent-purple"
                      />
                      <span className="font-semibold text-brown">Invite All</span>
                      <span className="ml-auto text-xs text-brown-muted">
                        {selectedInvite.size} of {notOnTudu.length} selected
                      </span>
                    </label>

                    <ul className="space-y-2">
                      {notOnTudu.map((contact) => (
                        <li key={contact.id}>
                          <ContactCheckbox
                            id={`invite-${contact.id}`}
                            checked={selectedInvite.has(contact.id)}
                            onChange={(checked) => toggleInvite(contact.id, checked)}
                            label={contact.name}
                            sublabel={contact.phones[0] ?? 'No phone number'}
                          />
                        </li>
                      ))}
                    </ul>

                    <GradientButton
                      fullWidth
                      className="disabled:opacity-50"
                      disabled={selectedInvite.size === 0}
                      onClick={handleSendInvites}
                    >
                      Send Invites ({selectedInvite.size})
                    </GradientButton>
                  </>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setView('find')
                setOnTudu([])
                setNotOnTudu([])
              }}
              className="w-full text-center text-sm text-brown-muted hover:text-brown"
            >
              ← Search contacts again
            </button>
          </section>
        )}
      </main>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
