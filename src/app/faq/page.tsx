"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  HelpCircle,
  ShoppingCart,
  Download,
  BarChart3,
  User,
  Search,
  ArrowRight,
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Link from "next/link"

const faqCategories = [
  {
    id: "general",
    label: "General",
    icon: HelpCircle,
    questions: [
      {
        q: "What is an eSIM?",
        a: "An eSIM (embedded SIM) is a digital SIM that allows you to activate a cellular plan without using a physical SIM card. It's built into most modern smartphones and can be activated by scanning a QR code or entering an activation code.",
      },
      {
        q: "How does MobiaL work?",
        a: "MobiaL is an eSIM marketplace that partners with multiple providers to offer you the best data plans for your destination. Simply choose your country or region, select a plan, complete your purchase, and receive a QR code instantly via email. Scan it with your phone and you're connected.",
      },
      {
        q: "Which countries are covered?",
        a: "We offer eSIM plans for over 190 countries and territories worldwide, including popular destinations across Europe, Asia, the Americas, Africa, and the Middle East. You can search for specific countries on our products page.",
      },
      {
        q: "How long does activation take?",
        a: "Most eSIMs activate within seconds of scanning the QR code. Some plans activate immediately upon installation, while others activate when you first connect to a network in your destination country. The entire process typically takes under 2 minutes.",
      },
    ],
  },
  {
    id: "purchasing",
    label: "Purchasing",
    icon: ShoppingCart,
    questions: [
      {
        q: "How do I buy an eSIM?",
        a: "Browse our plans by searching for your destination country or region. Select a plan that fits your needs, add it to your cart, and complete checkout with your preferred payment method. You'll receive your eSIM QR code instantly via email.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit and debit cards (Visa, Mastercard, American Express) processed securely through Stripe. Additional payment methods may be available depending on your region.",
      },
      {
        q: "Can I buy an eSIM for someone else?",
        a: "Yes. After purchasing, simply forward the QR code email to the person who will use the eSIM. They can scan it on their own compatible device. Make sure their device supports eSIM before purchasing.",
      },
      {
        q: "Do you offer refunds?",
        a: "We offer refunds for eSIMs that have not been installed or activated. Once an eSIM has been downloaded to a device, it cannot be refunded as the digital product has been consumed. Please review our refund policy for full details.",
      },
    ],
  },
  {
    id: "installation",
    label: "Installation",
    icon: Download,
    questions: [
      {
        q: "Is my device compatible?",
        a: "Most smartphones manufactured after 2018 support eSIM, including iPhone XS and later, Samsung Galaxy S20 and later, Google Pixel 3a and later, and many other brands. Your device must also be carrier-unlocked. Check our compatible devices page for a full list.",
      },
      {
        q: "Can I install the eSIM before my trip?",
        a: "Yes, and we recommend it. You can install the eSIM anytime after purchase while you have an internet connection. Some eSIMs activate immediately, while others only start counting data once you connect to a network in the destination country.",
      },
      {
        q: "What if the QR code doesn't work?",
        a: "First, make sure you have a stable internet connection. Try adjusting the screen brightness or zoom level of the QR code. If scanning still fails, use the manual installation method with the SM-DP+ address and activation code from your email. Contact our support team if issues persist.",
      },
      {
        q: "Can I use multiple eSIMs?",
        a: "Most modern devices can store multiple eSIM profiles, though typically only one can be active at a time alongside your physical SIM. iPhones (XS and later) support multiple eSIM profiles, and newer models like iPhone 14 (US) support dual eSIM without a physical SIM slot.",
      },
    ],
  },
  {
    id: "usage",
    label: "Usage",
    icon: BarChart3,
    questions: [
      {
        q: "How do I check my data usage?",
        a: "You can check your data usage in your phone's Settings under Cellular/Mobile Data for the eSIM line. Some plans also provide a usage dashboard accessible through the link in your order confirmation email.",
      },
      {
        q: "Can I top up my eSIM?",
        a: "Top-up availability depends on the specific plan and provider. Some plans support data top-ups, which you can purchase through our platform. If your plan doesn't support top-ups, you can purchase a new eSIM for additional data.",
      },
      {
        q: "What happens when my data runs out?",
        a: "When your data allocation is fully used, your internet connection will stop. You won't be charged any overage fees. You can purchase a new eSIM or a top-up (if available) to continue using data.",
      },
      {
        q: "Does the eSIM support calls and SMS?",
        a: "Most of our eSIM plans are data-only. This means they provide mobile data but not traditional voice calls or SMS. However, you can use apps like WhatsApp, FaceTime, and Zoom for calls over data. Some regional plans do include voice and SMS -- check the plan details before purchasing.",
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    icon: User,
    questions: [
      {
        q: "How do I reset my password?",
        a: 'Click "Forgot Password" on the login page and enter your email address. You\'ll receive a password reset link within a few minutes. Check your spam folder if you don\'t see it in your inbox.',
      },
      {
        q: "Can I use MobiaL without an account?",
        a: "You can browse plans without an account, but you'll need to create one to complete a purchase. Your account lets you track orders, access QR codes, and manage your eSIM purchases.",
      },
      {
        q: "How do I delete my account?",
        a: "You can request account deletion by contacting our support team at support@mobialo.eu. We'll process your request in accordance with GDPR requirements. Note that order history may be retained for legal compliance purposes.",
      },
    ],
  },
]

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("general")

  const filteredCategories = faqCategories.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (q) =>
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }))

  const hasResults = filteredCategories.some((c) => c.questions.length > 0)
  const displayCategories = searchQuery ? filteredCategories : faqCategories
  const displayActiveCategory = searchQuery
    ? displayCategories.find((c) => c.questions.length > 0)?.id || "general"
    : activeCategory

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-20 pb-16 overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
            <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
          </div>

          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase">
                Help Center
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">
                Frequently Asked <br />
                <span className="text-primary italic">Questions</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Find answers to common questions about eSIMs, purchasing,
                installation, and more.
              </p>

              <div className="max-w-lg mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search for answers..."
                  className="pl-12 h-14 rounded-2xl text-base bg-card border-border/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            {/* Category Tabs */}
            {!searchQuery && (
              <div className="flex flex-wrap justify-center gap-3 mb-10">
                {faqCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={
                      activeCategory === category.id ? "default" : "outline"
                    }
                    className="rounded-2xl gap-2"
                    onClick={() => setActiveCategory(category.id)}
                  >
                    <category.icon className="h-4 w-4" />
                    {category.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Questions */}
            {!hasResults && searchQuery ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <p className="text-muted-foreground text-lg">
                  No results found for &quot;{searchQuery}&quot;
                </p>
                <p className="text-muted-foreground mt-2">
                  Try a different search or{" "}
                  <Link href="/contact" className="text-primary hover:underline">
                    contact support
                  </Link>
                </p>
              </motion.div>
            ) : (
              displayCategories
                .filter((category) =>
                  searchQuery
                    ? category.questions.length > 0
                    : category.id === activeCategory
                )
                .map((category) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    {searchQuery && (
                      <div className="flex items-center gap-2 mb-4">
                        <category.icon className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-bold">{category.label}</h2>
                      </div>
                    )}
                    <Card className="border-border/50">
                      <CardContent className="p-6">
                        <Accordion type="single" collapsible className="w-full">
                          {category.questions.map((item, i) => (
                            <AccordionItem key={i} value={`${category.id}-${i}`}>
                              <AccordionTrigger className="text-left font-semibold">
                                {item.q}
                              </AccordionTrigger>
                              <AccordionContent className="text-muted-foreground leading-relaxed">
                                {item.a}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
            )}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-16 p-8 rounded-3xl bg-muted/30 border border-border/50"
            >
              <h3 className="text-2xl font-bold mb-3">
                Still have questions?
              </h3>
              <p className="text-muted-foreground mb-6">
                Our support team is available to help you with anything.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button className="rounded-2xl" asChild>
                  <Link href="/contact">
                    Contact Support <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="rounded-2xl" asChild>
                  <Link href="/guides/installation">
                    Installation Guide
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
