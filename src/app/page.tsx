"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  Globe, 
  Zap, 
  Shield, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock, 
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Wifi
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProductCard } from "@/components/common/product-card"
import { FeatureCard } from "@/components/common/feature-card"
import { CTASection } from "@/components/common/cta-section"
import { StatsSection } from "@/components/common/stats-section"
import { AuthModal } from "@/components/auth/auth-modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/contexts/cart-context"

// Sample product data
const sampleProducts = [
  {
    id: "1",
    name: "Global eSIM",
    provider: "MobiMatter",
    dataAmount: 10,
    dataUnit: "GB",
    validityDays: 30,
    countries: JSON.stringify(["USA", "UK", "Japan", "France", "Germany"]),
    price: 29.99,
    originalPrice: 39.99,
    isFeatured: true,
    supportsHotspot: true,
    supportsCalls: false,
    supportsSms: false,
  },
  {
    id: "2",
    name: "Europe Explorer",
    provider: "eSIM Plus",
    dataAmount: 20,
    dataUnit: "GB",
    validityDays: 30,
    countries: JSON.stringify(["France", "Germany", "Italy", "Spain", "Netherlands"]),
    price: 24.99,
    isFeatured: true,
    supportsHotspot: true,
    supportsCalls: true,
    supportsSms: true,
  },
  {
    id: "3",
    name: "Asia Pacific",
    provider: "SimOptions",
    dataAmount: 15,
    dataUnit: "GB",
    validityDays: 30,
    countries: JSON.stringify(["Japan", "South Korea", "Singapore", "Thailand", "Australia"]),
    price: 34.99,
    originalPrice: 44.99,
    isFeatured: false,
    supportsHotspot: true,
    supportsCalls: false,
    supportsSms: false,
  },
  {
    id: "4",
    name: "USA & Canada",
    provider: "Airalo",
    dataAmount: 5,
    dataUnit: "GB",
    validityDays: 30,
    countries: JSON.stringify(["USA", "Canada"]),
    price: 19.99,
    isFeatured: false,
    supportsHotspot: true,
    supportsCalls: true,
    supportsSms: false,
  },
]

const features = [
  {
    title: "Instant Activation",
    description: "Get your eSIM delivered instantly via email. No physical SIM required.",
    icon: Zap,
  },
  {
    title: "Global Coverage",
    description: "Stay connected in 190+ countries with our extensive partner network.",
    icon: Globe,
  },
  {
    title: "Secure Payments",
    description: "Your transactions are protected with bank-level encryption.",
    icon: Shield,
  },
  {
    title: "Best Price Guarantee",
    description: "We match any competitor's price for the same eSIM product.",
    icon: DollarSign,
  },
]

const affiliateBenefits = [
  {
    title: "High Commission Rates",
    description: "Earn up to 15% commission on every sale referred through your unique affiliate link.",
    icon: TrendingUp,
  },
  {
    title: "Recurring Revenue",
    description: "Get paid for every renewal from customers you referred.",
    icon: CreditCard,
  },
  {
    title: "Marketing Support",
    description: "Access professional banners, landing pages, and marketing materials.",
    icon: Users,
  },
  {
    title: "Real-time Analytics",
    description: "Track your clicks, conversions, and earnings with our detailed dashboard.",
    icon: Clock,
  },
]

const howItWorks = [
  {
    step: 1,
    title: "Choose Your Plan",
    description: "Browse our selection of eSIM plans and choose the one that fits your travel needs.",
  },
  {
    step: 2,
    title: "Instant Delivery",
    description: "Receive your eSIM QR code instantly via email after purchase.",
  },
  {
    step: 3,
    title: "Scan & Connect",
    description: "Scan the QR code with your phone and enjoy instant connectivity.",
  },
  {
    step: 4,
    title: "Stay Connected",
    description: "Enjoy seamless data connectivity throughout your trip.",
  },
]

const stats = [
  { value: "190", suffix: "+", label: "Countries Covered" },
  { value: "500", suffix: "K+", label: "Happy Travelers" },
  { value: "99", suffix: ".9%", label: "Uptime Guarantee" },
  { value: "24", suffix: "/7", label: "Support Available" },
]

