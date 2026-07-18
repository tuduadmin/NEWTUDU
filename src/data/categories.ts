export type BudgetId = 'free' | 'under25' | 'under100' | 'any' | '25-50' | '50-100'

export type TimeframeId = 'any' | 'today' | 'week' | 'month' | 'weekend' | 'anytime'

export type SavedTimeFilterId = 'any' | 'today' | 'week' | 'month' | 'august' | 'september'

export type SortOptionId = 'soonest' | 'name' | 'category'

export type CategoryId = string

export type InterestCategory = {
  id: CategoryId
  label: string
  emoji: string
}

export const INTEREST_CATEGORIES: InterestCategory[] = [
  { id: 'all', label: 'All', emoji: '🌐' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'arts-culture', label: 'Arts & Culture', emoji: '🎨' },
  { id: 'lifestyle-wellness', label: 'Lifestyle & Wellness', emoji: '💚' },
  { id: 'volunteering', label: 'Volunteering & Causes', emoji: '🤝' },
  { id: 'health-tech', label: 'Health & Technology', emoji: '💊' },
  { id: 'sports-fitness', label: 'Sports & Fitness', emoji: '⚽' },
  { id: 'conferences', label: 'Conferences & Conventions', emoji: '🎤' },
  { id: 'food-drink', label: 'Food & Drink', emoji: '🍽️' },
  { id: 'family-kids', label: 'Family & Kids', emoji: '👨‍👩‍👧' },
  { id: 'pets-animals', label: 'Pets & Animals', emoji: '🐾' },
  { id: 'nightlife-social', label: 'Nightlife & Social', emoji: '🌙' },
  { id: 'shows-gaming', label: 'Shows & Gaming', emoji: '🎮' },
  { id: 'shopping-markets', label: 'Shopping & Markets', emoji: '🛒' },
  { id: 'education-workshops', label: 'Education & Workshops', emoji: '📚' },
  { id: 'business-career', label: 'Business, Career & Innovation', emoji: '💡' },
  { id: 'auto-boat-air', label: 'Auto Boat & Air', emoji: '🚗' },
  { id: 'fashion-photoshoot', label: 'Fashion & Photoshoot', emoji: '📸' },
  { id: 'festivals', label: 'Festivals & Special Events', emoji: '⭐' },
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
