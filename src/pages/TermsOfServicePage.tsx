import { type ReactNode } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { LegalPublishedBody } from '../components/LegalPublishedBody'
import { BackLink } from '../components/NavActionButtons'
import { getPublishedLegalDoc } from '../lib/legalDocs'

function LegalSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 text-xl font-bold text-brown">{title}</h2>
      <div className="space-y-4 text-sm leading-relaxed text-brown-muted">{children}</div>
    </section>
  )
}

function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export default function TermsOfServicePage() {
  const published = getPublishedLegalDoc('terms')

  return (
    <div className="min-h-svh bg-cream">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <article>
          <header className="mb-10 border-b border-brown/10 pb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-orange">Legal</p>
            <h1 className="mb-4 text-3xl font-extrabold text-gradient sm:text-4xl">Terms of Service</h1>
            <p className="text-sm text-brown-muted">
              <strong className="font-semibold text-brown">TUDU Entertainment Inc.</strong>
            </p>
            <dl className="mt-4 grid gap-2 text-sm text-brown-muted sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-brown">Last Updated</dt>
                <dd>
                  {published
                    ? new Date(published.updatedAt).toLocaleDateString()
                    : 'January 1, 2026'}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-brown">Governing Law</dt>
                <dd>Canada (initial operations based in Saskatchewan)</dd>
              </div>
            </dl>
          </header>

          <LegalPublishedBody
            published={published}
            fallback={
              <div className="space-y-10">
            <LegalSection id="introduction" title="1. Introduction">
              <p>
                Welcome to TUDU, a digital platform that enables users to discover, create, share, and
                engage with real-world events, activities, and experiences. These Terms of Service
                (&quot;Terms&quot;) form a binding legal agreement between you (&quot;User,&quot;
                &quot;you,&quot; &quot;your&quot;) and TUDU Entertainment Inc. (&quot;TUDU,&quot;
                &quot;we,&quot; &quot;us,&quot; &quot;our&quot;).
              </p>
              <p>
                By accessing, downloading, or using TUDU in any form (mobile app, website, or related
                services), you acknowledge that you have read, understood, and agree to be bound by
                these Terms, as well as our Privacy Policy and any additional policies we may publish
                from time to time.
              </p>
              <p>If you do not agree to these Terms, you must immediately stop using the platform.</p>
            </LegalSection>

            <LegalSection id="eligibility" title="2. Eligibility">
              <p>To use TUDU, you must meet the following requirements:</p>
              <LegalList
                items={[
                  'Minimum Age: You must be at least 13 years old or the age of digital consent in your jurisdiction. Certain features may require users to be 18+ or 19+, depending on provincial law.',
                  'Legal Capacity: You must have the legal authority to enter into this agreement.',
                  'Compliance With Laws: You agree to use TUDU in compliance with all applicable laws, including local event regulations, alcohol-related restrictions, and venue requirements.',
                ]}
              />
              <p>Parents or guardians are responsible for minors who use TUDU.</p>
            </LegalSection>

            <LegalSection id="account-registration" title="3. Account Registration">
              <p>To access certain features, you may be required to create an account. You agree to:</p>
              <LegalList
                items={[
                  'Provide accurate and up-to-date information',
                  'Maintain the confidentiality of your login credentials',
                  'Be solely responsible for activity under your account',
                  'Not impersonate any person or entity',
                  'Not create multiple accounts to bypass rules or restrictions',
                ]}
              />
              <p>
                TUDU reserves the right to suspend or terminate any account found to be in violation of
                these Terms.
              </p>
            </LegalSection>

            <LegalSection id="location-services" title="4. Use of Location Services">
              <p>
                TUDU uses location data to deliver personalized recommendations, maps, travel
                information, and event listings.
              </p>
              <p>By enabling location services, you consent to the collection and processing of:</p>
              <LegalList
                items={[
                  'Approximate location data (e.g., city or region)',
                  'Precise GPS location (if permitted)',
                  'Movement or navigation data (e.g., in Road Trip Mode)',
                ]}
              />
              <p>
                You may disable location access at any time, but doing so may limit certain features.
              </p>
            </LegalSection>

            <LegalSection id="user-generated-content" title="5. User-Generated Content (UGC)">
              <p>
                TUDU allows users to upload, submit, create, or share content, including event
                listings, descriptions, images, tags, and other forms of media.
              </p>
              <h3 className="font-semibold text-brown">A. Ownership</h3>
              <p>You retain full ownership of the content you create.</p>
              <h3 className="font-semibold text-brown">B. License to TUDU</h3>
              <p>
                By posting content, you grant TUDU a worldwide, non-exclusive, royalty-free,
                transferable license to display, modify for formatting, distribute, use for
                promotional purposes, reproduce, host, and publish.
              </p>
              <p>This license ends when you delete your content, except for:</p>
              <LegalList items={['Backups', 'Data held for legal compliance', 'Content shared publicly that others may have downloaded or copied']} />
              <h3 className="font-semibold text-brown">C. Your Responsibility</h3>
              <p>You are solely responsible for the content you post. You agree not to upload:</p>
              <LegalList
                items={[
                  'Illegal, explicit, or harmful material',
                  'Misleading event details',
                  'Spam, scams, or fraudulent content',
                  'Content that promotes violence or unsafe activities',
                  'Intellectual property belonging to others without permission',
                ]}
              />
              <p>
                TUDU may remove or restrict any content that violates these terms or poses a risk to
                users.
              </p>
            </LegalSection>

            <LegalSection id="event-hosting" title="6. Event Posting and Hosting">
              <p>Users may create and host events on TUDU. By doing so, you agree to:</p>
              <LegalList
                items={[
                  'Provide truthful and accurate event information',
                  'Update event details if they change',
                  'Comply with local laws, permits, and venue requirements',
                  'Ensure safety for participants',
                  'Not host illegal, dangerous, or harmful events',
                  'Not impersonate businesses or organizations',
                ]}
              />
              <p>TUDU does not verify or guarantee any event, including safety, legitimacy, accuracy, or availability.</p>
              <p>You acknowledge that you host and attend events at your own risk.</p>
            </LegalSection>

            <LegalSection id="platform-role" title="7. Platform Role, Responsibilities, and Limitations">
              <p>TUDU is a technology platform, not an event organizer, participant, venue provider, travel agent, or ticketing broker (unless introduced in future updates).</p>
              <p>We do not control or oversee real-world events. We are not responsible for injuries, accidents, event cancellations, misconduct, transportation issues, venue access, weather, safety practices, or third-party service failures.</p>
              <p>Your decision to attend, host, or participate is voluntary and at your own risk.</p>
            </LegalSection>

            <LegalSection id="beta-subscriptions" title="8. Beta Access and Future Subscription Services">
              <p>TUDU is currently in a beta phase, where all features are available free of charge.</p>
              <p>During beta, features may change without notice, data may be reset or removed, bugs or downtime may occur, and user experience may vary.</p>
              <p>When TUDU launches publicly, premium subscription tiers may be introduced, certain advanced features may become paid, and a separate Subscription Agreement will be provided. Continuing to use TUDU after paid tiers launch means you accept the updated terms.</p>
            </LegalSection>

            <LegalSection id="acceptable-use" title="9. Acceptable Use Requirements">
              <p>You agree not to use TUDU for unlawful purposes, post dangerous events, harass other users, circumvent platform protections, scrape data without permission, interfere with operations, upload malicious software, or misuse TUDU intellectual property.</p>
              <p>TUDU may restrict or suspend your access if violations occur.</p>
            </LegalSection>

            <LegalSection id="intellectual-property" title="10. Intellectual Property Rights">
              <p>All TUDU-related assets are protected under applicable copyright, trademark, and intellectual property laws, including the TUDU name, icon, Road Trip Mode icon, Kids Mode icon, character designs, branding, graphics, and UI layouts.</p>
              <p>You may not copy, modify, distribute, or reproduce any TUDU branding without authorization.</p>
            </LegalSection>

            <LegalSection id="third-party" title="11. Third-Party Integrations">
              <p>TUDU may integrate with external services such as maps, ticketing partners, payment processors, analytics providers, business event feeds, and future travel or accommodation services.</p>
              <p>TUDU is not responsible for third-party errors, failures, or policies.</p>
            </LegalSection>

            <LegalSection id="privacy" title="12. Privacy">
              <p>
                Your use of TUDU is governed by our Privacy Policy, which outlines what data we
                collect, how we use it, how it is shared, and user rights under Canadian law
                (PIPEDA). You must review the Privacy Policy to understand your rights and
                obligations.
              </p>
            </LegalSection>

            <LegalSection id="termination" title="13. Suspension and Termination">
              <p>TUDU may suspend or permanently terminate accounts for violating these Terms, posting harmful content, creating unsafe events, fraudulent activity, disrupting platform operations, or abusing features through multiple accounts.</p>
              <p>Termination may include removal of content and loss of access. You may delete your account at any time.</p>
            </LegalSection>

            <LegalSection id="disclaimers" title="14. Disclaimers">
              <p>To the fullest extent permitted by law, TUDU is provided &quot;as is&quot; and &quot;as available.&quot; We make no warranties regarding uptime, accuracy, reliability, or functionality, and do not guarantee the safety, quality, or legality of events.</p>
            </LegalSection>

            <LegalSection id="liability" title="15. Limitation of Liability">
              <p>TUDU and its affiliates shall not be liable for personal injury, property damage, event-related incidents, lost profits, loss of data, technical issues, third-party actions, inaccurate event information, user misconduct, or travel problems.</p>
              <p>Our total liability, if any, is limited to the amount you paid for using the service (most likely $0 during beta).</p>
            </LegalSection>

            <LegalSection id="indemnification" title="16. Indemnification">
              <p>You agree to indemnify and hold harmless TUDU and its affiliates from claims arising from events you host, content you post, your interactions with other users, violations of these Terms, or use of third-party services through TUDU. This includes reasonable legal and professional fees.</p>
            </LegalSection>

            <LegalSection id="modifications" title="17. Modifications to These Terms">
              <p>We may update or modify these Terms at any time. If changes are significant, we will notify you via in-app alerts or email (if provided). Continued use of the platform after changes means you accept the revised Terms.</p>
            </LegalSection>

            <LegalSection id="governing-law" title="18. Governing Law">
              <p>These Terms are governed by the laws of Canada, with initial operational jurisdiction in Saskatchewan, and transferable to Alberta as operations evolve. Any disputes will be resolved according to these jurisdictions.</p>
            </LegalSection>

            <LegalSection id="contact" title="19. Contact Information">
              <p>For any questions about this Agreement, please contact:</p>
              <address className="not-italic">
                <strong className="text-brown">TUDU Entertainment Inc.</strong>
                <br />
                Box 2544
                <br />
                Kindersley, SK S0L 1S0
                <br />
                Canada
                <br />
                Email:{' '}
                <a href="mailto:admin@tudu.ca" className="font-semibold text-orange no-underline hover:underline">
                  admin@tudu.ca
                </a>
              </address>
            </LegalSection>
              </div>
            }
          />

          <p className="mt-12 text-center text-sm text-brown-muted">
            <BackLink to="/" className="text-orange hover:text-orange hover:underline">
              Back to home
            </BackLink>
          </p>
        </article>
      </main>

      <Footer />
    </div>
  )
}
