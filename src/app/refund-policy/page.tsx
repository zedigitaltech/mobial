import { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "MobiaL's refund policy for eSIM purchases. Learn about eligibility, process, and timeframes.",
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="prose prose-invert max-w-none">
            <h1 className="text-4xl font-black tracking-tight mb-2">Refund Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: March 10, 2026</p>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">1. Overview</h2>
              <p className="text-muted-foreground leading-relaxed">
                At MobiaL, we want you to be satisfied with your purchase. Because eSIM products are digital goods that are delivered instantly, our refund policy has specific conditions. Please read this policy carefully before making a purchase.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">2. Refund Eligibility</h2>
              <p className="text-muted-foreground leading-relaxed">
                You may be eligible for a refund if:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Unused and unactivated eSIM:</strong> The eSIM has not been installed on any device and has not been activated. You must request the refund within 30 days of purchase.</li>
                <li><strong>Technical failure:</strong> The eSIM could not be installed or activated due to a technical issue on our end, despite the device being compatible.</li>
                <li><strong>Duplicate purchase:</strong> You accidentally purchased the same eSIM product more than once. The duplicate must be unused and unactivated.</li>
                <li><strong>Non-delivery:</strong> You did not receive your eSIM activation details within 24 hours of purchase and our support team was unable to resolve the issue.</li>
              </ul>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">3. Non-Refundable Cases</h2>
              <p className="text-muted-foreground leading-relaxed">
                Refunds will not be provided in the following situations:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Activated eSIM:</strong> Once an eSIM has been installed and activated on a device, it cannot be refunded, even if data has not been consumed.</li>
                <li><strong>Partially used data:</strong> eSIMs where any data has been consumed are not eligible for a refund.</li>
                <li><strong>Expired eSIM:</strong> eSIMs that have passed their validity period are not eligible for a refund.</li>
                <li><strong>Device incompatibility:</strong> Purchases made for devices that do not support eSIM technology. It is your responsibility to verify device compatibility before purchase (see our <a href="/terms" className="text-primary hover:underline">Terms of Service</a>).</li>
                <li><strong>Network coverage dissatisfaction:</strong> Refunds are not available for complaints about network speed, coverage quality, or carrier performance, as these factors are controlled by the local carriers and are outside of MobiaL&apos;s control.</li>
                <li><strong>Change of travel plans:</strong> Changes to your travel itinerary or destination do not qualify for a refund if the eSIM has been activated.</li>
                <li><strong>Violation of terms:</strong> Purchases associated with accounts that have violated our Terms of Service.</li>
              </ul>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">4. How to Request a Refund</h2>
              <p className="text-muted-foreground leading-relaxed">
                To request a refund, please follow these steps:
              </p>
              <ol className="list-decimal pl-6 text-muted-foreground space-y-3">
                <li>
                  <strong>Contact our support team</strong> by emailing <a href="mailto:support@mobialo.eu" className="text-primary hover:underline">support@mobialo.eu</a> with the subject line &quot;Refund Request&quot;.
                </li>
                <li>
                  <strong>Include the following information</strong> in your email:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Your order number</li>
                    <li>The email address associated with your account</li>
                    <li>The reason for your refund request</li>
                    <li>Any relevant screenshots or documentation</li>
                  </ul>
                </li>
                <li>
                  <strong>Wait for our response.</strong> Our support team will review your request and respond within 2 business days.
                </li>
              </ol>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">5. Refund Processing</h2>

              <h3 className="text-xl font-semibold">5.1 Review Period</h3>
              <p className="text-muted-foreground leading-relaxed">
                All refund requests are reviewed within 2 business days. We may contact you for additional information if needed. You will receive an email notification once your refund request has been approved or denied.
              </p>

              <h3 className="text-xl font-semibold">5.2 Refund Method</h3>
              <p className="text-muted-foreground leading-relaxed">
                Approved refunds will be processed to the original payment method used for the purchase. We do not offer refunds via alternative payment methods, store credit, or cash.
              </p>

              <h3 className="text-xl font-semibold">5.3 Processing Time</h3>
              <p className="text-muted-foreground leading-relaxed">
                Once a refund is approved:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Credit/debit cards:</strong> 5-10 business days to appear on your statement</li>
                <li><strong>Other payment methods:</strong> Processing times may vary depending on your payment provider</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Please note that processing times are determined by your financial institution and are outside of our control.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">6. Partial Refunds</h2>
              <p className="text-muted-foreground leading-relaxed">
                In certain circumstances, partial refunds may be offered at our discretion. For example, if a technical issue prevented you from using a portion of your data plan, we may offer a prorated refund based on the unused portion.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">7. Disputes</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you disagree with a refund decision, you may escalate the matter by contacting us at <a href="mailto:legal@mobialo.eu" className="text-primary hover:underline">legal@mobialo.eu</a>. We are committed to resolving disputes fairly and promptly. Please do not initiate a chargeback with your bank before contacting us, as this may delay the resolution process.
              </p>
            </section>

            <section className="space-y-4 mb-10">
              <h2 className="text-2xl font-bold">8. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                For any questions about this Refund Policy, please contact us:
              </p>
              <ul className="list-none pl-0 text-muted-foreground space-y-1">
                <li>Email: <a href="mailto:support@mobialo.eu" className="text-primary hover:underline">support@mobialo.eu</a></li>
                <li>Refund requests: Include &quot;Refund Request&quot; in the subject line</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
