import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../lib/auth'
import { normalizeUsername, validateUsername } from '../lib/username'
import Header from '../components/Header'
import GradientButton from '../components/GradientButton'
import Footer from '../components/Footer'
import AddToHomeScreenButton from '../components/AddToHomeScreenButton'
import InstallAppOverlay from '../components/settings/InstallAppOverlay'
import { usePwaInstall } from '../hooks/usePwaInstall'
import {
  CakeIcon,
  CalendarIcon,
  EnvelopeIcon,
  FormField,
  IconInput,
  IconSelect,
  LockIcon,
  PasswordInput,
  PersonIcon,
  SearchIcon,
  SectionLabel,
} from '../components/FormFields'

const HEAR_OPTIONS = [
  { value: '', label: 'Select an option' },
  { value: 'social', label: 'Social Media (Instagram/TikTok)' },
  { value: 'friend', label: 'Friend/Word of Mouth' },
  { value: 'google', label: 'Google Search' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'organizer', label: 'Event Organizer' },
  { value: 'other', label: 'Other' },
]

type FormErrors = {
  name?: string
  username?: string
  email?: string
  password?: string
  dob?: string
  hearAbout?: string
  terms?: string
}

function validate(values: {
  name: string
  username: string
  email: string
  password: string
  dob: string
  hearAbout: string
  terms: boolean
}): FormErrors {
  const errors: FormErrors = {}

  if (!values.name.trim()) {
    errors.name = 'Please enter your name.'
  } else if (values.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.'
  }

  const usernameCheck = validateUsername(values.username)
  if (!usernameCheck.ok) {
    errors.username = usernameCheck.message
  }

  if (!values.email.trim()) {
    errors.email = 'Please enter your email.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Please enter a valid email address.'
  }

  if (!values.password) {
    errors.password = 'Please enter a password.'
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }

  if (!values.dob) {
    errors.dob = 'Please enter your date of birth.'
  }

  if (!values.hearAbout) {
    errors.hearAbout = 'Please tell us where you heard about us.'
  }

  if (!values.terms) {
    errors.terms = 'You must agree to the Terms of Service & Privacy Policy.'
  }

  return errors
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  const firstName = parts[0] ?? ''
  const lastName = parts.slice(1).join(' ') || firstName
  return { firstName, lastName }
}

export default function SignUpPage() {
  const navigate = useNavigate()
  const pwaInstall = usePwaInstall()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dob, setDob] = useState('')
  const [hearAbout, setHearAbout] = useState('')
  const [notifications, setNotifications] = useState(true)
  const [terms, setTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError('')

    const nextErrors = validate({ name, username, email, password, dob, hearAbout, terms })
    setErrors(nextErrors)
    setSubmitted(true)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const { firstName, lastName } = splitName(name)
    const usernameNormalized = normalizeUsername(username)
    const created = signUp({
      email: email.trim(),
      password,
      firstName,
      lastName,
      username: usernameNormalized,
      dob,
      hearAbout,
      notify: notifications,
    })

    if (!created.ok) {
      setSubmitError(created.error)
      return
    }

    navigate('/onboarding/interests')
  }

  return (
    <div className="app-page-shell min-h-svh">
      <Header variant="light" />

      <main className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-display text-3xl font-extrabold text-gradient">Create Your Account</h1>
          <p className="text-sm text-brown-muted">
            Join the community to discover what&apos;s happening near you.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          <section aria-labelledby="account-details-heading">
            <SectionLabel icon={<PersonIcon />}>
              <span id="account-details-heading">Account Details</span>
            </SectionLabel>

            <div className="space-y-4">
              <FormField id="name" label="Your Name" error={submitted ? errors.name : undefined}>
                <IconInput
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  icon={<PersonIcon />}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={!!errors.name && submitted}
                />
              </FormField>

              <FormField
                id="username"
                label="Username"
                error={submitted ? errors.username : undefined}
              >
                <IconInput
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="yourname"
                  icon={<PersonIcon />}
                  value={username}
                  onChange={(e) => setUsername(normalizeUsername(e.target.value))}
                  error={!!errors.username && submitted}
                />
                <p className="mt-1 text-xs text-brown-muted">
                  Your unique @handle on TUDU. Letters, numbers, and underscores only.
                </p>
              </FormField>

              <FormField id="email" label="Your Email" error={submitted ? errors.email : undefined}>
                <IconInput
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  icon={<EnvelopeIcon />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!!errors.email && submitted}
                />
              </FormField>

              <FormField id="password" label="Password" error={submitted ? errors.password : undefined}>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="Create a password"
                  icon={<LockIcon />}
                  visible={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!errors.password && submitted}
                />
              </FormField>
            </div>
          </section>

          <section aria-labelledby="personal-details-heading">
            <SectionLabel icon={<CakeIcon />}>
              <span id="personal-details-heading">Personal Details</span>
            </SectionLabel>

            <div className="space-y-4">
              <FormField id="dob" label="Date of Birth" error={submitted ? errors.dob : undefined}>
                <IconInput
                  id="dob"
                  name="dob"
                  type="date"
                  icon={<CalendarIcon />}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  error={!!errors.dob && submitted}
                />
              </FormField>

              <FormField
                id="hearAbout"
                label="Where did you hear about us?"
                error={submitted ? errors.hearAbout : undefined}
              >
                <IconSelect
                  id="hearAbout"
                  name="hearAbout"
                  icon={<SearchIcon />}
                  value={hearAbout}
                  onChange={(e) => setHearAbout(e.target.value)}
                  error={!!errors.hearAbout && submitted}
                >
                  {HEAR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                      {opt.label}
                    </option>
                  ))}
                </IconSelect>
              </FormField>
            </div>
          </section>

          <div className="space-y-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-brown/30 accent-purple"
              />
              <span className="text-sm text-brown-muted">
                Receive occasional email notifications for RSVPs and local recommendations.
              </span>
            </label>

            <div>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  required
                  aria-invalid={!!errors.terms && submitted}
                  className="mt-1 h-4 w-4 rounded border-brown/30 accent-purple"
                />
                <span className="text-sm text-brown-muted">
                  I agree to the{' '}
                  <Link to="/terms-of-service" className="font-semibold text-orange no-underline hover:underline">
                    Terms of Service
                  </Link>{' '}
                  &amp;{' '}
                  <a href="#privacy" className="font-semibold text-orange no-underline hover:underline">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
              {submitted && errors.terms && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.terms}
                </p>
              )}
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-red-600" role="alert">
              {submitError}
            </p>
          )}

          <GradientButton type="submit" fullWidth className="py-4 text-base">
            Continue
          </GradientButton>
        </form>

        {!pwaInstall.isInstalled && (
          <div className="mt-8">
            <AddToHomeScreenButton
              busy={pwaInstall.installBusy}
              onClick={() => void pwaInstall.requestInstall()}
            />
            {pwaInstall.installHint ? (
              <p className="mt-2 text-center text-xs text-red-400" role="status">
                {pwaInstall.installHint}
              </p>
            ) : (
              <p className="mt-2 text-center text-xs text-brown-muted">
                One tap installs Tudu on this device when your browser supports it.
              </p>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-brown-muted">
          Already have an account?{' '}
          <Link to="/signin" className="font-semibold text-orange no-underline hover:underline">
            Sign In
          </Link>
        </p>
      </main>

      <InstallAppOverlay open={pwaInstall.instructionsOpen} onClose={pwaInstall.closeInstructions} />

      <Footer variant="marketing" />
    </div>
  )
}
