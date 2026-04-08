import { Metadata } from "next"
import Link from "next/link"
import {
  Smartphone,
  Globe,
  Settings,
  Zap,
  RefreshCw,
  HelpCircle,
  ArrowRight,
  MapPin,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "eSIM Guides",
  description:
    "Step-by-step guides for installing, activating, and using your eSIM. Covers iPhone, Android, and more.",
}

const guides = [
  {
    title: "eSIM Installation Guide",
    description:
      "Step-by-step instructions for installing your eSIM on iPhone, Samsung, Google Pixel, and other compatible devices.",
    href: "/guides/installation",
    icon: Smartphone,
    color: "text-primary",
  },
  {
    title: "Troubleshooting",
    description:
      "Having issues with your eSIM? Our guided troubleshooter will help you resolve common problems quickly.",
    href: "/troubleshooting",
    icon: HelpCircle,
    color: "text-amber-500",
  },
  {
    title: "How to Check Usage",
    description:
      "Learn how to monitor your remaining data, check validity, and understand your usage stats.",
    href: "/check-usage",
    icon: Settings,
    color: "text-blue-500",
  },
  {
    title: "How to Top Up",
    description:
      "Running low on data? Learn how to easily add more data to your existing eSIM plan.",
    href: "/topup",
    icon: RefreshCw,
    color: "text-emerald-500",
  },
  {
    title: "Compatible Devices",
    description:
      "Check if your device supports eSIM and learn about dual-SIM functionality.",
    href: "/compatible-devices",
    icon: Zap,
    color: "text-purple-500",
  },
  {
    title: "Browse Destinations",
    description:
      "Explore eSIM plans available for 190+ countries and find the best deal for your trip.",
    href: "/esim",
    icon: Globe,
    color: "text-rose-500",
  },
]

export default function GuidesPage() {
  return (
    <>
      <section className="relative pt-20 pb-12 overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
          </div>

          <div className="container mx-auto px-4 text-center space-y-6">
            <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase tracking-wider">
              Help Center
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
              eSIM <span className="text-primary italic">Guides</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Everything you need to know about getting started with your eSIM,
              from installation to troubleshooting.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {guides.map((guide) => (
                <Link key={guide.href} href={guide.href}>
                  <Card className="h-full group hover:shadow-xl hover:border-primary/20 transition-all border-border/50">
                    <CardContent className="p-6 space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                        <guide.icon className={`h-6 w-6 ${guide.color}`} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold group-hover:text-primary transition-colors">
                          {guide.title}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                          {guide.description}
                        </p>
                      </div>
                      <div className="flex items-center text-xs font-bold text-primary pt-2">
                        Read Guide{" "}
                        <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Country Travel Guides */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-black tracking-tight">
                  Country Travel Guides
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {POPULAR_COUNTRIES.map((c) => (
                  <Link key={c.slug} href={`/guides/${c.slug}`}>
                    <Card className="h-full group hover:border-primary/20 transition-all border-border/50">
                      <CardContent className="p-4 flex items-center gap-3">
                        <span className="text-2xl">{c.flag}</span>
                        <div>
                          <p className="font-bold text-sm group-hover:text-primary transition-colors">
                            {c.name}
                          </p>
                          <p className="text-xs text-muted-foreground">eSIM Guide</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
    </>
  )
}

const POPULAR_COUNTRIES = [
  { slug: "japan", name: "Japan", flag: "\u{1F1EF}\u{1F1F5}" },
  { slug: "united-states", name: "USA", flag: "\u{1F1FA}\u{1F1F8}" },
  { slug: "turkey", name: "Turkey", flag: "\u{1F1F9}\u{1F1F7}" },
  { slug: "thailand", name: "Thailand", flag: "\u{1F1F9}\u{1F1ED}" },
  { slug: "spain", name: "Spain", flag: "\u{1F1EA}\u{1F1F8}" },
  { slug: "italy", name: "Italy", flag: "\u{1F1EE}\u{1F1F9}" },
  { slug: "united-kingdom", name: "UK", flag: "\u{1F1EC}\u{1F1E7}" },
  { slug: "germany", name: "Germany", flag: "\u{1F1E9}\u{1F1EA}" },
  { slug: "france", name: "France", flag: "\u{1F1EB}\u{1F1F7}" },
  { slug: "australia", name: "Australia", flag: "\u{1F1E6}\u{1F1FA}" },
  { slug: "south-korea", name: "S. Korea", flag: "\u{1F1F0}\u{1F1F7}" },
  { slug: "singapore", name: "Singapore", flag: "\u{1F1F8}\u{1F1EC}" },
]
