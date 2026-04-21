"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Star, Send, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface ReviewFormProps {
  destination?: string
  countryCode?: string
  orderId?: string
}

export function ReviewForm({ destination, countryCode, orderId }: ReviewFormProps) {
  const t = useTranslations("reviewForm")
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [title, setTitle] = useState("")
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error(t("selectRating"))
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          name,
          email,
          rating,
          title,
          text,
          destination,
          countryCode,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setSubmitted(true)
        toast.success(t("submitted"))
      } else {
        toast.error(data.error || t("submitFailed"))
      }
    } catch {
      toast.error(t("submitError"))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Check className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-xl font-bold">{t("thankYou")}</h3>
          <p className="text-muted-foreground">
            {t("afterApproval")}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("writeReview")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t("rating")}</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  className="p-0.5"
                  onMouseEnter={() => setHoveredRating(i)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(i)}
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      i <= (hoveredRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="review-name" className="text-sm font-medium mb-1 block">{t("name")}</label>
              <Input
                id="review-name"
                placeholder={t("namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="review-email" className="text-sm font-medium mb-1 block">{t("email")}</label>
              <Input
                id="review-email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="review-title" className="text-sm font-medium mb-1 block">{t("title")}</label>
            <Input
              id="review-title"
              placeholder={t("titlePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div>
            <label htmlFor="review-body" className="text-sm font-medium mb-1 block">{t("yourReview")}</label>
            <Textarea
              id="review-body"
              placeholder={t("reviewPlaceholder")}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={2000}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">{text.length}/2000</p>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("submitting")}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> {t("submitReview")}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
