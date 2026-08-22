import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BookmarkIcon,
  BookmarkSquareIcon,
  MapPinIcon,
  TicketIcon,
  TruckIcon,
  UserCircleIcon,
  UserIcon,
} from '@heroicons/react/24/solid'
import navHostEventsSrc from '../../assets/icons/nav-host-events.png'
import {
  NavBookmarkIcon,
  NavBucketIcon,
  NavBucketIconAlt,
  NavCarIcon,
  NavHostEventsIcon,
  NavMyTuduIcon,
  NavThingsTuduIcon,
  NavTicketIcon,
} from '../../components/icons/NavIcons'

type SlotKey = 'host' | 'roadtrip' | 'things' | 'bucket' | 'mytudu'

const STORAGE_KEY = 'nav-icon-picker-choice'

type NavChoices = Record<SlotKey, string>

const DEFAULT_CHOICES: NavChoices = {
  host: 'host:A1',
  roadtrip: 'roadtrip:R0',
  things: 'things:C1',
  bucket: 'bucket:B0',
  mytudu: 'mytudu:A1',
}

type Approach = 'A' | 'B' | 'C'

type IconOption = {
  id: string
  label: string
  approach: Approach
  note?: string
  render: (active: boolean) => React.ReactNode
}

type SlotSection = {
  key: SlotKey
  title: string
  sectionNote?: string
  options: IconOption[]
}

function navSvgClass(active: boolean) {
  return `h-9 w-9 shrink-0 transition-colors duration-[var(--duration-fast)] ${
    active ? 'text-orange' : 'text-brown-muted'
  }`
}

function navHostTicketIconClass(active: boolean) {
  return `nav-png-icon ${active ? 'nav-png-icon--host-active' : 'nav-png-icon--muted'}`
}

/** Road Trip picker â€” minimal side-profile sedan (solid currentColor). */
function RoadTripSideCarSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 12.75h1.4l1.35-3.8c.45-1.25 1.65-2.05 2.95-2.05h5.6c1.3 0 2.5.8 2.95 2.05l1.35 3.8H20v2.75c0 .55-.45 1-1 1h-.85a2.1 2.1 0 0 1-4.1 0h-4.08a2.1 2.1 0 0 1-4.1 0H5c-.55 0-1-.45-1-1v-2.75Zm5.15-4.5h5.7l.95 2.7H8.2l.95-2.7ZM7.25 16a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Zm9.5 0a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z"
      />
    </svg>
  )
}

/** Road Trip picker â€” front-view passenger car (solid currentColor). */
function RoadTripFrontCarSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 3.75c-2.35 0-4.35 1.15-5.35 3.35L5.25 10v8.25c0 .97.78 1.75 1.75 1.75h.9a2.25 2.25 0 0 0 4.35 0h3.5a2.25 2.25 0 0 0 4.35 0h.9c.97 0 1.75-.78 1.75-1.75V10l-1.4-2.9C19.35 4.9 17.35 3.75 15 3.75h-3Zm0 1.75c1.55 0 2.85.85 3.45 2.15L16.15 10H7.85l.7-2.35c.6-1.3 1.9-2.15 3.45-2.15ZM8.5 16.25a1.35 1.35 0 1 0 0-2.7 1.35 1.35 0 0 0 0 2.7Zm7 0a1.35 1.35 0 1 0 0-2.7 1.35 1.35 0 0 0 0 2.7Z"
      />
    </svg>
  )
}

/** Road Trip picker Ã¢â‚¬â€ boxy front-view SUV (solid currentColor). */
function RoadTripFrontSuvSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6 4.5c-1.35 0-2.55.85-3 2.15L2.25 10v8.75c0 .97.78 1.75 1.75 1.75h.75a2.15 2.15 0 0 0 4.15 0h5.2a2.15 2.15 0 0 0 4.15 0h.75c.97 0 1.75-.78 1.75-1.75V10l-.75-3.35C19.55 5.35 18.35 4.5 17 4.5H6Zm0 1.75h11l.65 2.75H5.35L6 6.25ZM7.75 16.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Zm8.5 0a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z"
      />
    </svg>
  )
}

