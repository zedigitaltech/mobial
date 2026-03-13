import {
  Globe,
  Zap,
  DollarSign,
  HeadphonesIcon,
  ArrowRight,
  QrCode,
  CreditCard,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

export default async function AboutPage() {
  const t = await getTranslations("about")

  const values = [
    {
      icon: DollarSign,
      title: t("valueBestPrices"),
      description: t("valueBestPricesDesc"),
      color: "text-green-500",
    },
    {
      icon: Zap,
      title: t("valueInstantDelivery"),
      description: t("valueInstantDeliveryDesc"),
      color: "text-amber-500",
    },
    {
      icon: Globe,
      title: t("valueGlobalCoverage"),
      description: t("valueGlobalCoverageDesc"),
      color: "text-blue-500",
    },
    {
      icon: HeadphonesIcon,
      title: t("value247Support"),
      description: t("value247SupportDesc"),
      color: "text-primary",
    },
  ]

  const steps = [
    {
      icon: Globe,
      title: t("stepChoose"),
      description: t("stepChooseDesc"),
    },
    {
      icon: CreditCard,
      title: t("stepPay"),
      description: t("stepPayDesc"),
    },
    {
      icon: QrCode,
      title: t("stepConnect"),
      description: t("stepConnectDesc"),
    },
  ]

  return (
    <>
        {/* Hero */}
        <section className="relative pt-20 pb-20 overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
            <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
            <div className="absolute -bottom-[10%] -left-[10%] w-[30%] h-[30%] bg-blue-500/10 blur-[120px] rounded-full" />
          </div>

          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase">
                {t("badge")}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">
                {t("title")} <span className="text-primary italic">MobiaL</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t("heroDesc")}
              </p>
            </div>
          </div>
        </section>

        {/* What We Do */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                {t("whatWeDoTitle")}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                {t("whatWeDoDesc")}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
                {[
                  { value: "190+", label: t("statCountries") },
                  { value: "Growing", label: t("statCommunity") },
                  { value: "24/7", label: t("statSupport") },
                  { value: "< 2min", label: t("statActivation") },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className="text-3xl md:text-4xl font-black text-primary">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase mb-4">
                {t("whyBadge")}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                {t("whyTitle")}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {values.map((item, i) => (
                <div key={i}>
                  <Card className="h-full border-border/50 hover:shadow-lg hover:border-primary/20 transition-all group">
                    <CardContent className="p-6 text-center">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-muted mx-auto group-hover:scale-110 transition-transform">
                        <item.icon className={`h-7 w-7 ${item.color}`} />
                      </div>
                      <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-16">
              <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase mb-4">
                {t("howBadge")}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                {t("howTitle")}
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <div key={i} className="text-center relative">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-6 text-2xl font-black">
                    {i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                  )}
                  <step.icon className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="relative rounded-3xl bg-foreground text-background overflow-hidden p-12 md:p-20 text-center">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-72 h-72 bg-primary blur-[100px] opacity-20" />
              <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-72 h-72 bg-blue-500 blur-[100px] opacity-20" />

              <div className="relative z-10 space-y-6">
                <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                  {t("ctaTitle")}{" "}
                  <span className="text-primary italic">{t("ctaHighlight")}</span>?
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {t("ctaDesc")}
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button
                    size="lg"
                    className="rounded-2xl px-10 h-14 text-lg font-black"
                    asChild
                  >
                    <Link href="/products">
                      {t("ctaBrowse")} <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-2xl px-10 h-14 text-lg font-black border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    asChild
                  >
                    <Link href="/contact">{t("ctaContact")}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
    </>
  )
}
