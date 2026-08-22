import { useEffect, useReducer } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Compass, Landmark, MapPin, Megaphone, Sparkles, Users } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import FeatureCard from '../components/FeatureCard'
import GradientButton from '../components/GradientButton'
import LandingCrewPromo from '../components/landing/LandingCrewPromo'
import LandingFeaturedEvent from '../components/landing/LandingFeaturedEvent'
import LandingExtraDeckPreviews from '../components/landing/LandingExtraDeckPreviews'
import LandingOrganizerTiers from '../components/landing/LandingOrganizerTiers'
import { LANDING_DECK_TRUSTED_HOST_CARD } from '../data/discoverEvents'
import {
  getLandingRolloutFlags,
  LANDING_ROLLOUT_CHANGED_EVENT,
} from '../lib/adminSettings'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80&auto=format&fit=crop'
const BUCKET_LIST_IMAGE = '/landing/bucket-list-hero.png'
const ROAD_TRIP_IMAGE = '/landing/road-trip-rv.png'

const EXPLORE_LINKS = [
  { label: 'Discover Events', to: '/discover', flag: null },
  { label: 'Bucket List', to: '/bucket-list', flag: 'landingBucketList' as const },
  { label: 'Road Trip', to: '/road-trip', flag: 'landingRoadTrip' as const },
  { label: 'TUDU Crew', to: '/crew', flag: 'landingTuduCrew' as const },
]

