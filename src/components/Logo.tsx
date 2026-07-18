import { Link } from 'react-router-dom'

type LogoProps = {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const pinSizes = { sm: 28, md: 36, lg: 48 }
const textSizes = { sm: 'text-base', md: 'text-lg', lg: 'text-xl' }

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const pin = pinSizes[size]

  return (
    <Link to="/" className={`inline-flex items-center gap-2 no-underline ${className}`}>
      <svg
        width={pin}
        height={pin}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden
        className="shrink-0 drop-shadow-sm"
      >
        <defs>
          <linearGradient id="pinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F68E5D" />
            <stop offset="100%" stopColor="#C02E8D" />
          </linearGradient>
        </defs>
        <path
          d="M24 4C16.27 4 10 10.27 10 18c0 10.5 14 26 14 26s14-15.5 14-26c0-7.73-6.27-14-14-14z"
          fill="#E53935"
        />
        <circle cx="24" cy="18" r="8" fill="white" />
        <text
          x="24"
          y="22"
          textAnchor="middle"
          fill="#E53935"
          fontSize="14"
          fontWeight="800"
          fontFamily="DM Sans, sans-serif"
        >
          T
        </text>
      </svg>
      {showText && (
        <span className={`font-bold tracking-tight text-brown ${textSizes[size]}`}>Tudu.ca</span>
      )}
    </Link>
  )
}

export function LogoPinGradient({ className = '' }: { className?: string }) {
  return (
    <svg width={56} height={56} viewBox="0 0 48 48" fill="none" aria-hidden className={className}>
      <defs>
        <linearGradient id="pinGradSignIn" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F68E5D" />
          <stop offset="100%" stopColor="#C02E8D" />
        </linearGradient>
      </defs>
      <path
        d="M24 4C16.27 4 10 10.27 10 18c0 10.5 14 26 14 26s14-15.5 14-26c0-7.73-6.27-14-14-14z"
        fill="url(#pinGradSignIn)"
      />
      <circle cx="24" cy="18" r="8" fill="white" />
      <text
        x="24"
        y="22"
        textAnchor="middle"
        fill="#C02E8D"
        fontSize="14"
        fontWeight="800"
        fontFamily="DM Sans, sans-serif"
      >
        T
      </text>
    </svg>
  )
}
