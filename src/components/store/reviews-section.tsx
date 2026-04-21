"use client"

import { useRef } from "react"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { Star, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { reviews, REVIEW_STATS } from "@/lib/reviews"
import type { Review } from "@/lib/reviews"

function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("")
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sizeClass = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5"
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  const t = useTranslations("reviews")
  return (
    <Card className="h-full border-white/5 bg-white/[0.03] backdrop-blur-2xl hover:border-white/10 transition-all duration-300 flex-shrink-0 w-[340px] md:w-[380px]">
      <CardContent className="p-6 flex flex-col gap-4 h-full">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-black text-primary">
              {review.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{review.name}</span>
                {review.verified && (
                  <BadgeCheck className="h-3.5 w-3.5 text-primary fill-primary/20" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {countryCodeToFlag(review.countryCode)} {review.country}
              </span>
            </div>
          </div>
          <StarRating rating={review.rating} />
        </div>

        <div className="flex-1 space-y-2">
          <h4 className="font-bold text-sm">{review.title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {review.text}
          </p>
        </div>

        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 border-t border-white/5 pt-3">
          <span>{t("usedIn", { destination: review.destination })}</span>
          <span>
            {review.verified ? t("verifiedPurchase") : ""}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export function ReviewsSection() {
  const t = useTranslations("reviews")
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return
    const amount = 400
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    })
  }

  return (
    <section className="py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-12"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                {t("trustedBy")}{" "}
                <span className="text-primary italic">{t("travelersWorldwide")}</span>
              </h2>
              <p className="text-muted-foreground max-w-lg">
                {t("joinThousands")}
              </p>
            </div>

            <div className="flex items-center gap-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
              <div className="text-center">
                <p className="text-4xl font-black">{REVIEW_STATS.averageRating}</p>
                <StarRating rating={5} size="lg" />
              </div>
              <div className="h-12 w-px bg-border/50" />
              <div className="text-sm">
                <p className="font-bold">{t("reviewsCount", { count: REVIEW_STATS.totalReviews.toLocaleString() })}</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {t("fiveStarPercent", { percent: REVIEW_STATS.fiveStarPercent })}
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="snap-start"
                >
                  <ReviewCard review={review} />
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center gap-3 mt-8">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-10 w-10 border-border/50 hover:border-primary/50"
                aria-label="Scroll reviews left"
                onClick={() => scroll("left")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-10 w-10 border-border/50 hover:border-primary/50"
                aria-label="Scroll reviews right"
                onClick={() => scroll("right")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
