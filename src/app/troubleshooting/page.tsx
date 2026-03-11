"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  ChevronRight,
  RotateCcw,
  Mail,
  CheckCircle2,
  HelpCircle,
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { troubleshootingTree, type TroubleshootingNode } from "@/lib/troubleshooting-data"
import Link from "next/link"

export default function TroubleshootingPage() {
  const [history, setHistory] = useState<string[]>(["start"])
  const currentId = history[history.length - 1]
  const currentNode = troubleshootingTree[currentId]

  const navigateTo = (nextId: string) => {
    setHistory((prev) => [...prev, nextId])
  }

  const goBack = () => {
    if (history.length > 1) {
      setHistory((prev) => prev.slice(0, -1))
    }
  }

  const restart = () => {
    setHistory(["start"])
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-20 pb-12 overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
          </div>

          <div className="container mx-auto px-4 text-center space-y-4">
            <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-xs font-black uppercase tracking-wider">
              <HelpCircle className="h-3 w-3 mr-1" /> Troubleshooting
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              eSIM <span className="text-primary italic">Help Center</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Follow the guided steps to resolve common eSIM issues.
            </p>
          </div>
        </section>

        {/* Wizard */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-2xl">
            {/* Breadcrumb / Progress */}
            <div className="flex items-center gap-2 mb-6">
              {history.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goBack}
                  className="rounded-xl text-xs font-bold"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              )}
              {history.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={restart}
                  className="rounded-xl text-xs font-bold ml-auto"
                >
                  <RotateCcw className="h-4 w-4 mr-1" /> Start Over
                </Button>
              )}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Question Node */}
                {currentNode?.options && (
                  <Card className="border-border/50">
                    <CardContent className="p-8 space-y-6">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-black tracking-tight">
                          {currentNode.title}
                        </h2>
                        {currentNode.description && (
                          <p className="text-muted-foreground">
                            {currentNode.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        {currentNode.options.map((option) => (
                          <button
                            key={option.nextId}
                            onClick={() => navigateTo(option.nextId)}
                            className="w-full flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                          >
                            <span className="font-medium">{option.label}</span>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Solution Node */}
                {currentNode?.solution && (
                  <Card className="border-primary/20">
                    <CardContent className="p-8 space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-xl font-black tracking-tight">
                            {currentNode.solution.title}
                          </h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            Follow these steps in order
                          </p>
                        </div>
                      </div>

                      <ol className="space-y-4">
                        {currentNode.solution.steps.map((step, i) => (
                          <li key={i} className="flex gap-4">
                            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <p className="text-sm leading-relaxed pt-1">{step}</p>
                          </li>
                        ))}
                      </ol>

                      {currentNode.solution.contactSupport && (
                        <div className="pt-4 border-t border-border/50">
                          <p className="text-sm text-muted-foreground mb-3">
                            Still need help? Our support team is here for you.
                          </p>
                          <div className="flex flex-wrap gap-3">
                            <Button variant="outline" className="rounded-xl" asChild>
                              <a href="mailto:support@mobialo.eu">
                                <Mail className="h-4 w-4 mr-2" /> Email Support
                              </a>
                            </Button>
                            <Button variant="outline" className="rounded-xl" asChild>
                              <Link href="/faq">View FAQ</Link>
                            </Button>
                          </div>
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={restart}
                        className="rounded-xl text-xs font-bold"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" /> Troubleshoot Another Issue
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Quick Links */}
            <div className="mt-12 grid grid-cols-2 gap-4">
              <Link
                href="/check-usage"
                className="p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all text-center"
              >
                <h3 className="font-bold text-sm">Check Usage</h3>
                <p className="text-[10px] text-muted-foreground mt-1">
                  View remaining data
                </p>
              </Link>
              <Link
                href="/compatible-devices"
                className="p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all text-center"
              >
                <h3 className="font-bold text-sm">Device Compatibility</h3>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Check if your device supports eSIM
                </p>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