/** Road Trip picker Ã¢â‚¬â€ steering wheel (driving / mode, not a vehicle silhouette). */
function RoadTripSteeringWheelSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2.25a9.75 9.75 0 1 0 0 19.5 9.75 9.75 0 0 0 0-19.5Zm0 1.75a8 8 0 0 1 7.75 6.02h-3.43a4.25 4.25 0 0 0-8.64 0H4.25A8 8 0 0 1 12 4Zm-4.25 7.77a2.75 2.75 0 0 1 5.34 0h3.82a6.25 6.25 0 0 1-12.98 0h3.82Zm0 1.75H4.28a8 8 0 0 0 15.44 0h-3.47a2.75 2.75 0 0 1-5.34 0h-3.47ZM12 6.5a3.25 3.25 0 0 0-3.2 2.65h6.4A3.25 3.25 0 0 0 12 6.5Z"
      />
    </svg>
  )
}

function FooterStripPreview({ renderIcon }: { renderIcon: (active: boolean) => React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-[14px] border border-white/[0.08] bg-midnight-elevated px-4 py-3">
      <div className="flex flex-col items-center gap-1.5">
        <span className="font-display text-[9px] font-bold uppercase tracking-wide text-brown-muted">
          Inactive
        </span>
        <span className="flex h-9 items-center justify-center">{renderIcon(false)}</span>
      </div>
      <div className="h-10 w-px bg-white/10" aria-hidden />
      <div className="flex flex-col items-center gap-1.5">
        <span className="font-display text-[9px] font-bold uppercase tracking-wide text-orange">
          Active
        </span>
        <span className="flex h-9 items-center justify-center">{renderIcon(true)}</span>
      </div>
    </div>
  )
}

function approachBadge(approach: Approach) {
  const labels: Record<Approach, string> = {
    A: 'A Ã¢â‚¬â€ SVG currentColor',
    B: 'B Ã¢â‚¬â€ PNG pair',
    C: 'C Ã¢â‚¬â€ PNG + filter',
  }
  return (
    <span className="rounded-[14px] bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-brown-muted">
      {labels[approach]}
    </span>
  )
}

