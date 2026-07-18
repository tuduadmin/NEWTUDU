import { Link } from 'react-router-dom'

type TuduLogoProps = {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
  linkTo?: string
  variant?: 'light' | 'dark' | 'iconOnly' | 'iconWithText'
}

const logoHeights = { sm: 32, md: 40, lg: 56 }
const iconOnlyHeights = { sm: 28, md: 36, lg: 48 }

export default function TuduLogo({
  size = 'md',
  showText = true,
  className = '',
  linkTo = '/',
  variant = 'light',
}: TuduLogoProps) {
  const isIconOnly = variant === 'iconOnly'
  const isIconWithText = variant === 'iconWithText'
  const height =
    isIconOnly || isIconWithText ? iconOnlyHeights[size] : logoHeights[size]
  const filterStyle = variant === 'dark' ? { filter: 'brightness(1.1)' } : undefined
  const iconSrc = isIconOnly || isIconWithText ? '/tudu-icon.png' : '/logo.png'

  const content = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {isIconWithText ? (
        <>
          <img
            src={iconSrc}
            alt="TUDU"
            width={height}
            height={height}
            className="shrink-0 object-contain"
            style={{ width: height, height }}
          />
          <span className="font-display text-lg font-extrabold tracking-tight bg-gradient-to-r from-sunset-orange to-magenta bg-clip-text text-transparent sm:text-xl">
            tudu.ca
          </span>
        </>
      ) : isIconOnly ? (
        <img
          src={iconSrc}
          alt="TUDU"
          width={height}
          height={height}
          className="shrink-0 object-contain"
          style={{ width: height, height, ...filterStyle }}
        />
      ) : showText ? (
        <img
          src="/logo.png"
          alt="TUDU Entertainment"
          height={height}
          className="h-auto w-auto shrink-0 object-contain"
          style={{ height, ...filterStyle }}
        />
      ) : (
        <span
          className="inline-block shrink-0 overflow-hidden"
          style={{ width: height * 0.42, height }}
          aria-hidden
        >
          <img
            src="/logo.png"
            alt=""
            className="h-full w-auto max-w-none object-contain object-left"
            style={{ height, ...filterStyle }}
          />
        </span>
      )}
    </span>
  )

  if (linkTo) {
    return (
      <Link to={linkTo} className="no-underline">
        {content}
      </Link>
    )
  }

  return content
}