export default function LandingPage() {
  const location = useLocation()
  const [refreshKey, bumpRefresh] = useReducer((count: number) => count + 1, 0)

  useEffect(() => {
    function refresh() {
      bumpRefresh()
    }

    window.addEventListener(LANDING_ROLLOUT_CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(LANDING_ROLLOUT_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  useEffect(() => {
    bumpRefresh()
  }, [location.key])

  void refreshKey
  const landingFlags = getLandingRolloutFlags()

  const visibleExploreLinks = EXPLORE_LINKS.filter(
    (link) => link.flag === null || landingFlags[link.flag],
  )

  const showMoreWays =
    landingFlags.landingBucketList || landingFlags.landingRoadTrip || landingFlags.landingTuduCrew

  return (
    <div className="min-h-svh overflow-x-hidden bg-midnight text-white">
      <Header variant="dark" />

      <section id="about" className="px-4 pt-2 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[14px] shadow-lg lg:grid lg:grid-cols-2 lg:items-stretch">
          <div className="relative w-full h-[220px] sm:h-[280px] md:h-[360px] lg:order-2 lg:h-auto lg:min-h-[min(520px,72vh)]">
            <img
              src={HERO_IMAGE}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              className="pointer-events-none absolute inset-0 lg:hidden"
              style={{
                background:
                  'linear-gradient(to bottom, transparent 40%, rgba(11, 15, 26, 0.55) 100%)',
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 hidden lg:block"
              style={{
                background:
                  'linear-gradient(to left, rgba(11, 15, 26, 0.35) 0%, transparent 55%)',
              }}
            />
          </div>

          <div className="bg-[#0b0f1a] px-5 py-5 text-center text-white sm:px-6 sm:py-6 lg:order-1 lg:flex lg:flex-col lg:justify-center lg:px-10 lg:py-14 lg:text-left xl:px-14">
            <h1 className="mb-2 font-display text-2xl font-extrabold leading-tight sm:mb-3 sm:text-3xl lg:mb-4 lg:text-[2.75rem] lg:leading-[1.1]">
              Community is right outside your door.
            </h1>
            <p className="mb-2 font-display text-lg font-extrabold leading-snug sm:mb-3 sm:text-xl lg:mb-4 lg:max-w-md lg:text-2xl">
              <span className="text-gradient">TUDU gets you there.</span>
            </p>
            <p className="mx-auto mb-5 max-w-lg text-sm leading-relaxed text-white/85 sm:mb-6 sm:text-base lg:mx-0 lg:mb-8 lg:max-w-md lg:text-[15px] lg:leading-relaxed lg:text-white/75">
              We built TUDU for one reason: to get you off your screen and into your city. Local events, run
              by real people near you - find something, then go live it.
            </p>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center sm:gap-3 lg:justify-start">
              <GradientButton to="/discover" className="px-8 py-3 sm:py-3.5 sm:w-auto">
                Find Something Tudu
              </GradientButton>
              <Link
                to="/host"
                className="inline-flex items-center justify-center rounded-[14px] border-2 border-white/80 bg-black/30 px-8 py-3 font-display text-sm font-bold text-white no-underline backdrop-blur-sm transition hover:bg-black/40 active:scale-[0.98] sm:py-3.5"
              >
                Host an Event
              </Link>
            </div>
            <p className="mx-auto mt-4 max-w-lg text-xs leading-relaxed text-white/75 sm:mt-5 lg:mx-0 lg:mt-6 lg:max-w-md lg:text-white/60">
              Explore without signing in
            </p>
            <nav
              className="mx-auto mt-1.5 flex max-w-lg flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs sm:mt-2 lg:mx-0 lg:max-w-md lg:justify-start"
              aria-label="Explore Tudu"
            >
              {visibleExploreLinks.map((link, i) => (
                <span key={link.to} className="inline-flex items-center gap-2">
                  {i > 0 && (
                    <span className="text-white/45" aria-hidden>
                      |
                    </span>
                  )}
                  <Link
                    to={link.to}
                    className="font-semibold text-white/90 no-underline hover:text-white hover:underline"
                  >
                    {link.label}
                  </Link>
                </span>
              ))}
            </nav>
          </div>
        </div>
      </section>

      <section id="partners" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <p className="mb-3 text-center font-display text-xs font-bold uppercase tracking-wider text-white/60">
          Why Tudu
        </p>
        <h2 className="mb-2 text-center font-display text-2xl font-extrabold text-gradient sm:text-3xl">
          Built to get you out the door.
        </h2>
        <p className="mx-auto mb-6 max-w-lg text-center text-sm text-white/72 sm:mb-8">
          Every part of Tudu points you toward something real to do - fast.
        </p>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <FeatureCard
            variant="dark"
            icon={
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-purple/15 text-purple">
                <Sparkles size={24} />
              </div>
            }
            title="Smart Discovery"
            description="Built from your filters to find what you need - the card deck, plain and simple."
          />
          <FeatureCard
            variant="dark"
            icon={
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-electric-blue/15 text-electric-blue">
                <Compass size={24} />
              </div>
            }
            title="Explore Events"
            description="Browse the deck - three events before sign-up, then unlock the full feed when you join."
          />
          <FeatureCard
            variant="dark"
            icon={
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-warm-yellow/20 text-yellow-600">
                <MapPin size={24} />
              </div>
            }
            title="Hidden Gems"
            description="Full-time businesses in entertainment and food. Post your business for maximum exposure."
          />
          <FeatureCard
            variant="dark"
            icon={
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-magenta/15 text-magenta">
                <Megaphone size={24} />
              </div>
            }
            title="Host Events"
            description="Run local events your way - low fees, instant payouts, and tools built for real organizers."
          />
          <FeatureCard
            variant="dark"
            icon={
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-success/15 text-success">
                <Users size={24} />
              </div>
            }
            title="Follow Organizers"
            description="Found a host you vibe with? Follow them once and never miss their next thing."
          />
          <FeatureCard
            variant="dark"
            icon={
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-peach/20 text-peach">
                <Landmark size={24} />
              </div>
            }
            title="Find Local Attractions"
            description="Attractions you've missed in your area - always-on spots worth a visit between events."
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl border-t border-white/10 px-4 py-14 sm:px-6 lg:px-8">
        <p className="mb-3 text-center font-display text-xs font-bold uppercase tracking-wider text-white/60">
          Events Near You
        </p>
        <h2 className="mb-10 text-center font-display text-2xl font-extrabold text-gradient sm:text-3xl">
          What&apos;s happening around you.
        </h2>
        <LandingFeaturedEvent event={LANDING_DECK_TRUSTED_HOST_CARD}>
          <LandingExtraDeckPreviews flags={landingFlags} />
        </LandingFeaturedEvent>
      </section>

      {showMoreWays && (
        <section
          id="more-ways-to-explore"
          className="mx-auto max-w-6xl border-t border-white/10 px-4 py-14 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-2 text-center font-display text-2xl font-extrabold text-gradient sm:text-3xl">
              More Ways to Explore
            </h2>
            <p className="mx-auto mb-10 max-w-lg text-center text-sm text-white/72">
              Save your dream experiences, hit the road, or join the team behind the adventures.
            </p>

            <div className="flex flex-col gap-10 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-stretch">
              {landingFlags.landingBucketList && (
                <article className="overflow-hidden rounded-[14px] shadow-md lg:flex lg:flex-col">
                  <div className="relative">
                    <img
                      src={BUCKET_LIST_IMAGE}
                      alt=""
                      className="aspect-[4/5] w-full object-cover sm:aspect-[16/10]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                      <p className="mb-1 font-display text-xs font-bold uppercase tracking-wider text-white/60">
                        Save &amp; share
                      </p>
                      <h3 className="mb-2 font-display text-2xl font-extrabold sm:text-3xl">Bucket List</h3>
                      <p className="max-w-md text-sm leading-relaxed text-white/85">
                        Save experiences and build your story. Curated lists and reels-style discovery help
                        you find your next must-do moment.
                      </p>
                    </div>
                  </div>
                </article>
              )}

              {landingFlags.landingRoadTrip && (
                <article className="overflow-hidden rounded-[14px] shadow-md lg:flex lg:flex-col">
                  <div className="relative">
                    <img
                      src={ROAD_TRIP_IMAGE}
                      alt=""
                      className="aspect-[16/10] w-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                      <p className="mb-1 font-display text-xs font-bold uppercase tracking-wider text-white/60">
                        Plan your route
                      </p>
                      <h3 className="mb-2 font-display text-2xl font-extrabold sm:text-3xl">Road Trip Mode</h3>
                      <p className="max-w-md text-sm leading-relaxed text-white/85">
                        Plan routes, discover surprise stops, and turn bucket-list dreams into multi-stop
                        adventures.
                      </p>
                    </div>
                  </div>
                </article>
              )}

              {landingFlags.landingTuduCrew && (
                <div className="lg:col-span-2">
                  <p className="mb-4 text-center font-display text-xs font-bold uppercase tracking-wider text-white/60">
                    Brand Ambassador Program 2027
                  </p>
                  <LandingCrewPromo />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <LandingOrganizerTiers />

      <section className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <h2 className="mb-3 font-display text-2xl font-extrabold text-gradient sm:text-3xl">
          Start Your Journey.
        </h2>
        <p className="mx-auto mb-8 max-w-md text-sm text-white/72">
          Join thousands of Canadians discovering their community. Your next adventure is one tap away.
        </p>
        <GradientButton to="/signup" className="mb-4 px-10 py-3.5">
          Join Tudu
        </GradientButton>
        <p className="text-sm text-white/72">
          Have an account?{' '}
          <Link to="/signin" className="font-semibold text-peach no-underline hover:underline">
            Log In
          </Link>
        </p>
      </section>

      <Footer variant="marketing" />
    </div>
  )
}
