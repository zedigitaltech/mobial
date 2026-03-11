import { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Learn about the cookies MobiaL uses and how to manage your preferences.",
}

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="prose prose-invert max-w-none">
            <h1 className="text-4xl font-black tracking-tight mb-2">Cookie Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: March 10, 2026</p>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">1. What Are Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the site owners. Cookies enable features like remembering your preferences, keeping you logged in, and understanding how you interact with our platform.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">2. Types of Cookies We Use</h2>

              <h3 className="text-xl font-semibold">2.1 Essential Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                These cookies are necessary for the platform to function properly. They enable core functionality such as security, authentication, and session management. You cannot opt out of these cookies as the platform would not work without them.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-muted-foreground border border-border/50 rounded-lg">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left p-3 font-semibold text-foreground">Cookie</th>
                      <th className="text-left p-3 font-semibold text-foreground">Purpose</th>
                      <th className="text-left p-3 font-semibold text-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/30">
                      <td className="p-3 font-mono text-xs">session_token</td>
                      <td className="p-3">Maintains your authenticated session</td>
                      <td className="p-3">7 days</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="p-3 font-mono text-xs">csrf_token</td>
                      <td className="p-3">Protects against cross-site request forgery attacks</td>
                      <td className="p-3">Session</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="p-3 font-mono text-xs">cookie_consent</td>
                      <td className="p-3">Stores your cookie consent preferences</td>
                      <td className="p-3">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold">2.2 Functional Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                These cookies allow us to remember choices you make and provide enhanced, personalized features. They may be set by us or by third-party providers whose services we have added to our pages.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-muted-foreground border border-border/50 rounded-lg">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left p-3 font-semibold text-foreground">Cookie</th>
                      <th className="text-left p-3 font-semibold text-foreground">Purpose</th>
                      <th className="text-left p-3 font-semibold text-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/30">
                      <td className="p-3 font-mono text-xs">theme</td>
                      <td className="p-3">Remembers your preferred theme (light/dark)</td>
                      <td className="p-3">1 year</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="p-3 font-mono text-xs">locale</td>
                      <td className="p-3">Stores your preferred language/region</td>
                      <td className="p-3">1 year</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="p-3 font-mono text-xs">cart</td>
                      <td className="p-3">Preserves your shopping cart between visits</td>
                      <td className="p-3">30 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold">2.3 Analytics Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                These cookies help us understand how visitors interact with our platform by collecting and reporting information anonymously. This helps us improve our services and user experience.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-muted-foreground border border-border/50 rounded-lg">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left p-3 font-semibold text-foreground">Cookie</th>
                      <th className="text-left p-3 font-semibold text-foreground">Purpose</th>
                      <th className="text-left p-3 font-semibold text-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/30">
                      <td className="p-3 font-mono text-xs">_analytics_id</td>
                      <td className="p-3">Identifies unique visitors for analytics</td>
                      <td className="p-3">2 years</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="p-3 font-mono text-xs">_analytics_session</td>
                      <td className="p-3">Tracks page views within a session</td>
                      <td className="p-3">30 minutes</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold">2.4 Third-Party Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                Some cookies are set by third-party services that appear on our pages. We do not control these cookies. The third parties that set these cookies include:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Stripe:</strong> Payment processing and fraud prevention</li>
              </ul>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">3. How to Manage Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                You can control and manage cookies in several ways:
              </p>

              <h3 className="text-xl font-semibold">3.1 Browser Settings</h3>
              <p className="text-muted-foreground leading-relaxed">
                Most web browsers allow you to control cookies through their settings. You can usually find these settings in the &quot;Options&quot; or &quot;Preferences&quot; menu of your browser. The following links may be helpful:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Chrome: Settings &gt; Privacy and security &gt; Cookies</li>
                <li>Firefox: Settings &gt; Privacy &amp; Security &gt; Cookies</li>
                <li>Safari: Preferences &gt; Privacy</li>
                <li>Edge: Settings &gt; Privacy, search, and services &gt; Cookies</li>
              </ul>

              <h3 className="text-xl font-semibold">3.2 Opt-Out of Analytics</h3>
              <p className="text-muted-foreground leading-relaxed">
                You can opt out of analytics cookies by adjusting your cookie preferences on our platform. Note that disabling analytics cookies does not affect the functionality of the platform.
              </p>

              <h3 className="text-xl font-semibold">3.3 Impact of Disabling Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                Please be aware that disabling certain cookies may affect the functionality of our platform. Essential cookies cannot be disabled as they are required for the platform to operate. If you disable functional cookies, some features like theme preferences and cart persistence may not work properly.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">4. Changes to This Cookie Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in technology, regulation, or our business practices. Any changes will be posted on this page with an updated &quot;Last updated&quot; date.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">5. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about our use of cookies, please contact us:
              </p>
              <ul className="list-none pl-0 text-muted-foreground space-y-1">
                <li>Email: <a href="mailto:privacy@mobialo.eu" className="text-primary hover:underline">privacy@mobialo.eu</a></li>
                <li>General Support: <a href="mailto:support@mobialo.eu" className="text-primary hover:underline">support@mobialo.eu</a></li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
