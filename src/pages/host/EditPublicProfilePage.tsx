import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Globe,
  User,
} from 'lucide-react'
import AppHeaderBar from '../../components/locked/AppHeaderBar'
import BottomNav from '../../components/BottomNav'
import GradientButton from '../../components/GradientButton'

const SOCIAL_FIELDS = [
  { id: 'website', label: 'Website', icon: Globe, placeholder: 'www.tudu.ca', defaultValue: 'www.tudu.ca' },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: InstagramIcon,
    placeholder: 'Instagram URL',
    defaultValue: 'https://www.instagram.com/tuc',
  },
  { id: 'twitter', label: 'Twitter/X', icon: TwitterIcon, placeholder: 'Twitter/X URL', defaultValue: '' },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: FacebookIcon,
    placeholder: 'Facebook URL',
    defaultValue: 'https://www.facebook.com/sha',
  },
  { id: 'youtube', label: 'YouTube', icon: YoutubeIcon, placeholder: 'YouTube URL', defaultValue: '' },
  { id: 'tiktok', label: 'TikTok', icon: TikTokIcon, placeholder: 'TikTok URL', defaultValue: '' },
  { id: 'twitch', label: 'Twitch', icon: TwitchIcon, placeholder: 'Twitch URL', defaultValue: '' },
  { id: 'kick', label: 'Kick', icon: KickIcon, placeholder: 'Kick URL', defaultValue: '' },
]

export default function EditPublicProfilePage() {
  return (
    <div className="mx-auto min-h-svh max-w-lg bg-cream pb-28">
      <AppHeaderBar logoLinkTo="/host" />

      <main className="px-4 pt-2">
        <Link
          to="/host"
          className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-brown-muted no-underline transition hover:text-brown"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">Edit Public Profile</h1>
        <p className="mt-1 text-sm text-brown-muted">
          This is how your organization appears to the community.
        </p>

        <div className="mt-5 rounded-[var(--radius-xl)] border border-brown/10 bg-white p-4 shadow-sm">
          {/* Organizer logo */}
          <div className="mb-5 flex flex-col items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-tudu shadow-md ring-4 ring-cream-dark">
              <span className="font-display text-3xl font-extrabold text-white">T</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-brown-muted">Organizer Logo</p>
          </div>

          {/* Organization Name */}
          <label htmlFor="org-name" className="mb-1.5 block text-sm font-medium text-brown">
            Organization Name
          </label>
          <div className="relative mb-4">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted">
              <User size={18} />
            </span>
            <input
              id="org-name"
              type="text"
              defaultValue="TUDU Entertainment Inc"
              className="w-full rounded-[var(--radius-tudu)] border border-brown/15 bg-white py-3.5 pl-12 pr-4 text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
            />
          </div>

          {/* Bio */}
          <label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-brown">
            Bio
          </label>
          <textarea
            id="bio"
            rows={4}
            defaultValue="From local happenings to bigger getaways, we make it easier to know what's going on. NOW YOU KNOW."
            className="mb-5 w-full resize-none rounded-[var(--radius-tudu)] border border-brown/15 bg-white px-4 py-3.5 text-sm leading-relaxed text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
          />

          {/* Social links */}
          <h2 className="mb-3 font-display text-base font-bold text-brown">Social Media &amp; Links</h2>
          <div className="space-y-3">
            {SOCIAL_FIELDS.map(({ id, icon: Icon, placeholder, defaultValue }) => (
              <div key={id} className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted">
                  <Icon size={18} />
                </span>
                <input
                  id={id}
                  type="text"
                  placeholder={placeholder}
                  defaultValue={defaultValue}
                  className="w-full rounded-[var(--radius-tudu)] border border-brown/15 bg-white py-3.5 pl-12 pr-4 text-sm text-brown outline-none placeholder:text-brown-muted/60 focus:border-purple focus:ring-2 focus:ring-purple/20"
                />
              </div>
            ))}
          </div>
        </div>

        <GradientButton fullWidth className="mt-5 py-3.5">
          Save Public Profile
        </GradientButton>
      </main>

      <BottomNav />
    </div>
  )
}

function TwitterIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function YoutubeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13.4a8.16 8.16 0 005.58 2.2V12.1a4.85 4.85 0 01-3.77-1.41z" />
    </svg>
  )
}

function TwitchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.64 5.5H9.5V8.64h2.14V5.5zm5.14 0h-2.14V8.64h2.14V5.5zM4 2L2 6.5v13h4.5V22h4.5l4-4h5.5L22 13.5V2H4zm14.5 10.5l-2.5 2.5h-4l-2 2v-2H6.5V4.5h12v8z" />
    </svg>
  )
}

function KickIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 3h7v4H8v10H3V3zm11 0h7v4h-2v10h-5V3z" />
    </svg>
  )
}
