import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Mail, MapPin, Phone, Shield, ShieldCheck, User } from 'lucide-react'
import AppHeaderBar from '../../components/locked/AppHeaderBar'
import BottomNav from '../../components/BottomNav'
import GradientButton from '../../components/GradientButton'
import PhoneInput from '../../components/PhoneInput'
import { BackLink } from '../../components/NavActionButtons'
import HostProfileAvatarEditor from '../../components/host/HostProfileAvatarEditor'
import {
  HOST_SOCIAL_FIELD_ICONS,
  HOST_SOCIAL_FIELD_LABELS,
} from '../../components/host/hostSocialIcons'
import {
  createOrganization,
  getCurrentAccount,
  isValidEmailFormat,
  updateOrganization,
  verifyPhone,
} from '../../lib/account'
import { getCurrentUser } from '../../lib/auth'
import {
  clearCreateOrgDraft,
  getCreateOrgDraft,
  saveCreateOrgDraft,
  type CreateOrgDraft,
} from '../../lib/createOrgDraft'
import { HOST_SOCIAL_FIELD_IDS } from '../../lib/hostSocialLinks'
import { saveOrgHostProfile } from '../../lib/orgHostProfile'
import { formatPhoneDisplay, isValidPhone, parsePhoneDigits } from '../../lib/phoneFormat'
import type { PersonalHostSocialLinks } from '../../lib/personalHostProfile'
import { submitOrgVerificationRequest, formatVerificationAttemptLabel } from '../../lib/orgVerificationRequests'
import {
  appFieldClassNoIcon,
  appFieldClassWithIconLg,
  appTextareaClass,
} from '../../lib/formFieldClasses'

const inputClassName = appFieldClassWithIconLg
const inputClassNameNoIcon = appFieldClassNoIcon
const textareaClassName = appTextareaClass

const CATEGORIES = [
  'Entertainment',
  'Music',
  'Sports',
  'Food & Drink',
  'Community',
  'Arts & Culture',
  'Other',
]

const SOCIAL_FIELDS = HOST_SOCIAL_FIELD_IDS.map((id) => ({
  id,
  label: HOST_SOCIAL_FIELD_LABELS[id],
  icon: HOST_SOCIAL_FIELD_ICONS[id],
  placeholder:
    id === 'website'
      ? 'www.yoursite.com'
      : `${HOST_SOCIAL_FIELD_LABELS[id]} URL`,
}))

type SocialFieldId = (typeof SOCIAL_FIELDS)[number]['id']
type ApplyStep = 'form' | 'verify-phone' | 'verify-code'

function draftFromForm(
  email: string,
  fields: Omit<CreateOrgDraft, 'email' | 'pendingSubmit'>,
  pendingSubmit = false,
): CreateOrgDraft {
  return { email, ...fields, pendingSubmit }
}

