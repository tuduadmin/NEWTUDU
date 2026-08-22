type NavIconProps = {
  className?: string
}

/** Host Events — admission ticket with perforated edge (Heroicons solid, nav weight). */
export function NavHostEventsIcon({ className }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.5 6.375c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v3.026a.75.75 0 0 1-.375.65 2.249 2.249 0 0 0 0 3.898.75.75 0 0 1 .375.65v3.026c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 17.625v-3.026a.75.75 0 0 1 .374-.65 2.249 2.249 0 0 0 0-3.898.75.75 0 0 1-.374-.65V6.375Zm15-1.125a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm.75 4.5a.75.75 0 0 0-1.5 0v.75a.75.75 0 0 0 1.5 0v-.75Zm-.75 3a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75a.75.75 0 0 1 .75-.75Zm.75 4.5a.75.75 0 0 0-1.5 0V18a.75.75 0 0 0 1.5 0v-.75ZM6 12a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 12Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z"
      />
    </svg>
  )
}

/** Horizontal admission ticket — alias for icon picker / legacy references. */
export function NavTicketIcon({ className }: NavIconProps) {
  return <NavHostEventsIcon className={className} />
}

/** Same gradient pin mark as header TuduLogo (iconWithText / iconOnly). */
export const TUDU_BRAND_ICON_SRC = '/tudu-icon.png'

type NavThingsTuduIconProps = NavIconProps & {
  active?: boolean
}

/** Things Tudu — brand pin + T artwork at nav size (no circle wrapper). */
export function NavThingsTuduIcon({ className = '', active = false }: NavThingsTuduIconProps) {
  return (
    <img
      src={TUDU_BRAND_ICON_SRC}
      alt=""
      aria-hidden
      className={`nav-png-icon ${active ? 'nav-png-icon--pin-active' : 'nav-png-icon--muted'} ${className}`}
    />
  )
}

/** Solid circle with head/shoulders silhouette cutout. */
export function NavMyTuduIcon({ className }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM14.5 9.25a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM12 13.5c-3.2 0-5.1 1.55-5.1 3.35V18h10.2v-1.15c0-1.8-1.9-3.35-5.1-3.35z"
      />
    </svg>
  )
}

/** Road Trip — solid side-view car, nav weight. */
export function NavCarIcon({ className }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.25 11.25 6.9 7.4c.45-.95 1.4-1.55 2.45-1.55h5.3c1.05 0 2 .6 2.45 1.55l1.65 3.85h.75c.97 0 1.75.78 1.75 1.75V16.5c0 .97-.78 1.75-1.75 1.75h-.35a2.75 2.75 0 0 1-5.3 0h-3.5a2.75 2.75 0 0 1-5.3 0H5.5c-.97 0-1.75-.78-1.75-1.75V13c0-.97.78-1.75 1.75-1.75h.25ZM8.5 16.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Zm7.5 0a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM8.15 8.5h7.7l1.35 3.15H6.8L8.15 8.5Z"
      />
    </svg>
  )
}

/** Bucket List — pail with rim + wire bail (nav weight). */
export function NavBucketIcon({ className }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.75 9.75C5.75 8.35 8.4 7.25 12 7.25s6.25 1.1 6.25 2.5l-1.5 9.5c-.1.6-.65 1-1.25 1H8.5c-.6 0-1.15-.4-1.25-1l-1.5-9.5zM7.75 8.5c0 0 .35-4.35 4.25-4.85 3.9.5 4.25 4.85 4.25 4.85l-.65.45c0 0-.25-3.55-3.6-4-3.35.45-3.6 4-3.6 4l-.65-.45z"
      />
    </svg>
  )
}

/** Bucket List alt — sand pail with flat bar handle (picker). */
export function NavBucketIconAlt({ className }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.75 10.25C5.75 8.85 8.4 7.75 12 7.75s6.25 1.1 6.25 2.5l-1.5 9.25c-.1.6-.65 1-1.25 1H8.5c-.6 0-1.15-.4-1.25-1l-1.5-9.25zM8 5.25h8v1.5H9.75v2.5h4.5V6.75H8V5.25z"
      />
    </svg>
  )
}

/** Solid bookmark ribbon — legacy / picker comparison. */
export function NavBookmarkIcon({ className }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6 4.75c0-.97.78-1.75 1.75-1.75h8.5c.97 0 1.75.78 1.75 1.75V19l-6-3.25L6 19V4.75z"
      />
    </svg>
  )
}

/** Folded map — legacy / picker comparison. */
export function NavMapIcon({ className }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.5 4.5 3 6.75v13.5l5.5-2.25L14 20.25l5.5-2.25V4.5L14 6.75 8.5 4.5zm0 2.35 4 1.65v11.3l-4-1.65V6.85zm5.5 1.65 4-1.65v11.3l-4 1.65V8.5z"
      />
    </svg>
  )
}