const SLOT_SECTIONS: SlotSection[] = [
  {
    key: 'host',
    title: 'Host Events',
    options: [
      {
        id: 'host:A1',
        label: 'NavHostEventsIcon (production SVG)',
        approach: 'A',
        render: (active) => <NavHostEventsIcon className={navSvgClass(active)} />,
      },
      {
        id: 'host:A0',
        label: 'Horizontal ticket SVG',
        approach: 'A',
        render: (active) => <NavTicketIcon className={navSvgClass(active)} />,
      },
      {
        id: 'host:A2',
        label: 'Heroicons TicketIcon',
        approach: 'A',
        render: (active) => <TicketIcon className={navSvgClass(active)} aria-hidden />,
      },
      {
        id: 'host:C2',
        label: 'Host ticket PNG + filter (legacy)',
        approach: 'C',
        note: 'nav-host-events.png with CSS filter pipeline',
        render: (active) => (
          <img
            src={navHostEventsSrc}
            className={navHostTicketIconClass(active)}
            alt=""
            aria-hidden
            draggable={false}
          />
        ),
      },
    ],
  },
  {
    key: 'roadtrip',
    title: 'Road Trip',
    sectionNote:
      'Production bottom nav uses roadtrip:R0 today. Reply with roadtrip:R1 (or any ID below) to switch the shipped icon.',
    options: [
      {
        id: 'roadtrip:R0',
        label: 'NavCarIcon Ã¢â‚¬â€ production (side view)',
        approach: 'A',
        note: 'Same SVG as BottomNav today; sedan in profile with cabin + wheels.',
        render: (active) => <NavCarIcon className={navSvgClass(active)} />,
      },
      {
        id: 'roadtrip:R1',
        label: 'Side-profile car (picker alt)',
        approach: 'A',
        note: 'Flatter sedan silhouette Ã¢â‚¬â€ still side view, slightly simpler shape.',
        render: (active) => <RoadTripSideCarSvg className={navSvgClass(active)} />,
      },
      {
        id: 'roadtrip:R2',
        label: 'Front-view car',
        approach: 'A',
        note: 'Head-on sedan Ã¢â‚¬â€ windshield, hood, and paired wheels.',
        render: (active) => <RoadTripFrontCarSvg className={navSvgClass(active)} />,
      },
      {
        id: 'roadtrip:R3',
        label: 'Heroicons TruckIcon (truck, not car)',
        approach: 'A',
        note: 'Delivery-style truck Ã¢â‚¬â€ reads Ã¢â‚¬Å“haul / roadÃ¢â‚¬Â but not a passenger car.',
        render: (active) => <TruckIcon className={navSvgClass(active)} aria-hidden />,
      },
      {
        id: 'roadtrip:R4',
        label: 'Front-view SUV',
        approach: 'A',
        note: 'Taller, boxier grille Ã¢â‚¬â€ adventure / family road trip vibe.',
        render: (active) => <RoadTripFrontSuvSvg className={navSvgClass(active)} />,
      },
      {
        id: 'roadtrip:R5',
        label: 'Steering wheel',
        approach: 'A',
        note: 'Driving mode mark Ã¢â‚¬â€ not a vehicle outline.',
        render: (active) => <RoadTripSteeringWheelSvg className={navSvgClass(active)} />,
      },
    ],
  },
  {
    key: 'things',
    title: 'Things Tudu',
    options: [
      {
        id: 'things:C1',
        label: 'Brand pin + T PNG (production)',
        approach: 'C',
        render: (active) => <NavThingsTuduIcon active={active} />,
      },
      {
        id: 'things:A1',
        label: 'Brand pin + T PNG',
        approach: 'A',
        note: 'Same mark as production NavThingsTuduIcon (/tudu-icon.png)',
        render: (active) => <NavThingsTuduIcon active={active} />,
      },
      {
        id: 'things:A2',
        label: 'Heroicons MapPinIcon',
        approach: 'A',
        render: (active) => <MapPinIcon className={navSvgClass(active)} aria-hidden />,
      },
    ],
  },
  {
    key: 'bucket',
    title: 'Bucket List',
    options: [
      {
        id: 'bucket:B0',
        label: 'NavBucketIcon (production)',
        approach: 'A',
        note: 'Pail with wire bail handle',
        render: (active) => <NavBucketIcon className={navSvgClass(active)} />,
      },
      {
        id: 'bucket:B1',
        label: 'NavBucketIconAlt',
        approach: 'A',
        note: 'Sand bucket with flat bar handle',
        render: (active) => <NavBucketIconAlt className={navSvgClass(active)} />,
      },
      {
        id: 'bucket:A1',
        label: 'NavBucketIcon (legacy id Ã¢â€ â€™ B0)',
        approach: 'A',
        render: (active) => <NavBucketIcon className={navSvgClass(active)} />,
      },
      {
        id: 'bucket:A0',
        label: 'NavBookmarkIcon (legacy)',
        approach: 'A',
        render: (active) => <NavBookmarkIcon className={navSvgClass(active)} />,
      },
      {
        id: 'bucket:A2',
        label: 'Heroicons BookmarkIcon',
        approach: 'A',
        render: (active) => <BookmarkIcon className={navSvgClass(active)} aria-hidden />,
      },
      {
        id: 'bucket:A3',
        label: 'Heroicons BookmarkSquareIcon',
        approach: 'A',
        render: (active) => <BookmarkSquareIcon className={navSvgClass(active)} aria-hidden />,
      },
    ],
  },
  {
    key: 'mytudu',
    title: 'My Tudu',
    options: [
      {
        id: 'mytudu:A1',
        label: 'NavMyTuduIcon',
        approach: 'A',
        render: (active) => <NavMyTuduIcon className={navSvgClass(active)} />,
      },
      {
        id: 'mytudu:A2',
        label: 'Heroicons UserCircleIcon',
        approach: 'A',
        render: (active) => <UserCircleIcon className={navSvgClass(active)} aria-hidden />,
      },
      {
        id: 'mytudu:A3',
        label: 'Heroicons UserIcon',
        approach: 'A',
        render: (active) => <UserIcon className={navSvgClass(active)} aria-hidden />,
      },
    ],
  },
]

