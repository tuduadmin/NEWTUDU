import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'

type ProfileViewButtonProps = {
  isDirty: boolean
  viewProfileUrl: string
  onPreview: () => void
}

export default function ProfileViewButton({
  isDirty,
  viewProfileUrl,
  onPreview,
}: ProfileViewButtonProps) {
  const className =
    'inline-flex items-center gap-1 text-xs font-semibold text-brown-muted no-underline transition hover:text-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/35 rounded-[8px]'

  if (isDirty) {
    return (
      <button type="button" onClick={onPreview} className={className}>
        <Eye size={14} />
        Preview
      </button>
    )
  }

  return (
    <Link to={viewProfileUrl} className={className}>
      View Profile
    </Link>
  )
}
