import { ArrowRight, BadgeCheck, Clock, Shirt, Ticket } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import GradientButton from '../components/GradientButton'

const CREW_FESTIVAL_IMAGE = '/landing/crew-festival-1.png'

const benefits = [
  {
    icon: BadgeCheck,
    title: 'Paid Gigs',
    description: 'Competitive hourly pay + bonuses',
  },
  {
    icon: Ticket,
    title: 'Event Access',
    description: 'Festivals, concerts & more',
  },
  {
    icon: Shirt,
    title: 'Free Merch',
    description: 'Branded fits & gear',
  },
  {
    icon: Clock,
    title: 'Flexible Schedule',
    description: 'Part-time, weekend-friendly',
  },
]

const qualifications = [
  'Ages 19-28',
  'Strong Communication Skills',
  'Professional Demeanor',
  'Reliable & Punctual',
  'Comfortable Public-Facing',
  'Social Media Proficiency',
  'Weekend Availability',
  'Based Locally',
]

export default function TuduCrewPage() {
  return (
    <div className="min-h-svh bg-[#0a0612] text-white">
      <Header variant="dark" />

      <main>
        <section className="relative overflow-hidden px-4 pb-10 pt-8 sm:px-6">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <div className="relative mx-auto max-w-3xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-warm-yellow">
                Brand Ambassador Program 2025
              </p>
              <span className="rounded-[14px] bg-gradient-tudu px-4 py-1.5 font-display text-xs font-bold uppercase tracking-wide text-white shadow-[0_0_24px_rgba(249,115,22,0.35)]">
                Now Hiring
              </span>
            </div>

            <h1 className="mb-6 font-display text-4xl font-extrabold leading-none sm:text-5xl">
              <span className="block text-white">Join</span>
              <span className="block text-gradient">The Crew</span>
            </h1>

            <p className="mb-10 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              We&apos;re looking for 3-4 energetic, outgoing people in their 20s to represent Tudu at
              events, festivals, and activations across the city.
            </p>

            <div className="relative mb-10 overflow-hidden rounded-[14px] border border-white/10">
              <img
                src={CREW_FESTIVAL_IMAGE}
                alt="TUDU Crew brand ambassadors at a music festival"
                className="aspect-[16/10] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0612]/80 via-transparent to-transparent" />
            </div>

            <div className="mb-10">
              <h2 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                What You Get
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {benefits.map(({ icon: Icon, title, description }) => (
                  <article
                    key={title}
                    className="rounded-[14px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[14px] bg-warm-yellow/15 text-warm-yellow">
                      <Icon size={20} strokeWidth={2.25} />
                    </div>
                    <h3 className="mb-1 font-display text-base font-bold text-white">{title}</h3>
                    <p className="text-sm leading-relaxed text-white/60">{description}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="mb-10 rounded-[14px] border border-magenta/40 bg-white/[0.03] p-6">
              <h2 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.18em] text-sunset-pink">
                Qualifications
              </h2>
              <div className="flex flex-wrap gap-2">
                {qualifications.map((item) => (
                  <span
                    key={item}
                    className="rounded-[14px] border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-sm text-white/80"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4 text-center">
              <GradientButton
                to="mailto:info@tudu.ca?subject=TUDU%20Crew%20Application"
                className="inline-flex w-full items-center justify-center gap-2 px-8 py-4 text-base sm:w-auto"
              >
                Apply to Join the TUDU Crew
                <ArrowRight size={18} />
              </GradientButton>

              <p className="text-sm text-white/55">
                DM us on Instagram{' '}
                <a
                  href="https://instagram.com/tudu_entertainment"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-sunset-pink no-underline hover:underline"
                >
                  @tudu_entertainment
                </a>{' '}
                or email{' '}
                <a
                  href="mailto:info@tudu.ca"
                  className="font-semibold text-sunset-pink no-underline hover:underline"
                >
                  info@tudu.ca
                </a>
              </p>

              <p className="text-xs text-white/35">
                www.tudu.ca | Limited spots available
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer variant="dark" />
    </div>
  )
}
