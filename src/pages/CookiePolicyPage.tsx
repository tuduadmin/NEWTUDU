import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

const cookieTypes = [
  {
    category: 'Essential cookies',
    purpose:
      'Required for the Site to function — for example, enabling core features, maintaining security, and remembering basic settings. The Site cannot operate properly without these, and they cannot be disabled through our cookie tools.',
  },
  {
    category: 'Functional cookies',
    purpose:
      'Remember your preferences and choices to provide a more personalized experience, such as language or display settings.',
  },
  {
    category: 'Analytics cookies',
    purpose:
      'Help us understand how visitors interact with the Site — which pages are visited, how long visitors stay, and where visitors come from — so we can improve performance and content.',
  },
  {
    category: 'Advertising cookies',
    purpose:
      'May be used in the future to deliver relevant advertising and measure the effectiveness of ad campaigns. TUDU does not currently use advertising cookies, but this policy will be updated before any such cookies are deployed.',
  },
  {
    category: 'Social media cookies',
    purpose:
      'Used when you interact with social login or sharing features (such as signing in with Facebook or Google), enabling those platforms to recognize you and connect your activity with your account on that platform.',
  },
]

const browserInstructions = [
  { browser: 'Google Chrome', path: 'Settings → Privacy and security → Cookies and other site data' },
  { browser: 'Safari', path: 'Preferences → Privacy → Manage Website Data' },
  { browser: 'Mozilla Firefox', path: 'Settings → Privacy & Security → Cookies and Site Data' },
  { browser: 'Microsoft Edge', path: 'Settings → Cookies and site permissions → Manage and delete cookies' },
]

