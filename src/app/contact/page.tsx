import {
  Mail,
  Clock,
  HelpCircle,
  ArrowRight,
  MessageSquare,
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ContactForm } from "./contact-form"

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-20 pb-16 overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
            <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
          </div>

          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase">
                Get in Touch
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">
                Contact <span className="text-primary italic">Us</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Have a question or need help? We&apos;re here for you.
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid lg:grid-cols-5 gap-10">
              {/* Contact Form (Client Component) */}
              <div className="lg:col-span-3">
                <ContactForm />
              </div>

              {/* Contact Info (Server-rendered) */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Email Us</h3>
                        <a
                          href="mailto:support@mobialo.eu"
                          className="text-primary hover:underline"
                        >
                          support@mobialo.eu
                        </a>
                        <p className="text-sm text-muted-foreground mt-1">
                          For all inquiries and support requests
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                        <Clock className="h-6 w-6 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Response Time</h3>
                        <p className="text-muted-foreground">
                          We typically respond within 24 hours
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Urgent issues are prioritized
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                        <HelpCircle className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Quick Answers</h3>
                        <p className="text-muted-foreground mb-3">
                          Check our FAQ for instant answers to common questions.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          asChild
                        >
                          <Link href="/faq">
                            Visit FAQ <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-primary/5">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <MessageSquare className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          Installation Help
                        </h3>
                        <p className="text-muted-foreground mb-3">
                          Need help setting up your eSIM?
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          asChild
                        >
                          <Link href="/guides/installation">
                            Setup Guide{" "}
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
