"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, 
  Globe, 
  Zap, 
  ShieldCheck, 
  ChevronRight, 
  Star, 
  ArrowRight,
  Smartphone,
  Wifi,
  BarChart3
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/providers/auth-provider"
import { TrustBadges } from "@/components/store/trust-badges"
import { ReviewsSection } from "@/components/store/reviews-section"
import Link from "next/link"
import Image from "next/image"

const POPULAR_REGIONS = [
  { name: "Europe", code: "EU", count: "40+ Countries", icon: "🇪🇺" },
  { name: "USA & Canada", code: "NA", count: "2 Countries", icon: "🇺🇸" },
  { name: "Asia Pacific", code: "AS", count: "15+ Countries", icon: "🌏" },
  { name: "Middle East", code: "ME", count: "10+ Countries", icon: "🐪" },
]

const STEPS = [
  {
    title: "Choose your destination",
    description: "Search for your destination and pick the best plan for your needs.",
    icon: Globe,
  },
  {
    title: "Get your QR code",
    description: "Receive your eSIM activation details instantly via email after payment.",
    icon: Zap,
  },
  {
    title: "Stay connected",
    description: "Scan the QR code and enjoy high-speed data as soon as you land.",
    icon: Wifi,
  },
]

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { openAuthModal } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
            <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
          </div>

          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                <Star className="h-3 w-3 fill-current" />
                Trusted by 50,000+ Travelers
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
                Your Global Travel <br />
                <span className="text-primary italic">Connectivity</span> Partner
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
                High-speed eSIM data plans for 150+ countries. 
                No roaming fees. No physical SIMs. Instant activation.
              </p>

              {/* Main Search Box */}
              <div className="max-w-2xl mx-auto relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-500 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center p-2 bg-card border rounded-[1.8rem] shadow-2xl">
                  <div className="flex-1 flex items-center px-4">
                    <Search className="h-6 w-6 text-muted-foreground mr-3" />
                    <Input 
                      placeholder="Where are you going?" 
                      className="border-0 focus-visible:ring-0 text-lg h-14 bg-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button size="lg" className="rounded-2xl h-14 px-8 font-bold text-lg shadow-lg" asChild>
                    <Link href={`/products?search=${searchQuery}`}>
                      Search Plans
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Popular Regions */}
              <div className="flex flex-wrap justify-center gap-3 pt-4">
                {POPULAR_REGIONS.map((region) => (
                  <Button 
                    key={region.code} 
                    variant="outline" 
                    className="rounded-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all hover:scale-105 h-12 px-6"
                    asChild
                  >
                    <Link href={`/products?region=${region.code}`}>
                      <span className="mr-2 text-lg">{region.icon}</span>
                      <span className="font-semibold">{region.name}</span>
                    </Link>
                  </Button>
                ))}
              <TrustBadges />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  title: "Instant Delivery",
                  description: "Receive your QR code in your inbox immediately after purchase. Ready to scan and go.",
                  color: "text-amber-500"
                },
                {
                  icon: Globe,
                  title: "Global Coverage",
                  description: "Connect in over 150 countries with our vast network of tier-1 carrier partners.",
                  color: "text-blue-500"
                },
                {
                  icon: ShieldCheck,
                  title: "Secure & Reliable",
                  description: "Bank-grade payment security and 24/7 technical support for your peace of mind.",
                  color: "text-primary"
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-xl transition-all group"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-muted group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-32 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 space-y-8">
                <div className="space-y-4">
                  <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase">How it works</Badge>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                    Get connected in <br /> 
                    <span className="text-primary italic">less than 2 minutes</span>
                  </h2>
                </div>

                <div className="space-y-12 pt-8">
                  {STEPS.map((step, i) => (
                    <div key={i} className="flex gap-6 group">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-xl z-10 relative">
                          {i + 1}
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-0.5 h-16 bg-gradient-to-b from-primary to-transparent" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold group-hover:text-primary transition-colors">{step.title}</h4>
                        <p className="text-muted-foreground max-w-sm">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button size="lg" className="rounded-2xl px-10 h-14 text-lg font-black mt-8" asChild>
                  <Link href="/products">
                    Start Browsing <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>

              <div className="flex-1 relative">
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
                <motion.div
                  initial={{ rotate: 10, y: 20 }}
                  whileInView={{ rotate: 0, y: 0 }}
                  viewport={{ once: true }}
                  className="relative bg-card border-[12px] border-muted rounded-[3rem] p-4 shadow-2xl max-w-[320px] mx-auto overflow-hidden"
                >
                  <div className="bg-muted h-6 w-32 mx-auto rounded-full mb-8" />
                  <div className="space-y-6">
                    <div className="h-40 rounded-2xl bg-gradient-to-br from-primary to-blue-600 p-6 flex flex-col justify-between text-white">
                      <Wifi className="h-8 w-8" />
                      <div>
                        <p className="text-xs opacity-80 uppercase font-bold tracking-widest">Global Connect</p>
                        <p className="text-xl font-black">Active eSIM</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 rounded-full bg-muted w-full" />
                      <div className="h-4 rounded-full bg-muted w-3/4" />
                      <div className="h-4 rounded-full bg-muted w-1/2" />
                    </div>
                    <div className="p-4 rounded-2xl border bg-muted/50 text-center space-y-2">
                      <Smartphone className="h-10 w-10 mx-auto text-primary" />
                      <p className="font-bold">Device Compatible</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <ReviewsSection />

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="relative rounded-[3rem] bg-foreground text-background overflow-hidden p-12 md:p-24 text-center space-y-8">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary blur-[100px] opacity-20" />
              <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500 blur-[100px] opacity-20" />
              
              <h2 className="text-4xl md:text-6xl font-black tracking-tight relative z-10">
                Ready for your next <br /> 
                <span className="text-primary italic">Adventure?</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto relative z-10">
                Join thousands of travelers who save on roaming costs every day. 
                Instant connectivity is just a few clicks away.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                <Button size="lg" className="rounded-2xl px-12 h-16 text-xl font-black" asChild>
                  <Link href="/products">Get your eSIM</Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-2xl px-12 h-16 text-xl font-black border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all" 
                  onClick={() => openAuthModal("register")}
                >
                  Start Now
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