export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { addItem, isInCart } = useCart()

  const handleBuyProduct = (productId: string) => {
    const product = sampleProducts.find(p => p.id === productId)
    if (product && !isInCart(productId)) {
      addItem({
        productId: product.id,
        name: product.name,
        provider: product.provider,
        price: product.price,
        originalPrice: product.originalPrice,
        dataAmount: product.dataAmount,
        dataUnit: product.dataUnit,
        validityDays: product.validityDays,
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative gradient-hero py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center lg:text-left"
              >
                <Badge variant="secondary" className="mb-4">
                  <Zap className="h-3 w-3 mr-1" />
                  Trusted by 500K+ Travelers
                </Badge>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                  Stay Connected{" "}
                  <span className="text-primary">Worldwide</span>{" "}
                  with Affordable eSIM
                </h1>
                
                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                  Get instant connectivity in 190+ countries. No physical SIM, no roaming fees. 
                  Just scan, connect, and travel smart.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button size="lg" className="gradient-accent text-accent-foreground" asChild>
                    <Link href="/products">
                      Browse eSIM Plans
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => setAuthModalOpen(true)}>
                    Become an Affiliate
                  </Button>
                </div>

                <div className="flex items-center justify-center lg:justify-start gap-6 mt-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Instant Delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>No Hidden Fees</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="hidden lg:block relative"
              >
                <div className="relative w-full aspect-square max-w-md mx-auto">
                  <div className="absolute inset-0 gradient-primary rounded-3xl opacity-10 animate-pulse-glow" />
                  <div className="absolute inset-4 bg-card rounded-2xl shadow-2xl border border-border/50 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="h-20 w-20 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center animate-float">
                        <Smartphone className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">eSIM Ready</h3>
                      <p className="text-sm text-muted-foreground">
                        Compatible with most modern smartphones
                      </p>
                      <div className="flex justify-center gap-2 mt-4">
                        <Wifi className="h-4 w-4 text-primary" />
                        <span className="text-sm text-primary font-medium">Connected</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-y bg-muted/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <StatsSection stats={stats} />
          </div>
        </section>

        {/* Featured Products Section */}
        <section id="products" className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <Badge variant="secondary" className="mb-4">Featured Products</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Popular eSIM Plans
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose from our selection of top-rated eSIM plans for travelers
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sampleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onBuy={handleBuyProduct}
                />
              ))}
            </div>

            <div className="text-center mt-8">
              <Button variant="outline" size="lg" asChild>
                <Link href="/products">
                  View All Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-muted/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <Badge variant="secondary" className="mb-4">Why MobiaL</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                The Smart Choice for Travelers
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We make staying connected while traveling easy, affordable, and secure
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <FeatureCard key={feature.title} feature={feature} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <Badge variant="secondary" className="mb-4">Simple Process</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get connected in just 4 simple steps
              </p>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-8">
              {howItWorks.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="relative text-center"
                >
                  <div className="h-16 w-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  
                  {index < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/50 to-transparent" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Affiliate Program Section */}
        <section id="affiliate" className="py-16 md:py-24 bg-muted/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <Badge variant="secondary" className="mb-4">Affiliate Program</Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Earn Money Promoting eSIMs
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Join our affiliate program and earn commissions by helping travelers 
                  stay connected. It&apos;s free to join and easy to get started.
                </p>
                <Button size="lg" className="gradient-accent text-accent-foreground" onClick={() => setAuthModalOpen(true)}>
                  Join Affiliate Program
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>

              <div className="grid sm:grid-cols-2 gap-4">
                {affiliateBenefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="p-4 rounded-xl bg-card border border-border/50"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto text-center"
            >
              <Badge variant="secondary" className="mb-4">About MobiaL</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Your Trusted eSIM Partner
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                MobiaL is an official MobiMatter partner, offering the best eSIM deals 
                for travelers worldwide. We believe staying connected should be simple, 
                affordable, and accessible to everyone.
              </p>
              <p className="text-lg text-muted-foreground">
                With over 500,000 satisfied customers and coverage in 190+ countries, 
                we&apos;re committed to making your travel experience seamless and connected.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <CTASection
              title="Ready to Stay Connected?"
              description="Join thousands of travelers who trust MobiaL for their global connectivity needs. Get started today with instant eSIM delivery."
              primaryAction={{
                label: "Browse Plans",
                href: "/products",
              }}
              secondaryAction={{
                label: "Become an Affiliate",
                href: "/#auth",
              }}
            />
          </div>
        </section>
      </main>

      <Footer />

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      {/* Auth anchor section for direct linking */}
      <div id="auth" className="sr-only" aria-hidden="true" />
    </div>
  )
}
