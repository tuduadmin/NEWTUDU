import { getLoginNameFromUser } from './auth'
import { getPreferences } from './preferences'

/** Name printed on tickets and used for check-in — private, not for public profile. */
export function resolveTicketHolderName(email?: string): string {
  const prefs = getPreferences(email)
  const legal = prefs.legalName?.trim()
  if (legal) return legal

  const userEmail = prefs.email?.trim() || email?.trim()
  if (userEmail) {
    const loginName = getLoginNameFromUser(userEmail)
    if (loginName) return loginName
    if (prefs.screenName.trim()) return prefs.screenName.trim()
  }
  return 'Guest'
}
