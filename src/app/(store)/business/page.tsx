import { Metadata } from "next"
import Link from "next/link"
import {
  Building2,
  Users,
  Globe,
  CreditCard,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  Check,
  Headphones,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BreadcrumbJsonLd } from "@/components/common/json-ld"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://mobialo.eu"

export const metadata: Metadata = {
  title: "Business eSIM Solutions - Corporate Travel Connectivity",
  description:
    "Enterprise eSIM management for businesses. Bulk ordering, team management, usage reporting, and invoice billing for corporate travel.",
  openGraph: {
    title: "MobiaL for Business | Corporate eSIM Solutions",
    description:
      "Keep your team connected worldwide. Bulk eSIM ordering, usage tracking, and centralized billing.",
  },
}

const FEATURES = [
  {
    icon: Users,
    title: "Team Management",
    description:
      "Add team members, assign eSIM plans, and manage connectivity for your entire organization from one dashboard.",
  },
  {
    icon: Globe,
    title: "190+ Countries",
    description:
      "Global coverage for business travel. One platform for all destinations, no local SIM hassle.",
  },
  {
    icon: CreditCard,
    title: "Invoice Billing",
    description:
      "Consolidated monthly invoicing with Net-30/60 terms. No individual expense reports needed.",
  },
  {
    icon: BarChart3,
    title: "Usage Reporting",
    description:
      "Real-time data usage across all company eSIMs. Track spending per employee, department, or trip.",
  },
  {
    icon: Shield,
    title: "Secure & Compliant",
    description:
      "GDPR-compliant data handling. No tracking, no ads, no selling employee data.",
  },
  {
    icon: Zap,
    title: "Instant Activation",
    description:
      "eSIMs delivered digitally via email or QR code. No shipping, no waiting, no hardware to manage.",
  },
]

const PRICING_TIERS = [
  {
    name: "Starter",
    description: "For small teams",
    range: "1-10 eSIMs/month",
    discount: "5%",
    features: [
      "Bulk ordering dashboard",
      "Email delivery",
      "Basic usage reports",
      "Email support",
    ],
  },
  {
    name: "Business",
    description: "For growing companies",
    range: "11-100 eSIMs/month",
    discount: "10%",
    highlighted: true,
    features: [
      "Everything in Starter",
      "Team management portal",
      "Detailed usage analytics",
      "Invoice billing (Net-30)",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    range: "100+ eSIMs/month",
    discount: "15%+",
    features: [
      "Everything in Business",
      "Custom pricing",
      "API access",
      "Dedicated account manager",
      "Net-60 payment terms",
      "SSO integration",
    ],
  },
]

const USE_CASES = [
  {
    title: "Travel Agencies",
    description:
      "Offer eSIMs to your clients as part of their travel package. White-label options available.",
  },
  {
    title: "Remote Teams",
    description:
      "Keep distributed teams connected during off-sites, conferences, and international meetings.",
  },
  {
    title: "Corporate Travel",
    description:
      "Eliminate roaming bills. Pre-assign eSIMs to employees before business trips.",
  },
  {
    title: "Event Organizers",
    description:
      "Provide connectivity for international attendees at conferences, exhibitions, and events.",
  },
]

export default function BusinessPage() {
  return (
    <>
      <BreadcrumbJsonLd
        baseUrl={BASE_URL}
        items={[
          { name: "Home", url: "/" },
          { name: "Business", url: "/business" },
        ]}
      />

        {/* Hero */}
        <section className="relative pt-20 pb-16 overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
            <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
          </div>

          <div className="container mx-auto px-4 text-center space-y-6">
            <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase tracking-wider">
              <Building2 className="h-3 w-3 mr-1" /> For Business
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
              Keep Your Team{" "}
              <span className="text-primary italic">Connected.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Enterprise eSIM management for companies of all sizes.
              Bulk ordering, centralized billing, and real-time usage tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact">
                <Button size="lg" className="font-bold w-full sm:w-auto">
                  Get a Quote
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/products">
                <Button
                  size="lg"
                  variant="outline"
                  className="font-bold w-full sm:w-auto"
                >
                  Browse Plans
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl font-black tracking-tight mb-8 text-center">
              Built for Business
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl font-black tracking-tight mb-2 text-center">
              Volume Pricing
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              The more your team travels, the more you save.
            </p>
            <div className="grid gap-6 sm:grid-cols-3">
              {PRICING_TIERS.map((tier) => (
                <Card
                  key={tier.name}
                  className={
                    tier.highlighted
                      ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/50"
                  }
                >
                  <CardContent className="p-6 space-y-4">
                    {tier.highlighted && (
                      <Badge className="bg-primary/20 text-primary border-0 text-[10px] font-black">
                        Recommended
                      </Badge>
                    )}
                    <div>
                      <h3 className="text-lg font-black">{tier.name}</h3>
                      <p className="text-sm text-muted-foreground">{tier.description}</p>
                    </div>
                    <div>
                      <p className="text-3xl font-black text-primary">{tier.discount}</p>
                      <p className="text-xs text-muted-foreground">
                        discount &middot; {tier.range}
                      </p>
                    </div>
                    <ul className="space-y-2">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-black tracking-tight mb-8 text-center">
              Who Uses MobiaL for Business?
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {USE_CASES.map((uc) => (
                <Card key={uc.title} className="border-border/50">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-sm">{uc.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {uc.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-2xl text-center space-y-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Headphones className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Ready to simplify corporate connectivity?
            </h2>
            <p className="text-muted-foreground">
              Contact our business team for a custom quote tailored to your team size and
              travel patterns. No commitment, no minimum orders.
            </p>
            <Link href="/contact">
              <Button size="lg" className="font-bold">
                Contact Business Team
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
    </>
  )
}
