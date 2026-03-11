import { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using MobiaL's eSIM marketplace platform.",
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="prose prose-invert max-w-none">
            <h1 className="text-4xl font-black tracking-tight mb-2">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: March 10, 2026</p>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">1. Service Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                MobiaL (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates an online marketplace for eSIM (embedded SIM) products. We resell eSIM data plans sourced through our partnership with MobiMatter, providing travelers and digital nomads with convenient mobile connectivity in over 150 countries.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using our platform at mobialo.eu (the &quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use our Service.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">2. Eligibility</h2>
              <p className="text-muted-foreground leading-relaxed">
                To use our Service, you must:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Be at least 18 years of age or the age of majority in your jurisdiction</li>
                <li>Have the legal capacity to enter into a binding agreement</li>
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Have an eSIM-compatible device (see Section 7 for device compatibility)</li>
              </ul>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">3. Account Responsibilities</h2>
              <p className="text-muted-foreground leading-relaxed">
                When you create an account with us, you agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Immediately notify us of any unauthorized access or use of your account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Keep your account information accurate and up to date</li>
                <li>Not share your account with others or create multiple accounts</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or are inactive for an extended period.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">4. Orders and Payments</h2>

              <h3 className="text-xl font-semibold">4.1 Placing Orders</h3>
              <p className="text-muted-foreground leading-relaxed">
                When you place an order through our platform, you are making an offer to purchase the selected eSIM product. All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason, including pricing errors or suspected fraud.
              </p>

              <h3 className="text-xl font-semibold">4.2 Pricing</h3>
              <p className="text-muted-foreground leading-relaxed">
                All prices are displayed in USD unless otherwise stated. Prices are subject to change without notice. The price at the time of order placement will be the price you are charged.
              </p>

              <h3 className="text-xl font-semibold">4.3 Payment Processing</h3>
              <p className="text-muted-foreground leading-relaxed">
                Payments are processed securely through Stripe. By making a purchase, you agree to Stripe&apos;s terms of service. We do not store your full payment card details on our servers.
              </p>

              <h3 className="text-xl font-semibold">4.4 Delivery</h3>
              <p className="text-muted-foreground leading-relaxed">
                eSIM products are delivered digitally. Upon successful payment, you will receive your eSIM activation details (QR code and/or manual configuration instructions) via email and in your account dashboard. Delivery is typically instant but may take up to 30 minutes in some cases.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">5. Refunds</h2>
              <p className="text-muted-foreground leading-relaxed">
                Refund eligibility depends on the status of your eSIM. Please refer to our <a href="/refund-policy" className="text-primary hover:underline">Refund Policy</a> for detailed information about eligibility, process, and timeframes.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">6. eSIM Usage and Fair Use</h2>
              <p className="text-muted-foreground leading-relaxed">
                eSIM products purchased through MobiaL are intended for personal use. You agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Use eSIMs in compliance with the laws of the country where activated</li>
                <li>Not resell or redistribute eSIM activation details</li>
                <li>Not use eSIMs for illegal activities, spam, or abuse</li>
                <li>Comply with any fair use policies set by the underlying carrier</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Data plans that include &quot;unlimited&quot; data may be subject to fair use limits imposed by the carrier. Excessive usage may result in throttling or service suspension by the carrier, which is outside of MobiaL&apos;s control.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">7. Device Compatibility</h2>
              <p className="text-muted-foreground leading-relaxed">
                eSIM products require an eSIM-compatible device. It is your responsibility to verify that your device supports eSIM technology and is not carrier-locked before making a purchase. MobiaL is not responsible for purchases made for incompatible devices.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Compatibility information provided on our platform is for general guidance only and may not cover all device models, firmware versions, or carrier restrictions. When in doubt, please consult your device manufacturer or carrier before purchasing.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">8. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content on the MobiaL platform, including but not limited to text, graphics, logos, icons, images, and software, is the property of MobiaL or its licensors and is protected by intellectual property laws. You may not reproduce, modify, distribute, or create derivative works from any content on our platform without prior written consent.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">9. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                To the maximum extent permitted by applicable law:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>MobiaL provides the Service on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind, either express or implied.</li>
                <li>We do not guarantee uninterrupted, timely, secure, or error-free service.</li>
                <li>We are not liable for network coverage, speed, or quality, which are determined by the underlying carriers.</li>
                <li>In no event shall MobiaL be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities.</li>
                <li>Our total liability for any claim arising from or relating to the Service shall not exceed the amount you paid for the specific eSIM product giving rise to the claim.</li>
              </ul>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">10. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify and hold harmless MobiaL, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses arising out of or in any way connected with your use of the Service, your violation of these Terms, or your violation of any third-party rights.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">11. Governing Law and Dispute Resolution</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law principles. Any disputes arising under these Terms shall first be resolved through good-faith negotiation. If unresolved, disputes shall be submitted to binding arbitration in accordance with the rules of the American Arbitration Association.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">12. Changes to These Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of material changes by posting the updated terms on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after changes are posted constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">13. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <ul className="list-none pl-0 text-muted-foreground space-y-1">
                <li>Email: <a href="mailto:legal@mobialo.eu" className="text-primary hover:underline">legal@mobialo.eu</a></li>
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
