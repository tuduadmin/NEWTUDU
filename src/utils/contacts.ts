import { DEMO_CONTACTS } from '../data/demoContacts'
import { MOCK_TUDU_USERS, type TuduUser } from '../data/mockTuduUsers'

export type DeviceContact = {
  id: string
  name: string
  phones: string[]
}

export type MatchedContact = DeviceContact & {
  tuduUser: TuduUser
  matchedPhone: string
}

export type UnmatchedContact = DeviceContact

/** Strip formatting and compare the last 10 digits (North American demo). */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 ? digits.slice(-10) : digits
}

export function contactsApiSupported(): boolean {
  return typeof navigator !== 'undefined' && 'contacts' in navigator && !!navigator.contacts?.select
}

export async function fetchDeviceContacts(): Promise<{
  contacts: DeviceContact[]
  usedDemoData: boolean
}> {
  if (contactsApiSupported()) {
    try {
      const raw = await navigator.contacts!.select(['name', 'tel'], { multiple: true })
      const contacts: DeviceContact[] = raw.map((entry, index) => ({
        id: `device-${index}`,
        name: entry.name?.[0] ?? 'Unknown',
        phones: (entry.tel ?? []).map(String),
      }))
      return { contacts, usedDemoData: false }
    } catch {
      return { contacts: DEMO_CONTACTS, usedDemoData: true }
    }
  }

  return { contacts: DEMO_CONTACTS, usedDemoData: true }
}

function findTuduUserByPhone(phone: string): TuduUser | undefined {
  const normalized = normalizePhone(phone)
  if (!normalized) return undefined

  return MOCK_TUDU_USERS.find((user) => normalizePhone(user.phone) === normalized)
}

export function matchContacts(contacts: DeviceContact[]): {
  onTudu: MatchedContact[]
  notOnTudu: UnmatchedContact[]
} {
  const onTudu: MatchedContact[] = []
  const notOnTudu: UnmatchedContact[] = []
  const seenTuduIds = new Set<string>()

  for (const contact of contacts) {
    let matchedUser: TuduUser | undefined
    let matchedPhone = ''

    for (const phone of contact.phones) {
      const user = findTuduUserByPhone(phone)
      if (user) {
        matchedUser = user
        matchedPhone = phone
        break
      }
    }

    if (matchedUser && !seenTuduIds.has(matchedUser.id)) {
      seenTuduIds.add(matchedUser.id)
      onTudu.push({ ...contact, tuduUser: matchedUser, matchedPhone })
    } else if (!matchedUser) {
      notOnTudu.push(contact)
    }
  }

  onTudu.sort((a, b) => a.name.localeCompare(b.name))
  notOnTudu.sort((a, b) => a.name.localeCompare(b.name))

  return { onTudu, notOnTudu }
}
