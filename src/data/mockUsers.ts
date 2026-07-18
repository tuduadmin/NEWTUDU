export type FollowableUser = {
  id: string
  name: string
  initials: string
  avatarColor: string
  type: 'friend' | 'business' | 'organizer'
  location?: string
  following?: boolean
}

export const MOCK_FOLLOWABLE_USERS: FollowableUser[] = [
  {
    id: 'tourism-kindersley',
    name: 'Tourism Kindersley',
    initials: 'TK',
    avatarColor: '#e53935',
    type: 'business',
    location: 'Kindersley, SK',
    following: true,
  },
  {
    id: 'emerald-lounge',
    name: 'Emerald Lounge',
    initials: 'EL',
    avatarColor: '#8e24aa',
    type: 'business',
    location: 'Kindersley, SK',
    following: true,
  },
  {
    id: 'jamie-ward',
    name: 'Jamie Ward',
    initials: 'JW',
    avatarColor: '#ec407a',
    type: 'friend',
    location: 'Kindersley, SK',
    following: true,
  },
  {
    id: 'town-kindersley',
    name: 'Town of Kindersley',
    initials: 'K',
    avatarColor: '#43a047',
    type: 'organizer',
    location: 'Kindersley, SK',
    following: true,
  },
  {
    id: 'sarah-chen',
    name: 'Sarah Chen',
    initials: 'SC',
    avatarColor: '#5c6bc0',
    type: 'friend',
    location: 'Saskatoon, SK',
    following: false,
  },
  {
    id: 'marcus-webb',
    name: 'Marcus Webb',
    initials: 'MW',
    avatarColor: '#26a69a',
    type: 'friend',
    location: 'Regina, SK',
    following: false,
  },
  {
    id: 'kindersley-arena',
    name: 'Kindersley Arena',
    initials: 'KA',
    avatarColor: '#1565c0',
    type: 'business',
    location: 'Kindersley, SK',
    following: false,
  },
  {
    id: 'west-central-events',
    name: 'West Central Events Co.',
    initials: 'WE',
    avatarColor: '#f57c00',
    type: 'organizer',
    location: 'Rosetown, SK',
    following: false,
  },
]

export function searchFollowableUsers(query: string): FollowableUser[] {
  const q = query.trim().toLowerCase()
  if (!q) return MOCK_FOLLOWABLE_USERS
  return MOCK_FOLLOWABLE_USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.type.includes(q) ||
      (u.location?.toLowerCase().includes(q) ?? false),
  )
}