const PRODUCTION_NAV = [
  {
    label: 'Host Events',
    render: (active: boolean) => (
      <NavHostEventsIcon className={navSvgClass(active)} />
    ),
  },
  {
    label: 'Road Trip',
    render: (active: boolean) => <NavCarIcon className={navSvgClass(active)} />,
  },
  {
    label: 'Things Tudu',
    render: (active: boolean) => <NavThingsTuduIcon active={active} />,
  },
  {
    label: 'Bucket List',
    render: (active: boolean) => <NavBucketIcon className={navSvgClass(active)} />,
  },
  {
    label: 'My Tudu',
    render: (active: boolean) => <NavMyTuduIcon className={navSvgClass(active)} />,
  },
] as const

const ROADTRIP_LEGACY_IDS: Record<string, string> = {
  'roadtrip:A1': 'roadtrip:R0',
  'roadtrip:A0': 'roadtrip:R0',
  'roadtrip:A2': 'roadtrip:R0',
  'roadtrip:A3': 'roadtrip:R3',
  'roadtrip:A4': 'roadtrip:R0',
}

const BUCKET_LEGACY_IDS: Record<string, string> = {
  'bucket:A1': 'bucket:B0',
}

function loadChoices(): NavChoices {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_CHOICES }
    const parsed = JSON.parse(raw) as Partial<NavChoices>
    const merged = { ...DEFAULT_CHOICES, ...parsed }
    const roadtrip = merged.roadtrip
    if (roadtrip && ROADTRIP_LEGACY_IDS[roadtrip]) {
      merged.roadtrip = ROADTRIP_LEGACY_IDS[roadtrip]
    }
    const bucket = merged.bucket
    if (bucket && BUCKET_LEGACY_IDS[bucket]) {
      merged.bucket = BUCKET_LEGACY_IDS[bucket]
    }
    return merged
  } catch {
    return { ...DEFAULT_CHOICES }
  }
}

