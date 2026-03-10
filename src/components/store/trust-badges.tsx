"use client"

import { motion } from "framer-motion"
import { Globe, Star, Zap, ShieldCheck, Headphones } from "lucide-react"

const BADGES = [
  {
    icon: Globe,
    label: "190+ Countries",
    color: "text-blue-400",
  },
  {
    icon: Star,
    label: "4.8/5 Rating",
    color: "text-amber-400",
  },
  {
    icon: Zap,
    label: "Instant Delivery",
    color: "text-emerald-400",
  },
  {
    icon: ShieldCheck,
    label: "Secure Payments",
    color: "text-primary",
  },
  {
    icon: Headphones,
    label: "24/7 Support",
    color: "text-purple-400",
  },
]

export function TrustBadges() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="flex flex-wrap justify-center gap-4 md:gap-8"
    >
      {BADGES.map((badge, i) => (
        <div
          key={i}
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <badge.icon className={`h-4 w-4 ${badge.color}`} />
          <span className="font-semibold text-xs md:text-sm whitespace-nowrap">
            {badge.label}
          </span>
        </div>
      ))}
    </motion.div>
  )
}
