/** Shared chip/button styling for Interests & Preferences (and onboarding picks). */
export const PREF_CHOICE_BASE =
  'pref-choice rounded-[14px] border-2 transition duration-[var(--duration-fast)] active:scale-[0.98]'

export const PREF_CHOICE_INACTIVE =
  'border-brown/15 bg-app-elevated hover:border-brown/25'

export const PREF_CHOICE_ACTIVE = 'pref-choice--active ring-1'

/** Label weight only — color comes from pref-choice-themes.css */
export const PREF_CHOICE_ACTIVE_TEXT = 'font-semibold'

export function prefChoiceClasses(active: boolean, extra = ''): string {
  return `${PREF_CHOICE_BASE} ${extra} ${active ? PREF_CHOICE_ACTIVE : PREF_CHOICE_INACTIVE}`.trim()
}
