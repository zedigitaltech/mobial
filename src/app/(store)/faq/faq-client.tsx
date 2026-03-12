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

const categoryIcons: Record<string, typeof HelpCircle> = {
  general: HelpCircle,
  purchasing: ShoppingCart,
  installation: Download,
  usage: BarChart3,
  account: User,
}

export interface FAQCategory {
  id: string
  label: string
  questions: { q: string; a: string }[]
}

interface FAQClientProps {
  categories: FAQCategory[]
}

export function FAQClient({ categories }: FAQClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || "general")

  const filteredCategories = categories.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (q) =>
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }))

  const hasResults = filteredCategories.some((c) => c.questions.length > 0)
  const displayCategories = searchQuery ? filteredCategories : categories
  const displayActiveCategory = searchQuery
    ? displayCategories.find((c) => c.questions.length > 0)?.id || categories[0]?.id
    : activeCategory

  return (
    <>
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
              {categories.map((category) => {
                const Icon = categoryIcons[category.id] || HelpCircle
                return (
                  <Button
                    key={category.id}
                    variant={
                      activeCategory === category.id ? "default" : "outline"
                    }
                    className="rounded-2xl gap-2"
                    onClick={() => setActiveCategory(category.id)}
                  >
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </Button>
                )
              })}
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
              .map((category) => {
                const Icon = categoryIcons[category.id] || HelpCircle
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    {searchQuery && (
                      <div className="flex items-center gap-2 mb-4">
                        <Icon className="h-5 w-5 text-primary" />
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
                )
              })
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
    </>
  )
}
