import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-react'
import AppHeaderBar from '../../components/locked/AppHeaderBar'
import BottomNav from '../../components/BottomNav'
import SaveButton from '../../components/host/SaveButton'
import { BackLink } from '../../components/NavActionButtons'
import Toast from '../../components/Toast'
import EventPhotosEditor from '../../components/EventPhotosEditor'
import HostProfilePreviewOverlay from '../../components/host/HostProfilePreviewOverlay'
import PublicProfileMerchBar from '../../components/host/PublicProfileMerchBar'
import ProfileViewButton from '../../components/host/ProfileViewButton'
import HostProfileTierBadge from '../../components/host/HostProfileTierBadge'
import PersonalProfilePhotoEditor from '../../components/host/PersonalProfilePhotoEditor'
import HostProfileAvatarEditor from '../../components/host/HostProfileAvatarEditor'
import {
  HOST_SOCIAL_FIELD_ICONS,
  HOST_SOCIAL_FIELD_LABELS,
} from '../../components/host/hostSocialIcons'
import { parsePhoneDigits } from '../../lib/phoneFormat'
import { HOST_SOCIAL_FIELD_IDS } from '../../lib/hostSocialLinks'
import { useHostContext } from '../../hooks/useHostContext'
import { useHostProfileStore } from '../../hooks/useHostProfileStore'
import { getCurrentAccount, getOrganization, getOrganizationApprovalStatus, resolveOrgPlanForOrganization, updateOrganization, updateOrganizationApproval } from '../../lib/account'
import { getCurrentUser } from '../../lib/auth'
import {
  getOrgProfileSubmitButtonLabel,
  getOrgProfileSubmitHelperText,
  getOrgProfileSubmitState,
  shouldSubmitVerificationOnSave,
} from '../../lib/orgProfileSubmit'
import {
  formatVerificationAttemptLabel,
  getOrgVerificationRequestForOrg,
  submitOrgVerificationRequest,
} from '../../lib/orgVerificationRequests'
import PhoneInput from '../../components/PhoneInput'
import { getOrgHostProfile, saveOrgHostProfile } from '../../lib/orgHostProfile'
import {
  getPersonalHostProfile,
  resolvePersonalHostDisplayName,
  saveLoginName,
  savePersonalHostProfile,
  type PersonalHostSocialLinks,
} from '../../lib/personalHostProfile'
import {
  getOrgPublicProfileUrl,
  getPersonalPublicProfileUrl,
} from '../../lib/publicHostProfile'
import { getOrgApprovalBadge, getTierBadgeForAccount } from '../../lib/tierDisplay'
import {
  normalizeHostSocialLinks,
  validateHostProfileForm,
  type HostProfileFormPreviewInput,
} from '../../lib/hostProfileForm'
import {
  getHostMerchSettingsFromAccount,
  getHostMerchSettingsFromOrg,
  isHostMerchVisible,
  isHostMerchVisibleForOrg,
} from '../../lib/hostMerch'
import {
  appFieldClassWithIcon,
  appFieldClassWithIconLg,
  appTextareaClass,
} from '../../lib/formFieldClasses'

const HOST_CARD = 'app-surface-card host-edit-profile-panel p-4'
const HOST_PANEL = 'rounded-[14px] border border-app-subtle bg-app-elevated p-4'

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

