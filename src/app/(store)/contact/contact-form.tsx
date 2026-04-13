"use client"

import { useState, FormEvent } from "react"
import { useTranslations } from "next-intl"
import { Send } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function ContactForm() {
  const t = useTranslations("contactForm")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (res.ok && result.success) {
        toast.success(t("messageSent"), {
          description: t("messageReply"),
        })
        ;(e.target as HTMLFormElement).reset()
      } else {
        toast.error(t("sendFailed"), {
          description: result.error || t("tryLater"),
        })
      }
    } catch {
      toast.error(t("sendFailed"), {
        description: t("checkConnection"),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold mb-6">{t("sendMessage")}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                {t("name")}
              </label>
              <Input
                id="name"
                name="name"
                placeholder={t("namePlaceholder")}
                required
                className="h-12 rounded-xl bg-muted/30"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t("email")}
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                required
                className="h-12 rounded-xl bg-muted/30"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">
              {t("subject")}
            </label>
            <Input
              id="subject"
              name="subject"
              placeholder={t("subjectPlaceholder")}
              required
              className="h-12 rounded-xl bg-muted/30"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              {t("message")}
            </label>
            <Textarea
              id="message"
              name="message"
              placeholder={t("messagePlaceholder")}
              required
              className="min-h-[150px] rounded-xl bg-muted/30"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full rounded-2xl h-14 text-lg font-bold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              t("sending")
            ) : (
              <>
                {t("sendBtn")} <Send className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
