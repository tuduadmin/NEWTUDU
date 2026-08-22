import { TUDU_BLACK_DISPLAY_NAME, TUDU_BLACK_ICON_SRC } from '../../lib/adminTuduBlack'

type TuduBlackMarkProps = {
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const SIZE_CLASS = {
  sm: 'h-4 w-4',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
} as const

export default function TuduBlackMark({
  size = 'sm',
  showLabel = false,
  className = '',
}: TuduBlackMarkProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`.trim()}>
      <img
        src={TUDU_BLACK_ICON_SRC}
        alt=""
        className={`${SIZE_CLASS[size]} shrink-0 object-contain`}
      />
      {showLabel && <span className="font-medium">{TUDU_BLACK_DISPLAY_NAME}</span>}
    </span>
  )
}
