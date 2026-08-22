import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  Camera,
  Car,
  Gamepad2,
  Globe,
  HandHeart,
  Lightbulb,
  Mic,
  Moon,
  Music,
  Palette,
  PawPrint,
  ShoppingBag,
  Star,
  Stethoscope,
  Trophy,
  UtensilsCrossed,
  Users,
  Heart,
} from 'lucide-react'

export type BudgetId = 'free' | 'under25' | 'under100' | 'any' | '25-50' | '50-100'

export type TimeframeId = 'any' | 'today' | 'week' | 'month' | 'weekend' | 'anytime'

export type SavedTimeFilterId = 'any' | 'today' | 'week' | 'month' | 'august' | 'september'

export type SortOptionId = 'soonest' | 'name' | 'category'

export type CategoryId = string

export type InterestCategory = {
  id: CategoryId
  label: string
  icon: LucideIcon
}

export const INTEREST_CATEGORIES: InterestCategory[] = [
  { id: 'all', label: 'All', icon: Globe },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'arts-culture', label: 'Arts & Culture', icon: Palette },
  { id: 'lifestyle-wellness', label: 'Lifestyle & Wellness', icon: Heart },
  { id: 'volunteering', label: 'Volunteering & Causes', icon: HandHeart },
  { id: 'health-tech', label: 'Health & Technology', icon: Stethoscope },
  { id: 'sports-fitness', label: 'Sports & Fitness', icon: Trophy },
  { id: 'conferences', label: 'Conferences & Conventions', icon: Mic },
  { id: 'food-drink', label: 'Food & Drink', icon: UtensilsCrossed },
  { id: 'family-kids', label: 'Family & Kids', icon: Users },
  { id: 'pets-animals', label: 'Pets & Animals', icon: PawPrint },
  { id: 'nightlife-social', label: 'Nightlife & Social', icon: Moon },
  { id: 'shows-gaming', label: 'Shows & Gaming', icon: Gamepad2 },
  { id: 'shopping-markets', label: 'Shopping & Markets', icon: ShoppingBag },
  { id: 'education-workshops', label: 'Education & Workshops', icon: BookOpen },
  { id: 'business-career', label: 'Business, Career & Innovation', icon: Lightbulb },
  { id: 'auto-boat-air', label: 'Auto Boat & Air', icon: Car },
  { id: 'fashion-photoshoot', label: 'Fashion & Photoshoot', icon: Camera },
  { id: 'festivals', label: 'Festivals & Special Events', icon: Star },
]

export const BUDGET_OPTIONS: { id: BudgetId; label: string; sublabel?: string }[] = [
  { id: 'free', label: 'Free Events', sublabel: 'Events' },
  { id: 'under25', label: 'Under $25', sublabel: 'Budget' },
  { id: 'under100', label: 'Under $100', sublabel: 'Premium' },
  { id: 'any', label: 'Any Price', sublabel: '' },
]

export const TIMEFRAME_FILTER_OPTIONS: { id: TimeframeId; label: string }[] = [
  { id: 'any', label: 'Any Time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
]

export const SAVED_TIME_FILTERS: { id: SavedTimeFilterId; label: string }[] = [
  { id: 'any', label: 'Any Time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'august', label: 'August' },
  { id: 'september', label: 'September' },
]

export const SORT_OPTIONS: { id: SortOptionId; label: string; icon: string }[] = [
  { id: 'soonest', label: 'Happening Soonest', icon: '🕐' },
  { id: 'name', label: 'Name (A-Z)', icon: '↕️' },
  { id: 'category', label: 'Category', icon: '🏷️' },
]
