"use client"

import { motion } from "framer-motion"
import {
  Smartphone,
  Wifi,
  QrCode,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Plane,
  ChevronRight,
  Apple,
  Monitor,
  Keyboard,
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const iosSteps = [
  {
    step: 1,
    title: "Open Settings",
    description:
      "Navigate to Settings > Cellular (or Mobile Data in some regions).",
  },
  {
    step: 2,
    title: "Add eSIM",
    description:
      'Tap "Add eSIM" or "Add Cellular Plan" depending on your iOS version.',
  },
  {
    step: 3,
    title: "Choose QR Code",
    description:
      'Select "Use QR Code" to scan the code provided in your order confirmation email.',
  },
  {
    step: 4,
    title: "Scan the QR Code",
    description:
      "Point your camera at the QR code from your MobiaL order. The eSIM details will populate automatically.",
  },
  {
    step: 5,
    title: "Wait for Download",
    description:
      "Your eSIM profile will download. This usually takes 10-30 seconds over a stable internet connection.",
  },
  {
    step: 6,
    title: "Label Your eSIM",
    description:
      'Give your eSIM a descriptive label like "Travel Data" or your destination name for easy identification.',
  },
  {
    step: 7,
    title: "Enable Data Roaming",
    description:
      "Go to Settings > Cellular > your eSIM line > turn on Data Roaming. This is required for the eSIM to work abroad.",
  },
  {
    step: 8,
    title: "Set as Secondary Line",
    description:
      "Keep your physical SIM as the primary line for calls/SMS, and use the eSIM for mobile data only.",
  },
]

const androidSteps = [
  {
    step: 1,
    title: "Open Settings",
    description:
      "Go to Settings > Connections > SIM Manager (Samsung) or Settings > Network & internet > SIMs (Pixel).",
  },
  {
    step: 2,
    title: "Add eSIM",
    description:
      'Tap "Add eSIM" or "Add Mobile Plan" to begin the setup process.',
  },
  {
    step: 3,
    title: "Scan QR Code",
    description:
      'Choose "Scan QR code" and point your camera at the QR code from your order, or select "Enter activation code" to type it manually.',
  },
  {
    step: 4,
    title: "Wait for Download",
    description:
      "The eSIM profile will download and install. This may take up to a minute on some devices.",
  },
  {
    step: 5,
    title: "Enable the eSIM",
    description:
      "Once downloaded, make sure the eSIM is toggled on in your SIM Manager settings.",
  },
  {
    step: 6,
    title: "Enable Data Roaming",
    description:
      "Navigate to Settings > Connections > Mobile Networks > Data Roaming and toggle it on for your eSIM line.",
  },
]

const manualSteps = [
  {
    step: 1,
    title: "Find Your Activation Details",
    description:
      "Locate the SM-DP+ address and activation code in your MobiaL order confirmation email.",
  },
  {
    step: 2,
    title: "Open eSIM Settings",
    description:
      "Go to Settings > Cellular > Add eSIM (iOS) or Settings > Connections > SIM Manager (Android).",
  },
  {
    step: 3,
    title: "Choose Manual Entry",
    description:
      'Select "Enter Details Manually" or "Enter activation code" instead of scanning a QR code.',
  },
  {
    step: 4,
    title: "Enter SM-DP+ Address",
    description:
      'Copy and paste the SM-DP+ server address into the "Server" or "SM-DP+ Address" field.',
  },
  {
    step: 5,
    title: "Enter Activation Code",
    description:
      'Paste the activation code into the "Activation Code" field. Double-check for accuracy.',
  },
  {
    step: 6,
    title: "Complete Setup",
    description:
      "Confirm the details, wait for the profile to download, then enable Data Roaming as described above.",
  },
]

const tips = [
  {
    icon: Wifi,
    title: "Install Before You Travel",
    description:
      "eSIM activation requires an internet connection. Install while you still have Wi-Fi or mobile data at home.",
    color: "text-blue-500",
  },
  {
    icon: AlertTriangle,
    title: "Don't Delete Your eSIM",
    description:
      "Once deleted, an eSIM cannot be reinstalled with the same QR code. Only remove it after your plan has fully expired.",
    color: "text-amber-500",
  },
  {
    icon: Smartphone,
    title: "Keep Your Physical SIM",
    description:
      "Use your physical SIM for calls and SMS, and the eSIM for data. This dual-SIM setup is the most reliable.",
    color: "text-green-500",
  },
  {
    icon: Shield,
    title: "Enable Data Roaming",
    description:
      "Data Roaming must be enabled for your eSIM to work in a foreign country. This won't incur extra charges with an eSIM plan.",
    color: "text-primary",
  },
]

const troubleshooting = [
  {
    question: "QR code won't scan",
    answer:
      "Make sure you have a stable internet connection (Wi-Fi or mobile data). Try adjusting the brightness on the screen showing the QR code, or use the manual installation method with the SM-DP+ address and activation code from your email.",
  },
  {
    question: "eSIM downloaded but no data connection",
    answer:
      "First, ensure Data Roaming is enabled for your eSIM line. Then check that the eSIM is set as your mobile data line in Settings. Restart your device if the issue persists. Some eSIMs only activate once you arrive at your destination.",
  },
  {
    question: "Device says 'eSIM not supported'",
    answer:
      "Verify that your device is eSIM-compatible and carrier-unlocked. Some carrier-locked phones restrict eSIM usage. Check our compatible devices page for a full list of supported devices.",
  },
  {
    question: "eSIM shows 'No Service' or 'Not Available'",
    answer:
      "This can happen if you're not yet in the coverage area. If you are in the correct country, try toggling Airplane Mode on and off, or manually select a network operator in Settings > Cellular > Network Selection.",
  },
  {
    question: "I accidentally deleted my eSIM",
    answer:
      "Contact our support team immediately at support@mobialo.eu. In some cases, we can issue a replacement eSIM. However, this depends on the provider and is not always guaranteed.",
  },
  {
    question: "Can I install the eSIM on a different device?",
    answer:
      "eSIMs are typically tied to a single device once installed. If you haven't yet scanned the QR code, you can install it on any compatible device. Once installed, it cannot be transferred.",
  },
]

export default function InstallationGuidePage() {
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase">
                Step-by-Step Guide
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">
                How to Install <br />
                <span className="text-primary italic">Your eSIM</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Follow these simple steps to get connected in minutes. Choose
                your device type below.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Tabs Section */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <Tabs defaultValue="ios" className="w-full">
              <TabsList className="w-full h-auto p-1 grid grid-cols-3 bg-muted/50 rounded-2xl">
                <TabsTrigger
                  value="ios"
                  className="rounded-xl py-3 text-base font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Apple className="h-4 w-4 mr-2" />
                  iOS
                </TabsTrigger>
                <TabsTrigger
                  value="android"
                  className="rounded-xl py-3 text-base font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Android
                </TabsTrigger>
                <TabsTrigger
                  value="manual"
                  className="rounded-xl py-3 text-base font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  Manual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ios" className="mt-8">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {iosSteps.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="border-border/50 hover:border-primary/30 transition-colors">
                        <CardContent className="flex items-start gap-5 py-5">
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-lg shrink-0">
                            {item.step}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{item.title}</h3>
                            <p className="text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>

              <TabsContent value="android" className="mt-8">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {androidSteps.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="border-border/50 hover:border-primary/30 transition-colors">
                        <CardContent className="flex items-start gap-5 py-5">
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-lg shrink-0">
                            {item.step}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{item.title}</h3>
                            <p className="text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>

              <TabsContent value="manual" className="mt-8">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {manualSteps.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="border-border/50 hover:border-primary/30 transition-colors">
                        <CardContent className="flex items-start gap-5 py-5">
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-lg shrink-0">
                            {item.step}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{item.title}</h3>
                            <p className="text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Tips */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase mb-4">
                Pro Tips
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                Important Things to Know
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {tips.map((tip, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full border-border/50 hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-muted`}
                      >
                        <tip.icon className={`h-6 w-6 ${tip.color}`} />
                      </div>
                      <h3 className="font-bold text-lg mb-2">{tip.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {tip.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-12">
              <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase mb-4">
                Troubleshooting
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                Common Issues
              </h2>
              <p className="text-muted-foreground mt-3">
                Having trouble? Find solutions to the most common problems
                below.
              </p>
            </div>

            <Card className="border-border/50">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  {troubleshooting.map((item, i) => (
                    <AccordionItem key={i} value={`item-${i}`}>
                      <AccordionTrigger className="text-left font-semibold">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            <div className="text-center mt-10">
              <p className="text-muted-foreground mb-4">
                Still need help? Our support team is here for you.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  asChild
                >
                  <Link href="/compatible-devices">
                    Check Device Compatibility
                  </Link>
                </Button>
                <Button className="rounded-2xl" asChild>
                  <Link href="/contact">Contact Support</Link>
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
