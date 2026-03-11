import { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
import { BreadcrumbJsonLd } from "@/components/common/json-ld"
import { FreeTrialForm } from "./client"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://mobialo.eu"

export const metadata: Metadata = {
  title: "Free Trial eSIM - Try Before You Buy",
  description:
    "Get a free trial eSIM and experience high-speed mobile data in popular destinations. No credit card required. One trial per person.",
  openGraph: {
    title: "Free Trial eSIM | MobiaL",
    description:
      "Try MobiaL free. Get a trial eSIM for popular destinations — no credit card needed.",
  },
}

export default function FreeTrialPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <BreadcrumbJsonLd
        baseUrl={BASE_URL}
        items={[
          { name: "Home", url: "/" },
          { name: "Free Trial", url: "/free-trial" },
        ]}
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-20 pb-12 overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
            <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
            <div className="absolute -bottom-[10%] -left-[10%] w-[30%] h-[30%] bg-primary/10 blur-[120px] rounded-full" />
          </div>

          <div className="container mx-auto px-4 text-center space-y-6">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-0 px-4 py-1.5 text-xs font-black uppercase tracking-wider">
              No Credit Card Required
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
              Try eSIM for{" "}
              <span className="text-primary italic">Free.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Experience mobile connectivity abroad before committing to a plan.
              Pick a destination, enter your email, and we&apos;ll send you a free
              trial eSIM.
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="pb-16">
          <div className="container mx-auto px-4 max-w-xl">
            <FreeTrialForm />
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-black tracking-tight mb-8 text-center">
              How the Free Trial Works
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              <StepCard
                step={1}
                title="Choose a Destination"
                description="Select from popular travel destinations where trial eSIMs are available."
              />
              <StepCard
                step={2}
                title="Enter Your Email"
                description="We'll send your eSIM QR code and activation instructions to your email."
              />
              <StepCard
                step={3}
                title="Install & Connect"
                description="Scan the QR code in your phone settings and enjoy free mobile data."
              />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-2xl space-y-6">
            <h2 className="text-2xl font-black tracking-tight text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <FaqItem
                q="How much data do I get with the trial?"
                a="The trial provides a small data allowance (typically 500MB-1GB depending on destination) so you can test the eSIM experience."
              />
              <FaqItem
                q="Do I need a credit card?"
                a="No. The free trial is completely free with no payment information required."
              />
              <FaqItem
                q="Can I claim more than one trial?"
                a="Each email address is eligible for one free trial. After your trial, you can purchase a full plan."
              />
              <FaqItem
                q="Which devices support eSIM?"
                a="Most modern smartphones including iPhone XR and newer, Samsung Galaxy S20 and newer, and Google Pixel 3 and newer. Check our compatible devices page for the full list."
              />
              <FaqItem
                q="How long is the trial valid?"
                a="You have 7 days to activate the trial eSIM after claiming it. Once activated, the data is valid for the plan's duration (typically 3-7 days)."
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function StepCard({
  step,
  title,
  description,
}: {
  step: number
  title: string
  description: string
}) {
  return (
    <div className="text-center space-y-3">
      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary font-black text-lg">
        {step}
      </div>
      <h3 className="font-bold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border/50">
      <h3 className="font-bold text-sm mb-1">{q}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
    </div>
  )
}
