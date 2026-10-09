import { Check, ChevronDown, Search, UserPlus, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFollowedUsers, resolveTaggedFollowers } from '../../lib/userFollows'
import { getCurrentUser } from '../../lib/auth'
import { appFieldClass } from '../../lib/formFieldClasses'

type RoadTripFollowerPickerProps = {
  taggedFollowerIds: string[]
  onChange: (ids: string[]) => void
  title?: string
  description?: string
}

export default function RoadTripFollowerPicker({
  taggedFollowerIds,
  onChange,
  title = 'Tag people you follow',
  description = 'They can follow this trip or add it to their own road trips.',
}: RoadTripFollowerPickerProps) {
  const user = getCurrentUser()
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const followed = useMemo(() => (user ? getFollowedUsers(user.email) : []), [user?.email])
  const tagged = resolveTaggedFollowers(taggedFollowerIds)

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return followed
    return followed.filter(
      (person) =>
        person.name.toLowerCase().includes(q) ||
        person.type.toLowerCase().includes(q) ||
        (person.location?.toLowerCase().includes(q) ?? false),
    )
  }, [followed, searchQuery])

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (rootRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => searchRef.current?.focus(), 0)
      return () => window.clearTimeout(t)
    }
    setSearchQuery('')
  }, [open])

  function toggle(userId: string) {
    onChange(
      taggedFollowerIds.includes(userId)
        ? taggedFollowerIds.filter((id) => id !== userId)
        : [...taggedFollowerIds, userId],
    )
  }

  function removeTagged(userId: string) {
    onChange(taggedFollowerIds.filter((id) => id !== userId))
  }

  if (!user) return null

  const triggerLabel =
    tagged.length === 0
      ? 'Select people to tag…'
      : tagged.length === 1
        ? tagged[0].name
        : `${tagged.length} people tagged`

  return (
    <div ref={rootRef} className="relative">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brown-muted">
        <UserPlus size={14} />
        {title}
      </p>
      <p className="mt-1 text-[11px] text-brown-muted">{description}</p>

      {followed.length === 0 ? (
        <p className="mt-3 rounded-[14px] border border-dashed border-app-subtle bg-cream-dark/40 px-3 py-4 text-center text-xs text-brown-muted">
          You&apos;re not following anyone yet.{' '}
          <Link to="/following" className="font-semibold text-orange no-underline">
            Find people to follow
          </Link>
        </p>
      ) : (
        <>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="mt-3 flex w-full items-center justify-between gap-2 rounded-[14px] border border-app-subtle bg-app-elevated px-3 py-2.5 text-left shadow-sm transition hover:border-orange/25"
          >
            <span
              className={`truncate text-sm font-semibold ${
                tagged.length > 0 ? 'text-brown' : 'text-brown-muted'
              }`}
            >
              {triggerLabel}
            </span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-brown-muted transition ${open ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>

          {tagged.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tagged.map((person) => (
                <span
                  key={person.id}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-orange/25 bg-orange/10 py-0.5 pl-1 pr-1.5"
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ backgroundColor: person.avatarColor }}
                  >
                    {person.initials}
                  </span>
                  <span className="truncate text-xs font-semibold text-brown">{person.name}</span>
                  <button
                    type="button"
                    onClick={() => removeTagged(person.id)}
                    className="rounded-full p-0.5 text-brown-muted transition hover:bg-orange/15 hover:text-brown"
                    aria-label={`Remove ${person.name}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {open && (
            <div className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated shadow-float">
              <div className="border-b border-app-subtle p-2">
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-brown-muted"
                    aria-hidden
                  />
                  <input
                    ref={searchRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search people you follow…"
                    className={`${appFieldClass} w-full py-2 pl-9 pr-3 text-sm`}
                    aria-label="Search people to tag"
                  />
                </div>
              </div>

              <ul
                className="max-h-52 overflow-y-auto p-1"
                role="listbox"
                aria-label="People you follow"
                aria-multiselectable
              >
                {filtered.length === 0 ? (
                  <li className="px-3 py-4 text-center text-xs text-brown-muted">No matches</li>
                ) : (
                  filtered.map((person) => {
                    const selected = taggedFollowerIds.includes(person.id)
                    return (
                      <li key={person.id} role="option" aria-selected={selected}>
                        <button
                          type="button"
                          onClick={() => toggle(person.id)}
                          className={`flex w-full items-center gap-2 rounded-[12px] px-2 py-2 text-left transition ${
                            selected ? 'bg-orange/10' : 'hover:bg-cream-dark/80'
                          }`}
                        >
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: person.avatarColor }}
                          >
                            {person.initials}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-brown">
                              {person.name}
                            </span>
                            <span className="block truncate text-[10px] capitalize text-brown-muted">
                              {person.type}
                              {person.location ? ` · ${person.location}` : ''}
                            </span>
                          </span>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border ${
                              selected
                                ? 'border-orange bg-orange text-white'
                                : 'border-brown/20 bg-app-elevated'
                            }`}
                            aria-hidden
                          >
                            {selected && <Check size={12} strokeWidth={3} />}
                          </span>
                        </button>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
