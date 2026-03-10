import { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how MobiaL collects, uses, and protects your personal data. GDPR compliant.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="prose prose-invert max-w-none">
            <h1 className="text-4xl font-black tracking-tight mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: March 10, 2026</p>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                MobiaL (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our eSIM marketplace platform and related services. We operate as a reseller of eSIM products in partnership with MobiMatter.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                By using our services, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this policy, please do not access our platform.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold">2.1 Personal Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                When you create an account, place an order, or interact with our platform, we may collect the following personal information:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Full name</li>
                <li>Email address</li>
                <li>Phone number (optional)</li>
                <li>Billing address</li>
                <li>Payment information (processed securely via Stripe)</li>
                <li>Device information relevant to eSIM compatibility</li>
              </ul>

              <h3 className="text-xl font-semibold">2.2 Automatically Collected Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                When you visit our platform, we automatically collect certain information, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Operating system</li>
                <li>Pages visited and time spent on our platform</li>
                <li>Referring website or source</li>
                <li>Device identifiers</li>
              </ul>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>To process and fulfill your eSIM orders</li>
                <li>To create and manage your account</li>
                <li>To communicate with you about orders, support, and updates</li>
                <li>To process payments securely</li>
                <li>To improve our platform and user experience</li>
                <li>To detect and prevent fraud or unauthorized access</li>
                <li>To comply with legal obligations</li>
                <li>To send promotional communications (with your consent)</li>
              </ul>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">4. Data Sharing and Third Parties</h2>

              <h3 className="text-xl font-semibold">4.1 MobiMatter</h3>
              <p className="text-muted-foreground leading-relaxed">
                As our eSIM supply partner, MobiMatter receives order-related information necessary to provision and activate your eSIM. This includes your email address and order details. MobiMatter processes this data in accordance with their own privacy policy.
              </p>

              <h3 className="text-xl font-semibold">4.2 Stripe</h3>
              <p className="text-muted-foreground leading-relaxed">
                We use Stripe as our payment processor. When you make a purchase, your payment information is transmitted directly to Stripe and is subject to Stripe&apos;s privacy policy. We do not store your full credit card details on our servers.
              </p>

              <h3 className="text-xl font-semibold">4.3 Resend</h3>
              <p className="text-muted-foreground leading-relaxed">
                We use Resend for transactional email delivery (order confirmations, password resets, verification emails). Your email address is shared with Resend solely for the purpose of delivering these communications.
              </p>

              <h3 className="text-xl font-semibold">4.4 Other Disclosures</h3>
              <p className="text-muted-foreground leading-relaxed">
                We may disclose your information if required by law, regulation, or legal process, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">5. Data Storage and Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement industry-standard security measures to protect your personal information, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Encryption of data in transit (TLS/SSL) and at rest</li>
                <li>Secure password hashing using PBKDF2</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls limiting data access to authorized personnel</li>
                <li>Two-factor authentication options for your account</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Your data is stored on secure servers. We retain your personal information for as long as your account is active or as needed to provide services, comply with legal obligations, resolve disputes, and enforce agreements.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">6. Your Rights Under GDPR</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you are a resident of the European Economic Area (EEA), you have the following data protection rights:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Right of Access:</strong> You can request a copy of the personal data we hold about you.</li>
                <li><strong>Right to Rectification:</strong> You can ask us to correct inaccurate or incomplete personal data.</li>
                <li><strong>Right to Erasure:</strong> You can request that we delete your personal data, subject to certain exceptions.</li>
                <li><strong>Right to Restriction:</strong> You can ask us to restrict the processing of your personal data.</li>
                <li><strong>Right to Data Portability:</strong> You can request your data in a structured, commonly used, machine-readable format.</li>
                <li><strong>Right to Object:</strong> You can object to the processing of your personal data for certain purposes.</li>
                <li><strong>Right to Withdraw Consent:</strong> Where processing is based on consent, you can withdraw it at any time.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                To exercise any of these rights, please contact us at privacy@mobial.com. We will respond to your request within 30 days.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">7. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience on our platform. For detailed information about the cookies we use and how to manage them, please see our <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a>.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">8. Children&apos;s Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected data from a minor, please contact us immediately.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">9. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review this policy periodically.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">10. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <ul className="list-none pl-0 text-muted-foreground space-y-1">
                <li>Email: <a href="mailto:privacy@mobial.com" className="text-primary hover:underline">privacy@mobial.com</a></li>
                <li>General Support: <a href="mailto:support@mobial.com" className="text-primary hover:underline">support@mobial.com</a></li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
