import type { InterestCategory } from '../data/categories'

type CategoryIconProps = {
  category: InterestCategory
  size?: number
  className?: string
}

/** Lucide icon for an interest category — matches app icon style. */
export default function CategoryIcon({
  category,
  size = 18,
  className = '',
}: CategoryIconProps) {
  const Icon = category.icon
  return <Icon size={size} className={className} strokeWidth={2} aria-hidden />
}
