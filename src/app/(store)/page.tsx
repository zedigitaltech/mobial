import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HomeClient } from "./home-client"
import { getCountries, getTopDestinations } from "@/lib/countries"
import { Star, Zap, Globe, Shield, Clock } from "lucide-react"

export default async function HomePage() {
  const allCountries = getCountries()
  const topDestinations = getTopDestinations(8)

  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full blur-[120px] opacity-20"
            style={{ background: "var(--brand-gradient)" }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <Badge variant="brand" className="text-xs px-3 py-1">
            ✦ Instant eSIM Delivery
          </Badge>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
            Your eSIM.{" "}
            <span
              style={{
                background: "var(--brand-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Any Country.
            </span>{" "}
            Instant.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect in 150+ countries. No roaming charges. No SIM swaps.
            Scan a QR code and you&apos;re online in minutes.
          </p>

          <HomeClient countries={allCountries} />

          <div className="flex items-center justify-center gap-4 pt-2">
            <Button variant="brand" size="lg" asChild>
              <Link href="/esim">Browse all plans</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/esim#how-it-works">How it works</Link>
            </Button>
          </div>
        </div>

        {/* Trust signals */}
        <div className="relative z-10 flex flex-wrap gap-6 justify-center mt-16 text-sm text-muted-foreground">
          {[
            { icon: Zap, text: "Instant delivery" },
            { icon: Globe, text: "150+ countries" },
            { icon: Shield, text: "Secure checkout" },
            { icon: Clock, text: "24/7 support" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="size-4 text-[#6C4FFF]" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured destinations */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold">Popular destinations</h2>
            <Button variant="ghost" asChild>
              <Link href="/esim">View all →</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {topDestinations.map((dest) => (
              <Link
                key={dest.code}
                href={`/esim?country=${dest.slug}`}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-border bg-card hover:bg-accent transition-all duration-200 text-center"
              >
                <span className="text-4xl">{dest.flag}</span>
                <span className="text-xs font-medium leading-tight">{dest.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4 bg-card/30">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">How it works</h2>
          <p className="text-muted-foreground mb-16">Three steps to stay connected anywhere.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Search your destination",
                desc: "Enter the country or region you're travelling to. We'll show you the best plans.",
              },
              {
                step: "02",
                title: "Choose your plan",
                desc: "Pick the data amount and validity that suits your trip. Pay once with no hidden fees.",
              },
              {
                step: "03",
                title: "Scan & connect",
                desc: "Install the eSIM by scanning a QR code. Done in under 2 minutes. Works on any modern phone.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center space-y-3">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: "var(--brand-gradient)" }}
                >
                  {step}
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="font-semibold text-lg">4.9 / 5 from 500+ reviews</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah M.",
                country: "🇬🇧 UK → Italy",
                text: "Set up in 2 minutes, worked perfectly in Rome. Way cheaper than my carrier's roaming add-on.",
              },
              {
                name: "Tomás R.",
                country: "🇪🇸 Spain → Japan",
                text: "Instant delivery, QR code in my email before I even got to the airport. 10/10 experience.",
              },
              {
                name: "Priya K.",
                country: "🇮🇳 India → Germany",
                text: "I use Mobialo every business trip. The data is fast and it always just works.",
              },
            ].map(({ name, country, text }) => (
              <div key={name} className="p-6 rounded-2xl border border-border bg-card space-y-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">&ldquo;{text}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">{country}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