export default function CookiePolicyPage() {
  return (
    <div className="min-h-svh bg-cream">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brown-muted">
          Legal
        </p>
        <h1 className="mb-2 text-3xl font-extrabold text-brown sm:text-4xl">Cookie Policy</h1>
        <p className="mb-1 text-sm text-brown-muted">TUDU Entertainment Inc.</p>
        <p className="mb-10 text-sm text-brown-muted">Effective Date: January 1, 2026</p>

        <article className="space-y-10 text-brown">
          <section>
            <h2 className="mb-3 text-xl font-bold text-brown">1. Introduction</h2>
            <p className="leading-relaxed text-brown-muted">
              At TUDU Entertainment Inc. (&quot;TUDU,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), we use
              cookies and similar tracking technologies on www.tudu.ca (the &quot;Site&quot;) to help our Site
              function properly, understand how visitors use our Site, and improve your overall experience.
              This Cookie Policy explains what cookies are, how we use them, and the choices available to
              you.
            </p>
            <p className="mt-4 leading-relaxed text-brown-muted">
              This policy should be read alongside our Privacy Policy, which explains more generally how we
              collect, use, and protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-brown">2. What Are Cookies?</h2>
            <p className="leading-relaxed text-brown-muted">
              Cookies are small text files placed on your device (computer, phone, or tablet) when you visit
              a website. They allow the website to recognize your device, remember your preferences and past
              actions, and collect information about how the site is used. Without cookies, a site would have
              no way of remembering that you were just there — every page you visit would treat you like a
              first-time stranger.
            </p>
            <p className="mt-4 leading-relaxed text-brown-muted">Cookies may be:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-brown-muted">
              <li>
                <strong className="text-brown">First-party cookies</strong> — set directly by TUDU.
              </li>
              <li>
                <strong className="text-brown">Third-party cookies</strong> — set by services we work with,
                such as Google Maps.
              </li>
              <li>
                <strong className="text-brown">Session cookies</strong> — temporary cookies deleted when you
                close your browser.
              </li>
              <li>
                <strong className="text-brown">Persistent cookies</strong> — cookies that remain on your
                device for a set period or until you delete them.
              </li>
            </ul>
            <p className="mt-4 leading-relaxed text-brown-muted">
              We may also use similar technologies such as web beacons, pixels, and local storage, which work
              alongside cookies to collect information about your use of the Site. In this policy, we refer to
              all of these collectively as &quot;cookies.&quot;
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-brown">3. Why We Use Cookies</h2>
            <p className="mb-4 leading-relaxed text-brown-muted">
              Cookies serve a few practical purposes for us and for you as a visitor:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-brown-muted">
              <li>
                <strong className="text-brown">Making the Site work</strong> — some cookies are required just
                to load pages correctly and keep the Site secure.
              </li>
              <li>
                <strong className="text-brown">Remembering you</strong> — cookies let the Site recall choices
                you&apos;ve already made, so you don&apos;t have to re-enter the same information every visit.
              </li>
              <li>
                <strong className="text-brown">Understanding usage</strong> — cookies help us see which pages
                and features people actually use, so we can prioritize improvements that matter.
              </li>
              <li>
                <strong className="text-brown">Supporting embedded features</strong> — some cookies come from
                third-party tools we embed directly into the Site, like maps and sign-in options.
              </li>
            </ul>
            <p className="mt-4 leading-relaxed text-brown-muted">
              We do not use cookies to sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-brown">4. Types of Cookies We Use</h2>
            <div className="overflow-x-auto rounded-[var(--radius-tudu)] border border-brown/10 bg-cream-dark/50">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-brown/10">
                    <th scope="col" className="px-4 py-3 font-bold text-brown">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3 font-bold text-brown">
                      Purpose
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cookieTypes.map((row) => (
                    <tr key={row.category} className="border-b border-brown/10 last:border-b-0">
                      <td className="align-top px-4 py-3 font-semibold text-brown">{row.category}</td>
                      <td className="px-4 py-3 leading-relaxed text-brown-muted">{row.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-brown">5. Third-Party Services</h2>
            <p className="mb-4 leading-relaxed text-brown-muted">
              We work with the following third-party providers, which may set their own cookies or collect
              information when you use certain features of the Site:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-brown-muted">
              <li>
                <strong className="text-brown">Google Maps</strong> — used to display maps and location-based
                features. Google may collect information in accordance with its own privacy and cookie
                policies.
              </li>
              <li>
                <strong className="text-brown">Facebook / Google Sign-In</strong> — used to let you create an
                account or log in using your existing Facebook or Google credentials. These providers may
                place cookies to enable this functionality and may collect information governed by their own
                policies.
              </li>
              <li>
                <strong className="text-brown">AI-powered features</strong> — TUDU is developing AI-powered
                functionality to enhance the Site experience. As these features are implemented, this policy
                will be updated to describe any related data collection or cookie use.
              </li>
            </ul>
            <p className="mt-4 leading-relaxed text-brown-muted">
              We encourage you to review the privacy and cookie policies of these third parties for more
              information about how they handle your data.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-brown">6. How to Control Cookies</h2>
            <p className="mb-4 leading-relaxed text-brown-muted">
              You have several options to manage or limit cookies:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-brown-muted">
              <li>
                <strong className="text-brown">Cookie banner:</strong> When available, our cookie consent tool
                lets you accept or decline non-essential cookies when you first visit the Site.
              </li>
              <li>
                <strong className="text-brown">Browser settings:</strong> Most browsers let you block, limit,
                or delete cookies through their settings menu. Note that blocking essential cookies may affect
                the Site&apos;s functionality.
              </li>
              <li>
                <strong className="text-brown">Third-party opt-outs:</strong> You can manage preferences
                directly with providers like Google through their own account and ad settings tools.
              </li>
            </ul>
            <p className="mt-4 leading-relaxed text-brown-muted">
              Instructions for managing cookies in common browsers:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-brown-muted">
              {browserInstructions.map((item) => (
                <li key={item.browser}>
                  <strong className="text-brown">{item.browser}:</strong> {item.path}
                </li>
              ))}
            </ul>
            <p className="mt-4 leading-relaxed text-brown-muted">
              Disabling cookies through your browser applies broadly across the sites you visit, not just
              TUDU, so review your browser&apos;s help documentation for full details.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-brown">7. Your Rights</h2>
            <p className="leading-relaxed text-brown-muted">
              Depending on where you live, you may have rights regarding the personal information collected
              through cookies, such as the right to know what information we hold, request its correction or
              deletion, or withdraw consent for non-essential cookies at any time. In Canada, these principles
              are guided by federal and provincial privacy law, including PIPEDA.
            </p>
            <p className="mt-4 leading-relaxed text-brown-muted">
              As TUDU grows into other regions, this section will be updated to reflect any additional rights
              that apply under local law (for example, the EU&apos;s GDPR or similar frameworks). To exercise
              any rights available to you now, contact us using the details in Section 9.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-brown">8. Updates to This Policy</h2>
            <p className="leading-relaxed text-brown-muted">
              We may update this Cookie Policy from time to time to reflect changes in the cookies and
              technologies we use, or for legal or regulatory reasons. We will post the updated version on this
              page with a revised effective date.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-brown">9. Contact Us</h2>
            <p className="leading-relaxed text-brown-muted">
              If you have questions about this Cookie Policy or how we handle your information, please contact
              us:
            </p>
            <address className="mt-4 not-italic leading-relaxed text-brown-muted">
              <strong className="text-brown">TUDU Entertainment Inc.</strong>
              <br />
              Box 2544
              <br />
              Kindersley, SK S0L 1S0
              <br />
              Canada
              <br />
              <br />
              Email:{' '}
              <a href="mailto:admin@tudu.ca" className="font-semibold text-orange no-underline hover:underline">
                admin@tudu.ca
              </a>
            </address>
          </section>
        </article>

        <p className="mt-12 text-sm text-brown-muted">
          <Link to="/" className="font-semibold text-orange no-underline hover:underline">
            ← Back to home
          </Link>
        </p>
      </main>

      <Footer />
    </div>
  )
}
