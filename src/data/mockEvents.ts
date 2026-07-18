export type MockEvent = {
  id: string
  title: string
  category: string
  categoryId: string
  location: string
  date: string
  dateSort: number
  cost: string
  image: string
  host: string
}

export const MOCK_EVENTS: MockEvent[] = [
  {
    id: 'e1',
    title: 'Kindersley Summer Market',
    category: 'Shopping & Markets',
    categoryId: 'shopping-markets',
    location: 'Kindersley, SK',
    date: 'Jul 19, 2026 · 9:00 AM',
    dateSort: 20260719,
    cost: 'Free',
    image: 'https://images.unsplash.com/photo-1567306303716-647a3c3a0a4c?w=400&q=80',
    host: 'Tourism Kindersley',
  },
  {
    id: 'e2',
    title: 'Live Jazz at Emerald Lounge',
    category: 'Music',
    categoryId: 'music',
    location: 'Kindersley, SK',
    date: 'Jul 20, 2026 · 8:00 PM',
    dateSort: 20260720,
    cost: '$15',
    image: 'https://images.unsplash.com/photo-1415201361474-7efff816c025?w=400&q=80',
    host: 'Emerald Lounge',
  },
  {
    id: 'e3',
    title: 'Community Yoga in the Park',
    category: 'Lifestyle & Wellness',
    categoryId: 'lifestyle-wellness',
    location: 'Kindersley, SK',
    date: 'Jul 21, 2026 · 7:00 AM',
    dateSort: 20260721,
    cost: 'Free',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80',
    host: 'Jamie Ward',
  },
  {
    id: 'e4',
    title: 'Town Hall Open House',
    category: 'Business, Career & Innovation',
    categoryId: 'business-career',
    location: 'Kindersley, SK',
    date: 'Jul 22, 2026 · 6:00 PM',
    dateSort: 20260722,
    cost: 'Free',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&q=80',
    host: 'Town of Kindersley',
  },
  {
    id: 'e5',
    title: 'Saskatchewan Food & Drink Festival',
    category: 'Food & Drink',
    categoryId: 'food-drink',
    location: 'Saskatoon, SK',
    date: 'Aug 2, 2026 · 11:00 AM',
    dateSort: 20260802,
    cost: '$25',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
    host: 'West Central Events Co.',
  },
  {
    id: 'e6',
    title: 'Family Fun Day at the Arena',
    category: 'Family & Kids',
    categoryId: 'family-kids',
    location: 'Kindersley, SK',
    date: 'Aug 9, 2026 · 1:00 PM',
    dateSort: 20260809,
    cost: '$10',
    image: 'https://images.unsplash.com/photo-1503454537845-2239d3d3f0e1?w=400&q=80',
    host: 'Kindersley Arena',
  },
  {
    id: 'e7',
    title: 'Night Market & Social',
    category: 'Nightlife & Social',
    categoryId: 'nightlife-social',
    location: 'Kindersley, SK',
    date: 'Aug 15, 2026 · 7:00 PM',
    dateSort: 20260815,
    cost: 'Free',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80',
    host: 'Tourism Kindersley',
  },
  {
    id: 'e8',
    title: 'Esports Tournament',
    category: 'Shows & Gaming',
    categoryId: 'shows-gaming',
    location: 'Regina, SK',
    date: 'Sep 5, 2026 · 2:00 PM',
    dateSort: 20260905,
    cost: '$20',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80',
    host: 'Marcus Webb',
  },
]

export function searchEvents(query: string): MockEvent[] {
  const q = query.trim().toLowerCase()
  if (!q) return MOCK_EVENTS
  return MOCK_EVENTS.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      e.host.toLowerCase().includes(q),
  )
}
