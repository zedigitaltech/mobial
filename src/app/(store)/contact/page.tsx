import {
  Mail,
  Clock,
  HelpCircle,
  ArrowRight,
  MessageSquare,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ContactForm } from "./contact-form"
import { getTranslations } from "next-intl/server"

export default async function ContactPage() {
  const t = await getTranslations("contact")

  return (
    <>
        {/* Hero */}
        <section className="relative pt-20 pb-16 overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
            <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
          </div>

          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase">
                {t("badge")}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">
                {t("title")} <span className="text-primary italic">Us</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t("heroDesc")}
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
                        <h3 className="font-bold text-lg">{t("emailUs")}</h3>
                        <a
                          href="mailto:support@mobialo.eu"
                          className="text-primary hover:underline"
                        >
                          support@mobialo.eu
                        </a>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t("emailDesc")}
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
                        <h3 className="font-bold text-lg">{t("responseTime")}</h3>
                        <p className="text-muted-foreground">
                          {t("responseDesc")}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t("responseUrgent")}
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
                        <h3 className="font-bold text-lg">{t("quickAnswers")}</h3>
                        <p className="text-muted-foreground mb-3">
                          {t("quickAnswersDesc")}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          asChild
                        >
                          <Link href="/faq">
                            {t("visitFaq")} <ArrowRight className="ml-1 h-3 w-3" />
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
                          {t("installationHelp")}
                        </h3>
                        <p className="text-muted-foreground mb-3">
                          {t("installationDesc")}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          asChild
                        >
                          <Link href="/guides/installation">
                            {t("setupGuide")}{" "}
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
    </>
  )
}
