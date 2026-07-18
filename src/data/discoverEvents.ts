export type DiscoverBadge = 'TRUSTED HOST' | 'HIDDEN GEM'
export type DiscoverAmenity = 'food' | 'parking' | 'wheelchair'

export type DiscoverCategory = {
  label: string
  color: 'teal' | 'yellow' | 'purple'
  icon: 'cart' | 'food' | 'party'
}

export type DiscoverEvent = {
  id: string
  title: string
  city: string
  image: string
  badges: DiscoverBadge[]
  amenities?: DiscoverAmenity[]
  dateTag?: string
  dateTime?: string
  cost?: string
  ageRange?: string
  distance?: string
  categories?: DiscoverCategory[]
  partyType?: string
  locationDetail?: string
  borderColor?: 'blue' | 'yellow'
}

export const DISCOVER_EVENTS: DiscoverEvent[] = [
  {
    id: 'farmers-market',
    title: "Saskatoon Farmers' Market",
    city: 'Saskatoon',
    image: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&q=80',
    badges: ['TRUSTED HOST'],
    amenities: ['food', 'parking', 'wheelchair'],
    dateTag: 'Tomorrow',
    dateTime: 'Dec 17, 9:00 AM',
    cost: 'Free',
    ageRange: 'All Ages',
    distance: '~5 mins away',
    categories: [
      { label: 'Shopping & Markets', color: 'teal', icon: 'cart' },
      { label: 'Food & Drink', color: 'yellow', icon: 'food' },
    ],
    borderColor: 'blue',
  },
  {
    id: 'one-book-one-province',
    title: 'One Book One Province 2026',
    city: 'Kindersley',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    badges: ['HIDDEN GEM'],
    partyType: 'Party',
    ageRange: 'All Ages',
    locationDetail:
      'In Maple Creek, Assiniboia, Saskatoon, Moosomin, Yorkton & Regina',
    borderColor: 'yellow',
  },
  {
    id: 'kindersley-summer-market',
    title: 'Kindersley Summer Market',
    city: 'Kindersley',
    image: 'https://images.unsplash.com/photo-1567306303716-647a3c3a0a4c?w=800&q=80',
    badges: ['TRUSTED HOST'],
    amenities: ['food', 'parking'],
    dateTag: 'This Weekend',
    dateTime: 'Jul 19, 9:00 AM',
    cost: 'Free',
    ageRange: 'All Ages',
    distance: '~10 mins away',
    categories: [{ label: 'Shopping & Markets', color: 'teal', icon: 'cart' }],
    borderColor: 'blue',
  },
  {
    id: 'jazz-emerald',
    title: 'Live Jazz at Emerald Lounge',
    city: 'Kindersley',
    image: 'https://images.unsplash.com/photo-1415201361474-7efff816c025?w=800&q=80',
    badges: ['HIDDEN GEM'],
    amenities: ['food', 'wheelchair'],
    dateTag: 'Next Week',
    dateTime: 'Jul 20, 8:00 PM',
    cost: '$15',
    ageRange: '19+',
    distance: '~3 mins away',
    categories: [{ label: 'Music', color: 'purple', icon: 'party' }],
    borderColor: 'yellow',
  },
]
