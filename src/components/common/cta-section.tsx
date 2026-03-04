"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CTASectionProps {
  title: string
  description: string
  primaryAction?: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
  variant?: "default" | "accent"
}

export function CTASection({
  title,
  description,
  primaryAction,
  secondaryAction,
  variant = "default"
}: CTASectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl p-8 md:p-12 text-center ${
        variant === "accent" 
          ? "gradient-accent text-accent-foreground" 
          : "gradient-primary text-primary-foreground"
      }`}
    >
      <h2 className="text-2xl md:text-3xl font-bold mb-4">{title}</h2>
      <p className="text-sm md:text-base opacity-90 max-w-2xl mx-auto mb-8">
        {description}
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {primaryAction && (
          <Button
            size="lg"
            variant={variant === "accent" ? "default" : "secondary"}
            className="min-w-[160px]"
            asChild
          >
            <Link href={primaryAction.href}>
              {primaryAction.label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
        {secondaryAction && (
          <Button
            size="lg"
            variant={variant === "accent" ? "outline" : "secondary"}
            className={`min-w-[160px] ${variant === "accent" ? "border-accent-foreground/20 hover:bg-accent-foreground/10" : ""}`}
            asChild
          >
            <Link href={secondaryAction.href}>
              {secondaryAction.label}
            </Link>
          </Button>
        )}
      </div>
    </motion.section>
  )
}