export default function CreateOrgPage() {
  const user = getCurrentUser()
  const account = getCurrentAccount()
  const isPhoneVerified = account?.verificationStatus === 'phone_verified'

  const [name, setName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [bio, setBio] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [social, setSocial] = useState<PersonalHostSocialLinks>({})
  const [backupAdminEmail, setBackupAdminEmail] = useState('')
  const [error, setError] = useState('')
  const [submittedRequestNumber, setSubmittedRequestNumber] = useState<number | null>(null)
  const [applyStep, setApplyStep] = useState<ApplyStep>('form')
  const [verifyPhoneDigits, setVerifyPhoneDigits] = useState(() =>
    parsePhoneDigits(account?.phone ?? ''),
  )
  const [verifyCode, setVerifyCode] = useState('')

  useEffect(() => {
    if (!user) return
    const draft = getCreateOrgDraft(user.email)
    if (!draft) return

    setName(draft.name)
    setCategory(draft.category)
    setBio(draft.bio)
    setLogoUrl(draft.logoUrl)
    setAddress(draft.address)
    setCity(draft.city)
    setPhone(draft.phone)
    setContactEmail(draft.contactEmail)
    setSocial(draft.social)
    setBackupAdminEmail(draft.backupAdminEmail)

    if (draft.pendingSubmit && account?.verificationStatus === 'phone_verified') {
      finalizeOrganization(user.email, draft)
    } else if (draft.pendingSubmit) {
      setApplyStep('verify-phone')
    }
  }, [user, account?.verificationStatus])

  if (!user) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo="/host" />
        <main className="px-4 pt-6 text-center">
          <p className="text-brown-muted">Sign in with your personal account to create a Host Account.</p>
          <Link to="/signin" className="mt-4 inline-block font-semibold text-orange no-underline">
            Sign in
          </Link>
        </main>
        <BottomNav />
      </div>
    )
  }

  function formFields() {
    return {
      name,
      category,
      bio,
      logoUrl,
      address,
      city,
      phone,
      contactEmail,
      social,
      backupAdminEmail,
    }
  }

  function persistDraft(pendingSubmit: boolean) {
    saveCreateOrgDraft(
      draftFromForm(user!.email, formFields(), pendingSubmit),
    )
  }

  function validateForm(): string | null {
    if (!name.trim()) return 'Host Account name is required.'
    if (backupAdminEmail.trim() && !isValidEmailFormat(backupAdminEmail)) {
      return 'Backup admin email format is invalid.'
    }
    if (contactEmail.trim() && !isValidEmailFormat(contactEmail)) {
      return 'Public contact email format is invalid.'
    }
    return null
  }

  function finalizeOrganization(email: string, source?: CreateOrgDraft) {
    setError('')
    clearCreateOrgDraft()
    const fields = source ?? draftFromForm(email, formFields(), false)
    const trimmedBio = fields.bio.trim()

    const result = createOrganization({
      name: fields.name,
      category: fields.category,
      creatorEmail: email,
      primaryAdminEmail: email,
      backupAdminEmail: fields.backupAdminEmail.trim() || undefined,
      contactEmail: fields.contactEmail.trim() || undefined,
    })

    if (!result.ok || !result.org) {
      setError(result.error ?? 'Could not create Host Account.')
      persistDraft(true)
      return false
    }

    if (trimmedBio) {
      updateOrganization(result.org.id, { profile: trimmedBio })
    }

    saveOrgHostProfile(result.org.id, {
      logoUrl: fields.logoUrl.trim() || undefined,
      bio: trimmedBio,
      address: fields.address.trim() || undefined,
      phone: fields.phone || undefined,
      email: fields.contactEmail.trim() || undefined,
      city: fields.city.trim() || undefined,
      social: fields.social,
    })

    const verificationResult = submitOrgVerificationRequest({
      orgId: result.org.id,
      orgName: result.org.name,
      submittedBy: email,
    })

    if (!verificationResult.ok) {
      setError(verificationResult.error)
      persistDraft(true)
      return false
    }

    setSubmittedRequestNumber(verificationResult.request.requestNumber)
    setApplyStep('form')
    return true
  }

  function updateSocial(id: SocialFieldId, value: string) {
    setSocial((prev) => ({ ...prev, [id]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!isPhoneVerified) {
      persistDraft(true)
      setApplyStep('verify-phone')
      return
    }

    finalizeOrganization(user!.email)
  }

  function handleSendVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!isValidPhone(verifyPhoneDigits)) {
      setError('Enter a valid 10-digit phone number.')
      return
    }
    setApplyStep('verify-code')
  }

  function handleVerifyAndSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const result = verifyPhone(user!.email, verifyPhoneDigits, verifyCode)
    if (!result.ok) {
      setError(result.error ?? 'Verification failed.')
      return
    }
    finalizeOrganization(user!.email)
  }

  if (submittedRequestNumber != null) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo="/host" />
        <main className="px-4 pt-8 text-center">
          <div className="app-notice-success p-6 text-center">
            <p className="font-display text-xl font-extrabold text-brown">
              {formatVerificationAttemptLabel(submittedRequestNumber)} submitted
            </p>
            <p className="mt-3 text-sm leading-relaxed text-brown-muted">
              We&apos;ll review your Host Account in Control Room. Public events and analytics unlock after
              approval.
            </p>
            <GradientButton fullWidth className="mt-6 py-3.5" to="/host">
              Back to Event Manager
            </GradientButton>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  if (applyStep === 'verify-phone' || applyStep === 'verify-code') {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo="/host" />
        <main className="px-4 pt-2">
          <button
            type="button"
            onClick={() => {
              setApplyStep('form')
              setError('')
            }}
            className="mb-3 text-sm font-semibold text-brown-muted transition hover:text-orange"
          >
            ← Back to application
          </button>

          <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">Verify your phone</h1>
          <p className="mt-2 text-sm text-brown-muted">
            Last step before we create <strong className="text-brown">{name.trim() || 'your Host Account'}</strong>.
            Control Room will still review your application after this.
          </p>

          <section className="mt-6 rounded-[14px] border border-brown/10 bg-white p-5 shadow-sm">
            {applyStep === 'verify-phone' ? (
              <form onSubmit={handleSendVerifyCode} className="space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange/15">
                  <Phone size={24} className="text-orange" />
                </div>
                <p className="text-center text-sm text-brown-muted">
                  We&apos;ll text a code to confirm you&apos;re a real person behind this application.
                </p>
                <div>
                  <label htmlFor="verify-personal-phone" className="mb-1 block text-xs font-semibold text-brown-muted">
                    Your mobile number
                  </label>
                  <PhoneInput
                    id="verify-personal-phone"
                    value={verifyPhoneDigits}
                    onChange={setVerifyPhoneDigits}
                    className={inputClassNameNoIcon}
                  />
                </div>
                {error && <p className="text-sm font-semibold text-maroon">{error}</p>}
                <GradientButton type="submit" fullWidth className="py-3.5">
                  Send code
                </GradientButton>
              </form>
            ) : (
              <form onSubmit={handleVerifyAndSubmit} className="space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple/15">
                  <ShieldCheck size={24} className="text-purple" />
                </div>
                <p className="text-center text-sm text-brown-muted">
                  Enter the 6-digit code sent to{' '}
                  <strong className="text-brown">{formatPhoneDisplay(verifyPhoneDigits)}</strong>
                </p>
                <div>
                  <label htmlFor="verify-code" className="mb-1 block text-xs font-semibold text-brown-muted">
                    Verification code
                  </label>
                  <input
                    id="verify-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full rounded-[14px] border border-brown/15 bg-cream/40 px-3 py-2.5 text-center text-lg tracking-widest text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
                  />
                  <p className="mt-1.5 text-center text-[11px] text-brown-muted">Demo code: 123456</p>
                </div>
                {error && <p className="text-sm font-semibold text-maroon">{error}</p>}
                <GradientButton type="submit" fullWidth className="py-3.5">
                  Verify &amp; submit application
                </GradientButton>
                <button
                  type="button"
                  onClick={() => setApplyStep('verify-phone')}
                  className="w-full text-sm text-brown-muted transition hover:text-brown"
                >
                  Change phone number
                </button>
              </form>
            )}
          </section>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/host" />

      <main className="px-4 pt-2">
        <BackLink to="/host" className="mb-3">
          Back to Event Manager
        </BackLink>

        <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">Create Host Account</h1>
        <p className="mt-2 text-xs text-brown-muted">
          Signed in as <span className="text-brown">{user.email}</span> — this is your personal login.
        </p>
        {!isPhoneVerified && (
          <p className="mt-2 rounded-[14px] border border-orange/20 bg-orange/8 px-3 py-2 text-xs text-brown-muted">
            Fill out your application first. You&apos;ll verify your phone on submit, then TUDU reviews in Control
            Room.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6">
          <section className="mb-8 rounded-[14px] border border-brown/10 bg-white p-4 shadow-sm">
            <HostProfileAvatarEditor
              name={name.trim() || 'Host Account'}
              avatarUrl={logoUrl}
              onAvatarUrlChange={setLogoUrl}
              label="Organizer logo"
            />

            <h2 className="mb-3 font-display text-base font-bold text-brown">About us</h2>

            <label htmlFor="org-name" className="mb-1.5 block text-sm font-medium text-brown">
              Host Account name
            </label>
            <div className="relative mb-4">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted">
                <User size={18} />
              </span>
              <input
                id="org-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kindersley Events Co."
                className={inputClassName}
              />
            </div>

            <label htmlFor="org-category" className="mb-1.5 block text-sm font-medium text-brown">
              Category
            </label>
            <select
              id="org-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`${inputClassNameNoIcon} mb-4`}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <label htmlFor="org-bio" className="mb-1.5 block text-sm font-medium text-brown">
              Bio
            </label>
            <textarea
              id="org-bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about your organization."
              className={`${textareaClassName} mb-5`}
            />

            <h2 className="mb-3 font-display text-base font-bold text-brown">Contact Information</h2>
            <p className="mb-3 text-xs text-brown-muted">
              Business contact details shown on your public profile. Leave blank to hide a field.
            </p>
            <div className="mb-5 space-y-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted">
                  <MapPin size={18} />
                </span>
                <input
                  id="org-address"
                  type="text"
                  placeholder="Business address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted">
                  <MapPin size={18} />
                </span>
                <input
                  id="org-city"
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted">
                  <Phone size={18} />
                </span>
                <PhoneInput
                  id="org-phone"
                  value={phone}
                  onChange={setPhone}
                  className={inputClassName}
                />
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted">
                  <Mail size={18} />
                </span>
                <input
                  id="contact-email"
                  type="email"
                  placeholder="Contact email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>

            <h2 className="mb-3 font-display text-base font-bold text-brown">Social Media &amp; Links</h2>
            <div className="space-y-3">
              {SOCIAL_FIELDS.map(({ id, icon: Icon, placeholder }) => (
                <div key={id} className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted">
                    <Icon size={18} />
                  </span>
                  <input
                    id={`create-org-${id}`}
                    type="text"
                    placeholder={placeholder}
                    value={social[id] ?? ''}
                    onChange={(e) => updateSocial(id, e.target.value)}
                    className={inputClassName}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8 overflow-hidden rounded-[14px] border border-brown/10 bg-white shadow-sm">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 font-display text-base font-bold text-brown [&::-webkit-details-marker]:hidden">
                <span className="flex-1">Admin (Recommended)</span>
                <ChevronRight
                  size={18}
                  className="shrink-0 text-brown-muted transition group-open:rotate-90"
                />
              </summary>

              <div className="space-y-4 border-t border-brown/5 px-5 pb-5 pt-4">
                <p className="text-xs text-brown-muted">
                  Add a backup admin who can help manage this Host Account.
                </p>

                <div>
                  <label htmlFor="backup-admin-email" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-brown">
                    <Shield size={14} className="text-brown-muted" />
                    Backup admin email
                  </label>
                  <input
                    id="backup-admin-email"
                    type="email"
                    value={backupAdminEmail}
                    onChange={(e) => setBackupAdminEmail(e.target.value)}
                    placeholder="backup@example.com"
                    className={inputClassNameNoIcon}
                  />
                </div>
              </div>
            </details>
          </section>

          <p className="mb-5 text-center text-xs text-brown-muted">You&apos;re the primary admin.</p>

          <p className="mb-5 text-center text-xs text-brown-muted">
            Your Host Account will be reviewed by TUDU before public events are unlocked.
          </p>

          {error && <p className="mb-3 text-sm font-semibold text-maroon">{error}</p>}

          <GradientButton type="submit" fullWidth className="py-3.5">
            {isPhoneVerified ? 'Submit for approval' : 'Continue — verify phone to submit'}
          </GradientButton>
        </form>

        <p className="mt-4 text-center text-xs text-brown-muted">
          Already have a team?{' '}
          <Link to="/host/team" className="font-semibold text-orange no-underline">
            Manage team
          </Link>
        </p>
      </main>

      <BottomNav />
    </div>
  )
}