export default function NavIconPickerPage() {
  const [choices, setChoices] = useState<NavChoices>(() => loadChoices())
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    setChoices(loadChoices())
  }, [])

  const optionById = useMemo(() => {
    const map = new Map<string, IconOption>()
    for (const section of SLOT_SECTIONS) {
      for (const opt of section.options) {
        map.set(opt.id, opt)
      }
    }
    return map
  }, [])

  const pick = useCallback((slot: SlotKey, optionId: string) => {
    setChoices((prev) => ({ ...prev, [slot]: optionId }))
  }, [])

  const save = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(choices))
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 2000)
  }, [choices])

  return (
    <div className="mx-auto min-h-svh max-w-lg bg-cream px-4 pb-12 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="mb-6 space-y-3">
        <p className="font-display text-xs font-bold uppercase tracking-widest text-brown-muted">
          Dev tool
        </p>
        <h1 className="font-display text-2xl font-bold text-charcoal">Bottom nav icon picker</h1>
        <p className="text-sm leading-relaxed text-brown">
          Bottom nav uses <strong className="text-charcoal">5 tabs</strong> Ã¢â‚¬â€ pick one icon per row.
        </p>
        <div className="rounded-[14px] border border-charcoal/10 bg-white/80 p-3 text-xs leading-relaxed text-brown">
          <p className="mb-2 font-display font-bold text-charcoal">Approach legend (easiest first)</p>
          <ul className="space-y-1">
            <li>
              <span className="font-mono text-charcoal">A</span> = SVG{' '}
              <code className="text-[11px]">currentColor</code> (easiest dev)
            </li>
            <li>
              <span className="font-mono text-charcoal">B</span> = PNG pair from Figma
            </li>
            <li>
              <span className="font-mono text-charcoal">C</span> = PNG + CSS filter (hardest)
            </li>
          </ul>
        </div>
      </header>

      <div className="space-y-8">
        {SLOT_SECTIONS.map((section) => (
          <section key={section.key} aria-labelledby={`slot-${section.key}`}>
            <h2
              id={`slot-${section.key}`}
              className="mb-3 font-display text-lg font-bold text-charcoal"
            >
              {section.title}
            </h2>
            {section.sectionNote ? (
              <p className="mb-3 text-xs leading-relaxed text-brown-muted">{section.sectionNote}</p>
            ) : null}
            <ul className="space-y-4">
              {section.options.map((opt) => {
                const selected = choices[section.key] === opt.id
                return (
                  <li key={opt.id}>
                    <label
                      className={`block cursor-pointer rounded-[14px] border p-4 transition-colors ${
                        selected
                          ? 'border-orange/60 bg-white shadow-sm ring-1 ring-orange/20'
                          : 'border-charcoal/10 bg-white/60 hover:border-charcoal/20'
                      }`}
                    >
                      <div className="mb-3 flex flex-wrap items-start gap-2">
                        <input
                          type="radio"
                          name={`nav-slot-${section.key}`}
                          value={opt.id}
                          checked={selected}
                          onChange={() => pick(section.key, opt.id)}
                          className="mt-1 h-4 w-4 accent-orange"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-brown-muted">{opt.id}</span>
                            {approachBadge(opt.approach)}
                          </div>
                          <p className="font-display text-sm font-bold text-charcoal">{opt.label}</p>
                          {opt.note ? (
                            <p className="mt-0.5 text-xs text-brown-muted">{opt.note}</p>
                          ) : null}
                        </div>
                      </div>
                      <FooterStripPreview renderIcon={opt.render} />
                    </label>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="sticky bottom-4 z-10 mt-8 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={save}
          className="flex-1 rounded-[14px] bg-gradient-to-r from-magenta via-sunset-pink to-sunset-orange px-4 py-3 font-display text-sm font-bold text-white shadow-md transition-opacity hover:opacity-95"
        >
          Save my picks
        </button>
        {savedFlash ? (
          <p className="text-center text-sm font-medium text-green-700 sm:self-center" role="status">
            Saved to localStorage ({STORAGE_KEY})
          </p>
        ) : null}
      </div>

      <section className="mt-10 border-t border-charcoal/10 pt-8" aria-labelledby="production-mock">
        <h2 id="production-mock" className="mb-2 font-display text-lg font-bold text-charcoal">
          Live mock Ã¢â‚¬â€ production footer (all 5)
        </h2>
        <p className="mb-4 text-xs text-brown-muted">
          Current shipped icons on the real dark footer strip (all tabs inactive).
        </p>
        <nav
          className="overflow-hidden rounded-t-2xl border border-white/[0.08] bg-midnight-elevated/95 backdrop-blur-md"
          aria-label="Production bottom nav preview"
        >
          <div className="flex h-[var(--app-bottom-nav-h)] items-center justify-between px-0.5">
            {PRODUCTION_NAV.map((item) => (
              <div
                key={item.label}
                className="relative flex min-h-[var(--app-bottom-nav-h)] min-w-0 flex-1 flex-col items-center justify-start gap-0.5 px-0.5 pt-1.5"
              >
                <span className="relative flex h-9 shrink-0 items-center justify-center">
                  {item.render(false)}
                </span>
                <span className="max-w-full truncate text-center font-display text-[9px] font-bold leading-none tracking-wide text-brown-muted">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </nav>

        <p className="mt-4 text-xs text-brown-muted">Your saved picks (preview one slot active each):</p>
        <nav
          className="mt-2 overflow-hidden rounded-t-2xl border border-white/[0.08] bg-midnight-elevated/95"
          aria-label="Saved picks footer preview"
        >
          <div className="flex h-[var(--app-bottom-nav-h)] items-center justify-between px-0.5">
            {SLOT_SECTIONS.map((section, index) => {
              const optId = choices[section.key]
              const opt = optionById.get(optId)
              const active = index === 2
              return (
                <div
                  key={section.key}
                  className="relative flex min-h-[var(--app-bottom-nav-h)] min-w-0 flex-1 flex-col items-center justify-start gap-0.5 px-0.5 pt-1.5"
                >
                  {active ? (
                    <span
                      className="absolute top-0 h-0.5 w-7 rounded-full bg-gradient-to-r from-magenta via-sunset-pink to-sunset-orange"
                      aria-hidden
                    />
                  ) : null}
                  <span className="relative flex h-9 shrink-0 items-center justify-center">
                    {opt ? opt.render(active) : null}
                  </span>
                  <span
                    className={`max-w-full truncate text-center font-display text-[9px] font-bold leading-none tracking-wide ${
                      active ? 'text-orange' : 'text-brown-muted'
                    }`}
                  >
                    {section.title}
                  </span>
                </div>
              )
            })}
          </div>
        </nav>
      </section>
    </div>
  )
}
