import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BookOpen,
  Car,
  Church,
  Gamepad2,
  HandHeart,
  HeartPulse,
  Lightbulb,
  Mountain,
  Music,
  Palette,
  PawPrint,
  Plane,
  ShoppingCart,
  Star,
  UtensilsCrossed,
  Users,
  Wine,
} from 'lucide-react'

export type EventCategoryId =
  | 'music'
  | 'arts-culture'
  | 'lifestyle-wellness'
  | 'community-causes'
  | 'faith-spirituality'
  | 'sports-fitness'
  | 'outdoors-adventure'
  | 'food-drink'
  | 'family-kids'
  | 'pets-animals'
  | 'nightlife-social'
  | 'tech-gaming'
  | 'shopping-markets'
  | 'education-workshops'
  | 'business-science'
  | 'auto-motorsports'
  | 'aviation-aerospace'
  | 'festivals-special'

export type EventCategory = {
  id: EventCategoryId
  label: string
  icon: LucideIcon
  subcategories: string[]
}

export const EVENT_CATEGORIES: EventCategory[] = [
  {
    id: 'music',
    label: 'Music',
    icon: Music,
    subcategories: [
      'Concerts & Live Shows',
      'Music Festivals & Tours',
      'DJs, Dance & Electronic Events',
      'Open Mic & Local Talent Nights',
      'Album Releases & Listening Parties',
    ],
  },
  {
    id: 'arts-culture',
    label: 'Arts & Culture',
    icon: Palette,
    subcategories: [
      'Galleries & Exhibits',
      'Theatre & Performing Arts',
      'Film, Photography & Media',
      'Cultural Celebrations & Heritage Events',
      'Literature, Poetry & Creative Workshops',
    ],
  },
  {
    id: 'lifestyle-wellness',
    label: 'Lifestyle & Wellness',
    icon: HeartPulse,
    subcategories: ['Yoga & Meditation', 'Fitness Classes', 'Spa & Self-Care', 'Health & Nutrition'],
  },
  {
    id: 'community-causes',
    label: 'Community & Causes',
    icon: HandHeart,
    subcategories: ['Fundraisers', 'Volunteer Events', 'Community Meetings', 'Charity Drives'],
  },
  {
    id: 'faith-spirituality',
    label: 'Faith & Spirituality',
    icon: Church,
    subcategories: ['Worship Services', 'Retreats', 'Study Groups', 'Interfaith Events'],
  },
  {
    id: 'sports-fitness',
    label: 'Sports & Fitness',
    icon: Activity,
    subcategories: ['Tournaments', 'Runs & Races', 'Team Sports', 'Fitness Challenges'],
  },
  {
    id: 'outdoors-adventure',
    label: 'Outdoors & Adventure',
    icon: Mountain,
    subcategories: ['Hiking & Camping', 'Water Sports', 'Wildlife & Nature', 'Adventure Tours'],
  },
  {
    id: 'food-drink',
    label: 'Food & Drink',
    icon: UtensilsCrossed,
    subcategories: ['Food Festivals', 'Tastings & Pairings', 'Pop-ups & Supper Clubs', 'Farm-to-Table'],
  },
  {
    id: 'family-kids',
    label: 'Family & Kids',
    icon: Users,
    subcategories: ['Kids Activities', 'Family Festivals', 'Storytime & Play', 'Parent Meetups'],
  },
  {
    id: 'pets-animals',
    label: 'Pets & Animals',
    icon: PawPrint,
    subcategories: ['Pet Meetups', 'Adoption Events', 'Animal Shows', 'Pet Training'],
  },
  {
    id: 'nightlife-social',
    label: 'Nightlife & Social',
    icon: Wine,
    subcategories: ['Club Nights', 'Bar Events', 'Social Mixers', 'Karaoke & Trivia'],
  },
  {
    id: 'tech-gaming',
    label: 'Tech & Gaming',
    icon: Gamepad2,
    subcategories: ['Esports', 'LAN Parties', 'Tech Talks', 'Hackathons'],
  },
  {
    id: 'shopping-markets',
    label: 'Shopping & Markets',
    icon: ShoppingCart,
    subcategories: ['Farmers Markets', 'Craft Fairs', 'Pop-up Shops', 'Vintage & Antiques'],
  },
  {
    id: 'education-workshops',
    label: 'Education & Workshops',
    icon: BookOpen,
    subcategories: ['Classes & Courses', 'Seminars', 'Skill Shares', 'Certification Prep'],
  },
  {
    id: 'business-science',
    label: 'Business, Science & Innovation',
    icon: Lightbulb,
    subcategories: ['Networking', 'Conferences', 'Startup Events', 'Science Fairs'],
  },
  {
    id: 'auto-motorsports',
    label: 'Auto & Motor Sports',
    icon: Car,
    subcategories: ['Car Shows', 'Races', 'Motorcycle Events', 'Off-Road'],
  },
  {
    id: 'aviation-aerospace',
    label: 'Aviation & Aerospace',
    icon: Plane,
    subcategories: ['Air Shows', 'Aviation Meetups', 'Space & STEM', 'Drone Events'],
  },
  {
    id: 'festivals-special',
    label: 'Festivals & Special Events',
    icon: Star,
    subcategories: ['Seasonal Festivals', 'Parades', 'Fireworks', 'Special Occasions'],
  },
]

export const PRIMARY_AMENITIES = [
  { id: 'food-drink', label: 'Food & Drink' },
  { id: 'alcohol', label: 'Alcohol Served' },
  { id: 'bathrooms', label: 'Bathrooms' },
  { id: 'parking', label: 'Parking Available' },
  { id: 'wheelchair', label: 'Wheelchair Accessible' },
  { id: 'wifi', label: 'Free Wi-Fi' },
] as const

export const ADDITIONAL_AMENITIES = {
  'Family & Accessibility': [
    { id: 'kid-friendly', label: 'Kid-Friendly Area' },
    { id: 'baby-changing', label: 'Baby Changing Station' },
    { id: 'pet-friendly', label: 'Pet Friendly' },
  ],
  'Services & Tech': [
    { id: 'power', label: 'Power Access' },
    { id: 'water', label: 'Water Access' },
    { id: 'atm', label: 'ATM On site' },
    { id: 'ev-charging', label: 'EV Charging' },
    { id: 'security', label: 'Security On-site' },
    { id: 'medical', label: 'Medical Services' },
  ],
  'Accommodations & Venue': [
    { id: 'lodging', label: 'Lodging Nearby' },
    { id: 'camping', label: 'Camping' },
    { id: 'camper-trailers', label: 'Camper Trailers' },
    { id: 'outdoor-seating', label: 'Outdoor Seating' },
    { id: 'transit', label: 'Near Public Transit' },
  ],
} as const

export const RECENT_VENUES = [
  {
    id: 'norman-ritchie',
    name: 'NORMAN RITCHIE CENTER',
    subtitle: 'Norman Ritchie Centre, Kindersley...',
    venueName: 'Norman Ritchie Centre',
    streetAddress: '902 5th Street West',
    city: 'Kindersley',
    province: 'SK',
    country: 'Canada',
  },
  {
    id: 'emerald-lounge',
    name: 'Emerald lounge',
    subtitle: '1 Dilson Drive, Kin...',
    venueName: 'Emerald Lounge',
    streetAddress: '1 Dilson Drive',
    city: 'Kindersley',
    province: 'SK',
    country: 'Canada',
  },
] as const

export const REPEAT_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
] as const

export function getCategoryById(id: EventCategoryId | ''): EventCategory | undefined {
  return EVENT_CATEGORIES.find((c) => c.id === id)
}
