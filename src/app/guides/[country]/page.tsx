import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  Globe,
  Wifi,
  Smartphone,
  Shield,
  Zap,
  ArrowRight,
  Phone,
  MapPin,
  Signal,
  Clock,
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getCountryBySlug, countries } from "@/lib/countries"
import { BreadcrumbJsonLd, FAQPageJsonLd } from "@/components/common/json-ld"
import { getProducts } from "@/services/product-service"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://mobialo.eu"

interface PageProps {
  params: Promise<{ country: string }>
}

// Country-specific travel data
const COUNTRY_INFO: Record<
  string,
  {
    emergencyNumber: string
    tipping: string
    voltage: string
    carriers: string[]
    avgSpeed: string
    coverage: string
    airportWifi: string
    bestFor: string[]
    dataAdvice: string
  }
> = {
  JP: {
    emergencyNumber: "110 (Police), 119 (Fire/Ambulance)",
    tipping: "Not customary — tipping can be considered rude",
    voltage: "100V, Type A/B plugs",
    carriers: ["NTT Docomo", "au (KDDI)", "SoftBank", "Rakuten Mobile"],
    avgSpeed: "50-100 Mbps (4G/5G widely available)",
    coverage: "Excellent nationwide, including rural areas",
    airportWifi: "Free WiFi at Narita, Haneda, Kansai airports",
    bestFor: ["Navigation", "Translation apps", "Google Maps"],
    dataAdvice:
      "Japan has excellent coverage. 1GB/day is enough for most travelers. Download Google Translate's Japanese offline pack before your trip.",
  },
  US: {
    emergencyNumber: "911",
    tipping: "15-20% at restaurants, $1-2 per drink at bars",
    voltage: "120V, Type A/B plugs",
    carriers: ["T-Mobile", "AT&T", "Verizon"],
    avgSpeed: "30-80 Mbps (5G in major cities)",
    coverage: "Good in cities, spotty in rural/national parks",
    airportWifi: "Free WiFi at most major airports",
    bestFor: ["Navigation", "Ride-hailing apps", "Streaming"],
    dataAdvice:
      "Get a larger plan (3-5GB) if visiting multiple cities. Coverage can be weak in national parks — download offline maps.",
  },
  TR: {
    emergencyNumber: "112 (General), 155 (Police), 110 (Fire)",
    tipping: "10-15% at restaurants, round up for taxis",
    voltage: "220V, Type C/F plugs",
    carriers: ["Turkcell", "Vodafone Turkey", "Turk Telekom"],
    avgSpeed: "30-60 Mbps (4G/4.5G widespread)",
    coverage: "Excellent in cities and coastal areas",
    airportWifi: "Free WiFi at Istanbul Airport (IST)",
    bestFor: ["Navigation", "Translation", "Calling restaurants"],
    dataAdvice:
      "Turkey has very affordable data. 1-2GB is enough for a week in Istanbul. Download offline maps for Cappadocia.",
  },
  TH: {
    emergencyNumber: "191 (Police), 1669 (Ambulance), 199 (Fire)",
    tipping: "Not expected, but 20-50 baht appreciated",
    voltage: "220V, Type A/B/C plugs",
    carriers: ["AIS", "DTAC", "TrueMove H"],
    avgSpeed: "20-50 Mbps (4G widespread, 5G in Bangkok)",
    coverage: "Good in cities and tourist areas, limited on islands",
    airportWifi: "Free WiFi at Suvarnabhumi and Don Mueang airports",
    bestFor: ["Grab (ride-hailing)", "Google Maps", "Translation"],
    dataAdvice:
      "Thailand is very data-friendly. 1GB/day covers most needs. Coverage on smaller islands may be limited.",
  },
  ES: {
    emergencyNumber: "112",
    tipping: "Not expected, rounding up is common",
    voltage: "230V, Type C/F plugs",
    carriers: ["Movistar", "Vodafone Spain", "Orange Spain"],
    avgSpeed: "30-70 Mbps (4G/5G in major cities)",
    coverage: "Excellent nationwide",
    airportWifi: "Free WiFi at Madrid-Barajas and Barcelona El Prat",
    bestFor: ["Navigation", "Restaurant booking apps", "Social media"],
    dataAdvice:
      "Spain has great coverage. EU roaming plans work here if you have one. 1-2GB per week is plenty for casual use.",
  },
  IT: {
    emergencyNumber: "112 (General), 113 (Police)",
    tipping: "Not expected — coperto (cover charge) is included",
    voltage: "230V, Type C/F/L plugs",
    carriers: ["TIM", "Vodafone Italy", "WindTre", "Iliad"],
    avgSpeed: "30-60 Mbps (4G widespread, 5G in cities)",
    coverage: "Good in cities, can be spotty in rural Tuscany/Sardinia",
    airportWifi: "Free WiFi at Rome Fiumicino and Milan Malpensa",
    bestFor: ["Google Maps", "Restaurant reservations", "Train apps"],
    dataAdvice:
      "Italy coverage is good but can vary in rural hilltop towns. Download offline maps if visiting Tuscany or Amalfi Coast.",
  },
  GB: {
    emergencyNumber: "999 or 112",
    tipping: "10-15% at restaurants (check if service charge included)",
    voltage: "230V, Type G plugs",
    carriers: ["EE", "Vodafone UK", "Three", "O2"],
    avgSpeed: "40-80 Mbps (5G in major cities)",
    coverage: "Excellent in England, varies in Scotland/Wales highlands",
    airportWifi: "Free WiFi at Heathrow, Gatwick, Stansted",
    bestFor: ["Transport apps", "Google Maps", "Mobile payments"],
    dataAdvice:
      "UK has excellent coverage in cities. 1GB/week is fine for light use. Tube has WiFi in London stations.",
  },
  DE: {
    emergencyNumber: "112",
    tipping: "5-10% at restaurants, round up for taxis",
    voltage: "230V, Type C/F plugs",
    carriers: ["Telekom", "Vodafone Germany", "O2"],
    avgSpeed: "30-60 Mbps (4G/5G expanding)",
    coverage: "Good in cities, can be spotty in rural areas and trains",
    airportWifi: "Free WiFi at Frankfurt, Munich, Berlin airports",
    bestFor: ["DB Navigator (trains)", "Google Maps", "Translation"],
    dataAdvice:
      "Germany's mobile coverage has some rural gaps compared to other EU countries. Download offline maps for train journeys through countryside.",
  },
  FR: {
    emergencyNumber: "112 (General), 15 (SAMU), 17 (Police)",
    tipping: "Not expected — service compris included in prices",
    voltage: "230V, Type C/E plugs",
    carriers: ["Orange", "SFR", "Bouygues Telecom", "Free Mobile"],
    avgSpeed: "30-70 Mbps (4G/5G in cities)",
    coverage: "Good nationwide, excellent in Paris",
    airportWifi: "Free WiFi at Charles de Gaulle and Orly",
    bestFor: ["Metro navigation", "Google Translate", "Restaurant apps"],
    dataAdvice:
      "France has solid coverage. Paris Metro has limited connectivity underground — download maps. 1-2GB/week for casual use.",
  },
  AU: {
    emergencyNumber: "000",
    tipping: "Not expected, 10% appreciated for exceptional service",
    voltage: "230V, Type I plugs",
    carriers: ["Telstra", "Optus", "Vodafone Australia"],
    avgSpeed: "30-60 Mbps (4G/5G in cities)",
    coverage: "Good in cities, very limited in outback",
    airportWifi: "Free WiFi at Sydney, Melbourne, Brisbane airports",
    bestFor: ["Navigation", "Road trip apps", "Emergency info"],
    dataAdvice:
      "Australia is vast with no coverage in the outback. Get a larger plan for road trips. City coverage is excellent.",
  },
  KR: {
    emergencyNumber: "112 (Police), 119 (Fire/Ambulance)",
    tipping: "Not customary",
    voltage: "220V, Type C/F plugs",
    carriers: ["SK Telecom", "KT", "LG U+"],
    avgSpeed: "80-150 Mbps (among world's fastest)",
    coverage: "Excellent nationwide, including subway",
    airportWifi: "Free WiFi everywhere, including Incheon Airport",
    bestFor: ["Naver Map (better than Google Maps)", "Papago translation", "KakaoTalk"],
    dataAdvice:
      "South Korea has the world's best mobile infrastructure. 1GB/day is plenty. WiFi is available almost everywhere.",
  },
  SG: {
    emergencyNumber: "999 (Police), 995 (Ambulance/Fire)",
    tipping: "Not expected — 10% service charge usually included",
    voltage: "230V, Type G plugs",
    carriers: ["Singtel", "StarHub", "M1"],
    avgSpeed: "60-100 Mbps (5G widely available)",
    coverage: "Excellent island-wide",
    airportWifi: "Free WiFi at Changi Airport",
    bestFor: ["Grab", "Google Maps", "Food apps"],
    dataAdvice:
      "Singapore is tiny with excellent coverage. 500MB-1GB is enough for most short trips. Free WiFi is abundant.",
  },
}