export default function EditPublicProfilePage() {
  const {
    activeOrg,
    hostAccounts,
    isPersonal,
    personalName,
    user,
    canUsePersonalMode,
    setHostContext,
  } = useHostContext()
  const profileRevision = useHostProfileStore()
  const account = getCurrentAccount()
  const org = activeOrg ?? undefined
  const tierBadge = useMemo(() => {
    if (!isPersonal && org) {
      return getOrgApprovalBadge(getOrganizationApprovalStatus(org))
    }
    return account ? getTierBadgeForAccount(account.tier, account.verificationStatus) : null
  }, [isPersonal, org, account])
  const resolvedPersonalName = user
    ? resolvePersonalHostDisplayName(user.email, personalName)
    : personalName
  const orgId = org?.id

  const [personalDisplayName, setPersonalDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [city, setCity] = useState('')
  const [social, setSocial] = useState<PersonalHostSocialLinks>({})
  const [saved, setSaved] = useState(false)
  const [verificationJustSubmitted, setVerificationJustSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [orgName, setOrgName] = useState(org?.name ?? '')
  const [orgBio, setOrgBio] = useState('')
  const [orgLogoUrl, setOrgLogoUrl] = useState('')
  const [orgAddress, setOrgAddress] = useState('')
  const [orgPhone, setOrgPhone] = useState('')
  const [orgContactEmail, setOrgContactEmail] = useState('')
  const [orgCity, setOrgCity] = useState('')
  const [orgSocial, setOrgSocial] = useState<PersonalHostSocialLinks>({})
  const [orgGalleryImages, setOrgGalleryImages] = useState<string[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [saveError, setSaveError] = useState('')

  const profileLoadKey = isPersonal ? `personal:${user?.email ?? ''}` : `org:${orgId ?? ''}`
  const prevProfileLoadKey = useRef(profileLoadKey)

  function loadPersonalForm() {
    if (!user?.email) return
    const profile = getPersonalHostProfile(user.email, personalName)
    setPersonalDisplayName(resolvePersonalHostDisplayName(user.email, personalName))
    setBio(profile.bio)
    setAvatarUrl(profile.avatarUrl ?? '')
    setAddress(profile.address ?? '')
    setPhone(parsePhoneDigits(profile.phone ?? ''))
    setContactEmail(profile.email ?? '')
    setCity(profile.city ?? '')
    setSocial({ ...profile.social })
  }

  function loadOrgForm() {
    if (!orgId) return
    const profile = getOrgHostProfile(orgId)
    const freshOrg = getOrganization(orgId)
    setOrgName(freshOrg?.name ?? '')
    setOrgBio(profile.bio ?? freshOrg?.profile ?? '')
    setOrgLogoUrl(profile.logoUrl ?? '')
    setOrgAddress(profile.address ?? '')
    setOrgPhone(parsePhoneDigits(profile.phone ?? ''))
    setOrgContactEmail(profile.email ?? '')
    setOrgCity(profile.city ?? '')
    setOrgSocial({ ...profile.social })
    setOrgGalleryImages(profile.galleryImages ?? [])
  }

  useEffect(() => {
    if (!user?.email || !isPersonal) return
    const loadKeyChanged = prevProfileLoadKey.current !== profileLoadKey
    prevProfileLoadKey.current = profileLoadKey
    if (isDirty && !loadKeyChanged) return
    loadPersonalForm()
    setIsDirty(false)
  }, [user?.email, isPersonal, personalName, profileLoadKey, profileRevision, isDirty])

  useEffect(() => {
    if (!orgId || isPersonal) return
    const loadKeyChanged = prevProfileLoadKey.current !== profileLoadKey
    prevProfileLoadKey.current = profileLoadKey
    if (isDirty && !loadKeyChanged) return
    loadOrgForm()
    setIsDirty(false)
  }, [orgId, isPersonal, profileLoadKey, profileRevision, isDirty])

  function markDirty() {
    setIsDirty(true)
    setSaved(false)
    setVerificationJustSubmitted(false)
    setSaveError('')
  }

  function updateSocial(id: SocialFieldId, value: string) {
    setSocial((prev) => ({ ...prev, [id]: value }))
    markDirty()
  }

  function updateOrgSocial(id: SocialFieldId, value: string) {
    setOrgSocial((prev) => ({ ...prev, [id]: value }))
    markDirty()
  }

  const personalPreviewDisplayName =
    personalDisplayName.trim() || resolvedPersonalName

  const personalPreviewForm = useMemo((): HostProfileFormPreviewInput | null => {
    if (!user?.email || !isPersonal) return null
    return {
      kind: 'personal',
      displayName: personalPreviewDisplayName,
      bio,
      avatarUrl,
      galleryImages: [],
      address,
      city,
      phone,
      email: contactEmail,
      social,
      userEmail: user.email,
    }
  }, [
    user?.email,
    isPersonal,
    personalPreviewDisplayName,
    bio,
    avatarUrl,
    address,
    city,
    phone,
    contactEmail,
    social,
  ])

  const orgPreviewForm = useMemo((): HostProfileFormPreviewInput | null => {
    if (!orgId || isPersonal) return null
    return {
      kind: 'org',
      displayName: orgName,
      bio: orgBio,
      avatarUrl: orgLogoUrl,
      galleryImages: orgGalleryImages,
      address: orgAddress,
      city: orgCity,
      phone: orgPhone,
      email: orgContactEmail,
      social: orgSocial,
      orgId,
    }
  }, [
    orgId,
    isPersonal,
    orgName,
    orgBio,
    orgLogoUrl,
    orgGalleryImages,
    orgAddress,
    orgCity,
    orgPhone,
    orgContactEmail,
    orgSocial,
  ])

  function handleSavePersonal() {
    if (!user?.email) return
    setSaveError('')
    const trimmedName = personalDisplayName.trim()
    if (!trimmedName) {
      setSaveError('Please enter your name.')
      return
    }
    const normalizedSocial = normalizeHostSocialLinks(social)
    const validationError = validateHostProfileForm({
      contactEmail,
      social: normalizedSocial,
      isOrg: false,
    })
    if (validationError) {
      setSaveError(validationError)
      return
    }

    try {
      saveLoginName(user.email, trimmedName)
      savePersonalHostProfile(user.email, {
        displayName: '',
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone || undefined,
        email: contactEmail.trim() || undefined,
        city: city.trim() || undefined,
        social: normalizedSocial,
      })
      setSocial(normalizedSocial)
      setIsDirty(false)
      setSaved(true)
      setToast('Profile saved')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save profile.')
    }
  }

  function persistOrgProfile(normalizedSocial: PersonalHostSocialLinks) {
    if (!orgId) return
    const trimmedName = orgName.trim()
    const freshOrg = getOrganization(orgId)
    updateOrganization(orgId, {
      name: trimmedName || freshOrg?.name || 'Organization',
      profile: orgBio.trim(),
    })
    saveOrgHostProfile(orgId, {
      logoUrl: orgLogoUrl.trim() || undefined,
      bio: orgBio.trim(),
      galleryImages: orgGalleryImages.length > 0 ? orgGalleryImages : undefined,
      address: orgAddress.trim() || undefined,
      phone: orgPhone || undefined,
      email: orgContactEmail.trim() || undefined,
      city: orgCity.trim() || undefined,
      social: normalizedSocial,
    })
  }

  function handleSaveOrg() {
    if (!orgId || !org) return
    setSubmitError('')
    setSaveError('')
    const normalizedSocial = normalizeHostSocialLinks(orgSocial)
    const validationError = validateHostProfileForm({
      contactEmail: orgContactEmail,
      social: normalizedSocial,
      orgName,
      isOrg: true,
    })
    if (validationError) {
      setSaveError(validationError)
      return
    }

    try {
      persistOrgProfile(normalizedSocial)
      setOrgSocial(normalizedSocial)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save profile.')
      return
    }

    const freshOrg = getOrganization(orgId) ?? org
    const submitState = getOrgProfileSubmitState(freshOrg)
    let verificationJustSubmittedLocal = false

    if (shouldSubmitVerificationOnSave(submitState)) {
      const currentUser = getCurrentUser()
      if (!currentUser?.email) {
        setSaveError('Sign in to submit for verification.')
        return
      }
      if (submitState === 'rejected') {
        updateOrganizationApproval(orgId, 'pending')
      }
      const result = submitOrgVerificationRequest({
        orgId,
        orgName: orgName.trim() || freshOrg.name,
        submittedBy: currentUser.email,
      })
      if (!result.ok) {
        setSubmitError(result.error)
        setToast('Profile saved â€” verification could not be submitted')
        setIsDirty(false)
        setSaved(true)
        return
      }
      verificationJustSubmittedLocal = true
      setVerificationJustSubmitted(true)
    }

    setIsDirty(false)
    setSaved(true)
    setToast(
      verificationJustSubmittedLocal ? 'Profile saved and sent for verification' : 'Profile saved',
    )
  }

  const freshOrg = orgId ? getOrganization(orgId) : undefined
  const orgSubmitState = freshOrg ? getOrgProfileSubmitState(freshOrg) : null
  const orgVerificationRequest = orgId ? getOrgVerificationRequestForOrg(orgId) : undefined
  const orgSubmitButtonLabel =
    orgSubmitState != null
      ? getOrgProfileSubmitButtonLabel(orgSubmitState, saved, verificationJustSubmitted)
      : 'Save profile'
  const orgSubmitHelperText = orgSubmitState ? getOrgProfileSubmitHelperText(orgSubmitState) : null

  const { showMerchShop, merchShopUrl, merchHostKind, merchHostId } = useMemo(() => {
    void profileRevision
    if (isPersonal && user) {
      const settings = getHostMerchSettingsFromAccount(account)
      return {
        showMerchShop: isHostMerchVisible(settings),
        merchShopUrl: settings.merchShopUrl,
        merchHostKind: 'personal' as const,
        merchHostId: user.email.trim().toLowerCase(),
      }
    }
    if (org) {
      const settings = getHostMerchSettingsFromOrg(org)
      const orgPlanId = resolveOrgPlanForOrganization(org)
      return {
        showMerchShop: isHostMerchVisibleForOrg(settings, orgPlanId),
        merchShopUrl: settings.merchShopUrl,
        merchHostKind: 'org' as const,
        merchHostId: org.id,
      }
    }
    return {
      showMerchShop: false,
      merchShopUrl: undefined,
      merchHostKind: undefined,
      merchHostId: undefined,
    }
  }, [isPersonal, user, account, org, profileRevision])

  useEffect(() => {
    if (!user || canUsePersonalMode || !isPersonal) return
    const orgId = activeOrg?.id ?? hostAccounts[0]?.id
    if (orgId) setHostContext(orgId)
  }, [user, canUsePersonalMode, isPersonal, activeOrg, hostAccounts, setHostContext])

  if (isPersonal && !canUsePersonalMode) {
    return <Navigate to="/host" replace />
  }

  return (
    <div className="host-edit-profile app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/host" />

      <main className="px-4 pt-2">
        <BackLink to="/host" variant="chevron" className="mb-3">
          Event Manager
        </BackLink>

        <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">
          {isPersonal ? 'Edit Profile' : 'Edit Public Profile'}
        </h1>
        {isPersonal && tierBadge && (
          <div className="mt-3 flex justify-center">
            <HostProfileTierBadge
              badge={tierBadge}
              account={account}
              returnTo="/host/profile"
              showPhoneVerifyLink={isPersonal}
            />
          </div>
        )}
        {isPersonal ? (
          user ? (
            <>
              <div className={`relative mt-5 ${HOST_CARD}`}>
                <div className="absolute right-4 top-4">
                  <ProfileViewButton
                    isDirty={isDirty}
                    viewProfileUrl={getPersonalPublicProfileUrl(user.email, 'host-profile')}
                    onPreview={() => setPreviewOpen(true)}
                  />
                </div>
                <PersonalProfilePhotoEditor
                  name={personalPreviewDisplayName}
                  photoUrl={avatarUrl}
                  onPhotoChange={(url) => {
                    setAvatarUrl(url)
                    markDirty()
                  }}
                  label="Personal host profile picture"
                  helperText="Shown on your public host profile when you post events as yourself."
                />

                <label htmlFor="personal-name" className="mb-1.5 block text-sm font-medium text-brown">
                  Your name
                </label>
                <p className="mb-2 text-xs text-brown-muted">
                  Shown on your public host profile and when you post events as yourself.
                </p>
                <div className="relative mb-4">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted">
                    <User size={18} />
                  </span>
                  <input
                    id="personal-name"
                    type="text"
                    value={personalDisplayName}
                    onChange={(e) => {
                      setPersonalDisplayName(e.target.value)
                      markDirty()
                    }}
                    placeholder="Your name"
                    className={appFieldClassWithIconLg}
                  />
                </div>

                <label htmlFor="personal-bio" className="mb-1.5 block text-sm font-medium text-brown">
                  Bio
                </label>
                <textarea
                  id="personal-bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value)
                    markDirty()
                  }}
                  placeholder="Tell people a little about yourself as an event host."
                  className={`mb-5 ${appTextareaClass}`}
                />

                {showMerchShop && merchHostKind && merchHostId && (
                  <PublicProfileMerchBar
                    shopUrl={merchShopUrl}
                    prominent
                    hostKind={merchHostKind}
                    hostId={merchHostId}
                    showMerchShop={showMerchShop}
                  />
                )}

                <h2 className="mb-3 border-t border-app-subtle pt-5 font-display text-base font-bold text-brown">
                  Contact Information
                </h2>
                <p className="mb-3 text-xs text-brown-muted">
                  Shown on your public profile. Leave blank to hide a field.
                </p>
                <div className="mb-5 space-y-3">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted">
                      <MapPin size={18} />
                    </span>
                    <input
                      id="personal-address"
                      type="text"
                      placeholder="Street address"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value)
                        markDirty()
                      }}
                      className={appFieldClassWithIcon}
                    />
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted">
                      <MapPin size={18} />
                    </span>
                    <input
                      id="personal-city"
                      type="text"
                      placeholder="City"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value)
                        markDirty()
                      }}
                      className={appFieldClassWithIcon}
                    />
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted">
                      <Phone size={18} />
                    </span>
                    <PhoneInput
                      id="personal-phone"
                      value={phone}
                      onChange={(digits) => {
                        setPhone(digits)
                        markDirty()
                      }}
                      className={appFieldClassWithIcon}
                    />
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted">
                      <Mail size={18} />
                    </span>
                    <input
                      id="personal-contact-email"
                      type="email"
                      placeholder="Contact email"
                      value={contactEmail}
                      onChange={(e) => {
                        setContactEmail(e.target.value)
                        markDirty()
                      }}
                      className={appFieldClassWithIcon}
                    />
                  </div>
                </div>

                <h2 className="mb-3 border-t border-app-subtle pt-5 font-display text-base font-bold text-brown">
                  Social Media &amp; Links
                </h2>
                <div className="space-y-3">
                  {SOCIAL_FIELDS.map(({ id, icon: Icon, placeholder }) => (
                    <div key={id} className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted">
                        <Icon size={18} />
                      </span>
                      <input
                        id={`personal-${id}`}
                        type="text"
                        placeholder={placeholder}
                        value={social[id] ?? ''}
                        onChange={(e) => updateSocial(id, e.target.value)}
                        className={appFieldClassWithIcon}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {saveError && (
                <p className="mt-4 text-center text-sm font-semibold text-maroon">{saveError}</p>
              )}

              <SaveButton
                fullWidth
                className="mt-5 py-3 text-sm"
                label="Save profile"
                savedLabel="Saved"
                justSaved={saved}
                onClick={handleSavePersonal}
              />
            </>
          ) : (
            <div className={`mt-5 ${HOST_PANEL} text-sm text-brown-muted`}>
              Sign in to edit your host profile.
            </div>
          )
        ) : !org ? (
          <div className={`mt-5 ${HOST_PANEL} text-sm text-brown-muted`}>
            {hostAccounts.length === 0
              ? 'Create an organization to edit a public business profile.'
              : 'Switch to Organization mode in Event Manager to edit your public profile.'}
          </div>
        ) : (
          <>
            <div className={`relative mt-5 ${HOST_CARD}`}>
              <div className="absolute right-4 top-4">
                <ProfileViewButton
                  isDirty={isDirty}
                  viewProfileUrl={getOrgPublicProfileUrl(org.id, 'host-profile')}
                  onPreview={() => setPreviewOpen(true)}
                />
              </div>
              <HostProfileAvatarEditor
                name={orgName.trim() || org.name}
                avatarUrl={orgLogoUrl}
                onAvatarUrlChange={(url) => {
                  setOrgLogoUrl(url)
                  markDirty()
                }}
                label="Organizer logo"
              />

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
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value)
                    markDirty()
                  }}
                  className={appFieldClassWithIconLg}
                />
              </div>

              <label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-brown">
                Bio
              </label>
              <textarea
                id="bio"
                rows={4}
                value={orgBio}
                onChange={(e) => {
                  setOrgBio(e.target.value)
                  markDirty()
                }}
                placeholder="Tell people about your organization."
                className={`mb-5 ${appTextareaClass}`}
              />

              {showMerchShop && merchHostKind && merchHostId && (
                <PublicProfileMerchBar
                  shopUrl={merchShopUrl}
                  prominent
                  hostKind={merchHostKind}
                  hostId={merchHostId}
                  showMerchShop={showMerchShop}
                />
              )}

              <h2 className="mb-3 border-t border-app-subtle pt-5 font-display text-base font-bold text-brown">
                Photos
              </h2>
              <div className="mb-5">
                <EventPhotosEditor
                  photos={orgGalleryImages}
                  onChange={(photos) => {
                    setOrgGalleryImages(photos)
                    markDirty()
                  }}
                  variant="host"
                />
              </div>

              <h2 className="mb-3 border-t border-app-subtle pt-5 font-display text-base font-bold text-brown">
                Contact Information
              </h2>
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
                    value={orgAddress}
                    onChange={(e) => {
                      setOrgAddress(e.target.value)
                      markDirty()
                    }}
                    className={appFieldClassWithIcon}
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
                    value={orgCity}
                    onChange={(e) => {
                      setOrgCity(e.target.value)
                      markDirty()
                    }}
                    className={appFieldClassWithIcon}
                  />
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted">
                    <Phone size={18} />
                  </span>
                  <PhoneInput
                    id="org-phone"
                    value={orgPhone}
                    onChange={(digits) => {
                      setOrgPhone(digits)
                      markDirty()
                    }}
                    className={appFieldClassWithIcon}
                  />
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted">
                    <Mail size={18} />
                  </span>
                  <input
                    id="org-contact-email"
                    type="email"
                    placeholder="Contact email"
                    value={orgContactEmail}
                    onChange={(e) => {
                      setOrgContactEmail(e.target.value)
                      markDirty()
                    }}
                    className={appFieldClassWithIcon}
                  />
                </div>
              </div>

              <h2 className="mb-3 border-t border-app-subtle pt-5 font-display text-base font-bold text-brown">
                Social Media &amp; Links
              </h2>
              <div className="space-y-3">
                {SOCIAL_FIELDS.map(({ id, icon: Icon, placeholder }) => (
                  <div key={id} className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted">
                      <Icon size={18} />
                    </span>
                    <input
                      id={id}
                      type="text"
                      placeholder={placeholder}
                      value={orgSocial[id] ?? ''}
                      onChange={(e) => updateOrgSocial(id, e.target.value)}
                      className={appFieldClassWithIcon}
                    />
                  </div>
                ))}
              </div>
            </div>

            {orgSubmitState === 'pending' && orgVerificationRequest && (
              <p className="app-notice-pending mt-5 px-4 py-3 text-sm">
                {formatVerificationAttemptLabel(orgVerificationRequest.requestNumber)} pending â€” awaiting
                Control Room review
              </p>
            )}

            {saveError && (
              <p className="mt-4 text-center text-sm font-semibold text-maroon">{saveError}</p>
            )}

            {submitError && (
              <p className="mt-4 text-center text-sm font-semibold text-maroon">{submitError}</p>
            )}

            {orgSubmitHelperText && (
              <p className="mt-4 text-center text-xs text-brown-muted">{orgSubmitHelperText}</p>
            )}

            <SaveButton
              fullWidth
              className="mt-4 py-3 text-sm"
              label={
                orgSubmitState != null
                  ? getOrgProfileSubmitButtonLabel(orgSubmitState, false, false)
                  : 'Save profile'
              }
              savedLabel={orgSubmitButtonLabel}
              justSaved={saved}
              onClick={handleSaveOrg}
            />
          </>
        )}
      </main>

      <BottomNav />

      <HostProfilePreviewOverlay
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        form={isPersonal ? personalPreviewForm : orgPreviewForm}
      />

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
