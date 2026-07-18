import { Link } from 'react-router-dom'
import { Compass, MapPin, Sparkles, Users } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import FeatureCard from '../components/FeatureCard'
import EventCard from '../components/EventCard'
import GradientButton from '../components/GradientButton'
import { getDiscoverPath, getHostPath } from '../lib/auth'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80&auto=format&fit=crop'
const ORGANIZER_IMAGE =
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80&auto=format&fit=crop'

const events = [
  {
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80&auto=format&fit=crop',
    title: 'Community Tech Talk',
    date: 'July 22, 2024 · 6:00 PM',
    venue: 'Tech Hub Central',
    host: 'Tech Community',
    verified: true,
    price: 'Free Entry',
    spots: '50 spots',
  },
  {
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80&auto=format&fit=crop',
    title: 'Artisan Pottery Workshop',
    date: 'July 25, 2024 · 2:00 PM',
    venue: 'Art District Studio',
    host: 'Artistic Artisan',
    verified: true,
    price: '$45',
    spots: '10 spots left',
  },
  {
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80&auto=format&fit=crop',
    title: 'Sunset Yoga in the Park',
    date: 'July 28, 2024 · 7:00 PM',
    venue: 'Riverside Park',
    host: 'Wellness Warrior',
    verified: true,
    price: '$20',
    spots: '20 spots left',
    highlighted: true,
  },
]

export default function LandingPage() {
  const discoverPath = getDiscoverPath()
  const hostPath = getHostPath()

  return (
    <div className="min-h-svh bg-cream text-brown">
      <Header variant="light" />

      <section className="relative mx-4 mt-2 overflow-hidden rounded-[var(--radius-tudu-xl)] sm:mx-6">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0 backdrop-blur-[2px]"
          style={{
            background:
              'linear-gradient(to bottom, rgba(11, 15, 26, 0.85) 0%, rgba(11, 15, 26, 0.5) 40%, rgba(11, 15, 26, 0.25) 70%, rgba(11, 15, 26, 0.45) 100%)',
          }}
        />
        <div className="relative px-6 py-16 text-center text-white sm:py-20">
          <h1 className="mb-4 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            Community is right outside your door.
          </h1>
          <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-white/90 sm:text-base">
            Tudu is your guide to local adventures. Discover hidden gems, connect with neighbors, and
            find your next favorite hobby.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <GradientButton to={discoverPath} className="px-8 py-3.5">
              Find Something To Do
            </GradientButton>
            <Link
              to={hostPath}
              className="inline-flex items-center justify-center rounded-full border-2 border-white/80 bg-black/30 px-8 py-3.5 font-display text-sm font-bold text-white no-underline backdrop-blur-sm transition hover:bg-black/40 active:scale-[0.98]"
            >
              Host Events
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6">
        <h2 className="mb-2 text-center font-display text-2xl font-extrabold text-gradient sm:text-3xl">
          Everything You Need to Explore
        </h2>
        <p className="mx-auto mb-8 max-w-lg text-center text-sm text-brown-muted">
          From personalized recommendations to hidden local treasures, Tudu makes discovering your
          community effortless.
        </p>
        <div className="mx-auto flex max-w-lg flex-col gap-4">
          <FeatureCard
            variant="light"
            icon={
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-purple/15 text-purple">
                <Sparkles size={24} />
              </div>
            }
            title="Smart Discovery"
            description="Personalized feed of events tailored to your interests and location."
          />
          <FeatureCard
            variant="light"
            icon={
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-warm-yellow/20 text-yellow-600">
                <MapPin size={24} />
              </div>
            }
            title="Hidden Gems"
            description="Uncover secret local spots and underground events you won't find anywhere else."
          />
          <FeatureCard
            variant="light"
            icon={
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-electric-blue/15 text-electric-blue">
                <Compass size={24} />
              </div>
            }
            title="Interests Quiz"
            description="Take our quick quiz to get spot-on recommendations for things you'll love."
          />
          <FeatureCard
            variant="light"
            icon={
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-success/15 text-success">
                <Users size={24} />
              </div>
            }
            title="Follow Organizers"
            description="Stay in the loop with your favorite local organizers and never miss their events."
          />
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6">
        <h2 className="mb-2 text-center font-display text-2xl font-extrabold text-gradient sm:text-3xl">
          Events for Every Passion
        </h2>
        <p className="mx-auto mb-8 max-w-lg text-center text-sm text-brown-muted">
          Browse curated events happening near you — from workshops to wellness, tech to art.
        </p>
        <div className="mx-auto flex max-w-lg flex-col gap-6">
          {events.map((event) => (
            <EventCard key={event.title} {...event} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            to={discoverPath}
            className="inline-flex items-center gap-2 font-semibold text-brown no-underline transition hover:text-purple"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Browse All Events
          </Link>
        </div>
      </section>

      <section className="relative mx-4 my-8 overflow-hidden rounded-[var(--radius-tudu-xl)] sm:mx-6">
        <img src={ORGANIZER_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative px-6 py-12 text-center text-white">
          <span className="mb-4 inline-block rounded-full border border-white/30 bg-white/10 px-4 py-1 font-display text-xs font-bold tracking-wider">
            For Event Organizers
          </span>
          <h2 className="mb-4 font-display text-2xl font-extrabold sm:text-3xl">
            Your event deserves better than 10% fees.
          </h2>
          <ul className="mx-auto mb-8 max-w-sm space-y-2 text-left text-sm text-white/90">
            {[
              'Low flat-fees — keep more of what you earn',
              'No listing fees — publish events for free',
              'Instant payouts — get paid when attendees RSVP',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-success">✓</span> {item}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <GradientButton to={hostPath} className="px-8 py-3">
              Learn More
            </GradientButton>
            <Link
              to={hostPath}
              className="inline-flex items-center justify-center rounded-full border-2 border-white/80 bg-transparent px-8 py-3 font-display text-sm font-bold text-white no-underline transition hover:bg-white/10"
            >
              Start Hosting For Free
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 text-center sm:px-6">
        <h2 className="mb-3 font-display text-2xl font-extrabold text-gradient sm:text-3xl">
          Start Your Journey.
        </h2>
        <p className="mx-auto mb-8 max-w-md text-sm text-brown-muted">
          Join thousands of Canadians discovering their community. Your next adventure is one tap away.
        </p>
        <GradientButton to="/signup" className="mb-4 px-10 py-3.5">
          Join Tudu
        </GradientButton>
        <p className="text-sm text-brown-muted">
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
