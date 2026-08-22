import Header from '../components/Header'
import Footer from '../components/Footer'
import { LegalPublishedBody } from '../components/LegalPublishedBody'
import { BackLink } from '../components/NavActionButtons'
import { getPublishedLegalDoc } from '../lib/legalDocs'

export default function PrivacyPolicyPage() {
  const published = getPublishedLegalDoc('privacy')

  return (
    <div className="min-h-svh bg-cream">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brown-muted">Legal</p>
        <h1 className="mb-2 text-3xl font-extrabold text-brown sm:text-4xl">Privacy Policy</h1>
        <p className="mb-1 text-sm text-brown-muted">TUDU Entertainment Inc.</p>
        <p className="mb-10 text-sm text-brown-muted">
          {published
            ? `Last updated: ${new Date(published.updatedAt).toLocaleDateString()}`
            : 'Effective Date: January 1, 2026'}
        </p>

        <LegalPublishedBody
          published={published}
          fallback={
            <article className="space-y-8 text-brown">
              <section>
                <h2 className="mb-3 text-xl font-bold text-brown">1. Introduction</h2>
                <p className="leading-relaxed text-brown-muted">
                  TUDU Entertainment Inc. (&quot;TUDU,&quot; &quot;we,&quot; &quot;us&quot;) respects your privacy.
                  This Privacy Policy explains how we collect, use, disclose, and safeguard personal
                  information when you use the TUDU platform, including our website and mobile
                  applications.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-bold text-brown">2. Information We Collect</h2>
                <ul className="list-disc space-y-2 pl-6 text-brown-muted">
                  <li>Account information (name, email, phone number when provided)</li>
                  <li>Profile and preference data (interests, home city, event preferences)</li>
                  <li>Location data (when you enable location services)</li>
                  <li>Event activity (RSVPs, saves, bucket lists, host-created events)</li>
                  <li>Device and usage data (pages visited, session activity)</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-bold text-brown">3. How We Use Information</h2>
                <p className="leading-relaxed text-brown-muted">
                  We use your information to personalize event discovery, operate host tools, improve
                  the platform, communicate with you, and comply with legal obligations. We do not
                  sell your personal information to third parties.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-bold text-brown">4. Your Rights (PIPEDA)</h2>
                <p className="leading-relaxed text-brown-muted">
                  Under Canadian privacy law, you may request access to, correction of, or deletion of
                  your personal information. Contact us at{' '}
                  <a
                    href="mailto:admin@tudu.ca"
                    className="font-semibold text-orange no-underline hover:underline"
                  >
                    admin@tudu.ca
                  </a>{' '}
                  to exercise these rights.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-bold text-brown">5. Contact</h2>
                <address className="not-italic leading-relaxed text-brown-muted">
                  <strong className="text-brown">TUDU Entertainment Inc.</strong>
                  <br />
                  Box 2544, Kindersley, SK S0L 1S0, Canada
                  <br />
                  Email:{' '}
                  <a
                    href="mailto:admin@tudu.ca"
                    className="font-semibold text-orange no-underline hover:underline"
                  >
                    admin@tudu.ca
                  </a>
                </address>
              </section>
            </article>
          }
        />

        <p className="mt-12 text-sm text-brown-muted">
          <BackLink to="/" className="text-orange hover:text-orange hover:underline">
            Back to home
          </BackLink>
        </p>
      </main>

      <Footer />
    </div>
  )
}