// Default info for countries not in our detailed list
const DEFAULT_INFO = {
  emergencyNumber: "112 (varies by country)",
  tipping: "Check local customs",
  voltage: "Check local standards",
  carriers: [],
  avgSpeed: "Varies",
  coverage: "Varies by region",
  airportWifi: "Check airport website",
  bestFor: ["Navigation", "Translation", "Communication"],
  dataAdvice:
    "We recommend 1-2GB per week for casual use (maps, messaging, social media). Get more if you plan to video call or stream.",
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country: slug } = await params
  const country = getCountryBySlug(slug)

  if (!country) {
    return { title: "Guide Not Found" }
  }

  return {
    title: `eSIM Guide for ${country.name} - Setup, Carriers & Travel Tips`,
    description: `Complete eSIM guide for ${country.name}. Local carriers, network speeds, coverage info, emergency numbers, and travel tips. Get the best eSIM plan for ${country.name}.`,
    openGraph: {
      title: `Best eSIM for ${country.name} | MobiaL Guide`,
      description: `Everything you need to know about using an eSIM in ${country.name}. Local carriers, speeds, and practical travel tips.`,
    },
  }
}

export async function generateStaticParams() {
  return Object.keys(countries).map((slug) => ({ country: slug }))
}

export default async function CountryGuidePage({ params }: PageProps) {
  const { country: slug } = await params
  const country = getCountryBySlug(slug)

  if (!country) notFound()

  const info = COUNTRY_INFO[country.code] || DEFAULT_INFO

  const { products } = await getProducts({
    country: country.code,
    limit: 3,
  })

  const faqQuestions = [
    {
      q: `How do I install an eSIM for ${country.name}?`,
      a: `Go to Settings > Cellular/Mobile > Add eSIM on your device. Scan the QR code we send to your email, or enter the activation details manually. The eSIM activates instantly.`,
    },
    {
      q: `What network speeds can I expect in ${country.name}?`,
      a: `Average speeds are ${info.avgSpeed}. Coverage is ${info.coverage.toLowerCase()}.`,
    },
    {
      q: `Do I need to unlock my phone to use an eSIM in ${country.name}?`,
      a: `Yes, your device must be carrier-unlocked and eSIM-compatible. Most modern iPhones (XR+), Samsung Galaxy (S20+), and Google Pixels (3+) support eSIM.`,
    },
    {
      q: `Can I keep my regular phone number while using an eSIM in ${country.name}?`,
      a: `Yes! eSIM works alongside your physical SIM. Keep your regular number for calls/texts and use the eSIM for data while abroad.`,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <BreadcrumbJsonLd
        baseUrl={BASE_URL}
        items={[
          { name: "Home", url: "/" },
          { name: "Guides", url: "/guides" },
          { name: country.name, url: `/guides/${slug}` },
        ]}
      />
      <FAQPageJsonLd questions={faqQuestions} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-20 pb-12 overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
          </div>

          <div className="container mx-auto px-4 text-center space-y-6">
            <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase tracking-wider">
              <MapPin className="h-3 w-3 mr-1" /> Travel Guide
            </Badge>
            <div className="text-6xl">{country.flag}</div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
              eSIM Guide for{" "}
              <span className="text-primary italic">{country.name}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Everything you need to stay connected in {country.name}.
              Local carriers, network info, and practical travel tips.
            </p>
            <div className="flex justify-center gap-3">
              <Link href={`/esim/${slug}`}>
                <Button size="lg" className="font-bold">
                  <Wifi className="mr-2 h-4 w-4" />
                  View {country.name} eSIM Plans
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Info Grid */}
        <section className="pb-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <QuickInfoCard
                icon={Signal}
                label="Avg Speed"
                value={info.avgSpeed.split(" ")[0]}
                detail={info.avgSpeed}
              />
              <QuickInfoCard
                icon={Globe}
                label="Coverage"
                value={info.coverage.split(",")[0]}
                detail={info.coverage}
              />
              <QuickInfoCard
                icon={Phone}
                label="Emergency"
                value={info.emergencyNumber.split(" ")[0]}
                detail={info.emergencyNumber}
              />
              <QuickInfoCard
                icon={Zap}
                label="Voltage"
                value={info.voltage.split(",")[0]}
                detail={info.voltage}
              />
            </div>
          </div>
        </section>

        {/* Local Carriers */}
        {info.carriers.length > 0 && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="text-2xl font-black tracking-tight mb-6">
                Local Carriers in {country.name}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {info.carriers.map((carrier) => (
                  <div
                    key={carrier}
                    className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50"
                  >
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Signal className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{carrier}</p>
                      <p className="text-xs text-muted-foreground">Mobile network</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Our eSIM plans connect to the best available network in {country.name} for
                optimal coverage and speed.
              </p>
            </div>
          </section>
        )}

        {/* Data Advice */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-black tracking-tight mb-6">
              How Much Data Do You Need in {country.name}?
            </h2>
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-4">
                <p className="text-sm leading-relaxed">{info.dataAdvice}</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <UsageTier
                    label="Light"
                    data="1-2 GB/week"
                    activities="Maps, messaging, email"
                  />
                  <UsageTier
                    label="Moderate"
                    data="3-5 GB/week"
                    activities="+ Social media, photos, video calls"
                  />
                  <UsageTier
                    label="Heavy"
                    data="7+ GB/week"
                    activities="+ Streaming, hotspot, working remotely"
                  />
                </div>
                <div className="flex justify-center pt-2">
                  <Link href="/data-calculator">
                    <Button variant="outline" size="sm" className="font-bold text-xs">
                      Use Data Calculator
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Essential Apps */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-black tracking-tight mb-6">
              Essential Apps for {country.name}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {info.bestFor.map((app) => (
                <div
                  key={app}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50"
                >
                  <Smartphone className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-bold text-sm">{app}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Travel Tips */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-black tracking-tight mb-6">
              Travel Tips for {country.name}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <TipCard
                icon={Wifi}
                title="Airport WiFi"
                text={info.airportWifi}
              />
              <TipCard
                icon={Shield}
                title="Tipping"
                text={info.tipping}
              />
              <TipCard
                icon={Zap}
                title="Power"
                text={info.voltage}
              />
              <TipCard
                icon={Clock}
                title="eSIM Activation"
                text="Install your eSIM before departure. It activates when you arrive and connect to a local network."
              />
            </div>
          </div>
        </section>

        {/* Plans CTA */}
        {products.length > 0 && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="text-2xl font-black tracking-tight mb-6">
                Top eSIM Plans for {country.name}
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {products.map((product) => (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <Card className="h-full hover:border-primary/30 transition-colors border-border/50">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {product.isUnlimited
                              ? "Unlimited"
                              : `${product.dataAmount} ${product.dataUnit || "GB"}`}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {product.validityDays} days
                          </span>
                        </div>
                        <p className="font-bold text-sm line-clamp-2">{product.name}</p>
                        <p className="text-xl font-black text-primary">
                          ${product.price.toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-6">
                <Link href={`/esim/${slug}`}>
                  <Button className="font-bold">
                    View All {country.name} Plans
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-black tracking-tight mb-6 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqQuestions.map((faq) => (
                <div
                  key={faq.q}
                  className="p-4 rounded-xl bg-card border border-border/50"
                >
                  <h3 className="font-bold text-sm mb-1">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function QuickInfoCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  detail: string
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        </div>
        <p className="font-black text-lg">{value}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function UsageTier({
  label,
  data,
  activities,
}: {
  label: string
  data: string
  activities: string
}) {
  return (
    <div className="p-4 rounded-xl bg-muted/50 text-center">
      <p className="font-bold text-sm">{label}</p>
      <p className="text-lg font-black text-primary mt-1">{data}</p>
      <p className="text-xs text-muted-foreground mt-1">{activities}</p>
    </div>
  )
}

function TipCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  text: string
}) {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-card border border-border/50">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 className="font-bold text-sm">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{text}</p>
      </div>
    </div>
  )
}
