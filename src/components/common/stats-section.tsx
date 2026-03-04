"use client"

import { motion } from "framer-motion"

interface Stat {
  value: string
  label: string
  suffix?: string
}

interface StatsSectionProps {
  stats: Stat[]
}

export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          className="text-center p-6 rounded-xl bg-muted/30 border border-border/50"
        >
          <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
            {stat.value}
            {stat.suffix && <span className="text-2xl">{stat.suffix}</span>}
          </div>
          <div className="text-sm text-muted-foreground">{stat.label}</div>
        </motion.div>
      ))}
    </motion.section>
  )
}
