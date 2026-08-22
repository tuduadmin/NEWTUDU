import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Mail, Phone, User } from 'lucide-react'
import SettingsLayout from '../../components/settings/SettingsLayout'
import SaveButton from '../../components/host/SaveButton'
import { FormField, IconInput, IconSelect } from '../../components/FormFields'
import VerificationBadge from '../../components/VerificationBadge'
import { DEFAULT_PREFERENCES, getPreferences, savePreferences } from '../../lib/preferences'
import { getCurrentAccount, updateCurrentAccount } from '../../lib/account'
import { getCurrentUser } from '../../lib/auth'
import {
  getPersonalHostProfile,
  resolvePersonalHostDisplayName,
  saveLoginName,
  savePersonalHostProfile,
} from '../../lib/personalHostProfile'
import PersonalProfilePhotoEditor from '../../components/host/PersonalProfilePhotoEditor'
import { formatStoredPhone } from '../../lib/phoneFormat'
import { getVerifyPhoneUrl } from '../../lib/verifyPhoneNav'
import { GENDER_OPTIONS, birthYearFromDob, type GenderOption } from '../../lib/demographics'

const PROFILE_CARD = 'app-surface-card host-edit-profile-panel p-4 mt-5'

export default function MyTuduEditProfilePage() {
  const user = getCurrentUser()
  const [loginName, setLoginName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [myTuduAvatarUrl, setMyTuduAvatarUrl] = useState('')
  const [hostAvatarUrl, setHostAvatarUrl] = useState('')
  const [email, setEmail] = useState(DEFAULT_PREFERENCES.email)
  const [dob, setDob] = useState(DEFAULT_PREFERENCES.dob)
  const [phone] = useState(DEFAULT_PREFERENCES.phone)
  const account = getCurrentAccount()
  const phoneVerified = account?.verificationStatus === 'phone_verified'
  const displayPhone = formatStoredPhone(account?.phone ?? phone)
  const [gender, setGender] = useState<GenderOption>('')
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    const prefs = getPreferences()
    const resolvedName = user
      ? resolvePersonalHostDisplayName(user.email, prefs.screenName)
      : prefs.screenName
    setLoginName(resolvedName)
    setLegalName(prefs.legalName ?? '')
    setMyTuduAvatarUrl(prefs.avatarUrl ?? '')
    if (user) {
      const hostProfile = getPersonalHostProfile(user.email, resolvedName)
      setHostAvatarUrl(hostProfile.avatarUrl ?? '')
    }
    setEmail(prefs.email)
    setDob(prefs.dob)
    setGender((getCurrentAccount()?.gender as GenderOption) ?? '')
  }, [user?.email])

  function handleSave() {
    setSaveError('')
    const trimmedName = loginName.trim()
    if (!trimmedName) {
      setSaveError('Please enter your name.')
      return
    }

    if (user?.email) {
      saveLoginName(user.email, trimmedName)
      try {
        const hostProfile = getPersonalHostProfile(user.email, trimmedName)
        savePersonalHostProfile(user.email, {
          ...hostProfile,
          displayName: '',
          avatarUrl: hostAvatarUrl.trim() || undefined,
        })
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Could not save host profile photo.')
        return
      }
    }

    savePreferences({
      screenName: trimmedName,
      legalName: legalName.trim() || undefined,
      avatarUrl: myTuduAvatarUrl.trim() || undefined,
      email,
      dob,
    })
    updateCurrentAccount({
      gender: gender || undefined,
      birthYear: birthYearFromDob(dob),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <SettingsLayout showTitle={false} backLabel="Back">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">
        Edit Profile
      </h1>
      <p className="mt-1 text-sm text-brown-muted">Your name, photos, and contact details</p>

      <div className={PROFILE_CARD}>
        <h2 className="mb-4 font-display text-base font-bold text-brown">Personal Information</h2>

        <PersonalProfilePhotoEditor
          name={loginName}
          photoUrl={myTuduAvatarUrl}
          onPhotoChange={(url) => {
            setMyTuduAvatarUrl(url)
            setSaved(false)
          }}
          label="My Tudu picture"
          helperText="Shown on your My Tudu page. You can set a different photo for hosting events below."
        />

        <PersonalProfilePhotoEditor
          name={loginName}
          photoUrl={hostAvatarUrl}
          onPhotoChange={(url) => {
            setHostAvatarUrl(url)
            setSaved(false)
          }}
          label="Personal host profile picture"
          helperText="Shown when you host events as yourself — on your public host profile and in Event Manager."
        />

        <div className="space-y-4">
          <FormField id="login-name" label="Your name">
            <p className="mb-2 text-xs text-brown-muted">
              Shown on My Tudu and your personal host profile.
            </p>
            <IconInput
              id="login-name"
              type="text"
              icon={<User size={18} />}
              value={loginName}
              onChange={(e) => {
                setLoginName(e.target.value)
                setSaved(false)
              }}
            />
          </FormField>

          <FormField id="legal-name" label="Name on tickets">
            <p className="mb-2 text-xs text-brown-muted">
              Your legal or full name for tickets and check-in. Not shown on your public profile.
            </p>
            <IconInput
              id="legal-name"
              type="text"
              icon={<User size={18} />}
              value={legalName}
              onChange={(e) => {
                setLegalName(e.target.value)
                setSaved(false)
              }}
              placeholder="e.g. Jane Marie Smith"
            />
          </FormField>

          <FormField id="email" label="Email">
            <IconInput
              id="email"
              type="email"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setSaved(false)
              }}
            />
          </FormField>

          <FormField id="dob" label="Date of Birth">
            <IconInput
              id="dob"
              type="date"
              icon={<Calendar size={18} />}
              value={dob}
              onChange={(e) => {
                setDob(e.target.value)
                setSaved(false)
              }}
            />
          </FormField>

          <FormField id="gender" label="Gender (optional)">
            <IconSelect
              id="gender"
              icon={<User size={18} />}
              value={gender}
              onChange={(e) => {
                setGender(e.target.value as GenderOption)
                setSaved(false)
              }}
            >
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value || 'empty'} value={g.value}>
                  {g.label}
                </option>
              ))}
            </IconSelect>
          </FormField>

          <FormField id="phone" label="Phone Number">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <IconInput
                  id="phone"
                  type="tel"
                  icon={<Phone size={18} />}
                  value={displayPhone}
                  readOnly
                  placeholder="Not set"
                  className="bg-app-surface opacity-90"
                />
              </div>
              <VerificationBadge account={account} showLink={!phoneVerified} />
            </div>
            {!phoneVerified && (
              <Link
                to={getVerifyPhoneUrl('/my-tudu/settings/edit-profile')}
                className="mt-2 inline-block text-xs font-semibold text-orange no-underline"
              >
                Verify phone to unlock public events →
              </Link>
            )}
          </FormField>
        </div>
      </div>

      <SaveButton
        fullWidth
        className="mt-5 py-3.5"
        label="Save All Changes"
        savedLabel="Saved!"
        justSaved={saved}
        onClick={handleSave}
      />
      {saveError && (
        <p className="mt-3 text-center text-sm font-semibold text-maroon">{saveError}</p>
      )}
    </SettingsLayout>
  )
}
